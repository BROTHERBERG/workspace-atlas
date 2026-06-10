'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { 
  TrendingUp, 
  Users, 
  Building2, 
  DollarSign, 
  Globe, 
  Smartphone,
  Monitor,
  Tablet,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Calendar,
  BarChart3,
  PieChart,
  MapPin
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'

interface AnalyticsData {
  platform: {
    totalWorkspaces: number
    activeWorkspaces: number
    totalUsers: number
    activeUsers: number
    totalViews: number
    totalBookings: number
    averageRating: number
    growth: {
      workspaces: number
      users: number
      bookings: number
      revenue: number
    }
  }
  geographic: Array<{
    country: string
    countryCode: string
    city?: string
    workspaceCount: number
    userCount: number
    avgRating: number
    totalViews: number
  }>
  userBehavior: {
    searchQueries: Array<{
      query: string
      count: number
      avgResultClicks: number
    }>
    popularAmenities: Array<{
      amenity: string
      searchCount: number
      workspaceCount: number
    }>
    userJourney: {
      averageSessionDuration: number
      bounceRate: number
      pagesPerSession: number
      conversionRate: number
    }
    deviceBreakdown: {
      mobile: number
      desktop: number
      tablet: number
    }
  }
  workspacePerformance: {
    topPerforming: Array<{
      id: string
      name: string
      city: string
      views: number
      bookings: number
      rating: number
      revenue: number
      growth: number
    }>
    underPerforming: Array<{
      id: string
      name: string
      city: string
      issues: string[]
      suggestions: string[]
    }>
    categoryBreakdown: Array<{
      category: string
      count: number
      avgRating: number
      totalRevenue: number
    }>
  }
  revenue: {
    totalRevenue: number
    monthlyRecurring: number
    averageBookingValue: number
    revenueBySource: Array<{
      source: string
      amount: number
      percentage: number
    }>
    growthTrend: Array<{
      period: string
      revenue: number
      bookings: number
      growth: number
    }>
  }
  insights: string[]
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    impact: string
  }>
}

const PERIOD_OPTIONS = [
  { value: 'day', label: 'Last 24 Hours' },
  { value: 'week', label: 'Last Week' },
  { value: 'month', label: 'Last Month' },
  { value: 'quarter', label: 'Last Quarter' },
  { value: 'year', label: 'Last Year' }
]

