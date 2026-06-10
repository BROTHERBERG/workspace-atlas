/**
 * Analytics Engine for Workspace Atlas
 * Provides comprehensive platform analytics, user insights, and business intelligence
 */

import { prisma } from '@/lib/db'
import { type PrismaClient } from '@prisma/client'
import { cache } from '@/lib/cache'
import { logger } from '@/lib/logger'

export interface AnalyticsTimeRange {
  start: Date
  end: Date
  period: 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year'
}

export interface PlatformMetrics {
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

export interface GeographicData {
  country: string
  countryCode: string
  city?: string
  workspaceCount: number
  userCount: number
  avgRating: number
  totalViews: number
  coordinates?: {
    lat: number
    lng: number
  }
}

export interface UserBehaviorMetrics {
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

export interface WorkspacePerformance {
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

export interface RevenueAnalytics {
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

export interface AnalyticsDashboard {
  platform: PlatformMetrics
  geographic: GeographicData[]
  userBehavior: UserBehaviorMetrics
  workspacePerformance: WorkspacePerformance
  revenue: RevenueAnalytics
  insights: string[]
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low'
    category: string
    title: string
    description: string
    impact: string
  }>
}

export class AnalyticsEngine {
  constructor(private prismaClient: PrismaClient = prisma) {}

  /**
   * Get comprehensive analytics dashboard data
   */
  async getDashboardAnalytics(
    timeRange: AnalyticsTimeRange,
    userId?: string
  ): Promise<AnalyticsDashboard> {
    const cacheKey = `analytics:dashboard:${timeRange.start.toISOString()}:${timeRange.end.toISOString()}:${userId || 'global'}`
    
    // Try cache first (15 minute TTL)
    const cached = cache.get(cacheKey) as AnalyticsDashboard | null
    if (cached) {
      logger.info('Analytics cache hit', { cacheKey })
      return cached
    }

    logger.info('Generating analytics dashboard', { timeRange, userId })

    const [
      platform,
      geographic,
      userBehavior,
      workspacePerformance,
      revenue
    ] = await Promise.all([
      this.getPlatformMetrics(timeRange),
      this.getGeographicData(timeRange),
      this.getUserBehaviorMetrics(timeRange),
      this.getWorkspacePerformance(timeRange),
      this.getRevenueAnalytics(timeRange)
    ])

    // Generate insights and recommendations
    const insights = this.generateInsights({
      platform,
      geographic,
      userBehavior,
      workspacePerformance,
      revenue
    })

    const recommendations = this.generateRecommendations({
      platform,
      geographic,
      userBehavior,
      workspacePerformance,
      revenue
    })

    const dashboard: AnalyticsDashboard = {
      platform,
      geographic,
      userBehavior,
      workspacePerformance,
      revenue,
      insights,
      recommendations
    }

    // Cache for 15 minutes
    cache.set(cacheKey, dashboard, 15 * 60 * 1000)

    return dashboard
  }

  /**
   * Get platform-wide metrics
   */
  private async getPlatformMetrics(timeRange: AnalyticsTimeRange): Promise<PlatformMetrics> {
    const previousPeriod = this.getPreviousPeriod(timeRange)

    const [
      currentStats,
      previousStats
    ] = await Promise.all([
      this.getBasicStats(timeRange),
      this.getBasicStats(previousPeriod)
    ])

    return {
      ...currentStats,
      growth: {
        workspaces: this.calculateGrowth(currentStats.totalWorkspaces, previousStats.totalWorkspaces),
        users: this.calculateGrowth(currentStats.totalUsers, previousStats.totalUsers),
        bookings: this.calculateGrowth(currentStats.totalBookings, previousStats.totalBookings),
        revenue: 0 // Would calculate from actual booking revenue
      }
    }
  }

