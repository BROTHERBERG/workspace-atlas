import { GET } from '@/app/api/search/locations/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/search/search-engine', () => ({
  searchEngine: {
    searchByLocation: jest.fn()
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

// Mock location data
const mockLocationData = [
  {
    lat: 40.7128,
    lng: -74.0060,
    address: '123 Broadway, New York',
    city: 'New York',
    country: 'United States',
    workspaceCount: 5
  },
  {
    lat: 40.7589,
    lng: -73.9851,
    address: '456 Times Square, New York',
    city: 'New York', 
    country: 'United States',
    workspaceCount: 3
  }
]

describe('/api/search/locations', () => {
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
    
    // Default location search response
    searchEngine.searchByLocation.mockResolvedValue(mockLocationData)

    mockRequest = {
      nextUrl: {
        searchParams: new URLSearchParams()
      }
    }
  })

  describe('Successful Requests', () => {
    it('should return locations for valid coordinates', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        center: { lat: 40.7128, lng: -74.0060 },
        radius: 25, // default radius
        locations: mockLocationData,
        count: 2,
        totalWorkspaces: 8 // 5 + 3
      })
      
      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.7128, -74.0060, 25)
    })

    it('should use custom radius when provided', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '51.5074',
        lng: '-0.1278',
        radius: '50'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.radius).toBe(50)
      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(51.5074, -0.1278, 50)
    })

    it('should cap radius at maximum of 100km', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '35.6762',
        lng: '139.6503',
        radius: '200'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.radius).toBe(100) // Should be capped at 100
      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(35.6762, 139.6503, 100)
    })

    it('should include proper response headers', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=600')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should calculate total workspaces correctly', async () => {
      const customLocationData = [
        { lat: 40.7128, lng: -74.0060, address: '123 St', city: 'NYC', country: 'US', workspaceCount: 10 },
        { lat: 40.7589, lng: -73.9851, address: '456 Ave', city: 'NYC', country: 'US', workspaceCount: 15 },
        { lat: 40.7505, lng: -73.9934, address: '789 Blvd', city: 'NYC', country: 'US', workspaceCount: 5 }
      ]
      
      searchEngine.searchByLocation.mockResolvedValue(customLocationData)
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(data.count).toBe(3)
      expect(data.totalWorkspaces).toBe(30) // 10 + 15 + 5
    })

    it('should handle empty location results', async () => {
      searchEngine.searchByLocation.mockResolvedValue([])
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '0',
        lng: '0'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.locations).toEqual([])
      expect(data.count).toBe(0)
      expect(data.totalWorkspaces).toBe(0)
    })
  })

  describe('Coordinate Validation', () => {
    it('should reject missing latitude', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid latitude or longitude coordinates')
      expect(searchEngine.searchByLocation).not.toHaveBeenCalled()
    })

    it('should reject missing longitude', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid latitude or longitude coordinates')
    })

    it('should reject invalid latitude values', async () => {
      const invalidLatitudes = ['-91', '91', 'invalid', 'NaN']
      
      for (const lat of invalidLatitudes) {
        mockRequest.nextUrl!.searchParams = new URLSearchParams({
          lat,
          lng: '-74.0060'
        })

        const response = await GET(mockRequest as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid latitude or longitude coordinates')
      }
    })

    it('should reject invalid longitude values', async () => {
      const invalidLongitudes = ['-181', '181', 'invalid', 'NaN']
      
      for (const lng of invalidLongitudes) {
        mockRequest.nextUrl!.searchParams = new URLSearchParams({
          lat: '40.7128',
          lng
        })

        const response = await GET(mockRequest as NextRequest)
        const data = await response.json()

        expect(response.status).toBe(400)
        expect(data.error).toBe('Invalid latitude or longitude coordinates')
      }
    })

    it('should accept boundary coordinate values', async () => {
      const boundaryCoordinates = [
        { lat: '90', lng: '180' },
        { lat: '-90', lng: '-180' },
        { lat: '0', lng: '0' }
      ]
      
      for (const coords of boundaryCoordinates) {
        mockRequest.nextUrl!.searchParams = new URLSearchParams(coords)

        const response = await GET(mockRequest as NextRequest)

        expect(response.status).toBe(200)
        expect(searchEngine.searchByLocation).toHaveBeenCalledWith(
          parseFloat(coords.lat),
          parseFloat(coords.lng),
          25
        )
      }
    })

    it('should handle floating point coordinates', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.712776',
        lng: '-74.005974'
      })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.712776, -74.005974, 25)
    })
  })

  describe('Radius Validation', () => {
    it('should reject zero radius', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060',
        radius: '0'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Radius must be greater than 0')
    })

    it('should reject negative radius', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060',
        radius: '-10'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Radius must be greater than 0')
    })

    it('should use default radius when not provided', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.7128, -74.0060, 25)
    })

    it('should handle invalid radius strings', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060',
        radius: 'invalid'
      })

      // parseFloat('invalid') returns NaN, default should be used
      await GET(mockRequest as NextRequest)

      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.7128, -74.0060, 25)
    })

    it('should handle floating point radius values', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060',
        radius: '12.5'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.7128, -74.0060, 12.5)
    })

    it('should accept minimum positive radius', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060',
        radius: '0.1'
      })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.7128, -74.0060, 0.1)
    })
  })

  describe('Rate Limiting', () => {
    it('should return rate limit error when rate limited', async () => {
      rateLimiters.search.mockResolvedValue({
        success: false,
        remaining: 0
      })

      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many requests')
      expect(searchEngine.searchByLocation).not.toHaveBeenCalled()
    })

    it('should proceed when rate limit check passes', async () => {
      rateLimiters.search.mockResolvedValue({
        success: true,
        remaining: 50
      })

      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.searchByLocation).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle search engine errors gracefully', async () => {
      searchEngine.searchByLocation.mockRejectedValue(new Error('Database error'))
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search locations')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Location search API error',
        expect.any(Error),
        {
          lat: '40.7128',
          lng: '-74.0060',
          radius: null
        }
      )
    })

    it('should handle non-Error exceptions', async () => {
      searchEngine.searchByLocation.mockRejectedValue('String error')
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search locations')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Location search API error',
        expect.any(Error),
        expect.any(Object)
      )
    })

    it('should handle rate limiter errors', async () => {
      rateLimiters.search.mockRejectedValue(new Error('Rate limiter error'))
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to search locations')
    })

    it('should log error context with request parameters', async () => {
      searchEngine.searchByLocation.mockRejectedValue(new Error('Test error'))
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '51.5074',
        lng: '-0.1278',
        radius: '30'
      })

      await GET(mockRequest as NextRequest)
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Location search API error',
        expect.any(Error),
        {
          lat: '51.5074',
          lng: '-0.1278',
          radius: '30'
        }
      )
    })
  })

  describe('Edge Cases', () => {
    it('should handle coordinates at the poles', async () => {
      const poleCoordinates = [
        { lat: '90', lng: '0' }, // North pole
        { lat: '-90', lng: '0' } // South pole
      ]
      
      for (const coords of poleCoordinates) {
        mockRequest.nextUrl!.searchParams = new URLSearchParams(coords)

        const response = await GET(mockRequest as NextRequest)

        expect(response.status).toBe(200)
      }
    })

    it('should handle coordinates at the date line', async () => {
      const dateLineCoordinates = [
        { lat: '0', lng: '180' },
        { lat: '0', lng: '-180' }
      ]
      
      for (const coords of dateLineCoordinates) {
        mockRequest.nextUrl!.searchParams = new URLSearchParams(coords)

        const response = await GET(mockRequest as NextRequest)

        expect(response.status).toBe(200)
      }
    })

    it('should handle very small radius values', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060',
        radius: '0.001'
      })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.7128, -74.0060, 0.001)
    })

    it('should handle locations with zero workspace count', async () => {
      const emptyLocationData = [
        {
          lat: 40.7128,
          lng: -74.0060,
          address: '123 Empty St',
          city: 'Empty City',
          country: 'United States',
          workspaceCount: 0
        }
      ]
      
      searchEngine.searchByLocation.mockResolvedValue(emptyLocationData)
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.totalWorkspaces).toBe(0)
      expect(data.count).toBe(1)
    })

    it('should handle scientific notation in coordinates', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '4.07128e1', // 40.7128 in scientific notation
        lng: '-7.40060e1' // -74.0060 in scientific notation
      })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.searchByLocation).toHaveBeenCalledWith(40.7128, -74.0060, 25)
    })
  })

  describe('Response Format Validation', () => {
    it('should return consistent response structure', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060',
        radius: '10'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(data).toHaveProperty('center')
      expect(data).toHaveProperty('radius')
      expect(data).toHaveProperty('locations')
      expect(data).toHaveProperty('count')
      expect(data).toHaveProperty('totalWorkspaces')
      
      expect(data.center).toEqual({ lat: 40.7128, lng: -74.0060 })
      expect(typeof data.radius).toBe('number')
      expect(Array.isArray(data.locations)).toBe(true)
      expect(typeof data.count).toBe('number')
      expect(typeof data.totalWorkspaces).toBe('number')
    })

    it('should ensure count matches locations array length', async () => {
      const testLocations = [
        { lat: 1, lng: 1, address: '1', city: '1', country: '1', workspaceCount: 1 },
        { lat: 2, lng: 2, address: '2', city: '2', country: '2', workspaceCount: 2 }
      ]
      
      searchEngine.searchByLocation.mockResolvedValue(testLocations)
      mockRequest.nextUrl!.searchParams = new URLSearchParams({
        lat: '40.7128',
        lng: '-74.0060'
      })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(data.count).toBe(data.locations.length)
      expect(data.count).toBe(2)
    })
  })
})