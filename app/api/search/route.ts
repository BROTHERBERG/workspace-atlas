import { NextRequest, NextResponse } from 'next/server'
import { searchEngine, SearchFilters } from '@/lib/search/search-engine'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/security/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.search(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many search requests. Please try again later.' },
        { 
          status: 429,
          headers: {
            'X-RateLimit-Limit': '100',
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': Math.ceil(rateLimitResult.resetTime / 1000).toString()
          }
        }
      )
    }

    const searchParams = request.nextUrl.searchParams
    
    // Parse search filters from query parameters
    const filters: SearchFilters = {
      query: searchParams.get('q') || undefined,
      city: searchParams.get('city') || undefined,
      country: searchParams.get('country') || undefined,
      latitude: searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined,
      longitude: searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined,
      radius: searchParams.get('radius') ? parseFloat(searchParams.get('radius')!) : undefined,
      amenities: searchParams.get('amenities') ? searchParams.get('amenities')!.split(',') : undefined,
      workspaceTypes: searchParams.get('types') ? searchParams.get('types')!.split(',') : undefined,
      minPrice: searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined,
      currency: searchParams.get('currency') || undefined,
      pricingType: (searchParams.get('pricingType') as any) || undefined,
      minRating: searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined,
      minReviewCount: searchParams.get('minReviews') ? parseInt(searchParams.get('minReviews')!) : undefined,
      minDigitalScore: searchParams.get('minScore') ? parseInt(searchParams.get('minScore')!) : undefined,
      hasAvailability: searchParams.get('available') === 'true',
      instantBooking: searchParams.get('instantBooking') === 'true',
      isVerified: searchParams.get('verified') === 'true' ? true : searchParams.get('verified') === 'false' ? false : undefined,
      isActive: searchParams.get('active') !== 'false', // Default to true
      sortBy: (searchParams.get('sortBy') as any) || 'relevance',
      sortOrder: (searchParams.get('sortOrder') as any) || 'desc',
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 20
    }

    // Validate filters
    if (filters.page && filters.page < 1) {
      return NextResponse.json(
        { error: 'Page number must be greater than 0' },
        { status: 400 }
      )
    }

    if (filters.limit && (filters.limit < 1 || filters.limit > 100)) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (filters.radius && filters.radius > 500) {
      return NextResponse.json(
        { error: 'Search radius cannot exceed 500km' },
        { status: 400 }
      )
    }

    // Perform search
    const results = await searchEngine.search(filters)

    // Add CORS headers for client-side access
    const headers = new Headers({
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Cache-Control': 'public, max-age=300', // 5 minute cache
      'X-Search-Time': results.searchMetadata.executionTime.toString(),
      'X-Total-Results': results.searchMetadata.totalResults.toString()
    })

    return NextResponse.json(results, { headers })

  } catch (error) {
    logger.error('Search API error', error instanceof Error ? error : new Error(String(error)), {
      searchParams: Object.fromEntries(request.nextUrl.searchParams.entries())
    })
    
    return NextResponse.json(
      { error: 'Internal search error. Please try again.' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting (more restrictive for POST)
    const rateLimitResult = await rateLimiters.search(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const body = await request.json()
    const filters: SearchFilters = body

    // Validate POST body
    if (!filters || typeof filters !== 'object') {
      return NextResponse.json(
        { error: 'Invalid search filters' },
        { status: 400 }
      )
    }

    // Perform search with more complex filters from POST body
    const results = await searchEngine.search(filters)

    return NextResponse.json(results, {
      headers: {
        'X-Search-Time': results.searchMetadata.executionTime.toString(),
        'X-Total-Results': results.searchMetadata.totalResults.toString()
      }
    })

  } catch (error) {
    logger.error('Search POST API error', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal search error' },
      { status: 500 }
    )
  }
}