  /**
   * Get geographic distribution data
   */
  private async getGeographicData(timeRange: AnalyticsTimeRange): Promise<GeographicData[]> {
    const workspacesByLocation = await this.prismaClient.workspace.groupBy({
      by: ['country', 'city'],
      where: {
        isActive: true,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      _count: {
        id: true
      },
      _avg: {
        rating: true
      }
    })

    return workspacesByLocation
      .filter((location: any) => location.country)
      .map((location: any) => ({
        country: location.country!,
        countryCode: this.getCountryCode(location.country!),
        city: location.city || undefined,
        workspaceCount: location._count.id,
        userCount: 0, // Would aggregate from user table
        avgRating: location._avg.rating || 0,
        totalViews: 0, // Would track from analytics events
        coordinates: this.getCoordinates(location.country!, location.city)
      }))
      .sort((a: any, b: any) => b.workspaceCount - a.workspaceCount)
      .slice(0, 20)
  }

  /**
   * Get user behavior analytics
   */
  private async getUserBehaviorMetrics(timeRange: AnalyticsTimeRange): Promise<UserBehaviorMetrics> {
    // This would integrate with actual analytics tracking
    // For now, return mock data based on workspace amenities
    const amenities = await this.prismaClient.workspace.findMany({
      where: { isActive: true },
      select: { amenities: true }
    })

    const amenityCount: Record<string, number> = {}
    amenities.forEach((workspace: any) => {
      if (Array.isArray(workspace.amenities)) {
        workspace.amenities.forEach((amenity: any) => {
          amenityCount[amenity] = (amenityCount[amenity] || 0) + 1
        })
      }
    })

    const popularAmenities = Object.entries(amenityCount)
      .map(([amenity, count]) => ({
        amenity,
        searchCount: count * 15, // Mock search data
        workspaceCount: count
      }))
      .sort((a, b) => b.searchCount - a.searchCount)
      .slice(0, 10)

    return {
      searchQueries: [
        { query: 'coworking london', count: 1247, avgResultClicks: 3.2 },
        { query: 'meeting room nyc', count: 892, avgResultClicks: 2.8 },
        { query: 'private office', count: 673, avgResultClicks: 4.1 },
        { query: 'startup space', count: 445, avgResultClicks: 2.5 }
      ],
      popularAmenities,
      userJourney: {
        averageSessionDuration: 347, // seconds
        bounceRate: 0.34,
        pagesPerSession: 4.2,
        conversionRate: 0.12
      },
      deviceBreakdown: {
        mobile: 0.58,
        desktop: 0.35,
        tablet: 0.07
      }
    }
  }

  /**
   * Get workspace performance data
   */
  private async getWorkspacePerformance(timeRange: AnalyticsTimeRange): Promise<WorkspacePerformance> {
    const workspaces = await this.prismaClient.workspace.findMany({
      where: {
        isActive: true,
        createdAt: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      },
      select: {
        id: true,
        name: true,
        city: true,
        rating: true,
        digitalScore: true,
        reviewCount: true,
        featured: true,
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        digitalScore: 'desc'
      }
    })

    const topPerforming = workspaces
      .slice(0, 10)
      .map((ws: any) => ({
        id: ws.id,
        name: ws.name,
        city: ws.city || 'Unknown',
        views: Math.floor(Math.random() * 1000) + 100, // Mock data
        bookings: ws._count.bookings,
        rating: ws.rating || 0,
        revenue: ws._count.bookings * 45, // Mock revenue
        growth: Math.floor(Math.random() * 50) + 10 // Mock growth
      }))

    const underPerforming = workspaces
      .filter((ws: any) => (ws.digitalScore || 0) < 50 || (ws.rating || 0) < 3.0)
      .slice(0, 5)
      .map((ws: any) => ({
        id: ws.id,
        name: ws.name,
        city: ws.city || 'Unknown',
        issues: [
          ws.digitalScore && ws.digitalScore < 50 ? 'Low digital presence' : '',
          ws.rating && ws.rating < 3.0 ? 'Poor rating' : '',
          ws.reviewCount === 0 ? 'No reviews' : ''
        ].filter(Boolean),
        suggestions: [
          'Improve website SEO',
          'Encourage customer reviews',
          'Update workspace photos',
          'Add missing amenities'
        ]
      }))

    return {
      topPerforming,
      underPerforming,
      categoryBreakdown: [
        { category: 'Coworking Space', count: 142, avgRating: 4.2, totalRevenue: 23450 },
        { category: 'Private Office', count: 89, avgRating: 4.5, totalRevenue: 34200 },
        { category: 'Meeting Room', count: 67, avgRating: 4.1, totalRevenue: 12300 },
        { category: 'Event Space', count: 34, avgRating: 4.3, totalRevenue: 18900 }
      ]
    }
  }

  /**
   * Get revenue analytics
   */
  private async getRevenueAnalytics(timeRange: AnalyticsTimeRange): Promise<RevenueAnalytics> {
    // Mock revenue data - would integrate with actual payment systems
    return {
      totalRevenue: 156780,
      monthlyRecurring: 89320,
      averageBookingValue: 47.50,
      revenueBySource: [
        { source: 'Direct Bookings', amount: 89320, percentage: 57 },
        { source: 'Platform Fee', amount: 31356, percentage: 20 },
        { source: 'Premium Listings', amount: 23568, percentage: 15 },
        { source: 'Haven Passport', amount: 12536, percentage: 8 }
      ],
      growthTrend: this.generateGrowthTrend(timeRange)
    }
  }

  /**
   * Generate actionable insights
   */
  private generateInsights(data: Omit<AnalyticsDashboard, 'insights' | 'recommendations'>): string[] {
    const insights: string[] = []

    // Platform growth insights
    if (data.platform.growth.users > 10) {
      insights.push(`User growth accelerated by ${data.platform.growth.users}% this period`)
    }

    // Geographic insights
    const topCountry = data.geographic[0]
    if (topCountry) {
      insights.push(`${topCountry.country} leads with ${topCountry.workspaceCount} workspaces`)
    }

    // User behavior insights
    const topAmenity = data.userBehavior.popularAmenities[0]
    if (topAmenity) {
      insights.push(`"${topAmenity.amenity}" is the most searched amenity`)
    }

    if (data.userBehavior.deviceBreakdown.mobile > 0.5) {
      insights.push(`${Math.round(data.userBehavior.deviceBreakdown.mobile * 100)}% of users browse on mobile`)
    }

    // Revenue insights
    if (data.revenue.totalRevenue > data.revenue.monthlyRecurring) {
      insights.push('One-time bookings exceed recurring revenue - focus on retention')
    }

    return insights
  }

  /**
   * Generate strategic recommendations
   */
  private generateRecommendations(
    data: Omit<AnalyticsDashboard, 'insights' | 'recommendations'>
  ): AnalyticsDashboard['recommendations'] {
    const recommendations: AnalyticsDashboard['recommendations'] = []

    // Mobile optimization recommendation
    if (data.userBehavior.deviceBreakdown.mobile > 0.6) {
      recommendations.push({
        priority: 'high',
        category: 'User Experience',
        title: 'Optimize Mobile Experience',
        description: 'Over 60% of users browse on mobile. Focus on mobile-first design improvements.',
        impact: 'Could improve conversion rate by 15-20%'
      })
    }

    // Geographic expansion
    const lowWorkspaceCountries = data.geographic.filter(g => g.workspaceCount < 5)
    if (lowWorkspaceCountries.length > 3) {
      recommendations.push({
        priority: 'medium',
        category: 'Market Expansion',
        title: 'Target Underserved Markets',
        description: `${lowWorkspaceCountries.length} countries have fewer than 5 workspaces. Consider expansion campaigns.`,
        impact: 'Potential 25% increase in market reach'
      })
    }

    // Digital presence improvement
    if (data.workspacePerformance.underPerforming.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Quality Improvement',
        title: 'Workspace Quality Initiative',
        description: `${data.workspacePerformance.underPerforming.length} workspaces need digital presence improvements.`,
        impact: 'Could increase average ratings by 0.5 points'
      })
    }

