import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { notificationEngine, NotificationFilter } from '@/lib/notifications/notification-engine'
import { createRateLimiter } from '@/lib/security/rate-limiter'
import { auditLogger } from '@/lib/security/audit-logger'
import { logger } from '@/lib/logger'
import { z } from 'zod'

const rateLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 100
})

const NotificationFilterSchema = z.object({
  type: z.string().optional(),
  category: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  read: z.boolean().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
  since: z.string().datetime().optional()
})

const CreateNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum([
    'booking_confirmed',
    'booking_cancelled', 
    'booking_reminder',
    'workspace_review',
    'workspace_featured',
    'recommendation_new',
    'passport_milestone',
    'score_updated',
    'system_maintenance',
    'promotional',
    'security_alert',
    'admin_message'
  ] as const),
  data: z.record(z.any()).optional(),
  customTitle: z.string().optional(),
  customMessage: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  actionUrl: z.string().optional(),
  imageUrl: z.string().url().optional(),
  expiresInHours: z.number().min(1).max(8760).optional()
})

const MarkAsReadSchema = z.object({
  notificationIds: z.array(z.string()),
  read: z.boolean().optional()
})

const BulkNotificationSchema = z.object({
  userIds: z.array(z.string()),
  type: z.enum([
    'booking_confirmed',
    'booking_cancelled', 
    'booking_reminder',
    'workspace_review',
    'workspace_featured',
    'recommendation_new',
    'passport_milestone',
    'score_updated',
    'system_maintenance',
    'promotional',
    'security_alert',
    'admin_message'
  ] as const),
  data: z.record(z.any()),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional()
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = await rateLimiter.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    // Handle statistics request
    if (action === 'stats') {
      const stats = await notificationEngine.getNotificationStats(session.user.id)
      
      await auditLogger.logEvent({
        type: 'DATA_ACCESS',
        userId: session.user.id,
        resource: 'notification_stats',
        action: 'read'
      })

      return NextResponse.json(stats)
    }

    // Handle notifications list request
    const filterParams = {
      userId: session.user.id,
      type: url.searchParams.get('type') || undefined,
      category: url.searchParams.get('category') || undefined,
      priority: url.searchParams.get('priority') as any || undefined,
      read: url.searchParams.get('read') ? url.searchParams.get('read') === 'true' : undefined,
      limit: url.searchParams.get('limit') ? parseInt(url.searchParams.get('limit')!) : undefined,
      offset: url.searchParams.get('offset') ? parseInt(url.searchParams.get('offset')!) : undefined,
      since: url.searchParams.get('since') ? new Date(url.searchParams.get('since')!) : undefined
    }

    const validatedFilter = NotificationFilterSchema.parse(filterParams)
    const notifications = await notificationEngine.getNotifications({
      ...validatedFilter,
      userId: session.user.id
    } as NotificationFilter)

    await auditLogger.logEvent({
      type: 'DATA_ACCESS',
      userId: session.user.id,
      resource: 'notifications',
      action: 'list'
    })

    return NextResponse.json({
      notifications,
      count: notifications.length
    })

  } catch (error) {
    logger.error('Notifications GET error', error instanceof Error ? error : new Error(String(error)))
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = await rateLimiter.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const body = await request.json()
    const action = body.action

    // Handle mark as read
    if (action === 'mark_read') {
      const { notificationIds, read: _read = true } = MarkAsReadSchema.parse(body)
      
      await notificationEngine.markAsRead(notificationIds, session.user.id)
      
      await auditLogger.logEvent({
        type: 'DATA_ACCESS',
        userId: session.user.id,
        resource: 'notifications',
        action: 'mark_read'
      })

      return NextResponse.json({ success: true })
    }

    // Handle bulk notification (admin only)
    if (action === 'bulk_send') {
      if (session.user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }

      const bulkData = BulkNotificationSchema.parse(body)
      const result = await notificationEngine.sendBulkNotification(bulkData)
      
      await auditLogger.logEvent({
        type: 'ADMIN_ACTION',
        userId: session.user.id,
        resource: 'bulk_notifications',
        action: 'send'
      })

      return NextResponse.json(result)
    }

    // Handle create notification
    const notificationData = CreateNotificationSchema.parse(body)
    
    // Only allow self-creation or admin creation
    if (notificationData.userId !== session.user.id && session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Can only create notifications for yourself' }, { status: 403 })
    }

    const notification = await notificationEngine.createNotification(notificationData)
    
    await auditLogger.logEvent({
      type: 'ADMIN_ACTION',
      userId: session.user.id,
      resource: 'notification',
      action: 'create'
    })

    return NextResponse.json(notification, { status: 201 })

  } catch (error) {
    logger.error('Notifications POST error', error instanceof Error ? error : new Error(String(error)))
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('blocked by user preferences')) {
      return NextResponse.json(
        { error: 'Notification blocked by user preferences' },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const rateLimitResult = await rateLimiter.check(request)
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429, headers: { 'Retry-After': '60' } }
      )
    }

    const body = await request.json()
    
    // Handle preferences update
    if (body.action === 'update_preferences') {
      await notificationEngine.updatePreferences(session.user.id, body.preferences)
      
      await auditLogger.logEvent({
        type: 'DATA_ACCESS',
        userId: session.user.id,
        resource: 'notification_preferences',
        action: 'update'
      })

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    logger.error('Notifications PUT error', error instanceof Error ? error : new Error(String(error)))
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}