/**
 * Performance tests for search functionality
 * These tests ensure search operations complete within acceptable time limits
 * and handle large datasets efficiently.
 */

import { WorkspaceSearchEngine, SearchFilters } from '@/lib/search/search-engine'

// Mock dependencies for performance testing
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    workspace: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
    },
    $queryRaw: jest.fn(),
    $disconnect: jest.fn(),
  }))
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
  PerformanceTimer: jest.fn().mockImplementation(() => ({
    finish: jest.fn().mockReturnValue(50), // Mock 50ms execution time
  }))
}))

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn().mockResolvedValue(null), // Always cache miss for performance testing
    set: jest.fn(),
  }
}))

// Generate large mock dataset for performance testing
const generateMockWorkspaces = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `workspace-${i}`,
    name: `Workspace ${i}`,
    slug: `workspace-${i}`,
    description: `Description for workspace ${i}`,
    city: `City ${i % 50}`, // 50 different cities
    country: `Country ${i % 10}`, // 10 different countries
    latitude: 40.7128 + (Math.random() - 0.5) * 10,
    longitude: -74.0060 + (Math.random() - 0.5) * 20,
    images: [`image${i}.jpg`],
    hotDeskPrice: 30 + (i % 100),
    dedicatedDeskPrice: 100 + (i % 200),
    privateOfficePrice: 300 + (i % 500),
    pricingCurrency: 'USD',
    rating: 3.0 + (i % 20) / 10,
    reviewCount: i % 100,
    digitalScore: 60 + (i % 40),
    amenities: [`Amenity${i % 20}`, `Amenity${(i + 1) % 20}`],
    workspaceType: { name: `Type${i % 5}` },
    isVerified: i % 3 === 0,
    isActive: true,
    website: `https://workspace${i}.com`,
    phone: `+1${i.toString().padStart(9, '0')}`,
    source: 'test',
    createdAt: new Date(2023, 0, 1 + (i % 365)),
    updatedAt: new Date(2023, 11, 1 + (i % 30))
  }))
}

