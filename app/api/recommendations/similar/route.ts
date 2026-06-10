import { NextRequest, NextResponse } from 'next/server'
import { recommendationEngine } from '@/lib/recommendations/recommendation-engine'
import { createRateLimiter } from '@/lib/security/rate-limiter'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'

const similarRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    return `similar:${ip}`
  }
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await similarRateLimit.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    
    const workspaceId = searchParams.get('workspaceId')
    if (!workspaceId) {
      return NextResponse.json(
        { error: 'workspaceId parameter is required' },
        { status: 400 }
      )
    }

    const count = parseInt(searchParams.get('count') || '6')

    logger.info('Similar workspaces request', { workspaceId, count })

    const similar = await recommendationEngine.getSimilarWorkspaces(workspaceId, count)

    await auditLogger.logEvent({
      type: 'DATA_ACCESS',
      resource: 'similar',
      action: 'view',
      metadata: {
        workspaceId,
        count: similar.length
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json({
      similar,
      metadata: {
        workspaceId,
        count: similar.length,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=600, s-maxage=1800',
        'Vary': 'Accept, Accept-Encoding'
      }
    })

  } catch (error) {
    logger.error('Similar workspaces API error', error instanceof Error ? error : new Error(String(error)))
    
    if (error instanceof Error && error.message === 'Target workspace not found') {
      return NextResponse.json(
        { error: 'Workspace not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to get similar workspaces' },
      { status: 500 }
    )
  }
}