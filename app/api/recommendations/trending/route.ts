import { NextRequest, NextResponse } from 'next/server'
import { recommendationEngine } from '@/lib/recommendations/recommendation-engine'
import { createRateLimiter } from '@/lib/security/rate-limiter'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'

const trendingRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    return `trending:${ip}`
  }
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await trendingRateLimit.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    
    const count = parseInt(searchParams.get('count') || '10')
    const currentLat = searchParams.get('lat')
    const currentLng = searchParams.get('lng')
    const currentCity = searchParams.get('city')
    const currentCountry = searchParams.get('country')

    const context = {
      currentLocation: currentLat && currentLng ? {
        latitude: parseFloat(currentLat),
        longitude: parseFloat(currentLng),
        city: currentCity || undefined,
        country: currentCountry || undefined
      } : undefined
    }

    logger.info('Trending workspaces request', { count, hasLocation: !!context.currentLocation })

    const trending = await recommendationEngine.getTrendingWorkspaces(context, count)

    await auditLogger.logEvent({
      type: 'DATA_ACCESS',
      resource: 'trending',
      action: 'view',
      metadata: {
        count: trending.length,
        hasLocation: !!context.currentLocation
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json({
      trending,
      metadata: {
        count: trending.length,
        hasLocation: !!context.currentLocation,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=900',
        'Vary': 'Accept, Accept-Encoding'
      }
    })

  } catch (error) {
    logger.error('Trending API error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to get trending workspaces' },
      { status: 500 }
    )
  }
}