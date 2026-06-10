/**
 * Rate limiting utilities for API security
 * Implements multiple rate limiting strategies
 */

import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/logger'

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  keyGenerator?: (req: NextRequest) => string
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  onLimitReached?: (req: NextRequest, key: string) => void
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  resetTime: number
  totalHits: number
}

/**
 * In-memory rate limiter with Redis-like interface
 * Edge Runtime compatible - uses lazy cleanup instead of timers
 * In production, replace with actual Redis
 */
export class MemoryRateLimiter {
  private store = new Map<string, { count: number; resetTime: number }>()
  private lastCleanup = Date.now()
  private readonly CLEANUP_INTERVAL = 60000 // 1 minute

  constructor() {
    // No timer needed - cleanup happens lazily on each request
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    const now = Date.now()

    // Perform lazy cleanup if needed
    if (now - this.lastCleanup > this.CLEANUP_INTERVAL) {
      this.cleanup()
      this.lastCleanup = now
    }

    const resetTime = now + windowMs
    const entry = this.store.get(key)

    if (!entry || entry.resetTime <= now) {
      // New entry or expired
      this.store.set(key, { count: 1, resetTime })
      return {
        success: true,
        remaining: -1, // Unknown without max limit
        resetTime,
        totalHits: 1
      }
    }

    // Increment existing entry
    entry.count++
    this.store.set(key, entry)

    return {
      success: true,
      remaining: -1,
      resetTime: entry.resetTime,
      totalHits: entry.count
    }
  }

  async get(key: string): Promise<{ count: number; resetTime: number } | null> {
    const entry = this.store.get(key)
    if (!entry || entry.resetTime <= Date.now()) {
      this.store.delete(key)
      return null
    }
    return entry
  }

  async reset(key: string): Promise<void> {
    this.store.delete(key)
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.store.entries()) {
      if (entry.resetTime <= now) {
        this.store.delete(key)
      }
    }
  }

  destroy(): void {
    // No timer to clear - just clear the store
    this.store.clear()
  }
}

// Global rate limiter instance
const rateLimiter = new MemoryRateLimiter()

/**
 * Rate limiting middleware
 */
export function createRateLimit(config: RateLimitConfig) {
  const {
    windowMs,
    maxRequests,
    keyGenerator = (req) => getClientIP(req),
    skipSuccessfulRequests = false,
    skipFailedRequests = false,
    onLimitReached
  } = config

  return async (req: NextRequest): Promise<RateLimitResult> => {
    const key = keyGenerator(req)
    const result = await rateLimiter.increment(key, windowMs)
    
    const remaining = Math.max(0, maxRequests - result.totalHits)
    const limitExceeded = result.totalHits > maxRequests

    if (limitExceeded && onLimitReached) {
      onLimitReached(req, key)
    }

    logger.debug('Rate limit check', {
      key,
      totalHits: result.totalHits,
      maxRequests,
      remaining,
      limitExceeded,
      resetTime: new Date(result.resetTime).toISOString()
    })

    return {
      success: !limitExceeded,
      remaining,
      resetTime: result.resetTime,
      totalHits: result.totalHits
    }
  }
}

/**
 * Pre-configured rate limiters for different use cases
 */
export const rateLimiters = {
  // General API requests - 1000 requests per hour
  general: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    onLimitReached: (req, key) => {
      logger.warn('General rate limit exceeded', { 
        key, 
        ip: getClientIP(req),
        userAgent: req.headers.get('user-agent') || undefined
      })
    }
  }),

  // Authentication endpoints - 10 attempts per 15 minutes
  auth: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 10,
    onLimitReached: (req, key) => {
      logger.warn('Auth rate limit exceeded', { 
        key, 
        ip: getClientIP(req),
        path: req.nextUrl.pathname
      })
    }
  }),

  // Search endpoints - 100 requests per 15 minutes
  search: createRateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    onLimitReached: (req, key) => {
      logger.warn('Search rate limit exceeded', { key, ip: getClientIP(req) })
    }
  }),

  // Contact/submission forms - 5 requests per hour
  forms: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 5,
    onLimitReached: (req, key) => {
      logger.warn('Form submission rate limit exceeded', { key, ip: getClientIP(req) })
    }
  }),

  // Admin endpoints - 200 requests per hour
  admin: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 200,
    keyGenerator: (req) => {
      // Use user ID for authenticated admin requests
      const userAgent = req.headers.get('user-agent')
      const ip = getClientIP(req)
      return `admin:${ip}:${userAgent?.slice(0, 50)}`
    },
    onLimitReached: (req, key) => {
      logger.error('Admin rate limit exceeded', new Error('Rate limit exceeded'), { 
        key, 
        ip: getClientIP(req),
        path: req.nextUrl.pathname
      })
    }
  }),

  // File upload endpoints - 20 requests per hour
  upload: createRateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 20,
    onLimitReached: (req, key) => {
      logger.warn('Upload rate limit exceeded', { key, ip: getClientIP(req) })
    }
  })
}

