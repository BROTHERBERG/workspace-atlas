import { NextRequest, NextResponse } from 'next/server'
import { searchEngine } from '@/lib/search/search-engine'
import { logger } from '@/lib/logger'
import { rateLimiters } from '@/lib/security/rate-limiter'

export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimiters.search(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const latitude = parseFloat(searchParams.get('lat') || '0')
    const longitude = parseFloat(searchParams.get('lng') || '0')
    const radius = Math.min(
      parseFloat(searchParams.get('radius') || '25'),
      100 // Max 100km radius
    )

    // Validate coordinates
    if (!latitude || !longitude || 
        latitude < -90 || latitude > 90 || 
        longitude < -180 || longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid latitude or longitude coordinates' },
        { status: 400 }
      )
    }

    if (radius <= 0) {
      return NextResponse.json(
        { error: 'Radius must be greater than 0' },
        { status: 400 }
      )
    }

    const locations = await searchEngine.searchByLocation(
      latitude,
      longitude,
      radius
    )

    return NextResponse.json(
      {
        center: { lat: latitude, lng: longitude },
        radius,
        locations,
        count: locations.length,
        totalWorkspaces: locations.reduce((sum, loc) => sum + loc.workspaceCount, 0)
      },
      {
        headers: {
          'Cache-Control': 'public, max-age=600', // 10 minute cache for location data
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    logger.error('Location search API error', error instanceof Error ? error : new Error(String(error)), {
      lat: request.nextUrl.searchParams.get('lat'),
      lng: request.nextUrl.searchParams.get('lng'),
      radius: request.nextUrl.searchParams.get('radius')
    })
    
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    )
  }
}