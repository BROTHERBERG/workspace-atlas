import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import { getRealWorkspaces } from '@/lib/real-workspace-data'

const workspaceQuerySchema = z.object({
  q: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  featured: z.string().transform((val) => val === 'true').optional(),
  amenities: z.string().optional(),
  types: z.string().optional(),
  minScore: z.string().transform((val) => parseInt(val, 10)).optional(),
  maxPrice: z.string().transform((val) => parseInt(val, 10)).optional(),
  sortBy: z.enum(['relevance', 'price-low', 'price-high', 'rating', 'digital-score']).optional(),
  limit: z.string().transform((val) => parseInt(val, 10)).optional(),
  page: z.string().transform((val) => parseInt(val, 10)).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = Object.fromEntries(searchParams.entries())
    const validatedQuery = workspaceQuerySchema.parse(query)

    const page = validatedQuery.page || 1
    const limit = validatedQuery.limit || 12
    const skip = (page - 1) * limit

    // Load real workspaces from JSON
    let allWorkspaces = getRealWorkspaces().map((ws, idx) => ({
      id: String(ws.id),
      name: ws.name,
      slug: ws.name.toLowerCase().replace(/\s+/g, '-'),
      description: ws.description,
      city: ws.location.city,
      country: ws.location.country,
      address: ws.location.address,
      latitude: ws.location.coordinates.lat,
      longitude: ws.location.coordinates.lng,
      website: ws.contactInfo.website,
      digitalScore: ws.digitalScore,
      rating: ws.rating,
      reviewCount: ws.reviewCount,
      featured: ws.featured,
      verified: ws.verified,
      images: ws.images.map((img, imgIdx) => ({
        id: `${ws.id}-${imgIdx}`,
        url: img,
        alt: `${ws.name} image ${imgIdx + 1}`,
        isMain: imgIdx === 0
      })),
      amenities: ws.amenities.map((amenity, amenIdx) => ({
        id: `${ws.id}-${amenIdx}`,
        amenity
      })),
      _count: {
        reviews: ws.reviewCount
      }
    }))

    // Apply filters
    if (validatedQuery.q) {
      const searchTerm = validatedQuery.q.toLowerCase()
      allWorkspaces = allWorkspaces.filter(ws =>
        ws.name.toLowerCase().includes(searchTerm) ||
        ws.description?.toLowerCase().includes(searchTerm) ||
        ws.city.toLowerCase().includes(searchTerm) ||
        ws.country.toLowerCase().includes(searchTerm) ||
        ws.address?.toLowerCase().includes(searchTerm)
      )
    }

    if (validatedQuery.city) {
      allWorkspaces = allWorkspaces.filter(ws =>
        ws.city.toLowerCase() === validatedQuery.city!.toLowerCase()
      )
    }

    if (validatedQuery.country) {
      allWorkspaces = allWorkspaces.filter(ws =>
        ws.country.toLowerCase() === validatedQuery.country!.toLowerCase()
      )
    }

    if (validatedQuery.featured) {
      allWorkspaces = allWorkspaces.filter(ws => ws.featured === validatedQuery.featured)
    }

    if (validatedQuery.minScore) {
      allWorkspaces = allWorkspaces.filter(ws =>
        ws.digitalScore && ws.digitalScore >= validatedQuery.minScore!
      )
    }

    if (validatedQuery.amenities) {
      const amenityList = validatedQuery.amenities.split(',').map(a => a.trim())
      allWorkspaces = allWorkspaces.filter(ws =>
        amenityList.some(amenity =>
          ws.amenities.some(a => a.amenity.toLowerCase().includes(amenity.toLowerCase()))
        )
      )
    }

    // Apply sorting
    switch (validatedQuery.sortBy) {
      case 'rating':
        allWorkspaces.sort((a, b) => (b.rating || 0) - (a.rating || 0))
        break
      case 'digital-score':
        allWorkspaces.sort((a, b) => (b.digitalScore || 0) - (a.digitalScore || 0))
        break
      default:
        // Default: featured first, then digital score, then rating
        allWorkspaces.sort((a, b) => {
          if (a.featured !== b.featured) return b.featured ? 1 : -1
          if ((b.digitalScore || 0) !== (a.digitalScore || 0)) return (b.digitalScore || 0) - (a.digitalScore || 0)
          return (b.rating || 0) - (a.rating || 0)
        })
    }

    const totalCount = allWorkspaces.length
    const workspaces = allWorkspaces.slice(skip, skip + limit)

    return NextResponse.json({
      workspaces,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      hasMore: page * limit < totalCount,
    })
  } catch (error) {
    logger.error('Workspaces API error', error instanceof Error ? error : new Error(String(error)))

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
