import { NextRequest, NextResponse } from 'next/server'
import { recommendationEngine } from '@/lib/recommendations/recommendation-engine'
import { createRateLimiter } from '@/lib/security/rate-limiter'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'

const recommendationRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 50,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    return `recommendations:${ip}`
  }
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await recommendationRateLimit.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const { searchParams } = new URL(request.url)
    
    const userProfileId = searchParams.get('userId')
    const count = parseInt(searchParams.get('count') || '10')
    const includeReasons = searchParams.get('includeReasons') === 'true'
    const diversityWeight = parseFloat(searchParams.get('diversityWeight') || '0.3')
    const noveltyWeight = parseFloat(searchParams.get('noveltyWeight') || '0.2')
    const locationWeight = parseFloat(searchParams.get('locationWeight') || '0.4')
    const excludeIds = searchParams.get('exclude')?.split(',') || []

    const currentLat = searchParams.get('lat')
    const currentLng = searchParams.get('lng')
    const currentCity = searchParams.get('city')
    const currentCountry = searchParams.get('country')
    
    const purpose = searchParams.get('purpose')
    const timeOfDay = searchParams.get('timeOfDay')
    const dayOfWeek = searchParams.get('dayOfWeek')
    const duration = searchParams.get('duration')

    const preferences = {
      workspaceTypes: searchParams.get('workspaceTypes')?.split(',') || [],
      amenities: searchParams.get('amenities')?.split(',') || [],
      cities: searchParams.get('cities')?.split(',') || [],
      workingStyle: searchParams.get('workingStyle') as 'quiet' | 'collaborative' | 'flexible' | undefined,
      priceRange: {
        min: parseInt(searchParams.get('minPrice') || '0'),
        max: parseInt(searchParams.get('maxPrice') || '1000')
      }
    }

    const userProfile = userProfileId ? {
      id: userProfileId,
      preferences: {
        ...preferences,
        workingStyle: preferences.workingStyle || 'flexible'
      },
      behavior: {
        recentSearches: searchParams.get('recentSearches')?.split(',') || [],
        viewedWorkspaces: searchParams.get('viewedWorkspaces')?.split(',') || [],
        favoriteWorkspaces: searchParams.get('favoriteWorkspaces')?.split(',') || [],
        bookingHistory: searchParams.get('bookingHistory')?.split(',') || [],
        searchFilters: []
      }
    } : undefined

    const context = {
      currentLocation: currentLat && currentLng ? {
        latitude: parseFloat(currentLat),
        longitude: parseFloat(currentLng),
        city: currentCity || undefined,
        country: currentCountry || undefined
      } : undefined,
      timeOfDay: timeOfDay as 'morning' | 'afternoon' | 'evening' | undefined,
      dayOfWeek: dayOfWeek as 'weekday' | 'weekend' | undefined,
      purpose: purpose as 'work' | 'meeting' | 'event' | 'networking' | undefined,
      duration: duration as 'hour' | 'day' | 'week' | 'month' | undefined
    }

    const options = {
      count,
      includeReasons,
      diversityWeight,
      noveltyWeight,
      locationWeight,
      excludeWorkspaceIds: excludeIds
    }

    logger.info('Recommendation request', {
      hasProfile: !!userProfile,
      hasContext: !!context.currentLocation,
      options
    })

    const recommendations = await recommendationEngine.getRecommendations(
      userProfile,
      context,
      options
    )

    await auditLogger.logEvent({
      type: 'DATA_ACCESS',
      userId: userProfileId || undefined,
      resource: 'recommendations',
      action: 'view',
      metadata: {
        count: recommendations.recommendations.length,
        strategy: recommendations.metadata.strategy,
        personalizationLevel: recommendations.metadata.personalizationLevel,
        executionTime: recommendations.metadata.executionTime
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json(recommendations, {
      headers: {
        'Cache-Control': 'public, max-age=300, s-maxage=600',
        'Vary': 'Accept, Accept-Encoding'
      }
    })

  } catch (error) {
    logger.error('Recommendations API error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}