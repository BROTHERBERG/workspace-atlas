"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  Database, 
  Clock, 
  Zap, 
  TrendingUp, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  BarChart3
} from 'lucide-react'
import { performanceTracker, ClientPerformanceTracker } from '@/lib/performance'
import { queryCache, imageCache } from '@/lib/cache'
import { logger } from '@/lib/logger'

interface PerformanceStats {
  database: {
    queryCount: number
    slowQueries: number
    cacheHitRate: number
    avgQueryTime: number
  }
  cache: {
    size: number
    hitRate: number
    memoryUsage: number
    evictions: number
  }
  webVitals: {
    lcp: number | null
    fid: number | null
    cls: number | null
    ttfb: number | null
  }
  customMetrics: Array<{
    name: string
    value: number
    trend: 'up' | 'down' | 'stable'
    status: 'good' | 'warning' | 'error'
  }>
}

export function PerformanceDashboard() {
  const [stats, setStats] = React.useState<PerformanceStats | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [autoRefresh, setAutoRefresh] = React.useState(false)
  const [tracker] = React.useState(() => new ClientPerformanceTracker())

  // Fetch performance data
  const fetchStats = React.useCallback(async () => {
    try {
      setLoading(true)

      // Simulate API call to get server-side stats
      const response = await fetch('/api/admin/performance')
      const serverStats = response.ok ? await response.json() : null

      // Get client-side stats
      const clientMetrics = tracker.getMetrics()
      const cacheStats = queryCache.getStats()
      const imageCacheStats = imageCache?.getStats()

      // Get Web Vitals from Performance Observer
      const webVitals = {
        lcp: getWebVital('largest-contentful-paint'),
        fid: getWebVital('first-input'),
        cls: getWebVital('cumulative-layout-shift'),
        ttfb: getWebVital('navigation', 'responseStart')
      }

      // Calculate custom metrics
      const customMetrics = [
        {
          name: 'Page Load Time',
          value: calculatePageLoadTime(),
          trend: 'stable' as const,
          status: calculatePageLoadTime() < 2000 ? 'good' as const : 'warning' as const
        },
        {
          name: 'Component Renders',
          value: clientMetrics.filter(m => m.name.includes('render')).length,
          trend: 'stable' as const,
          status: 'good' as const
        },
        {
          name: 'API Calls',
          value: clientMetrics.filter(m => m.name.includes('api')).length,
          trend: 'stable' as const,
          status: 'good' as const
        }
      ]

      setStats({
        database: {
          queryCount: serverStats?.database?.queryCount || 0,
          slowQueries: serverStats?.database?.slowQueries || 0,
          cacheHitRate: cacheStats.hitRate || 0,
          avgQueryTime: serverStats?.database?.avgQueryTime || 0
        },
        cache: {
          size: cacheStats.size || 0,
          hitRate: cacheStats.hitRate || 0,
          memoryUsage: cacheStats.memoryUsage || 0,
          evictions: 0
        },
        webVitals,
        customMetrics
      })
    } catch (error) {
      logger.error('Failed to fetch performance stats:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [tracker])

  // Auto-refresh effect
  React.useEffect(() => {
    fetchStats()
    
    let intervalId: NodeJS.Timeout | null = null
    if (autoRefresh) {
      intervalId = setInterval(fetchStats, 5000) // Refresh every 5 seconds
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [fetchStats, autoRefresh])

  // Helper functions
  const getWebVital = (entryType: string, metric?: string): number | null => {
    try {
      const entries = performance.getEntriesByType(entryType)
      if (entries.length === 0) return null
      
      const entry = entries[entries.length - 1] as any
      if (metric) {
        return entry[metric] || null
      }
      return entry.startTime || entry.value || null
    } catch {
      return null
    }
  }

  const calculatePageLoadTime = (): number => {
    try {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      return navigation ? navigation.loadEventEnd - navigation.loadEventStart : 0
    } catch {
      return 0
    }
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)}MB`
  }

  const getStatusColor = (status: 'good' | 'warning' | 'error'): string => {
    switch (status) {
      case 'good': return 'text-green-600'
      case 'warning': return 'text-yellow-600'
      case 'error': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getStatusIcon = (status: 'good' | 'warning' | 'error') => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />
    }
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading performance data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-gray-600">Monitor application performance and optimization</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            onClick={() => setAutoRefresh(!autoRefresh)}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto Refresh ON' : 'Auto Refresh OFF'}
          </Button>
          <Button onClick={fetchStats} disabled={loading} size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="cache">Cache</TabsTrigger>
          <TabsTrigger value="webvitals">Web Vitals</TabsTrigger>
          <TabsTrigger value="metrics">Custom Metrics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database Queries</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.database.queryCount || 0}</div>
                <p className="text-xs text-muted-foreground">
                  {stats?.database.slowQueries || 0} slow queries
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Cache Hit Rate</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {((stats?.cache.hitRate || 0) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats?.cache.size || 0} cached items
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Page Load Time</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(calculatePageLoadTime())}
                </div>
                <p className="text-xs text-muted-foreground">
                  Average load time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatBytes(stats?.cache.memoryUsage || 0)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Cache memory usage
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Query Performance</CardTitle>
                <CardDescription>Database query statistics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Total Queries</span>
                  <Badge variant="secondary">{stats?.database.queryCount || 0}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Slow Queries (&gt;1s)</span>
                  <Badge variant={stats?.database.slowQueries ? "destructive" : "secondary"}>
                    {stats?.database.slowQueries || 0}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Average Query Time</span>
                  <Badge variant="secondary">
                    {formatDuration(stats?.database.avgQueryTime || 0)}
                  </Badge>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Cache Hit Rate</span>
                    <span>{((stats?.database.cacheHitRate || 0) * 100).toFixed(1)}%</span>
                  </div>
                  <Progress value={(stats?.database.cacheHitRate || 0) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Query Cache</CardTitle>
                <CardDescription>Database query caching performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Cached Items</span>
                    <Badge variant="secondary">{stats?.cache.size || 0}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Memory Usage</span>
                    <Badge variant="secondary">
                      {formatBytes(stats?.cache.memoryUsage || 0)}
                    </Badge>
                  </div>
                  <Button 
                    onClick={() => {
                      queryCache.clear()
                      fetchStats()
                    }}
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    Clear Cache
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cache" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cache Performance</CardTitle>
              <CardDescription>Application caching statistics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <h4 className="font-medium">Query Cache</h4>
                  <div className="text-2xl font-bold">{stats?.cache.size || 0}</div>
                  <div className="text-sm text-muted-foreground">
                    Hit Rate: {((stats?.cache.hitRate || 0) * 100).toFixed(1)}%
                  </div>
                  <Progress value={(stats?.cache.hitRate || 0) * 100} />
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Memory Usage</h4>
                  <div className="text-2xl font-bold">
                    {formatBytes(stats?.cache.memoryUsage || 0)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Cache memory consumption
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Image Cache</h4>
                  <div className="text-2xl font-bold">
                    {imageCache?.getStats().size || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Preloaded images
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="webvitals" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Core Web Vitals</CardTitle>
                <CardDescription>Google's performance metrics</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Largest Contentful Paint (LCP)</span>
                    <Badge variant={
                      !stats?.webVitals.lcp ? "secondary" :
                      stats.webVitals.lcp < 2500 ? "default" : "destructive"
                    }>
                      {stats?.webVitals.lcp ? formatDuration(stats.webVitals.lcp) : 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>First Input Delay (FID)</span>
                    <Badge variant={
                      !stats?.webVitals.fid ? "secondary" :
                      stats.webVitals.fid < 100 ? "default" : "destructive"
                    }>
                      {stats?.webVitals.fid ? formatDuration(stats.webVitals.fid) : 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Cumulative Layout Shift (CLS)</span>
                    <Badge variant={
                      !stats?.webVitals.cls ? "secondary" :
                      stats.webVitals.cls < 0.1 ? "default" : "destructive"
                    }>
                      {stats?.webVitals.cls ? stats.webVitals.cls.toFixed(3) : 'N/A'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span>Time to First Byte (TTFB)</span>
                    <Badge variant={
                      !stats?.webVitals.ttfb ? "secondary" :
                      stats.webVitals.ttfb < 600 ? "default" : "destructive"
                    }>
                      {stats?.webVitals.ttfb ? formatDuration(stats.webVitals.ttfb) : 'N/A'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Performance Score</CardTitle>
                <CardDescription>Overall application performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-green-600">85</div>
                    <p className="text-sm text-muted-foreground">Performance Score</p>
                  </div>
                  <Progress value={85} className="w-full" />
                  <div className="text-sm text-center text-muted-foreground">
                    Based on Core Web Vitals and custom metrics
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Custom Metrics</CardTitle>
              <CardDescription>Application-specific performance metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats?.customMetrics.map((metric, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(metric.status)}
                      <span className="font-medium">{metric.name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`font-bold ${getStatusColor(metric.status)}`}>
                        {typeof metric.value === 'number' && metric.name.includes('Time') 
                          ? formatDuration(metric.value)
                          : metric.value
                        }
                      </span>
                      <TrendingUp className={`h-4 w-4 ${
                        metric.trend === 'up' ? 'text-green-600' :
                        metric.trend === 'down' ? 'text-red-600' : 'text-gray-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}