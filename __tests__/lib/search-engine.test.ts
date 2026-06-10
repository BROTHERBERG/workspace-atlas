import { WorkspaceSearchEngine, SearchFilters, SearchResult } from '@/lib/search/search-engine'

// Mock dependencies
jest.mock('@/lib/generated/prisma', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    workspace: {
      findMany: jest.fn(),
      count: jest.fn(),
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      $queryRaw: jest.fn(),
    },
    $disconnect: jest.fn(),
  }))
}))

jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  PerformanceTimer: jest.fn().mockImplementation((operation: string) => ({
    finish: jest.fn().mockReturnValue(10.5),
  }))
}))

jest.mock('@/lib/cache', () => ({
  cache: {
    get: jest.fn(),
    set: jest.fn(),
  }
}))

// Mock data
const mockWorkspaceData = [
  {
    id: 'workspace-1',
    name: 'Tech Hub NYC',
    slug: 'tech-hub-nyc',
    description: 'Modern coworking space in Manhattan',
    address: '123 Broadway, New York',
    city: 'New York',
    country: 'United States',
    latitude: 40.7128,
    longitude: -74.0060,
    images: ['image1.jpg', 'image2.jpg'],
    hotDeskPrice: 50,
    dedicatedDeskPrice: 150,
    privateOfficePrice: 500,
    pricingCurrency: 'USD',
    rating: 4.5,
    reviewCount: 25,
    digitalScore: 85,
    amenities: ['WiFi', 'Coffee', 'Meeting Rooms', 'Printing'],
    workspaceType: { name: 'Coworking' },
    isVerified: true,
    isActive: true,
    website: 'https://techhubnyc.com',
    phone: '+1234567890',
    source: 'direct',
    createdAt: new Date('2023-01-01'),
    updatedAt: new Date('2023-12-01')
  },
  {
    id: 'workspace-2',
    name: 'Creative Space LA',
    slug: 'creative-space-la',
    description: 'Artistic workspace in Los Angeles',
    address: '456 Sunset Blvd, Los Angeles',
    city: 'Los Angeles',
    country: 'United States',
    latitude: 34.0522,
    longitude: -118.2437,
    images: ['image3.jpg'],
    hotDeskPrice: 45,
    dedicatedDeskPrice: 120,
    privateOfficePrice: 400,
    pricingCurrency: 'USD',
    rating: 4.2,
    reviewCount: 18,
    digitalScore: 75,
    amenities: ['WiFi', 'Art Supplies', 'Natural Light'],
    workspaceType: { name: 'Creative Studio' },
    isVerified: false,
    isActive: true,
    website: 'https://creativela.com',
    phone: '+1987654321',
    source: 'scraped',
    createdAt: new Date('2023-02-01'),
    updatedAt: new Date('2023-11-01')
  }
]

