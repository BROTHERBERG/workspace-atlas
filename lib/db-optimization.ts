/**
 * Database optimization utilities
 * Provides connection pooling, query optimization, and caching
 */

import { PrismaClient } from '@prisma/client'
import { queryCache } from '@/lib/cache'
import { logger, PerformanceTimer } from '@/lib/logger'

/**
 * Optimized Prisma client with connection pooling and caching
 */
class OptimizedPrismaClient extends PrismaClient {
  private queryCount = 0
  private slowQueryThreshold = 1000 // 1 second

  constructor() {
    super({
      datasources: {
        db: {
          url: process.env.DATABASE_URL
        }
      },
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' }
      ]
    })

    // Setup query logging - disabled for build compatibility
    // this.$on('query' as any, (e: any) => {
    //   this.queryCount++
    //   
    //   if (e.duration > this.slowQueryThreshold) {
    //     logger.warn('Slow query detected', {
    //       query: e.query,
    //       params: e.params,
    //       duration: `${e.duration}ms`,
    //       target: e.target
    //     })
    //   } else {
    //     logger.debug('Database query executed', {
    //       query: e.query.substring(0, 100) + (e.query.length > 100 ? '...' : ''),
    //       duration: `${e.duration}ms`,
    //       params: e.params
    //     })
    //   }
    // })

