import { createClient, RedisClientType } from 'redis'
import { logger } from '@/lib/logger'
import type { 
  WorkspaceData, 
  UserSessionData, 
  SearchResultsData, 
  DashboardMetricsData,
  RedisSocketOptions 
} from '@/types/cache'

class RedisClient {
  private client: RedisClientType | null = null
  private isConnected: boolean = false

  constructor() {
    this.init()
  }

  private async init() {
    try {
      // Only initialize in Node.js environment
      if (typeof window !== 'undefined') {
        return
      }

      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
      
      this.client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000
        } as RedisSocketOptions
      })

      this.client.on('error', (err) => {
        logger.error('Redis Client Error', err, { redisUrl })
        this.isConnected = false
      })

      this.client.on('connect', () => {
        logger.info('Redis Client Connected', { redisUrl })
        this.isConnected = true
      })

      this.client.on('disconnect', () => {
        logger.warn('Redis Client Disconnected', { redisUrl })
        this.isConnected = false
      })

      // Don't connect immediately to avoid startup errors
      // Connection will happen on first use
    } catch (error) {
      logger.error('Redis initialization error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  public async ensureConnection(): Promise<boolean> {
    if (!this.client) {
      logger.warn('Redis client not initialized')
      return false
    }

    if (!this.isConnected) {
      try {
        await this.client.connect()
        return true
      } catch (error) {
        logger.error('Failed to connect to Redis', error instanceof Error ? error : new Error(String(error)))
        return false
      }
    }

    return true
  }

  async get(key: string): Promise<string | null> {
    try {
      if (!(await this.ensureConnection())) {
        return null
      }

      const value = await this.client!.get(key)
      return value
    } catch (error) {
      logger.error('Redis GET error', error instanceof Error ? error : new Error(String(error)), { key })
      return null
    }
  }

  async set(
    key: string, 
    value: string, 
    options?: { 
      EX?: number  // Expiration in seconds
      PX?: number  // Expiration in milliseconds
      NX?: boolean // Set only if key doesn't exist
    }
  ): Promise<boolean> {
    try {
      if (!(await this.ensureConnection())) {
        return false
      }

      if (options) {
        await this.client!.set(key, value, options)
      } else {
        await this.client!.set(key, value)
      }
      
      return true
    } catch (error) {
      logger.error('Redis SET error', error instanceof Error ? error : new Error(String(error)), { key })
      return false
    }
  }

  async del(key: string | string[]): Promise<number> {
    try {
      if (!(await this.ensureConnection())) {
        return 0
      }

      const result = await this.client!.del(key)
      return result
    } catch (error) {
      logger.error('Redis DEL error', error instanceof Error ? error : new Error(String(error)), { key: Array.isArray(key) ? key.join(',') : key })
      return 0
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      if (!(await this.ensureConnection())) {
        return false
      }

      const result = await this.client!.exists(key)
      return result > 0
    } catch (error) {
      logger.error('Redis EXISTS error', error instanceof Error ? error : new Error(String(error)), { key })
      return false
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      if (!(await this.ensureConnection())) {
        return []
      }

      const keys = await this.client!.keys(pattern)
      return keys
    } catch (error) {
      logger.error('Redis KEYS error', error instanceof Error ? error : new Error(String(error)), { pattern })
      return []
    }
  }

  async flushall(): Promise<boolean> {
    try {
      if (!(await this.ensureConnection())) {
        return false
      }

      await this.client!.flushAll()
      return true
    } catch (error) {
      logger.error('Redis FLUSHALL error', error instanceof Error ? error : new Error(String(error)))
      return false
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect()
        this.isConnected = false
      }
    } catch (error) {
      logger.error('Redis disconnect error', error instanceof Error ? error : new Error(String(error)))
    }
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}

// Cache utilities
export class CacheManager {
  constructor(private redis: RedisClient) {}

  // Generic cache methods
  async cached<T>(
    key: string,
    fetcher: () => Promise<T>,
    options: {
      ttl?: number // Time to live in seconds
      parseJson?: boolean
    } = {}
  ): Promise<T | null> {
    const { ttl = 300, parseJson = true } = options // Default 5 minutes

    try {
      // Try to get from cache
      const cached = await this.redis.get(key)
      if (cached) {
        return parseJson ? JSON.parse(cached) : (cached as unknown as T)
      }

      // Fetch new data
      const data = await fetcher()
      if (data === null || data === undefined) {
        return null
      }

      // Store in cache
      const serialized = parseJson ? JSON.stringify(data) : String(data)
      await this.redis.set(key, serialized, { EX: ttl })

      return data
    } catch (error) {
      logger.error('Cache error', error instanceof Error ? error : new Error(String(error)), { key })
      // Fallback to direct fetch if cache fails
      try {
        return await fetcher()
      } catch (fetchError) {
        logger.error('Fetcher error', fetchError instanceof Error ? fetchError : new Error(String(fetchError)), { key })
        return null
      }
    }
  }

