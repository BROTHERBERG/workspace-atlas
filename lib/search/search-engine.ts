/**
 * Advanced Search and Filtering Engine
 * Provides intelligent workspace discovery with multiple search strategies
 */

import { PrismaClient } from '@prisma/client'
import { logger, PerformanceTimer } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { prisma } from '@/lib/db'

export interface SearchFilters {
  // Text search
  query?: string
  
  // Location filters
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  radius?: number // in kilometers
  
  // Workspace features
  amenities?: string[]
  workspaceTypes?: string[]
  
  // Pricing filters
  minPrice?: number
  maxPrice?: number
  currency?: string
  pricingType?: 'hot_desk' | 'dedicated_desk' | 'private_office'
  
  // Quality filters
  minRating?: number
  minReviewCount?: number
  minDigitalScore?: number
  
  // Availability
  hasAvailability?: boolean
  instantBooking?: boolean
  
  // Business details
  isVerified?: boolean
  isActive?: boolean
  
  // Sorting
  sortBy?: 'relevance' | 'price' | 'rating' | 'distance' | 'digitalScore' | 'newest' | 'popular'
  sortOrder?: 'asc' | 'desc'
  
  // Pagination
  page?: number
  limit?: number
}

export interface SearchResult {
  id: string
  name: string
  slug: string
  description?: string
  
  // Location
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  
  // Images and media
  images: string[]
  primaryImage?: string
  
  // Pricing
  hotDeskPrice?: number
  dedicatedDeskPrice?: number
  privateOfficePrice?: number
  pricingCurrency: string
  
  // Quality metrics
  rating?: number
  reviewCount?: number
  digitalScore: number
  
  // Features
  amenities: string[]
  workspaceType?: string
  
  // Calculated fields
  distance?: number // in kilometers
  relevanceScore?: number
  matchingAmenities?: string[]
  
  // Business info
  isVerified: boolean
  isActive: boolean
  website?: string
  phone?: string
  
  // Metadata
  source: string
  createdAt: Date
  updatedAt: Date
}

export interface SearchResponse {
  results: SearchResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  aggregations: {
    cities: Array<{ name: string; count: number }>
    countries: Array<{ name: string; count: number }>
    amenities: Array<{ name: string; count: number }>
    priceRanges: Array<{ range: string; count: number }>
    ratings: Array<{ rating: number; count: number }>
  }
  searchMetadata: {
    query?: string
    executionTime: number
    totalResults: number
    appliedFilters: string[]
    suggestions?: string[]
  }
}

export interface LocationSearchResult {
  lat: number
  lng: number
  address: string
  city: string
  country: string
  workspaceCount: number
}

