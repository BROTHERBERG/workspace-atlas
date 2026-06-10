import { GET, POST } from '@/app/api/search/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/search/search-engine', () => ({
  searchEngine: {
    search: jest.fn()
  }
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn()
  }
}))

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimiters: {
    search: jest.fn()
  }
}))

// Mock search response
const mockSearchResponse = {
  results: [
    {
      id: 'workspace-1',
      name: 'Test Workspace',
      slug: 'test-workspace',
      city: 'New York',
      country: 'United States',
      rating: 4.5,
      digitalScore: 85,
      amenities: ['WiFi', 'Coffee'],
      images: ['image1.jpg'],
      primaryImage: 'image1.jpg',
      hotDeskPrice: 50,
      pricingCurrency: 'USD',
      isVerified: true,
      isActive: true,
      source: 'direct',
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-12-01'),
      relevanceScore: 95,
      reviewCount: 25
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false
  },
  aggregations: {
    cities: [{ name: 'New York', count: 1 }],
    countries: [{ name: 'United States', count: 1 }],
    amenities: [{ name: 'WiFi', count: 1 }],
    priceRanges: [{ range: '$40-60', count: 1 }],
    ratings: [{ rating: 4, count: 1 }]
  },
  searchMetadata: {
    query: 'test',
    executionTime: 25.5,
    totalResults: 1,
    appliedFilters: ['text_search']
  }
}

describe('/api/search', () => {
  let mockRequest: Partial<NextRequest>
  let searchEngine: any
  let rateLimiters: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Get mocked modules
    searchEngine = require('@/lib/search/search-engine').searchEngine
    rateLimiters = require('@/lib/security/rate-limiter').rateLimiters
    
    // Default rate limit success
    rateLimiters.search.mockResolvedValue({
      success: true,
      remaining: 95
    })
    
    // Default search success
    searchEngine.search.mockResolvedValue(mockSearchResponse)
  })

  describe('GET /api/search', () => {
    beforeEach(() => {
      mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams()
        }
      }
    })

    it('should perform basic search with no parameters', async () => {
      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(searchEngine.search).toHaveBeenCalledWith({
        query: undefined,
        city: undefined,
        country: undefined,
        latitude: undefined,
        longitude: undefined,
        radius: undefined,
        amenities: undefined,
        workspaceTypes: undefined,
        minPrice: undefined,
        maxPrice: undefined,
        currency: undefined,
        pricingType: undefined,
        minRating: undefined,
        minReviewCount: undefined,
        minDigitalScore: undefined,
        hasAvailability: false,
        instantBooking: false,
        isVerified: undefined,
        isActive: true,
        sortBy: 'relevance',
        sortOrder: 'desc',
        page: 1,
        limit: 20
      })
    })

    it('should parse query parameters correctly', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        q: 'coworking space',
        city: 'New York',
        country: 'United States',
        lat: '40.7128',
        lng: '-74.0060',
        radius: '10',
        amenities: 'WiFi,Coffee,Meeting Rooms',
        types: 'Coworking,Private Office',
        minPrice: '30',
        maxPrice: '100',
        currency: 'USD',
        pricingType: 'hot_desk',
        minRating: '4.0',
        minReviews: '5',
        minScore: '70',
        available: 'true',
        instantBooking: 'true',
        verified: 'true',
        sortBy: 'price',
        sortOrder: 'asc',
        page: '2',
        limit: '50'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.search).toHaveBeenCalledWith({
        query: 'coworking space',
        city: 'New York',
        country: 'United States',
        latitude: 40.7128,
        longitude: -74.0060,
        radius: 10,
        amenities: ['WiFi', 'Coffee', 'Meeting Rooms'],
        workspaceTypes: ['Coworking', 'Private Office'],
        minPrice: 30,
        maxPrice: 100,
        currency: 'USD',
        pricingType: 'hot_desk',
        minRating: 4.0,
        minReviewCount: 5,
        minDigitalScore: 70,
        hasAvailability: true,
        instantBooking: true,
        isVerified: true,
        isActive: true,
        sortBy: 'price',
        sortOrder: 'asc',
        page: 2,
        limit: 50
      })
    })

    it('should handle boolean parameters correctly', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        verified: 'false',
        active: 'false',
        available: 'false'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          isVerified: false,
          isActive: false,
          hasAvailability: false
        })
      )
    })

    it('should return rate limit error when rate limited', async () => {
      rateLimiters.search.mockResolvedValue({
        success: false,
        remaining: 0,
        resetTime: Date.now() + 60000
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many search requests. Please try again later.')
      expect(response.headers.get('X-RateLimit-Limit')).toBe('100')
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(searchEngine.search).not.toHaveBeenCalled()
    })

    it('should validate page parameter', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ page: '0' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Page number must be greater than 0')
      expect(searchEngine.search).not.toHaveBeenCalled()
    })

    it('should validate limit parameter', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ limit: '150' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Limit must be between 1 and 100')
    })

    it('should validate radius parameter', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ radius: '600' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Search radius cannot exceed 500km')
    })

    it('should include proper response headers', async () => {
      const response = await GET(mockRequest as NextRequest)

      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
      expect(response.headers.get('X-Search-Time')).toBe('25.5')
      expect(response.headers.get('X-Total-Results')).toBe('1')
    })

    it('should handle search engine errors', async () => {
      searchEngine.search.mockRejectedValue(new Error('Database error'))

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal search error. Please try again.')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Search API error',
        expect.any(Error),
        { searchParams: {} }
      )
    })

    it('should handle numeric parsing errors gracefully', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: 'invalid',
        lng: 'not-a-number',
        minPrice: 'not-numeric'
      })

      const response = await GET(mockRequest as NextRequest)
      
      // Should still work, but with undefined values for invalid numbers
      expect(response.status).toBe(200)
      expect(searchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: NaN,
          longitude: NaN,
          minPrice: NaN
        })
      )
    })

    it('should split comma-separated values correctly', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        amenities: 'WiFi,Coffee,Meeting Rooms,Printing',
        types: 'Coworking,Private Office'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          amenities: ['WiFi', 'Coffee', 'Meeting Rooms', 'Printing'],
          workspaceTypes: ['Coworking', 'Private Office']
        })
      )
    })
  })

  describe('POST /api/search', () => {
    beforeEach(() => {
      mockRequest = {
        json: jest.fn()
      }
    })

    it('should handle POST request with filters in body', async () => {
      const searchFilters = {
        query: 'coworking',
        city: 'San Francisco',
        amenities: ['WiFi', 'Coffee'],
        minPrice: 40,
        maxPrice: 80
      }
      
      ;(mockRequest.json as jest.Mock).mockResolvedValue(searchFilters)

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(1)
      expect(searchEngine.search).toHaveBeenCalledWith(searchFilters)
    })

    it('should return rate limit error for POST requests', async () => {
      rateLimiters.search.mockResolvedValue({
        success: false,
        remaining: 0
      })

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many requests')
    })

    it('should validate POST request body', async () => {
      ;(mockRequest.json as jest.Mock).mockResolvedValue('invalid-body')

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid search filters')
      expect(searchEngine.search).not.toHaveBeenCalled()
    })

    it('should handle null body', async () => {
      ;(mockRequest.json as jest.Mock).mockResolvedValue(null)

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid search filters')
    })

    it('should include search metadata in headers', async () => {
      const searchFilters = { query: 'test' }
      ;(mockRequest.json as jest.Mock).mockResolvedValue(searchFilters)

      const response = await POST(mockRequest as NextRequest)

      expect(response.headers.get('X-Search-Time')).toBe('25.5')
      expect(response.headers.get('X-Total-Results')).toBe('1')
    })

    it('should handle search errors in POST', async () => {
      const searchFilters = { query: 'test' }
      ;(mockRequest.json as jest.Mock).mockResolvedValue(searchFilters)
      searchEngine.search.mockRejectedValue(new Error('Search failed'))

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal search error')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Search POST API error',
        expect.any(Error)
      )
    })

    it('should handle JSON parsing errors', async () => {
      ;(mockRequest.json as jest.Mock).mockRejectedValue(new Error('Invalid JSON'))

      const response = await POST(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Internal search error')
    })

    it('should accept complex filter objects', async () => {
      const complexFilters = {
        query: 'modern workspace',
        city: 'London',
        country: 'United Kingdom',
        latitude: 51.5074,
        longitude: -0.1278,
        radius: 15,
        amenities: ['WiFi', 'Coffee', '24/7 Access', 'Meeting Rooms'],
        workspaceTypes: ['Coworking', 'Serviced Office'],
        minPrice: 25,
        maxPrice: 75,
        currency: 'GBP',
        pricingType: 'dedicated_desk',
        minRating: 4.0,
        minReviewCount: 10,
        minDigitalScore: 80,
        hasAvailability: true,
        instantBooking: false,
        isVerified: true,
        isActive: true,
        sortBy: 'digitalScore',
        sortOrder: 'desc',
        page: 1,
        limit: 25
      }

      ;(mockRequest.json as jest.Mock).mockResolvedValue(complexFilters)

      const response = await POST(mockRequest as NextRequest)
      
      expect(response.status).toBe(200)
      expect(searchEngine.search).toHaveBeenCalledWith(complexFilters)
    })
  })

  describe('Edge Cases', () => {
    beforeEach(() => {
      mockRequest = {
        nextUrl: {
          searchParams: new URLSearchParams()
        }
      }
    })

    it('should handle empty search results', async () => {
      const emptyResponse = {
        ...mockSearchResponse,
        results: [],
        pagination: {
          ...mockSearchResponse.pagination,
          total: 0,
          totalPages: 0
        },
        searchMetadata: {
          ...mockSearchResponse.searchMetadata,
          totalResults: 0,
          suggestions: ['Try broader search terms', 'Remove some filters']
        }
      }
      
      searchEngine.search.mockResolvedValue(emptyResponse)

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.results).toHaveLength(0)
      expect(data.searchMetadata.suggestions).toBeDefined()
    })

    it('should handle very long query strings', async () => {
      const longQuery = 'a'.repeat(1000)
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: longQuery })

      const response = await GET(mockRequest as NextRequest)
      
      expect(response.status).toBe(200)
      expect(searchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: longQuery
        })
      )
    })

    it('should handle special characters in search queries', async () => {
      const specialQuery = 'café & büro (24/7) - €50/day'
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: specialQuery })

      const response = await GET(mockRequest as NextRequest)
      
      expect(response.status).toBe(200)
      expect(searchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: specialQuery
        })
      )
    })

    it('should handle extreme coordinates', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '90',
        lng: '180',
        radius: '0.1'
      })

      const response = await GET(mockRequest as NextRequest)
      
      expect(response.status).toBe(200)
      expect(searchEngine.search).toHaveBeenCalledWith(
        expect.objectContaining({
          latitude: 90,
          longitude: 180,
          radius: 0.1
        })
      )
    })
  })
})