import { NextRequest, NextResponse } from 'next/server'
import { recommendationEngine } from '@/lib/recommendations/recommendation-engine'
import { createRateLimiter } from '@/lib/security/rate-limiter'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'

const locationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 80,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    return `location:${ip}`
  }
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await locationRateLimit.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    
    const lat = searchParams.get('lat')
    const lng = searchParams.get('lng')
    
    if (!lat || !lng) {
      return NextResponse.json(
        { error: 'lat and lng parameters are required' },
        { status: 400 }
      )
    }

    const latitude = parseFloat(lat)
    const longitude = parseFloat(lng)
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude values' },
        { status: 400 }
      )
    }

    if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) {
      return NextResponse.json(
        { error: 'Latitude must be between -90 and 90, longitude between -180 and 180' },
        { status: 400 }
      )
    }

    const radiusKm = parseInt(searchParams.get('radius') || '5')
    const count = parseInt(searchParams.get('count') || '10')

    if (radiusKm > 100) {
      return NextResponse.json(
        { error: 'Maximum radius is 100km' },
        { status: 400 }
      )
    }

    logger.info('Location-based recommendations request', { latitude, longitude, radiusKm, count })

    const recommendations = await recommendationEngine.getLocationBasedRecommendations(
      latitude,
      longitude,
      radiusKm,
      count
    )

    await auditLogger.logEvent({
      type: 'DATA_ACCESS',
      resource: 'location-recommendations',
      action: 'view',
      metadata: {
        latitude,
        longitude,
        radiusKm,
        count: recommendations.length
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json({
      recommendations,
      metadata: {
        location: { latitude, longitude },
        radiusKm,
        count: recommendations.length,
        timestamp: new Date().toISOString()
      }
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Vary': 'Accept, Accept-Encoding'
      }
    })

  } catch (error) {
    logger.error('Location recommendations API error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to get location-based recommendations' },
      { status: 500 }
    )
  }
}