export default function AnalyticsDashboard() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState('month')
  const [refreshing, setRefreshing] = useState(false)
  const [exporting, setExporting] = useState(false)

  const fetchAnalytics = async (period = selectedPeriod, isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      const params = new URLSearchParams({ period })
      const response = await fetch(`/api/analytics/dashboard?${params}`)
      
      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You need admin access to view analytics')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to load analytics')
      }

      const data = await response.json()
      setAnalytics(data)

      logger.info('Analytics loaded', {
        period,
        totalWorkspaces: data.platform.totalWorkspaces,
        totalUsers: data.platform.totalUsers
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics'
      setError(errorMessage)
      logger.error('Analytics fetch failed', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleExport = async (format: 'json' | 'csv' = 'json') => {
    try {
      setExporting(true)

      const response = await fetch('/api/analytics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'export',
          parameters: {
            format,
            timeRange: {
              period: selectedPeriod
            }
          }
        })
      })

      if (!response.ok) {
        throw new Error('Export failed')
      }

      if (format === 'csv') {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        const data = await response.json()
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `analytics-${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }

      toast({
        title: 'Export Successful',
        description: `Analytics data exported as ${format.toUpperCase()}`,
      })

    } catch (error) {
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export data',
        variant: 'destructive'
      })
    } finally {
      setExporting(false)
    }
  }

  useEffect(() => {
    if (session?.user?.role === 'ADMIN') {
      fetchAnalytics()
    } else if (session) {
      setError('Admin access required to view analytics')
      setLoading(false)
    }
  }, [session])

  const handlePeriodChange = (period: string) => {
    setSelectedPeriod(period)
    fetchAnalytics(period)
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toLocaleString()
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds}s`
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUp className="w-4 h-4 text-green-600" />
    if (growth < 0) return <ArrowDown className="w-4 h-4 text-red-600" />
    return null
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600'
    if (growth < 0) return 'text-red-600'
    return 'text-gray-500'
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-700 border-blue-200'
      default: return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  if (loading) {
    return <AnalyticsLoadingSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <Card className="border-red-200">
          <CardContent className="py-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Analytics Error</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => fetchAnalytics()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!analytics) {
    return null
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Platform insights and business intelligence
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PERIOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            onClick={() => fetchAnalytics(selectedPeriod, true)}
            disabled={refreshing}
            variant="outline"
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => handleExport('csv')}
            disabled={exporting}
            variant="outline"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Insights */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-yellow-800">
            <CheckCircle className="w-5 h-5" />
            Key Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {analytics.insights.map((insight, index) => (
              <div key={index} className="flex items-start gap-2 text-sm text-yellow-700">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
                {insight}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Platform Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Workspaces</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.platform.totalWorkspaces)}</div>
            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(analytics.platform.growth.workspaces)}`}>
              {getGrowthIcon(analytics.platform.growth.workspaces)}
              {Math.abs(analytics.platform.growth.workspaces)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(analytics.platform.totalUsers)}</div>
            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(analytics.platform.growth.users)}`}>
              {getGrowthIcon(analytics.platform.growth.users)}
              {Math.abs(analytics.platform.growth.users)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.revenue.totalRevenue)}</div>
            <div className={`text-xs flex items-center gap-1 ${getGrowthColor(analytics.platform.growth.revenue)}`}>
              {getGrowthIcon(analytics.platform.growth.revenue)}
              {Math.abs(analytics.platform.growth.revenue)}% from last period
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(analytics.userBehavior.userJourney.conversionRate * 100).toFixed(1)}%
            </div>
            <div className="text-xs text-muted-foreground">
              {analytics.platform.totalBookings} bookings this period
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="users">User Behavior</TabsTrigger>
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="insights">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Geographic Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Geographic Distribution
                </CardTitle>
                <CardDescription>Workspaces by country</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.geographic.slice(0, 8).map((geo, index) => (
                    <div key={geo.countryCode} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-yellow-500 rounded-full" />
                        <span className="font-medium">{geo.country}</span>
                        <span className="text-xs text-gray-500">
                          {geo.avgRating.toFixed(1)} ⭐
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">{geo.workspaceCount}</div>
                        <div className="text-xs text-gray-500">workspaces</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
                <CardDescription>How users access the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      <span>Mobile</span>
                    </div>
                    <span className="font-semibold">
                      {Math.round(analytics.userBehavior.deviceBreakdown.mobile * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={analytics.userBehavior.deviceBreakdown.mobile * 100} 
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-green-500" />
                      <span>Desktop</span>
                    </div>
                    <span className="font-semibold">
                      {Math.round(analytics.userBehavior.deviceBreakdown.desktop * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={analytics.userBehavior.deviceBreakdown.desktop * 100} 
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tablet className="w-4 h-4 text-purple-500" />
                      <span>Tablet</span>
                    </div>
                    <span className="font-semibold">
                      {Math.round(analytics.userBehavior.deviceBreakdown.tablet * 100)}%
                    </span>
                  </div>
                  <Progress 
                    value={analytics.userBehavior.deviceBreakdown.tablet * 100} 
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Popular Search Queries */}
            <Card>
              <CardHeader>
                <CardTitle>Top Search Queries</CardTitle>
                <CardDescription>Most searched terms</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.userBehavior.searchQueries.map((query, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">"{query.query}"</div>
                        <div className="text-xs text-gray-500">
                          {query.avgResultClicks.toFixed(1)} avg clicks
                        </div>
                      </div>
                      <Badge variant="outline">{formatNumber(query.count)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Popular Amenities */}
            <Card>
              <CardHeader>
                <CardTitle>Popular Amenities</CardTitle>
                <CardDescription>Most searched amenities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.userBehavior.popularAmenities.slice(0, 6).map((amenity, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{amenity.amenity}</div>
                        <div className="text-xs text-gray-500">
                          {amenity.workspaceCount} workspaces
                        </div>
                      </div>
                      <Badge variant="outline">{formatNumber(amenity.searchCount)}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* User Journey Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>User Journey</CardTitle>
              <CardDescription>User engagement and behavior patterns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {formatDuration(analytics.userBehavior.userJourney.averageSessionDuration)}
                  </div>
                  <div className="text-sm text-gray-600">Avg Session</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics.userBehavior.userJourney.pagesPerSession.toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Pages/Session</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {(analytics.userBehavior.userJourney.bounceRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Bounce Rate</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {(analytics.userBehavior.userJourney.conversionRate * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">Conversion</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="workspaces" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top Performing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-green-700">Top Performing Workspaces</CardTitle>
                <CardDescription>Highest rated and most booked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.workspacePerformance.topPerforming.slice(0, 5).map((workspace, index) => (
                    <div key={workspace.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <div className="font-medium">{workspace.name}</div>
                          <div className="text-xs text-gray-500">{workspace.city}</div>
                        </div>
                        <Badge className="bg-green-100 text-green-700">
                          ⭐ {workspace.rating.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div>
                          <span className="text-gray-500">Views:</span>
                          <span className="font-medium ml-1">{workspace.views}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Bookings:</span>
                          <span className="font-medium ml-1">{workspace.bookings}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Revenue:</span>
                          <span className="font-medium ml-1">{formatCurrency(workspace.revenue)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Under Performing */}
            <Card>
              <CardHeader>
                <CardTitle className="text-orange-700">Needs Attention</CardTitle>
                <CardDescription>Workspaces that could improve</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.workspacePerformance.underPerforming.slice(0, 5).map((workspace, index) => (
                    <div key={workspace.id} className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                      <div className="font-medium mb-1">{workspace.name}</div>
                      <div className="text-xs text-gray-500 mb-2">{workspace.city}</div>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="text-orange-700 font-medium">Issues:</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {workspace.issues.map((issue, i) => (
                              <Badge key={i} variant="outline" className="text-xs bg-orange-100">
                                {issue}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Revenue Sources */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue by Source</CardTitle>
                <CardDescription>Revenue breakdown by channel</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.revenue.revenueBySource.map((source, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="font-medium">{source.source}</span>
                        <span className="font-semibold">{formatCurrency(source.amount)}</span>
                      </div>
                      <Progress value={source.percentage} className="h-2" />
                      <div className="text-xs text-gray-500 text-right">
                        {source.percentage}% of total revenue
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Revenue Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Metrics</CardTitle>
                <CardDescription>Key revenue indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="text-sm text-gray-600">Monthly Recurring</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatCurrency(analytics.revenue.monthlyRecurring)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Average Booking Value</div>
                    <div className="text-2xl font-bold text-blue-600">
                      {formatCurrency(analytics.revenue.averageBookingValue)}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Total Bookings</div>
                    <div className="text-2xl font-bold text-purple-600">
                      {formatNumber(analytics.platform.totalBookings)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Strategic Recommendations</CardTitle>
              <CardDescription>Data-driven suggestions for growth</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.recommendations.map((rec, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border-2 ${getPriorityColor(rec.priority)}`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <Badge className={`${getPriorityColor(rec.priority)} text-xs`}>
                        {rec.priority.toUpperCase()} PRIORITY
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {rec.category}
                      </Badge>
                    </div>
                    
                    <h4 className="font-semibold mb-2">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    
                    <div className="text-xs">
                      <span className="font-medium text-green-700">Expected Impact: </span>
                      <span className="text-green-600">{rec.impact}</span>
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

function AnalyticsLoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-40" />
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
      </div>

      <Skeleton className="h-32 w-full" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
            <div className="space-y-4">
              <Skeleton className="h-6 w-48" />
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}