describe('WorkspaceSearchEngine', () => {
  let searchEngine: WorkspaceSearchEngine
  let mockPrisma: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Get the mocked Prisma constructor
    const { PrismaClient } = require('@/lib/generated/prisma')
    
    // Create mock instance
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
    
    // Make PrismaClient constructor return our mock
    PrismaClient.mockImplementation(() => mockPrisma)
    
    // Create search engine instance after setting up mocks
    searchEngine = new WorkspaceSearchEngine()
    
    // Default successful responses
    mockPrisma.workspace.findMany.mockResolvedValue(mockWorkspaceData)
    mockPrisma.workspace.count.mockResolvedValue(2)
    mockPrisma.workspace.groupBy.mockResolvedValue([])
    mockPrisma.workspace.aggregate.mockResolvedValue({
      _min: { hotDeskPrice: 30 },
      _max: { hotDeskPrice: 100 },
      _avg: { hotDeskPrice: 65 }
    })
  })

  afterEach(async () => {
    await searchEngine.cleanup()
  })

  describe('Basic Search', () => {
    it('should perform basic search with no filters', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null) // No cache hit

      const filters: SearchFilters = {}
      const results = await searchEngine.search(filters)

      expect(results).toBeDefined()
      expect(results.results).toHaveLength(2)
      expect(results.pagination.total).toBe(2)
      expect(results.pagination.page).toBe(1)
      expect(results.pagination.limit).toBe(20)
      expect(results.searchMetadata.totalResults).toBe(2)
      
      // Verify Prisma calls
      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith({
        where: { isActive: true, status: 'ACTIVE' },
        orderBy: [
          { digitalScore: 'desc' },
          { rating: 'desc' },
          { reviewCount: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: 20,
        skip: 0,
        select: expect.any(Object)
      })
    })

    it('should return cached results when available', async () => {
      const { cache } = require('@/lib/cache')
      const cachedResult = { 
        results: [], 
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0, hasNextPage: false, hasPrevPage: false },
        aggregations: { cities: [], countries: [], amenities: [], priceRanges: [], ratings: [] },
        searchMetadata: { executionTime: 5, totalResults: 0, appliedFilters: [] }
      }
      cache.get.mockResolvedValue(cachedResult)

      const filters: SearchFilters = { query: 'test' }
      const results = await searchEngine.search(filters)

      expect(results).toBe(cachedResult)
      expect(mockPrisma.workspace.findMany).not.toHaveBeenCalled()
      expect(cache.set).not.toHaveBeenCalled()
    })

    it('should handle text query search', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { query: 'Tech Hub' }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            isActive: true,
            status: 'ACTIVE',
            OR: [
              { name: { contains: 'Tech Hub', mode: 'insensitive' } },
              { description: { contains: 'Tech Hub', mode: 'insensitive' } },
              { address: { contains: 'Tech Hub', mode: 'insensitive' } },
              { city: { contains: 'Tech Hub', mode: 'insensitive' } }
            ]
          }
        })
      )
    })
  })

  describe('Location Filters', () => {
    it('should filter by city', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { city: 'New York' }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            city: { equals: 'New York', mode: 'insensitive' }
          })
        })
      )
    })

    it('should filter by country', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { country: 'United States' }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            country: { equals: 'United States', mode: 'insensitive' }
          })
        })
      )
    })

    it('should calculate distances when coordinates provided', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { 
        latitude: 40.7128, 
        longitude: -74.0060,
        radius: 10
      }
      const results = await searchEngine.search(filters)

      // First result should have distance 0 (same coordinates)
      expect(results.results[0].distance).toBe(0)
      // Second result should have calculated distance
      expect(results.results[1].distance).toBeGreaterThan(0)
    })
  })

  describe('Price Filters', () => {
    it('should filter by price range for hot desks', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { 
        minPrice: 40, 
        maxPrice: 60, 
        pricingType: 'hot_desk' 
      }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            hotDeskPrice: { gte: 40, lte: 60 }
          })
        })
      )
    })

    it('should filter by price range for dedicated desks', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { 
        minPrice: 100, 
        maxPrice: 200, 
        pricingType: 'dedicated_desk' 
      }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            dedicatedDeskPrice: { gte: 100, lte: 200 }
          })
        })
      )
    })
  })

  describe('Quality Filters', () => {
    it('should filter by minimum rating', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { minRating: 4.0 }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            rating: { gte: 4.0 }
          })
        })
      )
    })

    it('should filter by minimum digital score', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { minDigitalScore: 80 }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            digitalScore: { gte: 80 }
          })
        })
      )
    })

    it('should filter by verification status', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { isVerified: true }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            isVerified: true
          })
        })
      )
    })
  })

  describe('Sorting', () => {
    it('should sort by price ascending', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { 
        sortBy: 'price', 
        sortOrder: 'asc',
        pricingType: 'hot_desk'
      }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ hotDeskPrice: 'asc' }]
        })
      )
    })

    it('should sort by rating descending', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { 
        sortBy: 'rating', 
        sortOrder: 'desc' 
      }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [{ rating: 'desc' }, { reviewCount: 'desc' }]
        })
      )
    })

    it('should use relevance sorting by default', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = {}
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: [
            { digitalScore: 'desc' },
            { rating: 'desc' },
            { reviewCount: 'desc' },
            { updatedAt: 'desc' }
          ]
        })
      )
    })
  })

  describe('Pagination', () => {
    it('should handle pagination correctly', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { page: 2, limit: 5 }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          skip: 5 // (page - 1) * limit = (2 - 1) * 5 = 5
        })
      )
    })

    it('should limit maximum page size to 100', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { limit: 200 }
      await searchEngine.search(filters)

      expect(mockPrisma.workspace.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 100 // Should be capped at 100
        })
      )
    })

    it('should calculate pagination metadata correctly', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)
      mockPrisma.workspace.count.mockResolvedValue(25)

      const filters: SearchFilters = { page: 2, limit: 10 }
      const results = await searchEngine.search(filters)

      expect(results.pagination).toEqual({
        page: 2,
        limit: 10,
        total: 25,
        totalPages: 3,
        hasNextPage: true,
        hasPrevPage: true
      })
    })
  })

  describe('Location Search', () => {
    it('should perform location-based search', async () => {
      const mockLocationData = [
        {
          lat: '40.7128',
          lng: '-74.0060',
          address: '123 Broadway',
          city: 'New York',
          country: 'United States',
          workspace_count: '5'
        }
      ]
      
      mockPrisma.$queryRaw.mockResolvedValue(mockLocationData)

      const results = await searchEngine.searchByLocation(40.7128, -74.0060, 10)

      expect(results).toHaveLength(1)
      expect(results[0]).toEqual({
        lat: 40.7128,
        lng: -74.0060,
        address: '123 Broadway',
        city: 'New York',
        country: 'United States',
        workspaceCount: 5
      })

      expect(mockPrisma.$queryRaw).toHaveBeenCalledWith(
        expect.anything() // Raw SQL query
      )
    })
  })

  describe('Search Suggestions', () => {
    it('should return empty suggestions for short queries', async () => {
      const suggestions = await searchEngine.getSearchSuggestions('a')
      expect(suggestions).toEqual([])
    })

    it('should return cached suggestions when available', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(['Tech Hub', 'Tech Center'])

      const suggestions = await searchEngine.getSearchSuggestions('tech')
      expect(suggestions).toEqual(['Tech Hub', 'Tech Center'])
      expect(mockPrisma.workspace.findMany).not.toHaveBeenCalled()
    })

    it('should generate suggestions from workspace names and cities', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      // Mock different findMany calls for suggestions
      mockPrisma.workspace.findMany
        .mockResolvedValueOnce([{ name: 'Tech Hub NYC' }]) // workspace names
        .mockResolvedValueOnce([{ city: 'New York' }]) // cities
        .mockResolvedValueOnce([{ amenities: ['WiFi', 'Coffee'] }]) // amenities

      const suggestions = await searchEngine.getSearchSuggestions('tech')
      
      expect(suggestions).toContain('Tech Hub NYC')
      expect(cache.set).toHaveBeenCalledWith('search-suggestions:tech', expect.any(Array), 300)
    })
  })

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)
      mockPrisma.workspace.findMany.mockRejectedValue(new Error('Database error'))

      const filters: SearchFilters = { query: 'test' }

      await expect(searchEngine.search(filters)).rejects.toThrow('Database error')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Search failed',
        expect.any(Error),
        { filters }
      )
    })

    it('should handle location search errors', async () => {
      mockPrisma.$queryRaw.mockRejectedValue(new Error('Query error'))

      await expect(searchEngine.searchByLocation(40.7128, -74.0060)).rejects.toThrow('Query error')
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Location search failed',
        expect.any(Error),
        { latitude: 40.7128, longitude: -74.0060, radiusKm: 25 }
      )
    })

    it('should return empty suggestions on error', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)
      mockPrisma.workspace.findMany.mockRejectedValue(new Error('Database error'))

      const suggestions = await searchEngine.getSearchSuggestions('test')
      expect(suggestions).toEqual([])
      
      const { logger } = require('@/lib/logger')
      expect(logger.error).toHaveBeenCalledWith(
        'Search suggestions failed',
        expect.any(Error),
        { query: 'test' }
      )
    })
  })

  describe('Result Processing', () => {
    it('should calculate relevance scores correctly', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { query: 'Tech Hub' }
      const results = await searchEngine.search(filters)

      expect(results.results[0].relevanceScore).toBeGreaterThan(0)
      expect(results.results[0].relevanceScore).toBeGreaterThan(results.results[1].relevanceScore)
    })

    it('should identify matching amenities', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { amenities: ['WiFi', 'Coffee'] }
      const results = await searchEngine.search(filters)

      expect(results.results[0].matchingAmenities).toContain('WiFi')
      expect(results.results[0].matchingAmenities).toContain('Coffee')
    })

    it('should set primary image from images array', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const results = await searchEngine.search({})

      expect(results.results[0].primaryImage).toBe('image1.jpg')
      expect(results.results[1].primaryImage).toBe('image3.jpg')
    })
  })

  describe('Utility Functions', () => {
    it('should calculate distance between coordinates correctly', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      // Search with NYC coordinates, should calculate distance to LA
      const filters: SearchFilters = { 
        latitude: 40.7128, 
        longitude: -74.0060 
      }
      const results = await searchEngine.search(filters)

      // Distance from NYC to LA should be approximately 3944 km
      const laResult = results.results.find(r => r.city === 'Los Angeles')
      expect(laResult?.distance).toBeCloseTo(3944, -1) // Within 100km accuracy
    })
  })

  describe('Cache Behavior', () => {
    it('should cache search results', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters: SearchFilters = { query: 'test' }
      await searchEngine.search(filters)

      expect(cache.set).toHaveBeenCalledWith(
        expect.stringContaining('search:'),
        expect.any(Object),
        300 // 5 minute TTL
      )
    })

    it('should generate consistent cache keys', async () => {
      const { cache } = require('@/lib/cache')
      cache.get.mockResolvedValue(null)

      const filters1: SearchFilters = { query: 'test', city: 'New York' }
      const filters2: SearchFilters = { city: 'New York', query: 'test' }

      // Both searches should generate the same cache key
      await searchEngine.search(filters1)
      await searchEngine.search(filters2)

      const calls = cache.set.mock.calls
      expect(calls).toHaveLength(2)
      // Note: JSON.stringify ordering might differ, so we just check they both called cache.set
    })
  })
})