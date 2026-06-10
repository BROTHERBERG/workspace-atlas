import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { DataQualityValidator, DeduplicationEngine } from '@/lib/data-quality/validator'
import { logger } from '@/lib/logger'
import { createRateLimiter, getClientIP } from '@/lib/security/rate-limiter'
import { securityAuditLogger } from '@/lib/security/audit-logger'
import { prisma } from '@/lib/db'

// Rate limit for admin endpoints
const rateLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || 'unknown'
    return `admin-data-quality:${ip}`
  }
})

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
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
      await securityAuditLogger.logSecurityEvent(
        'ACCESS_DENIED',
        'MEDIUM',
        'Insufficient permissions for data quality operations',
        {
          reason: 'Insufficient permissions',
          resource: '/api/admin/data-quality',
          userId: session.user.id
        },
        getClientIP(request),
        request.headers.get('user-agent') || undefined,
        session.user.id
      )
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action') || 'status'
    const limit = parseInt(searchParams.get('limit') || '100')
    const threshold = parseInt(searchParams.get('threshold') || '60')

    const validator = new DataQualityValidator()
    const deduplicator = new DeduplicationEngine()

    switch (action) {
      case 'status': {
        // Get overall data quality status
        const workspaces = await prisma.workspace.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            city: true,
            country: true,
            website: true,
            images: true,
            amenities: true,
            source: true,
            sourceId: true,
            createdAt: true,
            updatedAt: true
          },
          take: limit,
          orderBy: { updatedAt: 'desc' }
        })

        let validCount = 0
        let totalScore = 0
        const issues: string[] = []

        for (const workspace of workspaces) {
          const validationData = {
            name: workspace.name,
            description: workspace.description || undefined,
            address: workspace.address || undefined,
            city: workspace.city || undefined,
            country: workspace.country || undefined,
            website: workspace.website || undefined,
            images: (workspace.images as string[]) || [],
            amenities: (workspace.amenities as string[]) || [],
            pricing: [],
            socialMedia: {},
            source: workspace.source || 'unknown',
            sourceId: workspace.sourceId || '',
            lastUpdated: workspace.updatedAt || workspace.createdAt
          } as any

          const result = validator.validate(validationData)
          totalScore += result.score
          
          if (result.isValid) {
            validCount++
          } else {
            issues.push(...result.errors, ...result.warnings)
          }
        }

        // Get duplicate count estimate
        const duplicateEstimate = await prisma.workspace.groupBy({
          by: ['name', 'city'],
          having: {
            name: {
              _count: {
                gt: 1
              }
            }
          }
        })

        const stats = {
          totalWorkspaces: workspaces.length,
          validWorkspaces: validCount,
          invalidWorkspaces: workspaces.length - validCount,
          averageQualityScore: Math.round(totalScore / workspaces.length),
          estimatedDuplicates: duplicateEstimate.length,
          validationThreshold: threshold,
          lastChecked: new Date().toISOString(),
          commonIssues: [...new Set(issues)].slice(0, 10)
        }

        await securityAuditLogger.logSecurityEvent(
          'ADMIN_ACCESS',
          'LOW',
          'Admin data quality status check',
          {
            action: 'status',
            stats,
            resource: '/api/admin/data-quality',
            userId: session.user.id
          },
          getClientIP(request),
          request.headers.get('user-agent') || undefined,
          session.user.id
        )

        return NextResponse.json({ success: true, stats })
      }

      case 'validate': {
        // Run full validation on recent data
        const workspaces = await prisma.workspace.findMany({
          select: {
            id: true,
            name: true,
            description: true,
            address: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
            phone: true,
            email: true,
            website: true,
            images: true,
            amenities: true,
            source: true,
            sourceId: true,
            createdAt: true,
            updatedAt: true
          },
          take: limit,
          orderBy: { updatedAt: 'desc' }
        })

        const validationData = workspaces.map(workspace => ({
          name: workspace.name,
          description: workspace.description || undefined,
          address: workspace.address || undefined,
          city: workspace.city || undefined,
          country: workspace.country || undefined,
          latitude: workspace.latitude || undefined,
          longitude: workspace.longitude || undefined,
          phone: workspace.phone || undefined,
          email: workspace.email || undefined,
          website: workspace.website || undefined,
          images: (workspace.images as string[]) || [],
          amenities: (workspace.amenities as string[]) || [],
          pricing: [],
          socialMedia: {},
          source: workspace.source || 'unknown',
          sourceId: workspace.sourceId || '',
          lastUpdated: workspace.updatedAt || workspace.createdAt
        })) as any[]

        const results = validator.validateBatch(validationData)

        await securityAuditLogger.logSecurityEvent(
          'ADMIN_ACCESS',
          'LOW',
          'Admin data quality validation performed',
          {
            action: 'validate',
            summary: results.summary,
            sampleInvalid: results.invalidEntries.slice(0, 5).map(entry => ({
              name: entry.data.name,
              errors: entry.validation.errors,
              score: entry.validation.score
            })),
            resource: '/api/admin/data-quality',
            userId: session.user.id
          },
          getClientIP(request),
          request.headers.get('user-agent') || undefined,
          session.user.id
        )

        return NextResponse.json({ 
          success: true, 
          results: {
            summary: results.summary,
            invalidEntries: results.invalidEntries.slice(0, 10) // First 10 invalid entries
          }
        })
      }

      case 'duplicates': {
        // Find potential duplicates
        const workspaces = await prisma.workspace.findMany({
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            website: true,
            sourceId: true,
            source: true
          },
          take: limit
        })

        const duplicates: any[] = []
        const processed = new Set<string>()

        for (let i = 0; i < workspaces.length; i++) {
          const workspace = workspaces[i]
          
          if (processed.has(workspace.id)) continue
          processed.add(workspace.id)

          const otherWorkspaces = workspaces.slice(i + 1).filter(w => !processed.has(w.id))
          
          if (otherWorkspaces.length === 0) continue

          const testData = {
            name: workspace.name,
            address: workspace.address || undefined,
            city: workspace.city || undefined,
            website: workspace.website || undefined,
            sourceId: workspace.sourceId || '',
            source: workspace.source || 'unknown',
            lastUpdated: new Date()
          } as any

          const result = await deduplicator.checkDuplicate(testData, otherWorkspaces.map(w => ({
            ...w,
            address: w.address || undefined,
            city: w.city || undefined,
            website: w.website || undefined,
            sourceId: w.sourceId || undefined,
            source: w.source || undefined
          })))

          if (result.isDuplicate && result.matchedWorkspace) {
            duplicates.push({
              workspace1: {
                id: workspace.id,
                name: workspace.name,
                city: workspace.city
              },
              workspace2: result.matchedWorkspace,
              confidence: result.confidence,
              duplicateFields: result.duplicateFields
            })

            // Mark the matched workspace as processed
            processed.add(result.matchedWorkspace.id)
          }
        }

        await securityAuditLogger.logSecurityEvent(
          'ADMIN_ACCESS',
          'LOW',
          'Admin duplicate detection performed',
          {
            action: 'duplicates',
            count: duplicates.length,
            resource: '/api/admin/data-quality',
            userId: session.user.id
          },
          getClientIP(request),
          request.headers.get('user-agent') || undefined,
          session.user.id
        )

        return NextResponse.json({ 
          success: true, 
          duplicates: duplicates.slice(0, 20), // First 20 potential duplicates
          summary: {
            totalChecked: workspaces.length,
            duplicatesFound: duplicates.length
          }
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: status, validate, or duplicates' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Data quality API error', error instanceof Error ? error : new Error(String(error)))
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
    // Rate limiting
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

    const body = await request.json()
    const { action, workspaceIds } = body

    switch (action) {
      case 'fix_duplicates': {
        if (!workspaceIds || !Array.isArray(workspaceIds)) {
          return NextResponse.json(
            { error: 'workspaceIds array required' },
            { status: 400 }
          )
        }

        // In a real implementation, you'd implement duplicate merging logic
        // For now, just log the action
        await securityAuditLogger.logSecurityEvent(
          'ADMIN_ACCESS',
          'MEDIUM',
          `Admin fixed duplicates for ${workspaceIds.length} workspaces`,
          {
            action: 'fix_duplicates',
            workspaceCount: workspaceIds.length,
            workspaceIds: workspaceIds.slice(0, 10),
            resource: '/api/admin/data-quality',
            userId: session.user.id
          },
          getClientIP(request),
          request.headers.get('user-agent') || undefined,
          session.user.id
        )

        return NextResponse.json({ 
          success: true, 
          message: `Duplicate fixing queued for ${workspaceIds.length} workspaces`,
          note: 'This is a placeholder - implement actual duplicate merging logic'
        })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Data quality API error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}