/**
 * Real-time notification engine for Workspace Atlas
 * Handles in-app notifications, push notifications, and email alerts
 */

import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'
import { cache } from '@/lib/cache'

export interface NotificationData {
  id: string
  userId: string
  type: NotificationType
  title: string
  message: string
  data?: Record<string, any>
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: NotificationCategory
  read: boolean
  actionUrl?: string
  actionText?: string
  imageUrl?: string
  createdAt: Date
  readAt?: Date
  expiresAt?: Date
}

export type NotificationType = 
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'booking_reminder'
  | 'workspace_review'
  | 'workspace_featured'
  | 'recommendation_new'
  | 'passport_milestone'
  | 'score_updated'
  | 'system_maintenance'
  | 'promotional'
  | 'security_alert'
  | 'admin_message'

export type NotificationCategory = 
  | 'booking'
  | 'workspace'
  | 'recommendation'
  | 'passport'
  | 'system'
  | 'security'
  | 'promotional'

export interface NotificationTemplate {
  type: NotificationType
  title: (data: any) => string
  message: (data: any) => string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  category: NotificationCategory
  actionUrl?: (data: any) => string
  actionText?: string
  imageUrl?: (data: any) => string
  expiresInHours?: number
}

export interface NotificationPreferences {
  userId: string
  inApp: boolean
  email: boolean
  push: boolean
  categories: Partial<Record<NotificationCategory, {
    inApp: boolean
    email: boolean
    push: boolean
  }>>
  quietHours?: {
    enabled: boolean
    startTime: string // HH:mm format
    endTime: string
    timezone: string
  }
  frequency: 'immediate' | 'hourly' | 'daily' | 'weekly'
}

export interface NotificationFilter {
  userId?: string
  type?: NotificationType
  category?: NotificationCategory
  priority?: 'low' | 'medium' | 'high' | 'urgent'
  read?: boolean
  limit?: number
  offset?: number
  since?: Date
}

export interface NotificationStats {
  total: number
  unread: number
  byCategory: Record<NotificationCategory, number>
  byPriority: Record<string, number>
  recentActivity: Array<{
    date: string
    count: number
  }>
}

export class NotificationEngine {
  private templates: Map<NotificationType, NotificationTemplate> = new Map()
  private subscribers: Map<string, Set<(notification: NotificationData) => void>> = new Map()

  constructor() {
    this.setupTemplates()
  }

  /**
   * Create and send a notification
   */
  async createNotification({
    userId,
    type,
    data = {},
    customTitle,
    customMessage,
    priority,
    actionUrl,
    imageUrl,
    expiresInHours
  }: {
    userId: string
    type: NotificationType
    data?: Record<string, any>
    customTitle?: string
    customMessage?: string
    priority?: 'low' | 'medium' | 'high' | 'urgent'
    actionUrl?: string
    imageUrl?: string
    expiresInHours?: number
  }): Promise<NotificationData> {
    const template = this.templates.get(type)
    if (!template) {
      throw new Error(`Unknown notification type: ${type}`)
    }

    // Check user preferences
    const preferences = await this.getUserPreferences(userId)
    if (!this.shouldSendNotification(template, preferences)) {
      logger.info('Notification blocked by user preferences', { userId, type })
      throw new Error('Notification blocked by user preferences')
    }

    // Check quiet hours
    if (this.isInQuietHours(preferences)) {
      logger.info('Notification delayed due to quiet hours', { userId, type })
      // Could implement delayed delivery here
    }

    const now = new Date()
    const expiresAt = expiresInHours 
      ? new Date(now.getTime() + expiresInHours * 60 * 60 * 1000)
      : (template.expiresInHours 
          ? new Date(now.getTime() + template.expiresInHours * 60 * 60 * 1000)
          : undefined)

    const notification: NotificationData = {
      id: this.generateId(),
      userId,
      type,
      title: customTitle || template.title(data),
      message: customMessage || template.message(data),
      data,
      priority: priority || template.priority,
      category: template.category,
      read: false,
      actionUrl: actionUrl || template.actionUrl?.(data),
      actionText: template.actionText,
      imageUrl: imageUrl || template.imageUrl?.(data),
      createdAt: now,
      expiresAt
    }

    // Store in database
    await this.storeNotification(notification)

    // Send real-time notification to subscribers
    this.broadcastToUser(userId, notification)

    // Send push/email based on preferences
    await this.sendExternalNotifications(notification, preferences)

    logger.info('Notification created', { 
      id: notification.id, 
      userId, 
      type, 
      priority: notification.priority 
    })

    return notification
  }