    // Revenue optimization
    const directBookingPercentage = data.revenue.revenueBySource.find(s => s.source === 'Direct Bookings')?.percentage || 0
    if (directBookingPercentage < 50) {
      recommendations.push({
        priority: 'medium',
        category: 'Revenue Growth',
        title: 'Increase Direct Bookings',
        description: 'Direct bookings are below 50%. Improve booking flow and incentivize direct reservations.',
        impact: 'Could reduce commission costs by 20%'
      })
    }

    return recommendations.slice(0, 6) // Return top 6 recommendations
  }

  /**
   * Helper methods
   */
  private async getBasicStats(timeRange: AnalyticsTimeRange) {
    const [workspaceStats, userStats, bookingStats] = await Promise.all([
      this.prismaClient.workspace.aggregate({
        where: {
          createdAt: { gte: timeRange.start, lte: timeRange.end }
        },
        _count: { id: true },
        _avg: { rating: true }
      }),
      this.prismaClient.user.count({
        where: {
          createdAt: { gte: timeRange.start, lte: timeRange.end }
        }
      }),
      this.prismaClient.booking.aggregate({
        where: {
          createdAt: { gte: timeRange.start, lte: timeRange.end }
        },
        _count: { id: true }
      })
    ])

    return {
      totalWorkspaces: workspaceStats._count.id,
      activeWorkspaces: workspaceStats._count.id, // Simplified
      totalUsers: userStats,
      activeUsers: Math.floor(userStats * 0.6), // Mock active ratio
      totalViews: Math.floor(workspaceStats._count.id * 25), // Mock views
      totalBookings: bookingStats._count.id,
      averageRating: workspaceStats._avg.rating || 0
    }
  }