export class WorkspaceSearchEngine {
  private prisma: PrismaClient

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma
  }
  
  /**
   * Main search method with comprehensive filtering
   */
  async search(filters: SearchFilters): Promise<SearchResponse> {
    const timer = new PerformanceTimer('workspace-search')
    
    try {
      logger.info('Starting workspace search', { filters })
      
      // Cache key for this search
      const cacheKey = this.generateCacheKey(filters)
      
      // Try cache first (5 minute TTL)
      const cached = cache.get(cacheKey) as SearchResponse | null
      if (cached) {
        logger.info('Search cache hit', { cacheKey })
        return cached
      }
      
      const page = filters.page || 1
      const limit = Math.min(filters.limit || 20, 100) // Max 100 per page
      const offset = (page - 1) * limit
      
      // Build Prisma query
      const whereClause = await this.buildWhereClause(filters)
      const orderBy = this.buildOrderBy(filters)
      
      // Execute search and count in parallel
      const [workspaces, totalCount] = await Promise.all([
        this.prisma.workspace.findMany({
          where: whereClause,
          orderBy,
          take: limit,
          skip: offset,
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            address: true,
            city: true,
            country: true,
            latitude: true,
            longitude: true,
            images: true,
            hotDeskPrice: true,
            dedicatedDeskPrice: true,
            privateOfficePrice: true,
            pricingCurrency: true,
            rating: true,
            reviewCount: true,
            digitalScore: true,
            amenities: true,
            verified: true,
            isActive: true,
            website: true,
            phone: true,
            source: true,
            createdAt: true,
            updatedAt: true,
          }
        }),
        this.prisma.workspace.count({ where: whereClause })
      ])
      
      // Process results
      const results = await this.processResults(workspaces, filters)
      
      // Generate aggregations
      const aggregations = await this.generateAggregations(whereClause)
      
      // Generate suggestions for empty results
      const suggestions = results.length === 0 
        ? await this.generateSuggestions(filters)
        : undefined
      
      const response: SearchResponse = {
        results,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages: Math.ceil(totalCount / limit),
          hasNextPage: page < Math.ceil(totalCount / limit),
          hasPrevPage: page > 1
        },
        aggregations,
        searchMetadata: {
          query: filters.query,
          executionTime: timer.finish({
            totalResults: totalCount,
            page,
            limit
          }),
          totalResults: totalCount,
          appliedFilters: this.getAppliedFilters(filters),
          suggestions
        }
      }
      
      // Cache the response (5 minutes)
      await cache.set(cacheKey, response, 300)
      
      logger.info('Search completed', {
        totalResults: totalCount,
        pageResults: results.length,
        executionTime: response.searchMetadata.executionTime
      })
      
      return response
      
    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      logger.error('Search failed', error instanceof Error ? error : new Error(String(error)), { filters })
      throw error
    }
  }
  
  /**
   * Location-based search for map displays
   */
  async searchByLocation(
    latitude: number,
    longitude: number,
    radiusKm: number = 25
  ): Promise<LocationSearchResult[]> {
    try {
      // Using raw SQL for geo distance calculation
      const locations = await this.prisma.$queryRaw<any[]>`
        SELECT 
          latitude as lat,
          longitude as lng,
          address,
          city,
          country,
          COUNT(*) as workspace_count,
          (6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(latitude))
          )) AS distance
        FROM "Workspace" 
        WHERE 
          latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND "isActive" = true
          AND "status" = 'ACTIVE'
        HAVING distance <= ${radiusKm}
        GROUP BY latitude, longitude, address, city, country
        ORDER BY distance
        LIMIT 100
      `
      
      return locations.map(loc => ({
        lat: parseFloat(loc.lat),
        lng: parseFloat(loc.lng),
        address: loc.address,
        city: loc.city,
        country: loc.country,
        workspaceCount: parseInt(loc.workspace_count)
      }))
      
    } catch (error) {
      logger.error('Location search failed', error instanceof Error ? error : new Error(String(error)), {
        latitude,
        longitude,
        radiusKm
      })
      throw error
    }
  }
  
  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string, limit: number = 10): Promise<string[]> {
    if (query.length < 2) return []
    
    try {
      const cacheKey = `search-suggestions:${query.toLowerCase()}`
      const cached = cache.get(cacheKey) as string[] | null
      if (cached) return cached
      
      const suggestions = new Set<string>()
      
      // Search workspace names
      const workspaceNames = await this.prisma.workspace.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: { name: true },
        take: limit
      })
      
      workspaceNames.forEach(w => suggestions.add(w.name))
      
      // Search cities
      const cities = await this.prisma.workspace.findMany({
        where: {
          city: {
            contains: query,
            mode: 'insensitive'
          },
          isActive: true
        },
        select: { city: true },
        distinct: ['city'],
        take: limit
      })
      
      cities.forEach(c => c.city && suggestions.add(c.city))
      
      // Search amenities
      const amenityResults = await this.prisma.workspace.findMany({
        where: {
          amenities: {
            hasSome: [query] // This might need adjustment based on your Prisma setup
          },
          isActive: true
        },
        select: { amenities: true },
        take: 20
      })
      
      amenityResults.forEach(r => {
        (r.amenities as string[])?.forEach(amenity => {
          if (amenity.toLowerCase().includes(query.toLowerCase())) {
            suggestions.add(amenity)
          }
        })
      })
      
      const result = Array.from(suggestions).slice(0, limit)
      await cache.set(cacheKey, result, 300) // 5 minute cache
      
      return result
      
    } catch (error) {
      logger.error('Search suggestions failed', error instanceof Error ? error : new Error(String(error)), { query })
      return []
    }
  }
  
  /**
   * Build WHERE clause from filters
   */
  private async buildWhereClause(filters: SearchFilters): Promise<any> {
    const where: any = {
      isActive: filters.isActive !== false, // Default to true unless explicitly false
      status: 'ACTIVE'
    }
    
    // Text search
    if (filters.query) {
      where.OR = [
        { name: { contains: filters.query, mode: 'insensitive' } },
        { description: { contains: filters.query, mode: 'insensitive' } },
        { address: { contains: filters.query, mode: 'insensitive' } },
        { city: { contains: filters.query, mode: 'insensitive' } }
      ]
    }
    
    // Location filters
    if (filters.city) {
      where.city = { equals: filters.city, mode: 'insensitive' }
    }
    
    if (filters.country) {
      where.country = { equals: filters.country, mode: 'insensitive' }
    }
    
    // Geographic radius search
    if (filters.latitude && filters.longitude && filters.radius) {
      // This would need raw SQL or a spatial extension
      // For now, we'll handle this in post-processing
    }
    
    // Amenities filter
    if (filters.amenities && filters.amenities.length > 0) {
      where.amenities = {
        hassome: filters.amenities
      }
    }
    
    // Price filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      const priceField = this.getPriceField(filters.pricingType)
      if (priceField) {
        where[priceField] = {}
        if (filters.minPrice !== undefined) {
          where[priceField].gte = filters.minPrice
        }
        if (filters.maxPrice !== undefined) {
          where[priceField].lte = filters.maxPrice
        }
      }
    }
    
    // Quality filters
    if (filters.minRating) {
      where.rating = { gte: filters.minRating }
    }
    
    if (filters.minReviewCount) {
      where.reviewCount = { gte: filters.minReviewCount }
    }
    
    if (filters.minDigitalScore) {
      where.digitalScore = { gte: filters.minDigitalScore }
    }
    
    // Verification filter
    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified
    }
    
    return where
  }
  
  /**
   * Build ORDER BY clause
   */
  private buildOrderBy(filters: SearchFilters): any[] {
    const sortBy = filters.sortBy || 'relevance'
    const sortOrder = filters.sortOrder || 'desc'
    
    switch (sortBy) {
      case 'price':
        const priceField = this.getPriceField(filters.pricingType) || 'hotDeskPrice'
        return [{ [priceField]: sortOrder }]
        
      case 'rating':
        return [{ rating: sortOrder }, { reviewCount: 'desc' }]
        
      case 'digitalScore':
        return [{ digitalScore: sortOrder }]
        
      case 'newest':
        return [{ createdAt: 'desc' }]
        
      case 'popular':
        return [{ reviewCount: 'desc' }, { rating: 'desc' }]
        
      case 'distance':
        // Distance sorting would be handled after geographic filtering
        return [{ createdAt: 'desc' }] // Fallback
        
      case 'relevance':
      default:
        // Complex relevance scoring
        return [
          { digitalScore: 'desc' },
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { updatedAt: 'desc' }
        ]
    }
  }
  
  /**
   * Process raw results and add calculated fields
   */
  private async processResults(workspaces: any[], filters: SearchFilters): Promise<SearchResult[]> {
    return workspaces.map(workspace => {
      const result: SearchResult = {
        id: workspace.id,
        name: workspace.name,
        slug: workspace.slug,
        description: workspace.description,
        address: workspace.address,
        city: workspace.city,
        country: workspace.country,
        latitude: workspace.latitude,
        longitude: workspace.longitude,
        images: (workspace.images as string[]) || [],
        primaryImage: ((workspace.images as string[]) || [])[0],
        hotDeskPrice: workspace.hotDeskPrice,
        dedicatedDeskPrice: workspace.dedicatedDeskPrice,
        privateOfficePrice: workspace.privateOfficePrice,
        pricingCurrency: workspace.pricingCurrency,
        rating: workspace.rating,
        reviewCount: workspace.reviewCount || 0,
        digitalScore: workspace.digitalScore,
        amenities: (workspace.amenities as string[]) || [],
        workspaceType: undefined,
        isVerified: workspace.verified,
        isActive: workspace.isActive,
        website: workspace.website,
        phone: workspace.phone,
        source: workspace.source,
        createdAt: workspace.createdAt,
        updatedAt: workspace.updatedAt
      }
      
      // Calculate distance if location provided
      if (filters.latitude && filters.longitude && workspace.latitude && workspace.longitude) {
        result.distance = this.calculateDistance(
          filters.latitude,
          filters.longitude,
          workspace.latitude,
          workspace.longitude
        )
      }
      
      // Calculate relevance score
      result.relevanceScore = this.calculateRelevanceScore(workspace, filters)
      
      // Find matching amenities
      if (filters.amenities && filters.amenities.length > 0) {
        result.matchingAmenities = result.amenities.filter(amenity =>
          filters.amenities!.some(filterAmenity =>
            amenity.toLowerCase().includes(filterAmenity.toLowerCase())
          )
        )
      }
      
      return result
    })
  }
  
  /**
   * Generate search aggregations for faceted search
   */
  private async generateAggregations(whereClause: any): Promise<SearchResponse['aggregations']> {
    try {
      const [cities, countries, amenities, priceStats] = await Promise.all([
        // Top cities
        this.prisma.workspace.groupBy({
          by: ['city'],
          where: { ...whereClause, city: { not: null } },
          _count: { city: true },
          orderBy: { _count: { city: 'desc' } },
          take: 20
        }),
        
        // Top countries
        this.prisma.workspace.groupBy({
          by: ['country'],
          where: { ...whereClause, country: { not: null } },
          _count: { country: true },
          orderBy: { _count: { country: 'desc' } },
          take: 10
        }),
        
        // This is a simplified amenities aggregation
        // In production, you'd want to flatten the amenities array
        this.prisma.workspace.findMany({
          where: whereClause,
          select: { amenities: true },
          take: 100
        }),
        
        // Price statistics
        this.prisma.workspace.aggregate({
          where: { ...whereClause, hotDeskPrice: { not: null } },
          _min: { hotDeskPrice: true },
          _max: { hotDeskPrice: true },
          _avg: { hotDeskPrice: true }
        })
      ])
      
      // Process amenities
      const amenityCount = new Map<string, number>()
      amenities.forEach(workspace => {
        (workspace.amenities as string[])?.forEach(amenity => {
          amenityCount.set(amenity, (amenityCount.get(amenity) || 0) + 1)
        })
      })
      
      // Generate price ranges
      const priceRanges = this.generatePriceRanges(priceStats)
      
      return {
        cities: cities.map(c => ({ name: c.city!, count: c._count.city })),
        countries: countries.map(c => ({ name: c.country!, count: c._count.country })),
        amenities: Array.from(amenityCount.entries())
          .map(([name, count]) => ({ name, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 20),
        priceRanges,
        ratings: [] // Would be generated similarly
      }
      
    } catch (error) {
      logger.error('Failed to generate aggregations', error instanceof Error ? error : new Error(String(error)))
      return {
        cities: [],
        countries: [],
        amenities: [],
        priceRanges: [],
        ratings: []
      }
    }
  }
  
  /**
   * Generate search suggestions for empty results
   */
  private async generateSuggestions(filters: SearchFilters): Promise<string[]> {
    const suggestions: string[] = []
    
    if (filters.query) {
      // Suggest similar city names
      const similarCities = await this.prisma.workspace.findMany({
        where: {
          city: {
            contains: filters.query.substring(0, 3),
            mode: 'insensitive'
          }
        },
        select: { city: true },
        distinct: ['city'],
        take: 3
      })
      
      suggestions.push(...similarCities.map(c => c.city!))
    }
    
    // Suggest expanding search radius
    if (filters.city || filters.country) {
      suggestions.push('Try searching in nearby areas')
    }
    
    // Suggest removing filters
    if (filters.minPrice || filters.maxPrice) {
      suggestions.push('Try adjusting price range')
    }
    
    if (filters.amenities && filters.amenities.length > 0) {
      suggestions.push('Try fewer amenity requirements')
    }
    
    return suggestions.slice(0, 5)
  }
  
  // Utility methods
  private generateCacheKey(filters: SearchFilters): string {
    return `search:${JSON.stringify(filters)}`
  }
  
  private getPriceField(pricingType?: string): string | null {
    switch (pricingType) {
      case 'hot_desk': return 'hotDeskPrice'
      case 'dedicated_desk': return 'dedicatedDeskPrice'  
      case 'private_office': return 'privateOfficePrice'
      default: return 'hotDeskPrice'
    }
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
  
  private calculateRelevanceScore(workspace: any, filters: SearchFilters): number {
    let score = 0
    
    // Base score from digital score
    score += (workspace.digitalScore || 0) * 0.3
    
    // Rating contribution
    if (workspace.rating) {
      score += workspace.rating * 20 * 0.4
    }
    
    // Review count contribution
    if (workspace.reviewCount) {
      score += Math.min(workspace.reviewCount, 100) * 0.2
    }
    
    // Query matching bonus
    if (filters.query && workspace.name) {
      if (workspace.name.toLowerCase().includes(filters.query.toLowerCase())) {
        score += 20
      }
    }
    
    // Verification bonus
    if (workspace.isVerified) {
      score += 10
    }
    
    return Math.round(score)
  }
  
  private generatePriceRanges(priceStats: any): Array<{ range: string; count: number }> {
    if (!priceStats._min.hotDeskPrice || !priceStats._max.hotDeskPrice) {
      return []
    }
    
    const min = priceStats._min.hotDeskPrice
    const max = priceStats._max.hotDeskPrice
    const ranges = [
      { range: `$${min}-${Math.round(min + (max - min) * 0.25)}`, count: 0 },
      { range: `$${Math.round(min + (max - min) * 0.25)}-${Math.round(min + (max - min) * 0.5)}`, count: 0 },
      { range: `$${Math.round(min + (max - min) * 0.5)}-${Math.round(min + (max - min) * 0.75)}`, count: 0 },
      { range: `$${Math.round(min + (max - min) * 0.75)}-${max}`, count: 0 }
    ]
    
    return ranges
  }
  
  private getAppliedFilters(filters: SearchFilters): string[] {
    const applied: string[] = []
    
    if (filters.query) applied.push('text_search')
    if (filters.city) applied.push('city')
    if (filters.country) applied.push('country')
    if (filters.amenities?.length) applied.push('amenities')
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) applied.push('price_range')
    if (filters.minRating) applied.push('rating')
    if (filters.isVerified) applied.push('verified_only')
    if (filters.latitude && filters.longitude) applied.push('location_search')
    
    return applied
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Global search engine instance
export const searchEngine = new WorkspaceSearchEngine()