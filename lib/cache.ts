/**
 * Caching utilities for performance optimization
 * Supports both client-side and server-side caching
 */

import { logger } from '@/lib/logger'

export interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum cache size
  onEvict?: (key: string, value: any) => void
}

export interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
  accessCount: number
  lastAccess: number
}

/**
 * In-memory cache with TTL and LRU eviction
 */
export class MemoryCache<T = any> {
  private cache = new Map<string, CacheEntry<T>>()
  private readonly maxSize: number
  private readonly defaultTTL: number
  private readonly onEvict?: (key: string, value: T) => void

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 1000
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // 5 minutes default
    this.onEvict = options.onEvict

    // Cleanup expired entries every minute
    if (typeof window !== 'undefined') {
      setInterval(() => this.cleanup(), 60000)
    }
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key)
    
    if (!entry) {
      return null
    }

    // Check if expired
    if (Date.now() > entry.timestamp + entry.ttl) {
      this.cache.delete(key)
      if (this.onEvict) {
        this.onEvict(key, entry.data)
      }
      return null
    }

    // Update access stats
    entry.accessCount++
    entry.lastAccess = Date.now()

    return entry.data
  }

  /**
   * Set value in cache
   */
  set(key: string, data: T, ttl?: number): void {
    // Evict if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictLRU()
    }

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      accessCount: 1,
      lastAccess: Date.now()
    }

    this.cache.set(key, entry)
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (entry && this.onEvict) {
      this.onEvict(key, entry.data)
    }
    return this.cache.delete(key)
  }

  /**
   * Clear entire cache
   */
  clear(): void {
    if (this.onEvict) {
      for (const [key, entry] of this.cache) {
        this.onEvict(key, entry.data)
      }
    }
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const entries = Array.from(this.cache.values())
    const now = Date.now()
    const expired = entries.filter(e => now > e.timestamp + e.ttl).length
    
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      hitRate: this.calculateHitRate(),
      memoryUsage: this.estimateMemoryUsage()
    }
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey = ''
    let oldestAccess = Date.now()

    for (const [key, entry] of this.cache) {
      if (entry.lastAccess < oldestAccess) {
        oldestAccess = entry.lastAccess
        oldestKey = key
      }
    }

    if (oldestKey) {
      const entry = this.cache.get(oldestKey)
      if (entry && this.onEvict) {
        this.onEvict(oldestKey, entry.data)
      }
      this.cache.delete(oldestKey)
    }
  }

  /**
   * Remove expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    const expired: string[] = []

    for (const [key, entry] of this.cache) {
      if (now > entry.timestamp + entry.ttl) {
        expired.push(key)
      }
    }

    for (const key of expired) {
      const entry = this.cache.get(key)
      if (entry && this.onEvict) {
        this.onEvict(key, entry.data)
      }
      this.cache.delete(key)
    }

    if (expired.length > 0) {
      logger.debug('Cache cleanup completed', { 
        expiredEntries: expired.length,
        remainingEntries: this.cache.size
      })
    }
  }

  private calculateHitRate(): number {
    const entries = Array.from(this.cache.values())
    if (entries.length === 0) return 0
    
    const totalAccess = entries.reduce((sum, entry) => sum + entry.accessCount, 0)
    return totalAccess / entries.length
  }

  private estimateMemoryUsage(): number {
    // Rough estimation of memory usage in bytes
    let size = 0
    for (const [key, entry] of this.cache) {
      size += key.length * 2 // UTF-16 characters
      size += JSON.stringify(entry.data).length * 2
      size += 64 // Overhead for entry metadata
    }
    return size
  }
}

/**
 * Query cache for database/API results
 */
export class QueryCache extends MemoryCache<any> {
  constructor(options: CacheOptions = {}) {
    super({
      ttl: 2 * 60 * 1000, // 2 minutes default for queries
      maxSize: 500,
      ...options,
      onEvict: (key, value) => {
        logger.debug('Query evicted from cache', { key, dataSize: JSON.stringify(value).length })
      }
    })
  }