  private getPreviousPeriod(timeRange: AnalyticsTimeRange): AnalyticsTimeRange {
    const duration = timeRange.end.getTime() - timeRange.start.getTime()
    return {
      start: new Date(timeRange.start.getTime() - duration),
      end: new Date(timeRange.end.getTime() - duration),
      period: timeRange.period
    }
  }

  private calculateGrowth(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0
    return Math.round(((current - previous) / previous) * 100)
  }

  private getCountryCode(country: string): string {
    const countryCodes: Record<string, string> = {
      'United States': 'US',
      'United Kingdom': 'GB',
      'Canada': 'CA',
      'Germany': 'DE',
      'France': 'FR',
      'Australia': 'AU',
      'Netherlands': 'NL',
      'Singapore': 'SG',
      'Japan': 'JP',
      'Brazil': 'BR'
    }
    return countryCodes[country] || country.substring(0, 2).toUpperCase()
  }

  private getCoordinates(country: string, city?: string): { lat: number; lng: number } | undefined {
    // Mock coordinates - would integrate with geocoding service
    const coordinates: Record<string, { lat: number; lng: number }> = {
      'United States': { lat: 39.8283, lng: -98.5795 },
      'United Kingdom': { lat: 55.3781, lng: -3.4360 },
      'Canada': { lat: 56.1304, lng: -106.3468 },
      'Germany': { lat: 51.1657, lng: 10.4515 },
      'France': { lat: 46.2276, lng: 2.2137 }
    }
    return coordinates[country]
  }

  private generateGrowthTrend(timeRange: AnalyticsTimeRange): Array<{
    period: string
    revenue: number
    bookings: number
    growth: number
  }> {
    // Generate mock growth trend data
    const periods = []
    const start = new Date(timeRange.start)
    const end = new Date(timeRange.end)
    
    while (start <= end) {
      const baseRevenue = 12000 + Math.random() * 8000
      const growth = (Math.random() - 0.3) * 40 // -12% to +28% growth
      
      periods.push({
        period: start.toISOString().substring(0, 7), // YYYY-MM format
        revenue: Math.round(baseRevenue),
        bookings: Math.round(baseRevenue / 47.5),
        growth: Math.round(growth)
      })
      
      start.setMonth(start.getMonth() + 1)
    }
    
    return periods
  }
}

export const analyticsEngine = new AnalyticsEngine()