  /**
   * Get notifications for a user
   */
  async getNotifications(filter: NotificationFilter): Promise<NotificationData[]> {
    const cacheKey = `notifications:${JSON.stringify(filter)}`
    
    // Try cache first (5 minute TTL)
    const cached = cache.get(cacheKey) as NotificationData[] | null
    if (cached) {
      return cached
    }

    // Mock implementation - would query database in production
    const notifications = await this.fetchNotificationsFromDb(filter)
    
    // Cache results
    cache.set(cacheKey, notifications, 5 * 60 * 1000)
    
    return notifications
  }

  /**
   * Mark notifications as read
   */
  async markAsRead(notificationIds: string[], userId: string): Promise<void> {
    logger.info('Marking notifications as read', { notificationIds, userId })
    
    // Would update database in production
    await this.updateNotificationReadStatus(notificationIds, userId, true)
    
    // Clear relevant caches
    this.clearUserNotificationCache(userId)
    
    // Broadcast update to subscribers
    this.broadcastReadUpdate(userId, notificationIds)
  }

  /**
   * Get notification statistics for a user
   */
  async getNotificationStats(userId: string): Promise<NotificationStats> {
    const cacheKey = `notification-stats:${userId}`
    
    const cached = cache.get(cacheKey) as NotificationStats | null
    if (cached) {
      return cached
    }

    // Mock implementation - would aggregate from database
    const stats: NotificationStats = {
      total: 47,
      unread: 12,
      byCategory: {
        booking: 15,
        workspace: 8,
        recommendation: 12,
        passport: 5,
        system: 4,
        security: 1,
        promotional: 2
      },
      byPriority: {
        low: 25,
        medium: 18,
        high: 3,
        urgent: 1
      },
      recentActivity: this.generateRecentActivity()
    }

    cache.set(cacheKey, stats, 10 * 60 * 1000) // 10 minute cache
    return stats
  }

  /**
   * Subscribe to real-time notifications for a user
   */
  subscribe(userId: string, callback: (notification: NotificationData) => void): () => void {
    if (!this.subscribers.has(userId)) {
      this.subscribers.set(userId, new Set())
    }
    
    this.subscribers.get(userId)!.add(callback)
    
    logger.info('User subscribed to notifications', { userId })
    
    // Return unsubscribe function
    return () => {
      const userSubs = this.subscribers.get(userId)
      if (userSubs) {
        userSubs.delete(callback)
        if (userSubs.size === 0) {
          this.subscribers.delete(userId)
        }
      }
      logger.info('User unsubscribed from notifications', { userId })
    }
  }

  /**
   * Update user notification preferences
   */
  async updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void> {
    logger.info('Updating notification preferences', { userId, preferences })
    
    // Would update database in production
    await this.storeUserPreferences(userId, preferences)
    
    // Clear preferences cache
    cache.delete(`notification-prefs:${userId}`)
  }

  /**
   * Send bulk notifications (admin only)
   */
  async sendBulkNotification({
    userIds,
    type,
    data,
    priority = 'medium'
  }: {
    userIds: string[]
    type: NotificationType
    data: Record<string, any>
    priority?: 'low' | 'medium' | 'high' | 'urgent'
  }): Promise<{ sent: number; failed: number }> {
    let sent = 0
    let failed = 0

    for (const userId of userIds) {
      try {
        await this.createNotification({ userId, type, data, priority })
        sent++
      } catch (error) {
        failed++
        logger.error('Failed to send bulk notification', error instanceof Error ? error : new Error(String(error)), { userId, type })
      }
    }

    logger.info('Bulk notification complete', { sent, failed, total: userIds.length })
    return { sent, failed }
  }

