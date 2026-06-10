import { NextRequest, NextResponse } from 'next/server'
import { searchEngine } from '@/lib/search/search-engine'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/security/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting (more permissive for suggestions)
    const rateLimitResult = await rateLimiters.general(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const limit = Math.min(
      parseInt(searchParams.get('limit') || '10'),
      20
    ) // Max 20 suggestions

    if (!query || query.trim().length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      )
    }

    const suggestions = await searchEngine.getSearchSuggestions(
      query.trim(),
      limit
    )

    return NextResponse.json(
      {
        query: query.trim(),
        suggestions,
        count: suggestions.length
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=300', // 5 minute cache
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    logger.error('Search suggestions API error', error instanceof Error ? error : new Error(String(error)), {
      query: request.nextUrl.searchParams.get('q')
    })
    
    return NextResponse.json(
      { error: 'Failed to get search suggestions' },
      { status: 500 }
    )
  }
}