  // Application-specific cache methods
  async cacheWorkspaceData(workspaceId: string, data: WorkspaceData, ttl = 300): Promise<void> {
    await this.redis.set(`workspace:${workspaceId}`, JSON.stringify(data), { EX: ttl })
  }

  async getCachedWorkspaceData(workspaceId: string): Promise<WorkspaceData | null> {
    const data = await this.redis.get(`workspace:${workspaceId}`)
    return data ? JSON.parse(data) : null
  }

  async cacheUserSession(userId: string, sessionData: UserSessionData, ttl = 3600): Promise<void> {
    await this.redis.set(`session:${userId}`, JSON.stringify(sessionData), { EX: ttl })
  }

  async getCachedUserSession(userId: string): Promise<UserSessionData | null> {
    const data = await this.redis.get(`session:${userId}`)
    return data ? JSON.parse(data) : null
  }

  async cacheSearchResults(queryHash: string, results: SearchResultsData, ttl = 600): Promise<void> {
    await this.redis.set(`search:${queryHash}`, JSON.stringify(results), { EX: ttl })
  }

  async getCachedSearchResults(queryHash: string): Promise<SearchResultsData | null> {
    const data = await this.redis.get(`search:${queryHash}`)
    return data ? JSON.parse(data) : null
  }

  async cacheDashboardMetrics(metrics: DashboardMetricsData, ttl = 60): Promise<void> {
    await this.redis.set('dashboard:metrics', JSON.stringify(metrics), { EX: ttl })
  }

  async getCachedDashboardMetrics(): Promise<DashboardMetricsData | null> {
    const data = await this.redis.get('dashboard:metrics')
    return data ? JSON.parse(data) : null
  }

  async invalidateWorkspaceCache(workspaceId: string): Promise<void> {
    // Delete specific workspace cache
    const keysToDelete = [`workspace:${workspaceId}`]

    // Get all search keys that might contain this workspace
    const searchKeys = await this.redis.keys('search:*')
    if (searchKeys.length > 0) {
      keysToDelete.push(...searchKeys)
    }

    // Delete all keys at once
    if (keysToDelete.length > 0) {
      await this.redis.del(keysToDelete)
    }
  }

  async invalidateUserCache(userId: string): Promise<void> {
    await this.redis.del(`session:${userId}`)
  }

  async invalidateSearchCache(): Promise<void> {
    const searchKeys = await this.redis.keys('search:*')
    if (searchKeys.length > 0) {
      await this.redis.del(searchKeys)
    }
  }

  async invalidateDashboardCache(): Promise<void> {
    await this.redis.del('dashboard:metrics')
  }
}

// Singleton instances
const redis = new RedisClient()
const cache = new CacheManager(redis)

export { redis, cache }

// Rate limiting utility
export class RateLimiter {
  constructor(private redis: RedisClient) {}

  async checkRateLimit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> {
    const key = `ratelimit:${identifier}`
    const windowSeconds = Math.floor(windowMs / 1000)
    
    try {
      if (!(await this.redis.ensureConnection())) {
        // If Redis is down, allow the request
        return { allowed: true, remaining: limit - 1, resetTime: new Date(Date.now() + windowMs) }
      }

      const current = await this.redis.get(key)
      const now = Date.now()
      const resetTime = new Date(now + windowMs)
      
      if (!current) {
        // First request in window
        await this.redis.set(key, '1', { EX: windowSeconds })
        return { allowed: true, remaining: limit - 1, resetTime }
      }

      const count = parseInt(current)
      
      if (count >= limit) {
        return { allowed: false, remaining: 0, resetTime }
      }

      // Increment counter
      await this.redis.set(key, (count + 1).toString(), { EX: windowSeconds })
      
      return { 
        allowed: true, 
        remaining: limit - count - 1, 
        resetTime 
      }
    } catch (error) {
      logger.error('Rate limiting error', error instanceof Error ? error : new Error(String(error)), { identifier, limit, windowMs })
      // If Redis fails, allow the request
      return { allowed: true, remaining: limit - 1, resetTime: new Date(Date.now() + windowMs) }
    }
  }
}

export const rateLimiter = new RateLimiter(redis)