  /**
   * Private helper methods
   */
  private setupTemplates(): void {
    this.templates.set('booking_confirmed', {
      type: 'booking_confirmed',
      title: (data) => 'Booking Confirmed! 🎉',
      message: (data) => `Your booking at ${data.workspaceName} for ${data.date} has been confirmed.`,
      priority: 'high',
      category: 'booking',
      actionUrl: (data) => `/bookings/${data.bookingId}`,
      actionText: 'View Booking',
      imageUrl: (data) => data.workspaceImage,
      expiresInHours: 72
    })

    this.templates.set('booking_cancelled', {
      type: 'booking_cancelled',
      title: () => 'Booking Cancelled',
      message: (data) => `Your booking at ${data.workspaceName} has been cancelled. ${data.reason || ''}`,
      priority: 'high',
      category: 'booking',
      actionUrl: () => '/bookings',
      actionText: 'View Bookings'
    })

    this.templates.set('booking_reminder', {
      type: 'booking_reminder',
      title: () => 'Upcoming Booking Reminder 📅',
      message: (data) => `Your booking at ${data.workspaceName} is tomorrow at ${data.time}.`,
      priority: 'medium',
      category: 'booking',
      actionUrl: (data) => `/bookings/${data.bookingId}`,
      actionText: 'View Details',
      expiresInHours: 24
    })

    this.templates.set('workspace_review', {
      type: 'workspace_review',
      title: () => 'New Review Received ⭐',
      message: (data) => `${data.reviewerName} left a ${data.rating}-star review for your workspace.`,
      priority: 'medium',
      category: 'workspace',
      actionUrl: (data) => `/workspaces/${data.workspaceId}/reviews`,
      actionText: 'View Review'
    })

    this.templates.set('workspace_featured', {
      type: 'workspace_featured',
      title: () => 'Your Workspace is Featured! 🌟',
      message: (data) => `${data.workspaceName} is now featured on our homepage. Expect increased visibility!`,
      priority: 'high',
      category: 'workspace',
      actionUrl: (data) => `/workspaces/${data.workspaceId}`,
      actionText: 'View Workspace',
      expiresInHours: 168 // 1 week
    })

    this.templates.set('recommendation_new', {
      type: 'recommendation_new',
      title: () => 'New Workspace Recommendations ✨',
      message: (data) => `We found ${data.count} new workspaces perfect for you in ${data.location}.`,
      priority: 'low',
      category: 'recommendation',
      actionUrl: () => '/recommendations',
      actionText: 'View Recommendations',
      expiresInHours: 48
    })

    this.templates.set('passport_milestone', {
      type: 'passport_milestone',
      title: () => 'Haven Passport Milestone! 🎯',
      message: (data) => `Congratulations! You've reached ${data.milestone} and earned ${data.points} points.`,
      priority: 'medium',
      category: 'passport',
      actionUrl: () => '/haven-passport',
      actionText: 'View Progress',
      expiresInHours: 168
    })

    this.templates.set('score_updated', {
      type: 'score_updated',
      title: () => 'Digital Score Updated 📊',
      message: (data) => `Your workspace's digital score is now ${data.newScore}/100 (${data.change > 0 ? '+' : ''}${data.change} points).`,
      priority: 'medium',
      category: 'workspace',
      actionUrl: (data) => `/workspaces/${data.workspaceId}/score`,
      actionText: 'View Details'
    })

    this.templates.set('system_maintenance', {
      type: 'system_maintenance',
      title: () => 'Scheduled Maintenance Notice 🔧',
      message: (data) => `System maintenance scheduled for ${data.date} from ${data.startTime} to ${data.endTime}.`,
      priority: 'medium',
      category: 'system',
      expiresInHours: 72
    })

    this.templates.set('promotional', {
      type: 'promotional',
      title: (data) => data.title || 'Special Offer Available! 🎁',
      message: (data) => data.message || 'Check out this limited-time offer.',
      priority: 'low',
      category: 'promotional',
      actionUrl: (data) => data.actionUrl,
      actionText: 'Learn More',
      expiresInHours: 72
    })

    this.templates.set('security_alert', {
      type: 'security_alert',
      title: () => 'Security Alert 🔒',
      message: (data) => data.message || 'Important security information regarding your account.',
      priority: 'urgent',
      category: 'security',
      actionUrl: () => '/account/security',
      actionText: 'Review Security',
      expiresInHours: 24
    })
  }

  private async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    const cacheKey = `notification-prefs:${userId}`
    const cached = cache.get(cacheKey) as NotificationPreferences | null
    
    if (cached) {
      return cached
    }

    // Mock default preferences - would query database in production
    const preferences: NotificationPreferences = {
      userId,
      inApp: true,
      email: true,
      push: false,
      categories: {
        booking: { inApp: true, email: true, push: true },
        workspace: { inApp: true, email: true, push: false },
        recommendation: { inApp: true, email: false, push: false },
        passport: { inApp: true, email: false, push: false },
        system: { inApp: true, email: true, push: false },
        security: { inApp: true, email: true, push: true },
        promotional: { inApp: false, email: false, push: false }
      },
      frequency: 'immediate'
    }

