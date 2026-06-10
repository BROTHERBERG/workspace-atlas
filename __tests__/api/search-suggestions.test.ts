import { GET } from '@/app/api/search/suggestions/route'
import { NextRequest } from 'next/server'

// Mock dependencies
jest.mock('@/lib/search/search-engine', () => ({
  searchEngine: {
    getSearchSuggestions: jest.fn()
  }
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn()
  }
}))

jest.mock('@/lib/security/rate-limiter', () => ({
  rateLimiters: {
    general: jest.fn()
  }
}))

describe('/api/search/suggestions', () => {
  let mockRequest: Partial<NextRequest>
  let searchEngine: any
  let rateLimiters: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Get mocked modules
    searchEngine = require('@/lib/search/search-engine').searchEngine
    rateLimiters = require('@/lib/security/rate-limiter').rateLimiters
    
    // Default rate limit success
    rateLimiters.general.mockResolvedValue({
      success: true,
      remaining: 95
    })
    
    // Default suggestions response
    searchEngine.getSearchSuggestions.mockResolvedValue([
      'Tech Hub NYC',
      'Technology Center',
      'Technical Workspace'
    ])

    mockRequest = {
      nextUrl: {
        searchParams: new URLSearchParams()
      }
    }
  })

  describe('Successful Requests', () => {
    it('should return suggestions for valid query', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'tech' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toEqual({
        query: 'tech',
        suggestions: ['Tech Hub NYC', 'Technology Center', 'Technical Workspace'],
        count: 3
      })
      
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('tech', 10)
    })

    it('should trim query whitespace', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: '  coworking  ' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe('coworking')
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('coworking', 10)
    })

    it('should respect custom limit parameter', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ 
        q: 'workspace',
        limit: '5'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('workspace', 5)
    })

    it('should cap limit at maximum of 20', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ 
        q: 'office',
        limit: '50'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('office', 20)
    })

    it('should use default limit of 10 when not specified', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'space' })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('space', 10)
    })

    it('should include proper response headers', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)

      expect(response.headers.get('Cache-Control')).toBe('public, max-age=300')
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*')
    })

    it('should return empty suggestions when search engine returns empty array', async () => {
      searchEngine.getSearchSuggestions.mockResolvedValue([])
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'nonexistent' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.suggestions).toEqual([])
      expect(data.count).toBe(0)
    })
  })

  describe('Validation', () => {
    it('should reject requests without query parameter', async () => {
      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters long')
      expect(searchEngine.getSearchSuggestions).not.toHaveBeenCalled()
    })

    it('should reject empty query parameter', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: '' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters long')
    })

    it('should reject single character query', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'a' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters long')
    })

    it('should reject query with only whitespace', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: '   ' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters long')
    })

    it('should handle single character after trimming', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: '  a  ' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Query must be at least 2 characters long')
    })

    it('should handle invalid limit parameter gracefully', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ 
        q: 'test',
        limit: 'invalid'
      })

      await GET(mockRequest as NextRequest)

      // parseInt('invalid') returns NaN, so should use default 10
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('test', 10)
    })

    it('should handle negative limit parameter', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ 
        q: 'test',
        limit: '-5'
      })

      await GET(mockRequest as NextRequest)

      // Math.min(-5, 20) should be -5, but since it's negative, behavior may vary
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('test', -5)
    })

    it('should handle zero limit parameter', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ 
        q: 'test',
        limit: '0'
      })

      await GET(mockRequest as NextRequest)

      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('test', 0)
    })
  })

  describe('Rate Limiting', () => {
    it('should return rate limit error when rate limited', async () => {
      rateLimiters.general.mockResolvedValue({
        success: false,
        remaining: 0
      })

      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(429)
      expect(data.error).toBe('Too many requests')
      expect(searchEngine.getSearchSuggestions).not.toHaveBeenCalled()
    })

    it('should proceed when rate limit check passes', async () => {
      rateLimiters.general.mockResolvedValue({
        success: true,
        remaining: 50
      })

      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should handle search engine errors gracefully', async () => {
      searchEngine.getSearchSuggestions.mockRejectedValue(new Error('Database error'))
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get search suggestions')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Search suggestions API error',
        expect.any(Error),
        { query: 'test' }
      )
    })

    it('should handle non-Error exceptions', async () => {
      searchEngine.getSearchSuggestions.mockRejectedValue('String error')
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get search suggestions')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Search suggestions API error',
        expect.any(Error),
        { query: 'test' }
      )
    })

    it('should handle rate limiter errors', async () => {
      rateLimiters.general.mockRejectedValue(new Error('Rate limiter error'))
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get search suggestions')
    })
  })

  describe('Query Handling Edge Cases', () => {
    it('should handle special characters in query', async () => {
      const specialQuery = 'café & büro'
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: specialQuery })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.query).toBe(specialQuery)
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith(specialQuery, 10)
    })

    it('should handle Unicode characters', async () => {
      const unicodeQuery = '东京 coworking'
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: unicodeQuery })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith(unicodeQuery, 10)
    })

    it('should handle very long queries', async () => {
      const longQuery = 'coworking '.repeat(50) // 500+ characters
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: longQuery.trim() })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith(longQuery.trim(), 10)
    })

    it('should handle queries with only numbers', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: '123' })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith('123', 10)
    })

    it('should handle queries with mixed content', async () => {
      const mixedQuery = 'WeWork 2023 $50/day 24/7'
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: mixedQuery })

      const response = await GET(mockRequest as NextRequest)

      expect(response.status).toBe(200)
      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledWith(mixedQuery, 10)
    })
  })

  describe('Response Format', () => {
    it('should return consistent response format', async () => {
      const expectedSuggestions = ['Workspace A', 'Workspace B']
      searchEngine.getSearchSuggestions.mockResolvedValue(expectedSuggestions)
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'workspace' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(data).toHaveProperty('query')
      expect(data).toHaveProperty('suggestions')
      expect(data).toHaveProperty('count')
      expect(data.query).toBe('workspace')
      expect(data.suggestions).toEqual(expectedSuggestions)
      expect(data.count).toBe(expectedSuggestions.length)
    })

    it('should handle when suggestions count differs from array length', async () => {
      // This shouldn't happen in normal conditions, but testing edge case
      const suggestions = ['A', 'B', 'C']
      searchEngine.getSearchSuggestions.mockResolvedValue(suggestions)
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(data.count).toBe(3)
      expect(data.suggestions).toHaveLength(3)
    })
  })

  describe('Performance Considerations', () => {
    it('should handle large suggestion responses', async () => {
      const largeSuggestions = Array.from({ length: 20 }, (_, i) => `Suggestion ${i + 1}`)
      searchEngine.getSearchSuggestions.mockResolvedValue(largeSuggestions)
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'test' })

      const response = await GET(mockRequest as NextRequest)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.suggestions).toHaveLength(20)
      expect(data.count).toBe(20)
    })

    it('should handle concurrent requests', async () => {
      mockRequest.nextUrl!.searchParams = new URLSearchParams({ q: 'concurrent' })

      const promises = Array.from({ length: 5 }, () => 
        GET(mockRequest as NextRequest)
      )

      const responses = await Promise.all(promises)

      responses.forEach(response => {
        expect(response.status).toBe(200)
      })

      expect(searchEngine.getSearchSuggestions).toHaveBeenCalledTimes(5)
    })
  })
})