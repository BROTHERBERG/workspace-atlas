import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { dbOptimizer } from '@/lib/db-optimization'
import { queryCache } from '@/lib/cache'
import { logger } from '@/lib/logger'
import os from 'os'

interface DbStats {
  queryCount: number
  [key: string]: unknown
}

interface CacheStats {
  size: number
  hitRate: number
  memoryUsage: number
  expired: number
  [key: string]: unknown
}

interface MemoryUsage {
  heapUsed: number
  heapTotal: number
  external: number
  rss: number
}

/**
 * Performance monitoring API endpoint
 * Returns server-side performance statistics
 */
export async function GET(_request: NextRequest) {
  try {
    // Check authentication and admin role
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin role
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Get database performance stats
    const dbStats = dbOptimizer.getPerformanceStats()
    
    // Get cache statistics
    const cacheStats = queryCache.getStats()
    
    // Get system memory usage (if available)
    const memoryUsage = process.memoryUsage()
    
    // Calculate some derived metrics
    const uptime = process.uptime()
    
    // Get recent slow queries from logs (simulated)
    const slowQueries = await getRecentSlowQueries()
    
    // Get top endpoints by usage (simulated)
    const endpointStats = await getEndpointStats()

    const performanceData = {
      timestamp: new Date().toISOString(),
      uptime: uptime,
      
      database: {
        queryCount: dbStats.queryCount,
        slowQueries: slowQueries.length,
        avgQueryTime: slowQueries.length > 0 
          ? slowQueries.reduce((sum, q) => sum + q.duration, 0) / slowQueries.length 
          : 0,
        cacheHitRate: cacheStats.hitRate,
        connectionCount: getActiveConnections(),
        recentSlowQueries: slowQueries.slice(0, 10) // Last 10 slow queries
      },
      
      cache: {
        size: cacheStats.size,
        hitRate: cacheStats.hitRate,
        memoryUsage: cacheStats.memoryUsage,
        expired: cacheStats.expired,
        evictions: 0 // TODO: Track evictions
      },
      
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memory: {
          used: memoryUsage.heapUsed,
          total: memoryUsage.heapTotal,
          external: memoryUsage.external,
          rss: memoryUsage.rss
        },
        cpu: await getCpuUsage(),
        loadAverage: getLoadAverage()
      },
      
      api: {
        endpoints: endpointStats,
        totalRequests: getTotalRequests(),
        averageResponseTime: getAverageResponseTime(),
        errorRate: getErrorRate()
      },
      
      performance: {
        score: await calculatePerformanceScore(dbStats, cacheStats, memoryUsage),
        recommendations: await generateRecommendations(dbStats, cacheStats, memoryUsage)
      }
    }

    return NextResponse.json(performanceData)

  } catch (error) {
    logger.error('Performance API error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Clear caches endpoint
 */
export async function DELETE(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Clear all caches
    queryCache.clear()
    dbOptimizer.clearCache()
    
    return NextResponse.json({ 
      message: 'Caches cleared successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Cache clear error:', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to clear caches' },
      { status: 500 }
    )
  }
}

// Helper functions for gathering performance data

async function getRecentSlowQueries() {
  // In a real implementation, this would query logs or monitoring system
  // For now, return simulated data
  return [
    {
      query: 'SELECT * FROM workspace WHERE city ILIKE ...',
      duration: 1250,
      timestamp: Date.now() - 300000,
      params: ['%london%']
    },
    {
      query: 'SELECT COUNT(*) FROM reviews JOIN workspace ...',
      duration: 890,
      timestamp: Date.now() - 180000,
      params: []
    }
  ]
}

async function getEndpointStats() {
  // Simulated endpoint statistics
  return [
    { path: '/api/workspaces', requests: 1250, avgResponseTime: 120, errorRate: 0.02 },
    { path: '/api/workspaces/[id]', requests: 890, avgResponseTime: 95, errorRate: 0.01 },
    { path: '/api/search', requests: 567, avgResponseTime: 180, errorRate: 0.03 },
    { path: '/api/reviews', requests: 234, avgResponseTime: 75, errorRate: 0.01 }
  ]
}

function getActiveConnections(): number {
  // This would normally come from your database connection pool
  return 8
}

async function getCpuUsage(): Promise<number> {
  return new Promise((resolve) => {
    const startUsage = process.cpuUsage()
    setTimeout(() => {
      const endUsage = process.cpuUsage(startUsage)
      const totalUsage = endUsage.user + endUsage.system
      const percentage = (totalUsage / 1000000) * 100 // Convert to percentage
      resolve(Math.min(percentage, 100))
    }, 100)
  })
}

function getLoadAverage(): number[] {
  try {
    return os.loadavg()
  } catch {
    return [0, 0, 0]
  }
}

function getTotalRequests(): number {
  // This would come from your monitoring system
  return 12450
}

function getAverageResponseTime(): number {
  // This would come from your monitoring system
  return 125
}

function getErrorRate(): number {
  // This would come from your monitoring system
  return 0.015 // 1.5%
}

async function calculatePerformanceScore(dbStats: DbStats, cacheStats: CacheStats, memoryUsage: MemoryUsage): Promise<number> {
  let score = 100

  // Deduct points for poor cache hit rate
  if (cacheStats.hitRate < 0.8) {
    score -= (0.8 - cacheStats.hitRate) * 50
  }

  // Deduct points for high memory usage
  const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal
  if (memoryUsagePercent > 0.8) {
    score -= (memoryUsagePercent - 0.8) * 100
  }

  // Deduct points for slow queries  
  if (dbStats.queryCount > 0) {
    const slowQueries = await getRecentSlowQueries()
    const slowQueryPercent = (slowQueries.length / dbStats.queryCount)
    if (slowQueryPercent > 0.05) { // More than 5% slow queries
      score -= (slowQueryPercent - 0.05) * 200
    }
  }

  return Math.max(0, Math.round(score))
}

async function generateRecommendations(dbStats: DbStats, cacheStats: CacheStats, memoryUsage: MemoryUsage): Promise<string[]> {
  const recommendations: string[] = []

  if (cacheStats.hitRate < 0.8) {
    recommendations.push('Consider increasing cache TTL or pre-warming frequently accessed data')
  }

  const memoryUsagePercent = memoryUsage.heapUsed / memoryUsage.heapTotal
  if (memoryUsagePercent > 0.8) {
    recommendations.push('High memory usage detected. Consider optimizing memory allocation or scaling up')
  }

  const slowQueries = await getRecentSlowQueries()
  if (slowQueries.length > 0) {
    recommendations.push(`${slowQueries.length} slow queries detected. Review database indexes and query optimization`)
  }

  if (cacheStats.size > 500) {
    recommendations.push('Large cache size detected. Consider implementing cache partitioning')
  }

  if (recommendations.length === 0) {
    recommendations.push('System performance is optimal')
  }

  return recommendations
}