'use client'

import { useState, useEffect } from 'react'
import { 
  TrendingUp, 
  Users, 
  Building2, 
  DollarSign,
  ArrowUp,
  ArrowDown,
  Eye,
  Calendar
} from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'

interface QuickStatsProps {
  period?: string
  className?: string
}

interface QuickStats {
  totalWorkspaces: number
  totalUsers: number
  totalViews: number
  totalRevenue: number
  growth: {
    workspaces: number
    users: number
    views: number
    revenue: number
  }
}

interface TopPerformer {
  id: string
  name: string
  city: string
  rating: number
  bookings: number
  revenue: number
}

export function AnalyticsQuickStats({ period = 'week', className = '' }: QuickStatsProps) {
  const [stats, setStats] = useState<QuickStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchQuickStats = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard?period=${period}`)
        
        if (response.ok) {
          const data = await response.json()
          setStats({
            totalWorkspaces: data.platform.totalWorkspaces,
            totalUsers: data.platform.totalUsers,
            totalViews: data.platform.totalViews,
            totalRevenue: data.revenue.totalRevenue,
            growth: data.platform.growth
          })
        } else {
          setError('Failed to load stats')
        }
      } catch (err) {
        setError('Failed to load stats')
      } finally {
        setLoading(false)
      }
    }

    fetchQuickStats()
  }, [period])

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact'
    }).format(amount)
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="w-3 h-3 text-green-600" />
    if (growth < 0) return <ArrowDown className="w-3 h-3 text-red-600" />
    return null
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-1" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          {error || 'No data available'}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Workspaces</CardTitle>
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalWorkspaces)}</div>
          <div className={`text-xs flex items-center gap-1 ${getGrowthColor(stats.growth.workspaces)}`}>
            {getGrowthIcon(stats.growth.workspaces)}
            {Math.abs(stats.growth.workspaces)}% from last period
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Users</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalUsers)}</div>
          <div className={`text-xs flex items-center gap-1 ${getGrowthColor(stats.growth.users)}`}>
            {getGrowthIcon(stats.growth.users)}
            {Math.abs(stats.growth.users)}% from last period
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Views</CardTitle>
          <Eye className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatNumber(stats.totalViews)}</div>
          <div className={`text-xs flex items-center gap-1 ${getGrowthColor(stats.growth.views)}`}>
            {getGrowthIcon(stats.growth.views)}
            {Math.abs(stats.growth.views)}% from last period
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
          <div className={`text-xs flex items-center gap-1 ${getGrowthColor(stats.growth.revenue)}`}>
            {getGrowthIcon(stats.growth.revenue)}
            {Math.abs(stats.growth.revenue)}% from last period
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function TopPerformingWorkspaces({ 
  limit = 5, 
  period = 'week', 
  className = '' 
}: { 
  limit?: number
  period?: string
  className?: string 
}) {
  const [performers, setPerformers] = useState<TopPerformer[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchTopPerformers = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard?period=${period}`)
        
        if (response.ok) {
          const data = await response.json()
          setPerformers(data.workspacePerformance.topPerforming.slice(0, limit))
        }
      } catch (err) {
        // Handle error silently for widget
      } finally {
        setLoading(false)
      }
    }

    fetchTopPerformers()
  }, [limit, period])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: limit }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-8 w-8 rounded" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-24 mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-6 w-12" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Top Performing Workspaces</CardTitle>
        <CardDescription>Highest rated and most booked this {period}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {performers.map((workspace, index) => (
            <div key={workspace.id} className="flex items-center justify-between space-x-3">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center text-sm font-bold text-yellow-700">
                  #{index + 1}
                </div>
                <div>
                  <div className="font-medium text-sm">{workspace.name}</div>
                  <div className="text-xs text-gray-500">{workspace.city}</div>
                </div>
              </div>
              
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm">
                  <span className="text-yellow-500">⭐</span>
                  <span className="font-medium">{workspace.rating.toFixed(1)}</span>
                </div>
                <div className="text-xs text-gray-500">
                  {workspace.bookings} bookings
                </div>
              </div>
            </div>
          ))}
          
          {performers.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function RevenueBreakdown({ 
  period = 'month', 
  className = '' 
}: { 
  period?: string
  className?: string 
}) {
  const [revenue, setRevenue] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRevenue = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard?period=${period}`)
        
        if (response.ok) {
          const data = await response.json()
          setRevenue(data.revenue)
        }
      } catch (err) {
        // Handle error silently for widget
      } finally {
        setLoading(false)
      }
    }

    fetchRevenue()
  }, [period])

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-4 w-24" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <div className="flex justify-between mb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!revenue) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-gray-500">
          No revenue data available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">Revenue Breakdown</CardTitle>
        <CardDescription>Revenue by source this {period}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {revenue.revenueBySource.map((source: any, index: number) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">{source.source}</span>
                <span className="text-sm font-semibold">{formatCurrency(source.amount)}</span>
              </div>
              <Progress value={source.percentage} className="h-2" />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {source.percentage}% of total
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t">
          <div className="flex justify-between items-center">
            <span className="font-medium">Total Revenue</span>
            <span className="text-lg font-bold">{formatCurrency(revenue.totalRevenue)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function AnalyticsInsights({ 
  period = 'week', 
  className = '' 
}: { 
  period?: string
  className?: string 
}) {
  const [insights, setInsights] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const response = await fetch(`/api/analytics/dashboard?period=${period}`)
        
        if (response.ok) {
          const data = await response.json()
          setInsights(data.insights.slice(0, 3)) // Show top 3 insights
        }
      } catch (err) {
        // Handle error silently for widget
      } finally {
        setLoading(false)
      }
    }

    fetchInsights()
  }, [period])

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-yellow-500" />
          Key Insights
        </CardTitle>
        <CardDescription>Important trends this {period}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <div key={index} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
              <p className="text-sm text-yellow-800">{insight}</p>
            </div>
          ))}
          
          {insights.length === 0 && (
            <div className="text-center text-gray-500 py-4">
              No insights available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}