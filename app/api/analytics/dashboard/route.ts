import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { analyticsEngine, AnalyticsTimeRange } from '@/lib/analytics/analytics-engine'
import { createRateLimiter } from '@/lib/security/rate-limiter'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'

const analyticsRateLimit = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    return `analytics:${ip}`
  }
})

export async function GET(request: NextRequest) {
  try {
    const rateLimitResult = await analyticsRateLimit.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user has admin access
    if (session.user.role !== 'ADMIN') {
      await auditLogger.logEvent({
        type: 'ACCESS_DENIED',
        severity: 'MEDIUM',
        userId: session.user.id,
        resource: 'analytics',
        action: 'view',
        metadata: { reason: 'insufficient_privileges', role: session.user.role },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
      })
      
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    
    // Parse time range parameters
    const startParam = searchParams.get('start')
    const endParam = searchParams.get('end')
    const period = (searchParams.get('period') || 'month') as AnalyticsTimeRange['period']

    let timeRange: AnalyticsTimeRange

    if (startParam && endParam) {
      // Custom date range
      timeRange = {
        start: new Date(startParam),
        end: new Date(endParam),
        period
      }
    } else {
      // Default time ranges based on period
      const end = new Date()
      let start: Date

      switch (period) {
        case 'hour':
          start = new Date(end.getTime() - 60 * 60 * 1000)
          break
        case 'day':
          start = new Date(end.getTime() - 24 * 60 * 60 * 1000)
          break
        case 'week':
          start = new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        case 'year':
          start = new Date(end.getTime() - 365 * 24 * 60 * 60 * 1000)
          break
        default: // month
          start = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)
      }

      timeRange = { start, end, period }
    }

    // Validate time range
    if (timeRange.start >= timeRange.end) {
      return NextResponse.json(
        { error: 'Invalid time range: start must be before end' },
        { status: 400 }
      )
    }

    // Limit time range to prevent excessive queries
    const maxDays = 365
    const daysDiff = (timeRange.end.getTime() - timeRange.start.getTime()) / (1000 * 60 * 60 * 24)
    if (daysDiff > maxDays) {
      return NextResponse.json(
        { error: `Time range too large. Maximum ${maxDays} days allowed.` },
        { status: 400 }
      )
    }

    logger.info('Analytics dashboard request', {
      userId: session.user.id,
      timeRange,
      period
    })

    // Get analytics data
    const analytics = await analyticsEngine.getDashboardAnalytics(timeRange, session.user.id)

    // Log successful access
    await auditLogger.logEvent({
      type: 'DATA_ACCESS',
      severity: 'LOW',
      userId: session.user.id,
      resource: 'analytics-dashboard',
      action: 'view',
      metadata: {
        period,
        startDate: timeRange.start.toISOString(),
        endDate: timeRange.end.toISOString(),
        dataPoints: {
          workspaces: analytics.platform.totalWorkspaces,
          users: analytics.platform.totalUsers,
          revenue: analytics.revenue.totalRevenue
        }
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    })

    return NextResponse.json({
      ...analytics,
      metadata: {
        timeRange,
        generatedAt: new Date().toISOString(),
        userId: session.user.id
      }
    }, {
      headers: {
        'Cache-Control': 'private, max-age=900', // 15 minute cache
        'Vary': 'Accept, Authorization'
      }
    })

  } catch (error) {
    logger.error('Analytics dashboard API error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to generate analytics dashboard' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await analyticsRateLimit.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
    }

    const session = await getServerSession(authOptions)
    if (!session?.user?.id || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { action, parameters } = body

    switch (action) {
      case 'export':
        // Export analytics data
        const { format = 'json', timeRange } = parameters
        
        const analytics = await analyticsEngine.getDashboardAnalytics(timeRange, session.user.id)
        
        if (format === 'csv') {
          // Convert to CSV format for download
          const csv = generateCSVExport(analytics)
          return new NextResponse(csv, {
            headers: {
              'Content-Type': 'text/csv',
              'Content-Disposition': `attachment; filename="analytics-${new Date().toISOString().split('T')[0]}.csv"`
            }
          })
        }

        return NextResponse.json({
          success: true,
          data: analytics,
          exportedAt: new Date().toISOString()
        })

      case 'refresh':
        // Force refresh analytics cache
        const _cacheKey = `analytics:dashboard:${parameters.timeRange.start}:${parameters.timeRange.end}:${session.user.id}`
        // Would clear cache here if we had cache.delete method
        
        const freshAnalytics = await analyticsEngine.getDashboardAnalytics(parameters.timeRange, session.user.id)
        
        return NextResponse.json({
          success: true,
          data: freshAnalytics,
          refreshedAt: new Date().toISOString()
        })

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

  } catch (error) {
    logger.error('Analytics dashboard POST error', error instanceof Error ? error : new Error(String(error)))
    
    return NextResponse.json(
      { error: 'Failed to process analytics request' },
      { status: 500 }
    )
  }
}

function generateCSVExport(analytics: any): string {
  const headers = [
    'Metric',
    'Value',
    'Growth',
    'Period'
  ]

  const rows = [
    ['Total Workspaces', analytics.platform.totalWorkspaces, `${analytics.platform.growth.workspaces}%`, 'Current'],
    ['Total Users', analytics.platform.totalUsers, `${analytics.platform.growth.users}%`, 'Current'],
    ['Total Revenue', analytics.revenue.totalRevenue, `${analytics.platform.growth.revenue}%`, 'Current'],
    ['Average Rating', analytics.platform.averageRating, '', 'Current'],
    ['Conversion Rate', analytics.userBehavior.userJourney.conversionRate, '', 'Current'],
    ['Mobile Usage', `${Math.round(analytics.userBehavior.deviceBreakdown.mobile * 100)}%`, '', 'Current']
  ]

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')

  return csvContent
}