    // this.$on('error', (e) => {
    //   logger.error('Database error', new Error(e.message), {
    //     target: e.target,
    //     timestamp: e.timestamp
    //   })
    // })
  }

  /**
   * Execute query with caching support
   */
  async cachedQuery<T>(
    queryFn: () => Promise<T>,
    cacheKey: string,
    ttl?: number
  ): Promise<T> {
    // Check cache first
    const cached = queryCache.get(cacheKey)
    if (cached !== null) {
      logger.debug('Cache hit for query', { cacheKey })
      return cached
    }

    // Execute query with performance timing
    const timer = new PerformanceTimer(`DB Query: ${cacheKey}`)
    try {
      const result = await queryFn()
      
      // Cache successful result
      queryCache.set(cacheKey, result, ttl)
      
      const duration = timer.finish()
      logger.debug('Query executed and cached', { 
        cacheKey, 
        duration: `${duration}ms`,
        dataSize: JSON.stringify(result).length
      })
      
      return result
    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Batch multiple queries for better performance
   */
  async batchQuery<T>(queries: Array<() => Promise<T>>): Promise<T[]> {
    const timer = new PerformanceTimer('Batch Query')
    
    try {
      const results = await Promise.all(queries.map(query => query()))
      timer.finish({ queryCount: queries.length })
      return results
    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      queryCount: this.queryCount,
      cacheStats: queryCache.getStats(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    queryCache.clear()
    logger.info('Database query cache cleared')
  }
}

// Create singleton instance
let prismaInstance: OptimizedPrismaClient | null = null

export function getPrismaClient(): OptimizedPrismaClient {
  if (!prismaInstance) {
    prismaInstance = new OptimizedPrismaClient()
  }
  return prismaInstance
}

/**
 * Database query optimization helpers
 */
export class DatabaseOptimizer {
  private readonly prisma: OptimizedPrismaClient

  constructor() {
    this.prisma = getPrismaClient()
  }

  /**
   * Optimized workspace queries with intelligent caching
   */
  async getWorkspaces(params: {
    page?: number
    limit?: number
    city?: string
    country?: string
    featured?: boolean
    sortBy?: 'name' | 'rating' | 'digitalScore' | 'created'
    sortOrder?: 'asc' | 'desc'
  }) {
    const {
      page = 1,
      limit = 20,
      city,
      country,
      featured,
      sortBy = 'digitalScore',
      sortOrder = 'desc'
    } = params

    const cacheKey = `workspaces:${JSON.stringify(params)}`
    
    return this.prisma.cachedQuery(
      async () => {
        const where: any = {
          status: 'ACTIVE',
          isActive: true
        }

        if (city) where.city = { contains: city, mode: 'insensitive' }
        if (country) where.country = { contains: country, mode: 'insensitive' }
        if (featured !== undefined) where.featured = featured

        const orderBy: any = {}
        orderBy[sortBy] = sortOrder

        const [workspaces, total] = await Promise.all([
          this.prisma.workspace.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              },
              _count: {
                select: {
                  reviews: true
                }
              }
            },
            orderBy,
            skip: (page - 1) * limit,
            take: limit
          }),
          this.prisma.workspace.count({ where })
        ])

        return {
          workspaces,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      },
      cacheKey,
      2 * 60 * 1000 // 2 minutes cache
    )
  }

  /**
   * Optimized workspace details with related data
   */
  async getWorkspaceDetails(id: string) {
    const cacheKey = `workspace:${id}`
    
    return this.prisma.cachedQuery(
      async () => {
        const workspace = await this.prisma.workspace.findFirst({
          where: {
            OR: [{ id }, { slug: id }],
            status: 'ACTIVE',
            isActive: true
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true
              }
            },
            _count: {
              select: {
                reviews: true,
                bookings: true
              }
            }
          }
        })

        if (!workspace) return null

        // Get similar workspaces in parallel
        const similarWorkspaces = await this.prisma.workspace.findMany({
          where: {
            AND: [
              { id: { not: workspace.id } },
              { status: 'ACTIVE' },
              { isActive: true },
              {
                OR: [
                  { city: workspace.city },
                  { country: workspace.country }
                ]
              }
            ]
          },
          include: {
            _count: {
              select: { reviews: true }
            }
          },
          orderBy: [
            { featured: 'desc' },
            { digitalScore: 'desc' }
          ],
          take: 3
        })

        return {
          workspace,
          similarWorkspaces
        }
      },
      cacheKey,
      5 * 60 * 1000 // 5 minutes cache for details
    )
  }

  /**
   * Optimized search with full-text search capabilities
   */
  async searchWorkspaces(query: string, options: {
    limit?: number
    city?: string
    country?: string
  } = {}) {
    const { limit = 10, city, country } = options
    const cacheKey = `search:${query}:${JSON.stringify(options)}`

    return this.prisma.cachedQuery(
      async () => {
        const searchTerms = query.toLowerCase().split(' ').filter(term => term.length > 2)
        
        if (searchTerms.length === 0) {
          return { workspaces: [], total: 0 }
        }

        const where: any = {
          status: 'ACTIVE',
          isActive: true,
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { city: { contains: query, mode: 'insensitive' } },
            { country: { contains: query, mode: 'insensitive' } },
            // Search in amenities array
            {
              amenities: {
                hasSome: searchTerms
              }
            }
          ]
        }

        if (city) where.city = { contains: city, mode: 'insensitive' }
        if (country) where.country = { contains: country, mode: 'insensitive' }

        const [workspaces, total] = await Promise.all([
          this.prisma.workspace.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true
                }
              },
              _count: {
                select: { reviews: true }
              }
            },
            orderBy: [
              { featured: 'desc' },
              { digitalScore: 'desc' },
              { rating: 'desc' }
            ],
            take: limit
          }),
          this.prisma.workspace.count({ where })
        ])

        return { workspaces, total }
      },
      cacheKey,
      30 * 1000 // 30 seconds cache for search
    )
  }

  /**
   * Get analytics data with caching
   */
  async getAnalytics() {
    const cacheKey = 'analytics:dashboard'
    
    return this.prisma.cachedQuery(
      async () => {
        const [
          totalWorkspaces,
          activeWorkspaces,
          totalUsers,
          pendingScoreRequests,
          unreadSubmissions,
          topCities
        ] = await Promise.all([
          this.prisma.workspace.count(),
          this.prisma.workspace.count({ where: { status: 'ACTIVE', isActive: true } }),
          this.prisma.user.count(),
          this.prisma.scoreRequest.count({ where: { status: 'PENDING' } }),
          this.prisma.contactSubmission.count({ where: { status: 'UNREAD' } }),
          this.prisma.workspace.groupBy({
            by: ['city'],
            where: { status: 'ACTIVE', isActive: true },
            _count: { city: true },
            orderBy: { _count: { city: 'desc' } },
            take: 10
          })
        ])

        return {
          totalWorkspaces,
          activeWorkspaces,
          totalUsers,
          pendingScoreRequests,
          unreadSubmissions,
          topCities: topCities.map((city: any) => ({
            name: city.city,
            count: city._count.city
          }))
        }
      },
      cacheKey,
      5 * 60 * 1000 // 5 minutes cache
    )
  }

  /**
   * Invalidate related caches when data changes
   */
  invalidateWorkspaceCache(workspaceId?: string, city?: string, country?: string): void {
    queryCache.clear() // Simple approach - clear all for now
    
    logger.info('Workspace cache invalidated', {
      workspaceId,
      city,
      country,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Clear query cache
   */
  clearCache(): void {
    this.prisma.clearCache()
  }

  /**
   * Get database performance statistics
   */
  getPerformanceStats() {
    return this.prisma.getStats()
  }
}

// Export singleton instance
export const dbOptimizer = new DatabaseOptimizer()

/**
 * React hook for optimized database queries
 */
export function useOptimizedQuery<T>(
  queryKey: string,
  queryFn: () => Promise<T>,
  options: {
    enabled?: boolean
    refreshInterval?: number
    cacheTime?: number
  } = {}
) {
  const [state, setState] = React.useState<{
    data: T | null
    loading: boolean
    error: Error | null
    lastFetch: number
  }>({
    data: null,
    loading: false,
    error: null,
    lastFetch: 0
  })

  const {
    enabled = true,
    refreshInterval,
    cacheTime = 2 * 60 * 1000
  } = options

  React.useEffect(() => {
    if (!enabled) return

    const fetchData = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }))

      try {
        const result = await getPrismaClient().cachedQuery(queryFn, queryKey, cacheTime)
        setState({
          data: result,
          loading: false,
          error: null,
          lastFetch: Date.now()
        })
      } catch (error) {
        setState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error : new Error(String(error))
        }))
      }
    }

    fetchData()

    // Set up refresh interval if specified
    let intervalId: NodeJS.Timeout | null = null
    if (refreshInterval && refreshInterval > 0) {
      intervalId = setInterval(fetchData, refreshInterval)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [queryKey, enabled, refreshInterval, cacheTime])

  const refetch = React.useCallback(async () => {
    if (!enabled) return

    setState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const result = await queryFn()
      queryCache.set(queryKey, result, cacheTime)
      setState({
        data: result,
        loading: false,
        error: null,
        lastFetch: Date.now()
      })
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error : new Error(String(error))
      }))
    }
  }, [queryKey, queryFn, enabled, cacheTime])

  return { ...state, refetch }
}

// Import React for hooks
import React from 'react'