    cache.set(cacheKey, preferences, 30 * 60 * 1000) // 30 minute cache
    return preferences
  }

  private shouldSendNotification(
    template: NotificationTemplate,
    preferences: NotificationPreferences
  ): boolean {
    if (!preferences.inApp) return false
    
    const categoryPrefs = preferences.categories[template.category]
    if (categoryPrefs && !categoryPrefs.inApp) return false
    
    return true
  }

  private isInQuietHours(preferences: NotificationPreferences): boolean {
    if (!preferences.quietHours?.enabled) return false
    
    // Simple quiet hours check - would implement proper timezone handling
    const now = new Date()
    const currentHour = now.getHours()
    const startHour = parseInt(preferences.quietHours.startTime.split(':')[0])
    const endHour = parseInt(preferences.quietHours.endTime.split(':')[0])
    
    if (startHour <= endHour) {
      return currentHour >= startHour && currentHour < endHour
    } else {
      return currentHour >= startHour || currentHour < endHour
    }
  }

  private broadcastToUser(userId: string, notification: NotificationData): void {
    const subscribers = this.subscribers.get(userId)
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(notification)
        } catch (error) {
          logger.error('Error broadcasting notification', error instanceof Error ? error : new Error(String(error)), { userId })
        }
      })
    }
  }

  private async sendExternalNotifications(
    notification: NotificationData,
    preferences: NotificationPreferences
  ): Promise<void> {
    const categoryPrefs = preferences.categories[notification.category]
    
    // Email notifications
    if (preferences.email && categoryPrefs?.email) {
      // Would integrate with email service
      logger.info('Email notification queued', { 
        userId: notification.userId, 
        type: notification.type 
      })
    }
    
    // Push notifications
    if (preferences.push && categoryPrefs?.push) {
      // Would integrate with push service
      logger.info('Push notification queued', { 
        userId: notification.userId, 
        type: notification.type 
      })
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private async storeNotification(notification: NotificationData): Promise<void> {
    // Mock storage - would save to database in production
    logger.info('Notification stored', { id: notification.id })
  }

  private async fetchNotificationsFromDb(filter: NotificationFilter): Promise<NotificationData[]> {
    // Mock implementation - would query database in production
    const mockNotifications: NotificationData[] = [
      {
        id: 'notif_1',
        userId: filter.userId || 'user_1',
        type: 'booking_confirmed',
        title: 'Booking Confirmed! 🎉',
        message: 'Your booking at WeWork SoHo for March 15 has been confirmed.',
        priority: 'high',
        category: 'booking',
        read: false,
        actionUrl: '/bookings/booking_1',
        actionText: 'View Booking',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        id: 'notif_2',
        userId: filter.userId || 'user_1',
        type: 'recommendation_new',
        title: 'New Workspace Recommendations ✨',
        message: 'We found 3 new workspaces perfect for you in New York.',
        priority: 'low',
        category: 'recommendation',
        read: true,
        actionUrl: '/recommendations',
        actionText: 'View Recommendations',
        createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
        readAt: new Date(Date.now() - 20 * 60 * 60 * 1000)
      }
    ]

    // Apply filters
    let filtered = mockNotifications
    
    if (filter.read !== undefined) {
      filtered = filtered.filter(n => n.read === filter.read)
    }
    
    if (filter.type) {
      filtered = filtered.filter(n => n.type === filter.type)
    }
    
    if (filter.category) {
      filtered = filtered.filter(n => n.category === filter.category)
    }
    
    if (filter.since) {
      filtered = filtered.filter(n => n.createdAt >= filter.since!)
    }

    // Apply limit and offset
    const offset = filter.offset || 0
    const limit = filter.limit || 50
    
    return filtered.slice(offset, offset + limit)
  }

  private async updateNotificationReadStatus(
    notificationIds: string[],
    userId: string,
    read: boolean
  ): Promise<void> {
    // Mock implementation - would update database in production
    logger.info('Notification read status updated', { notificationIds, userId, read })
  }

  private async storeUserPreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>
  ): Promise<void> {
    // Mock implementation - would save to database in production
    logger.info('Notification preferences updated', { userId, preferences })
  }

  private clearUserNotificationCache(userId: string): void {
    // Would clear relevant cache keys in production
    cache.delete(`notification-stats:${userId}`)
  }

  private broadcastReadUpdate(userId: string, notificationIds: string[]): void {
    const subscribers = this.subscribers.get(userId)
    if (subscribers) {
      const update = { type: 'read_update', notificationIds }
      subscribers.forEach(callback => {
        try {
          // Would send read update event
        } catch (error) {
          logger.error('Error broadcasting read update', error instanceof Error ? error : new Error(String(error)), { userId })
        }
      })
    }
  }

  private generateRecentActivity(): Array<{ date: string; count: number }> {
    const activity = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      activity.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 10) + 1
      })
    }
    return activity
  }
}

export const notificationEngine = new NotificationEngine()