/**
 * Get client IP address from request
 */
export function getClientIP(req: NextRequest): string {
  // Check for common proxy headers
  const forwardedFor = req.headers.get('x-forwarded-for')
  const realIP = req.headers.get('x-real-ip')
  const cfConnectingIP = req.headers.get('cf-connecting-ip')

  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwardedFor) {
    // x-forwarded-for can be comma-separated
    return forwardedFor.split(',')[0].trim()
  }

  // Fallback (for development)
  return 'unknown'
}

/**
 * Rate limit response helper
 */
export function createRateLimitResponse(result: RateLimitResult): NextResponse {
  const headers = new Headers()
  headers.set('X-RateLimit-Limit', '1000') // Could be dynamic
  headers.set('X-RateLimit-Remaining', result.remaining.toString())
  headers.set('X-RateLimit-Reset', Math.ceil(result.resetTime / 1000).toString())

  if (!result.success) {
    headers.set('Retry-After', Math.ceil((result.resetTime - Date.now()) / 1000).toString())
    
    return new NextResponse(
      JSON.stringify({
        error: 'Too Many Requests',
        message: 'Rate limit exceeded. Please try again later.',
        retryAfter: result.resetTime
      }),
      {
        status: 429,
        headers
      }
    )
  }

  return NextResponse.next({ headers })
}

/**
 * Distributed rate limiter for production use with Redis
 */
export class RedisRateLimiter {
  private redis: any // Would be actual Redis client in production

  constructor(redisClient: any) {
    this.redis = redisClient
  }

  async increment(key: string, windowMs: number): Promise<RateLimitResult> {
    // Redis implementation would go here
    // Using sliding window log or fixed window counter
    throw new Error('Redis rate limiter not implemented - using memory fallback')
  }

  // ... other Redis methods
}

/**
 * Rate limit by user ID for authenticated requests
 */
export function createUserRateLimit(maxRequests: number, windowMs: number) {
  return createRateLimit({
    windowMs,
    maxRequests,
    keyGenerator: (req) => {
      // Extract user ID from JWT token or session
      const authHeader = req.headers.get('authorization')
      if (authHeader) {
        try {
          const token = authHeader.replace('Bearer ', '')
          // In real implementation, decode JWT and extract user ID
          return `user:${token.slice(-10)}` // Placeholder
        } catch {
          return getClientIP(req)
        }
      }
      return getClientIP(req)
    }
  })
}

/**
 * Adaptive rate limiting based on system load
 */
export class AdaptiveRateLimiter {
  private baseLimit: number
  private currentLimit: number
  private systemLoad = 0

  constructor(baseLimit: number) {
    this.baseLimit = baseLimit
    this.currentLimit = baseLimit

    // Monitor system load every 30 seconds
    setInterval(() => {
      this.updateSystemLoad()
    }, 30000)
  }

  private async updateSystemLoad(): Promise<void> {
    try {
      // Simple CPU usage check (would be more sophisticated in production)
      if (typeof process !== 'undefined' && process.cpuUsage) {
        const usage = process.cpuUsage()
        this.systemLoad = (usage.user + usage.system) / 1000000 // Convert to seconds
      } else {
        this.systemLoad = 0.5 // Default load for edge runtime
      }

      // Adjust rate limit based on load
      if (this.systemLoad > 0.8) {
        this.currentLimit = Math.floor(this.baseLimit * 0.5) // Reduce by 50%
      } else if (this.systemLoad > 0.6) {
        this.currentLimit = Math.floor(this.baseLimit * 0.75) // Reduce by 25%
      } else {
        this.currentLimit = this.baseLimit // Full capacity
      }

      logger.debug('Adaptive rate limit updated', {
        systemLoad: this.systemLoad,
        baseLimit: this.baseLimit,
        currentLimit: this.currentLimit
      })
    } catch (error) {
      logger.warn('Failed to update system load', { error })
    }
  }

  getCurrentLimit(): number {
    return this.currentLimit
  }

  getSystemLoad(): number {
    return this.systemLoad
  }
}

// Export adaptive limiter instance
export const adaptiveRateLimiter = new AdaptiveRateLimiter(1000)

/**
 * Legacy wrapper for createRateLimit to maintain backward compatibility
 */
export function createRateLimiter(config: {
  windowMs: number
  max: number
  keyGenerator?: (req: NextRequest) => string
}) {
  const rateLimit = createRateLimit({
    windowMs: config.windowMs,
    maxRequests: config.max,
    keyGenerator: config.keyGenerator
  })

  return {
    check: async (req: NextRequest) => {
      const result = await rateLimit(req)
      return {
        success: result.success,
        remaining: result.remaining,
        resetTime: result.resetTime,
        headers: new Headers({
          'X-RateLimit-Limit': config.max.toString(),
          'X-RateLimit-Remaining': result.remaining.toString(),
          'X-RateLimit-Reset': Math.ceil(result.resetTime / 1000).toString()
        })
      }
    }
  }
}