  /**
   * Cache database query result
   */
  cacheQuery(query: string, params: any[], result: any, ttl?: number): void {
    const key = this.generateQueryKey(query, params)
    this.set(key, result, ttl)
  }

  /**
   * Get cached query result
   */
  getCachedQuery(query: string, params: any[]): any | null {
    const key = this.generateQueryKey(query, params)
    return this.get(key)
  }

  /**
   * Generate consistent cache key from query and parameters
   */
  private generateQueryKey(query: string, params: any[]): string {
    const paramHash = JSON.stringify(params)
    return `query:${query}:${paramHash}`
  }
}

/**
 * Image cache for optimized loading
 */
export class ImageCache extends MemoryCache<string> {
  constructor() {
    super({
      ttl: 30 * 60 * 1000, // 30 minutes
      maxSize: 200,
      onEvict: (key, url) => {
        logger.debug('Image evicted from cache', { key, url })
      }
    })
  }

  /**
   * Preload and cache image
   */
  async preloadImage(src: string): Promise<string> {
    if (this.has(src)) {
      return this.get(src)!
    }

    try {
      const img = new Image()
      img.src = src

      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
        setTimeout(reject, 10000) // 10 second timeout
      })

      this.set(src, src)
      return src
    } catch (error) {
      logger.warn('Failed to preload image', { src, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(sources: string[]): Promise<string[]> {
    const promises = sources.map(src => 
      this.preloadImage(src).catch(() => src) // Return src even if preload fails
    )
    return Promise.all(promises)
  }
}

/**
 * Component cache for expensive computations
 */
export class ComponentCache extends MemoryCache<React.ReactElement> {
  constructor() {
    super({
      ttl: 5 * 60 * 1000, // 5 minutes
      maxSize: 100,
      onEvict: (key, element) => {
        logger.debug('Component evicted from cache', { key })
      }
    })
  }

  /**
   * Cache React element
   */
  cacheComponent(key: string, element: React.ReactElement, ttl?: number): void {
    this.set(key, element, ttl)
  }

  /**
   * Get cached React element
   */
  getCachedComponent(key: string): React.ReactElement | null {
    return this.get(key)
  }
}

// Global cache instances
export const queryCache = new QueryCache()
export const imageCache = typeof window !== 'undefined' ? new ImageCache() : null
export const componentCache = new ComponentCache()

// Default cache export for backwards compatibility
export const cache = queryCache

/**
 * React hook for caching expensive computations
 */
export function useCachedValue<T>(
  key: string,
  computation: () => T,
  deps: React.DependencyList,
  ttl?: number
): T {
  const cache = React.useMemo(() => new MemoryCache<T>(), [])
  
  return React.useMemo(() => {
    const cached = cache.get(key)
    if (cached !== null) {
      return cached
    }

    const result = computation()
    cache.set(key, result, ttl)
    return result
  }, [key, cache, ttl, ...deps])
}

/**
 * React hook for caching async operations
 */
export function useCachedAsync<T>(
  key: string,
  asyncFn: () => Promise<T>,
  deps: React.DependencyList,
  ttl?: number
): { data: T | null; loading: boolean; error: Error | null } {
  const [state, setState] = React.useState<{
    data: T | null
    loading: boolean
    error: Error | null
  }>({ data: null, loading: false, error: null })

  const cache = React.useMemo(() => new MemoryCache<T>(), [])

  React.useEffect(() => {
    const cached = cache.get(key)
    if (cached !== null) {
      setState({ data: cached, loading: false, error: null })
      return
    }

    setState(prev => ({ ...prev, loading: true, error: null }))
    
    asyncFn()
      .then(result => {
        cache.set(key, result, ttl)
        setState({ data: result, loading: false, error: null })
      })
      .catch(error => {
        setState({ data: null, loading: false, error })
      })
  }, [key, cache, ttl, ...deps])

  return state
}

// Import React for hooks
import React from 'react'