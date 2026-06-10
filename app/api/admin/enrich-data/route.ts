import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { PlacesEnricher, EnrichmentRequest } from '@/lib/data-enrichment/places-enricher'
import { logger } from '@/lib/logger'
import { createRateLimiter, getClientIP } from '@/lib/security/rate-limiter'
import { securityAuditLogger } from '@/lib/security/audit-logger'
import { prisma } from '@/lib/db'

// Rate limit for data enrichment (more restrictive due to API costs)
const rateLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // 20 requests per hour
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    return `admin-enrich:${ip}`
  }
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiter.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests. Data enrichment is limited to 20 requests per hour.' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization - admin only
    if (session.user.role !== 'ADMIN') {
      await securityAuditLogger.logSecurityEvent(
        'ACCESS_DENIED',
        'MEDIUM',
        'Insufficient permissions for data enrichment operations',
        {
          reason: 'Insufficient permissions',
          resource: '/api/admin/enrich-data',
          userId: session.user.id
        },
        getClientIP(request),
        request.headers.get('user-agent') || undefined,
        session.user.id
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if Google Places API key is configured
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 503 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'candidates'
    const workspaceId = searchParams.get('workspaceId')
    const limit = parseInt(searchParams.get('limit') || '10')

    const enricher = new PlacesEnricher({
      includePhotos: true,
      includeReviews: true,
      maxPhotos: 5,
      maxReviews: 3,
      confidenceThreshold: 0.7
    })

    switch (action) {
      case 'candidates': {
        // Get workspaces that could benefit from enrichment
        const workspaces = await prisma.workspace.findMany({
          where: {
            isActive: true,
            status: 'ACTIVE',
            NOT: [
              { name: "" },
              { city: null }
            ]
          },
          select: {
            id: true,
            name: true,
            city: true,
            country: true,
            address: true,
            website: true,
            phone: true,
            rating: true,
            images: true,
            createdAt: true,
            updatedAt: true
          },
          take: limit * 2, // Get more to show prioritization
          orderBy: [
            { rating: 'asc' }, // Prioritize workspaces with missing/low ratings
            { createdAt: 'desc' }
          ]
        })

        // Score candidates by enrichment potential
        const candidates = workspaces.map(workspace => {
          let score = 0
          const reasons: string[] = []

          // Missing basic info
          if (!workspace.website) {
            score += 3
            reasons.push('Missing website')
          }
          if (!workspace.phone) {
            score += 2
            reasons.push('Missing phone')
          }
          if (!workspace.rating) {
            score += 4
            reasons.push('Missing rating')
          }

          // Poor image quality/quantity
          const imageCount = (workspace.images as string[])?.length || 0
          if (imageCount < 3) {
            score += 3
            reasons.push(`Only ${imageCount} images`)
          }

          // Address quality
          if (!workspace.address || workspace.address.length < 10) {
            score += 2
            reasons.push('Incomplete address')
          }

          return {
            ...workspace,
            enrichmentScore: score,
            enrichmentReasons: reasons,
            priority: score > 7 ? 'high' : score > 4 ? 'medium' : 'low'
          }
        }).sort((a, b) => b.enrichmentScore - a.enrichmentScore)

        await securityAuditLogger.logSecurityEvent(
          'ADMIN_ACCESS',
          'LOW',
          'Admin fetched enrichment candidates',
          {
            action: 'candidates',
            count: candidates.length,
            resource: '/api/admin/enrich-data',
            userId: session.user.id
          },
          getClientIP(request),
          request.headers.get('user-agent') || undefined,
          session.user.id
        )

        return NextResponse.json({
          success: true,
          candidates: candidates.slice(0, limit),
          summary: {
            total: candidates.length,
            highPriority: candidates.filter(c => c.priority === 'high').length,
            mediumPriority: candidates.filter(c => c.priority === 'medium').length,
            lowPriority: candidates.filter(c => c.priority === 'low').length
          }
        })
      }

      case 'preview': {
        // Preview enrichment for a single workspace
        if (!workspaceId) {
          return NextResponse.json(
            { error: 'workspaceId parameter required' },
            { status: 400 }
          )
        }

        const workspace = await prisma.workspace.findUnique({
          where: { id: workspaceId },
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            website: true,
            phone: true,
            latitude: true,
            longitude: true
          }
        })

        if (!workspace) {
          return NextResponse.json(
            { error: 'Workspace not found' },
            { status: 404 }
          )
        }

        const enrichmentRequest: EnrichmentRequest = {
          workspaceId: workspace.id,
          name: workspace.name,
          address: workspace.address || undefined,
          city: workspace.city || undefined,
          country: workspace.country || undefined,
          website: workspace.website || undefined,
          phone: workspace.phone || undefined,
          latitude: workspace.latitude || undefined,
          longitude: workspace.longitude || undefined
        }

        const result = await enricher.enrichWorkspace(enrichmentRequest)

        await securityAuditLogger.logSecurityEvent(
          'ADMIN_ACCESS',
          'LOW',
          'Admin previewed workspace enrichment',
          {
            action: 'preview',
            workspaceId,
            success: result.success,
            confidence: result.confidence,
            resource: '/api/admin/enrich-data',
            userId: session.user.id
          },
          getClientIP(request),
          request.headers.get('user-agent') || undefined,
          session.user.id
        )

        return NextResponse.json({
          success: true,
          workspace,
          enrichmentResult: result,
          preview: result.success ? {
            confidence: result.confidence,
            newPhotos: result.enrichedData?.photos?.length || 0,
            newReviews: result.enrichedData?.reviews?.length || 0,
            hasOpeningHours: !!result.enrichedData?.openingHours,
            hasPricing: !!result.enrichedData?.priceLevel,
            businessStatus: result.enrichedData?.businessStatus,
            enhancedRating: result.enrichedData?.rating,
            enhancedWebsite: result.enrichedData?.website,
            enhancedPhone: result.enrichedData?.phone
          } : null
        })
      }

      case 'status': {
        // Get enrichment status and statistics
        const [
          totalWorkspaces,
          enrichedWorkspaces,
          recentEnrichments,
          pendingEnrichments
        ] = await Promise.all([
          prisma.workspace.count({ where: { isActive: true } }),
          prisma.workspace.count({ 
            where: { 
              isActive: true
            }
          }),
          prisma.workspace.count({
            where: {
              isActive: true,
              updatedAt: {
                gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
              }
            }
          }),
          prisma.workspace.count({
            where: {
              isActive: true,
              status: 'ACTIVE',
              NOT: [
                { name: "" },
                { city: null }
              ]
            }
          })
        ])

        const enrichmentRate = Math.round((enrichedWorkspaces / totalWorkspaces) * 100)

        return NextResponse.json({
          success: true,
          stats: {
            totalWorkspaces,
            enrichedWorkspaces,
            recentEnrichments,
            pendingEnrichments,
            enrichmentRate: `${enrichmentRate}%`,
            apiConfigured: !!process.env.GOOGLE_PLACES_API_KEY,
            lastChecked: new Date().toISOString()
          }
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: candidates, preview, or status' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Data enrichment API error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect()
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (more restrictive for POST operations)
    const rateLimitResult = await rateLimiter.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { 
          status: 429,
          headers: rateLimitResult.headers
        }
      )
    }

    // Authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Authorization - admin only
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check API key
    if (!process.env.GOOGLE_PLACES_API_KEY) {
      return NextResponse.json(
        { error: 'Google Places API key not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { action, workspaceIds, batchSize: _batchSize = 5 } = body

    const enricher = new PlacesEnricher({
      includePhotos: true,
      includeReviews: true,
      maxPhotos: 8,
      maxReviews: 5,
      confidenceThreshold: 0.7,
      collectImages: true
    })

    switch (action) {
      case 'enrich_batch': {
        if (!workspaceIds || !Array.isArray(workspaceIds)) {
          return NextResponse.json(
            { error: 'workspaceIds array required' },
            { status: 400 }
          )
        }

        if (workspaceIds.length > 10) {
          return NextResponse.json(
            { error: 'Maximum 10 workspaces per batch' },
            { status: 400 }
          )
        }

        // Fetch workspaces to enrich
        const workspaces = await prisma.workspace.findMany({
          where: {
            id: { in: workspaceIds },
            isActive: true
          },
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            country: true,
            website: true,
            phone: true,
            latitude: true,
            longitude: true
          }
        })

        if (workspaces.length === 0) {
          return NextResponse.json(
            { error: 'No valid workspaces found' },
            { status: 400 }
          )
        }

        // Convert to enrichment requests
        const enrichmentRequests: EnrichmentRequest[] = workspaces.map(workspace => ({
          workspaceId: workspace.id,
          name: workspace.name,
          address: workspace.address || undefined,
          city: workspace.city || undefined,
          country: workspace.country || undefined,
          website: workspace.website || undefined,
          phone: workspace.phone || undefined,
          latitude: workspace.latitude || undefined,
          longitude: workspace.longitude || undefined
        }))

        // Perform enrichment
        const results = await enricher.enrichWorkspaces(enrichmentRequests, {
          maxConcurrent: 2, // Conservative for API
          delayMs: 2000     // 2 second delay between requests
        })

        // Save successful results to database
        const savedCount = await saveEnrichmentResults(results)

        await securityAuditLogger.logSecurityEvent(
          'ADMIN_ACCESS',
          'MEDIUM',
          `Admin enriched ${workspaceIds.length} workspaces`,
          {
            action: 'enrich_batch',
            requestedCount: workspaceIds.length,
            processedCount: results.length,
            successfulCount: results.filter(r => r.success).length,
            savedCount,
            resource: '/api/admin/enrich-data',
            userId: session.user.id
          },
          getClientIP(request),
          request.headers.get('user-agent') || undefined,
          session.user.id
        )

        return NextResponse.json({
          success: true,
          results: {
            requested: workspaceIds.length,
            processed: results.length,
            successful: results.filter(r => r.success).length,
            failed: results.filter(r => !r.success).length,
            saved: savedCount,
            averageConfidence: results
              .filter(r => r.success)
              .reduce((sum, r) => sum + r.confidence, 0) / Math.max(results.filter(r => r.success).length, 1)
          },
          details: results.map(r => ({
            workspaceId: r.workspaceId,
            success: r.success,
            confidence: r.confidence,
            error: r.error,
            hasPhotos: r.enrichedData?.photos?.length || 0,
            hasReviews: r.enrichedData?.reviews?.length || 0
          }))
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Data enrichment POST error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to save enrichment results
async function saveEnrichmentResults(results: any[]): Promise<number> {
  let savedCount = 0
  
  for (const result of results.filter(r => r.success && r.enrichedData)) {
    try {
      const updateData: any = {
        updatedAt: new Date()
      }
      
      const enriched = result.enrichedData
      
      // Update enhanced data
      if (enriched.website) updateData.website = enriched.website
      if (enriched.phone) updateData.phone = enriched.phone
      if (enriched.address) updateData.address = enriched.address
      if (enriched.latitude && enriched.longitude) {
        updateData.latitude = enriched.latitude
        updateData.longitude = enriched.longitude
      }
      if (enriched.rating) updateData.rating = enriched.rating
      if (enriched.reviewCount) updateData.reviewCount = enriched.reviewCount
      
      // Enhanced images
      if (enriched.photos?.length) {
        const photoUrls = enriched.photos.map((p: any) => p.url).filter(Boolean)
        if (photoUrls.length) {
          const existing = await prisma.workspace.findUnique({
            where: { id: result.workspaceId },
            select: { images: true }
          })
          
          if (existing) {
            const existingImages = (existing.images as string[]) || []
            updateData.images = [...new Set([...existingImages, ...photoUrls])].slice(0, 20)
          }
        }
      }
      
      // Opening hours
      if (enriched.openingHours?.weekdayText) {
        updateData.hoursDescription = enriched.openingHours.weekdayText.join('; ')
      }

      await prisma.workspace.update({
        where: { id: result.workspaceId },
        data: updateData
      })
      
      savedCount++
    } catch (error) {
      logger.error('Failed to save enrichment result', error instanceof Error ? error : new Error(String(error)), {
        workspaceId: result.workspaceId
      })
    }
  }
  
  return savedCount
}