describe('Search Performance Tests', () => {
  let searchEngine: WorkspaceSearchEngine
  let mockPrisma: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    const { PrismaClient } = require('@/lib/generated/prisma')
    mockPrisma = {
      workspace: {
        findMany: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
        aggregate: jest.fn(),
      },
      $queryRaw: jest.fn(),
      $disconnect: jest.fn(),
    }
    
    PrismaClient.mockImplementation(() => mockPrisma)
    searchEngine = new WorkspaceSearchEngine()
  })

  afterEach(async () => {
    await searchEngine.cleanup()
  })

  describe('Basic Search Performance', () => {
    it('should handle small dataset (100 records) quickly', async () => {
      const mockData = generateMockWorkspaces(100)
      mockPrisma.workspace.findMany.mockResolvedValue(mockData)
      mockPrisma.workspace.count.mockResolvedValue(100)
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const filters: SearchFilters = { query: 'workspace' }
      const startTime = performance.now()
      
      const results = await searchEngine.search(filters)
      
      const executionTime = performance.now() - startTime
      
      expect(results).toBeDefined()
      expect(results.results).toHaveLength(100)
      expect(executionTime).toBeLessThan(200) // Should complete in under 200ms
    })

    it('should handle medium dataset (1000 records) within acceptable time', async () => {
      const mockData = generateMockWorkspaces(1000)
      mockPrisma.workspace.findMany.mockResolvedValue(mockData.slice(0, 20)) // Paginated result
      mockPrisma.workspace.count.mockResolvedValue(1000)
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const filters: SearchFilters = { query: 'workspace', limit: 20 }
      const startTime = performance.now()
      
      const results = await searchEngine.search(filters)
      
      const executionTime = performance.now() - startTime
      
      expect(results).toBeDefined()
      expect(results.pagination.total).toBe(1000)
      expect(executionTime).toBeLessThan(500) // Should complete in under 500ms
    })

    it('should handle complex filters without significant performance degradation', async () => {
      const mockData = generateMockWorkspaces(500)
      mockPrisma.workspace.findMany.mockResolvedValue(mockData.slice(0, 20))
      mockPrisma.workspace.count.mockResolvedValue(50) // Filtered count
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const complexFilters: SearchFilters = {
        query: 'modern workspace',
        city: 'New York',
        amenities: ['WiFi', 'Coffee', 'Meeting Rooms'],
        minPrice: 50,
        maxPrice: 150,
        minRating: 4.0,
        isVerified: true,
        sortBy: 'digitalScore'
      }
      
      const startTime = performance.now()
      
      const results = await searchEngine.search(complexFilters)
      
      const executionTime = performance.now() - startTime
      
      expect(results).toBeDefined()
      expect(executionTime).toBeLessThan(600) // Complex queries may take slightly longer
    })
  })

  describe('Location Search Performance', () => {
    it('should perform location-based search efficiently', async () => {
      const mockLocationData = Array.from({ length: 100 }, (_, i) => ({
        lat: (40.7128 + i * 0.001).toString(),
        lng: (-74.0060 + i * 0.001).toString(),
        address: `Address ${i}`,
        city: `City ${i % 10}`,
        country: `Country ${i % 3}`,
        workspace_count: (i % 10 + 1).toString()
      }))

      mockPrisma.$queryRaw.mockResolvedValue(mockLocationData)

      const startTime = performance.now()
      
      const results = await searchEngine.searchByLocation(40.7128, -74.0060, 25)
      
      const executionTime = performance.now() - startTime
      
      expect(results).toHaveLength(100)
      expect(executionTime).toBeLessThan(300) // Geospatial queries should be fast
    })

    it('should handle large radius searches efficiently', async () => {
      const mockLocationData = Array.from({ length: 500 }, (_, i) => ({
        lat: (40.7128 + i * 0.01).toString(),
        lng: (-74.0060 + i * 0.01).toString(),
        address: `Address ${i}`,
        city: `City ${i % 50}`,
        country: `Country ${i % 5}`,
        workspace_count: (i % 20 + 1).toString()
      }))

      mockPrisma.$queryRaw.mockResolvedValue(mockLocationData)

      const startTime = performance.now()
      
      const results = await searchEngine.searchByLocation(40.7128, -74.0060, 100)
      
      const executionTime = performance.now() - startTime
      
      expect(results).toHaveLength(500)
      expect(executionTime).toBeLessThan(500) // Large radius should still be reasonably fast
    })
  })

  describe('Search Suggestions Performance', () => {
    it('should generate suggestions quickly for popular queries', async () => {
      // Mock multiple findMany calls for suggestions
      mockPrisma.workspace.findMany
        .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ name: `Workspace ${i}` })))
        .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ city: `City ${i}` })))
        .mockResolvedValueOnce(Array.from({ length: 10 }, (_, i) => ({ amenities: [`Amenity${i}`] })))

      const startTime = performance.now()
      
      const suggestions = await searchEngine.getSearchSuggestions('work')
      
      const executionTime = performance.now() - startTime
      
      expect(suggestions).toBeDefined()
      expect(executionTime).toBeLessThan(200) // Suggestions should be very fast
    })

    it('should handle concurrent suggestion requests efficiently', async () => {
      mockPrisma.workspace.findMany.mockResolvedValue([
        { name: 'Test Workspace' },
        { city: 'Test City' },
        { amenities: ['Test Amenity'] }
      ])

      const concurrentRequests = 10
      const promises = Array.from({ length: concurrentRequests }, () =>
        searchEngine.getSearchSuggestions('test')
      )

      const startTime = performance.now()
      
      const results = await Promise.all(promises)
      
      const executionTime = performance.now() - startTime
      
      expect(results).toHaveLength(concurrentRequests)
      results.forEach(result => expect(result).toBeDefined())
      expect(executionTime).toBeLessThan(500) // Concurrent requests should complete quickly
    })
  })

  describe('Memory and Resource Management', () => {
    it('should handle multiple consecutive searches without memory issues', async () => {
      const mockData = generateMockWorkspaces(100)
      mockPrisma.workspace.findMany.mockResolvedValue(mockData)
      mockPrisma.workspace.count.mockResolvedValue(100)
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const consecutiveSearches = 20
      const startTime = performance.now()
      
      for (let i = 0; i < consecutiveSearches; i++) {
        const filters: SearchFilters = { query: `search ${i}` }
        const results = await searchEngine.search(filters)
        expect(results).toBeDefined()
      }
      
      const executionTime = performance.now() - startTime
      const averageTime = executionTime / consecutiveSearches
      
      expect(averageTime).toBeLessThan(100) // Average time per search should remain low
    })

    it('should process results efficiently with distance calculations', async () => {
      const mockData = generateMockWorkspaces(200)
      mockPrisma.workspace.findMany.mockResolvedValue(mockData)
      mockPrisma.workspace.count.mockResolvedValue(200)
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const filters: SearchFilters = { 
        latitude: 40.7128, 
        longitude: -74.0060,
        radius: 50,
        limit: 200 
      }
      
      const startTime = performance.now()
      
      const results = await searchEngine.search(filters)
      
      const executionTime = performance.now() - startTime
      
      expect(results.results).toHaveLength(200)
      // All results should have distance calculated
      results.results.forEach(result => {
        expect(result.distance).toBeDefined()
        expect(typeof result.distance).toBe('number')
      })
      expect(executionTime).toBeLessThan(400) // Distance calculations shouldn't slow things down too much
    })
  })

  describe('Aggregation Performance', () => {
    it('should generate aggregations quickly even with large datasets', async () => {
      const largeCityList = Array.from({ length: 100 }, (_, i) => ({
        city: `City ${i}`,
        _count: { city: i + 1 }
      }))
      
      const largeCountryList = Array.from({ length: 20 }, (_, i) => ({
        country: `Country ${i}`,
        _count: { country: (i + 1) * 10 }
      }))

      const largeAmenitiesList = Array.from({ length: 50 }, (_, i) => ({
        amenities: [`Amenity${i}`, `Amenity${i+1}`]
      }))

      mockPrisma.workspace.findMany.mockResolvedValue([])
      mockPrisma.workspace.count.mockResolvedValue(0)
      mockPrisma.workspace.groupBy
        .mockResolvedValueOnce(largeCityList)
        .mockResolvedValueOnce(largeCountryList)
      mockPrisma.workspace.findMany.mockResolvedValueOnce(largeAmenitiesList)
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const startTime = performance.now()
      
      const results = await searchEngine.search({})
      
      const executionTime = performance.now() - startTime
      
      expect(results.aggregations.cities).toHaveLength(100)
      expect(results.aggregations.countries).toHaveLength(20)
      expect(executionTime).toBeLessThan(300) // Aggregations should be processed quickly
    })
  })

  describe('Cache Performance', () => {
    it('should benefit from caching on repeated searches', async () => {
      const { cache } = require('@/lib/cache')
      
      const mockData = generateMockWorkspaces(100)
      mockPrisma.workspace.findMany.mockResolvedValue(mockData)
      mockPrisma.workspace.count.mockResolvedValue(100)
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const filters: SearchFilters = { query: 'cached search' }
      
      // First search - cache miss
      cache.get.mockResolvedValue(null)
      const firstSearchStart = performance.now()
      const firstResult = await searchEngine.search(filters)
      const firstSearchTime = performance.now() - firstSearchStart
      
      // Mock cache hit for second search
      cache.get.mockResolvedValue(firstResult)
      
      // Second search - should be much faster due to cache
      const secondSearchStart = performance.now()
      const secondResult = await searchEngine.search(filters)
      const secondSearchTime = performance.now() - secondSearchStart
      
      expect(firstResult).toEqual(secondResult)
      expect(secondSearchTime).toBeLessThan(firstSearchTime / 2) // Cached search should be at least 50% faster
      expect(mockPrisma.workspace.findMany).toHaveBeenCalledTimes(1) // Should only hit DB once
    })
  })

  describe('Error Handling Performance', () => {
    it('should fail fast on database errors', async () => {
      mockPrisma.workspace.findMany.mockRejectedValue(new Error('Database connection failed'))
      
      const filters: SearchFilters = { query: 'error test' }
      
      const startTime = performance.now()
      
      await expect(searchEngine.search(filters)).rejects.toThrow('Database connection failed')
      
      const executionTime = performance.now() - startTime
      
      expect(executionTime).toBeLessThan(100) // Should fail quickly, not hang
    })

    it('should handle malformed data gracefully without performance impact', async () => {
      // Mock data with some malformed entries
      const malformedData = [
        ...generateMockWorkspaces(50),
        // Add some malformed entries
        { id: 'bad-1', name: null, latitude: 'invalid', longitude: undefined },
        { id: 'bad-2', amenities: 'not-an-array', images: null }
      ]
      
      mockPrisma.workspace.findMany.mockResolvedValue(malformedData)
      mockPrisma.workspace.count.mockResolvedValue(52)
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const filters: SearchFilters = { query: 'malformed test' }
      
      const startTime = performance.now()
      
      const results = await searchEngine.search(filters)
      
      const executionTime = performance.now() - startTime
      
      expect(results).toBeDefined()
      expect(executionTime).toBeLessThan(300) // Should handle malformed data without significant slowdown
    })
  })

  describe('Stress Testing', () => {
    it('should handle burst of concurrent searches', async () => {
      const mockData = generateMockWorkspaces(100)
      mockPrisma.workspace.findMany.mockResolvedValue(mockData.slice(0, 20))
      mockPrisma.workspace.count.mockResolvedValue(100)
      mockPrisma.workspace.groupBy.mockResolvedValue([])
      mockPrisma.workspace.aggregate.mockResolvedValue({
        _min: { hotDeskPrice: 30 },
        _max: { hotDeskPrice: 130 },
        _avg: { hotDeskPrice: 80 }
      })

      const concurrentSearches = 50
      const searchPromises = Array.from({ length: concurrentSearches }, (_, i) => 
        searchEngine.search({ query: `concurrent search ${i}` })
      )

      const startTime = performance.now()
      
      const results = await Promise.allSettled(searchPromises)
      
      const executionTime = performance.now() - startTime
      
      // All searches should succeed
      const successful = results.filter(result => result.status === 'fulfilled')
      expect(successful).toHaveLength(concurrentSearches)
      
      // Should complete within reasonable time even under load
      expect(executionTime).toBeLessThan(2000) // 2 seconds for 50 concurrent searches
    })
  })
})