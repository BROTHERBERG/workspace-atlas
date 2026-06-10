'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { 
  Bell, 
  X, 
  Check,
  CheckCheck,
  Filter,
  Calendar,
  ExternalLink,
  Settings,
  Trash2,
  RefreshCw,
  AlertCircle,
  Info,
  Star
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { logger } from '@/lib/logger'
import { 
  NotificationData, 
  NotificationType, 
  NotificationCategory, 
  type NotificationStats as NotificationStatsType
} from '@/lib/notifications/notification-engine'

interface NotificationCenterProps {
  variant?: 'inline' | 'popover'
  className?: string
}

interface NotificationItemProps {
  notification: NotificationData
  onMarkRead: (id: string) => void
  onDelete?: (id: string) => void
  compact?: boolean
}

const CATEGORY_ICONS = {
  booking: Calendar,
  workspace: Star,
  recommendation: Info,
  passport: Star,
  system: Settings,
  security: AlertCircle,
  promotional: Info
}

const PRIORITY_COLORS = {
  urgent: 'border-red-500 bg-red-50',
  high: 'border-orange-500 bg-orange-50',
  medium: 'border-yellow-500 bg-yellow-50',
  low: 'border-blue-500 bg-blue-50'
}

function NotificationItem({ notification, onMarkRead, onDelete, compact = false }: NotificationItemProps) {
  const { toast } = useToast()
  const IconComponent = CATEGORY_ICONS[notification.category] || Info

  const handleMarkRead = async () => {
    try {
      onMarkRead(notification.id)
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive'
      })
    }
  }

  const handleDelete = async () => {
    if (onDelete) {
      try {
        onDelete(notification.id)
      } catch (error) {
        toast({
          title: 'Error', 
          description: 'Failed to delete notification',
          variant: 'destructive'
        })
      }
    }
  }

  const formatTimeAgo = (date: Date): string => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <Card className={`
      ${notification.read ? 'opacity-60' : ''}
      ${PRIORITY_COLORS[notification.priority]}
      transition-all hover:shadow-sm
      ${compact ? 'p-2' : ''}
    `}>
      <CardContent className={compact ? 'p-3' : 'p-4'}>
        <div className="flex items-start justify-between space-x-3">
          <div className="flex items-start space-x-3 flex-1 min-w-0">
            <div className={`flex-shrink-0 ${compact ? 'mt-0.5' : 'mt-1'}`}>
              <IconComponent className={`${compact ? 'w-4 h-4' : 'w-5 h-5'} text-gray-600`} />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className={`${compact ? 'text-sm' : 'text-base'} font-medium text-gray-900 truncate`}>
                  {notification.title}
                </h4>
                {!notification.read && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                )}
              </div>
              
              <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 mb-2`}>
                {notification.message}
              </p>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {notification.category}
                  </Badge>
                  <span className={`${compact ? 'text-xs' : 'text-xs'} text-gray-500`}>
                    {formatTimeAgo(notification.createdAt)}
                  </span>
                </div>
                
                {notification.actionUrl && (
                  <a
                    href={notification.actionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-xs"
                  >
                    {notification.actionText || 'View'}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-1">
            {!notification.read && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleMarkRead}
                className="h-8 w-8 p-0"
                title="Mark as read"
              >
                <Check className="w-4 h-4" />
              </Button>
            )}
            
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDelete}
                className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                title="Delete"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function NotificationStats({ stats }: { stats: NotificationStatsType }) {
  return (
    <div className="grid grid-cols-2 gap-4 mb-4">
      <Card>
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
          <div className="text-xs text-gray-600">Total</div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent className="p-3">
          <div className="text-2xl font-bold text-orange-600">{stats.unread}</div>
          <div className="text-xs text-gray-600">Unread</div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function NotificationCenter({ variant = 'popover', className = '' }: NotificationCenterProps) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [stats, setStats] = useState<NotificationStatsType | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<{
    type?: NotificationType
    category?: NotificationCategory
    read?: boolean
  }>({})
  const [refreshing, setRefreshing] = useState(false)

  const fetchNotifications = useCallback(async (showLoader = true) => {
    if (!session?.user) return

    try {
      if (showLoader) setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (filter.type) params.append('type', filter.type)
      if (filter.category) params.append('category', filter.category)
      if (filter.read !== undefined) params.append('read', filter.read.toString())
      params.append('limit', '20')

      const response = await fetch(`/api/notifications?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to load notifications')
      }

      const data = await response.json()
      setNotifications(data.notifications)

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load notifications'
      setError(errorMessage)
      logger.error('Notification fetch failed', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [session?.user, filter])

  const fetchStats = useCallback(async () => {
    if (!session?.user) return

    try {
      const response = await fetch('/api/notifications?action=stats')
      if (response.ok) {
        const statsData = await response.json()
        setStats(statsData)
      }
    } catch (error) {
      logger.error('Stats fetch failed', error instanceof Error ? error : new Error(String(error)))
    }
  }, [session?.user])

  const handleMarkRead = async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: [notificationId]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notification as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId 
            ? { ...notif, read: true, readAt: new Date() }
            : notif
        )
      )

      // Update stats
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: Math.max(0, prev.unread - 1) } : null)
      }

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark as read',
        variant: 'destructive'
      })
    }
  }

  const handleMarkAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
    if (unreadIds.length === 0) return

    try {
      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds: unreadIds
        })
      })

      if (!response.ok) {
        throw new Error('Failed to mark notifications as read')
      }

      // Update local state
      setNotifications(prev => 
        prev.map(notif => ({ ...notif, read: true, readAt: new Date() }))
      )

      // Update stats
      if (stats) {
        setStats(prev => prev ? { ...prev, unread: 0 } : null)
      }

      toast({
        title: 'Success',
        description: `Marked ${unreadIds.length} notifications as read`
      })

    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to mark all as read',
        variant: 'destructive'
      })
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await Promise.all([fetchNotifications(false), fetchStats()])
    setRefreshing(false)
  }

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
      fetchStats()
    }
  }, [session?.user, filter, fetchNotifications, fetchStats])

  const unreadCount = stats?.unread || 0

  if (variant === 'popover') {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold">Notifications</h3>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                </Button>
                {unreadCount > 0 && (
                  <Button size="sm" variant="outline" onClick={handleMarkAllRead}>
                    <CheckCheck className="h-4 w-4 mr-1" />
                    Mark All Read
                  </Button>
                )}
              </div>
            </div>

            {stats && <NotificationStats stats={stats} />}

            <ScrollArea className="h-96">
              {loading ? (
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">{error}</p>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">No notifications</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onMarkRead={handleMarkRead}
                      compact
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  // Inline variant
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Notifications</h2>
          <p className="text-gray-600">Stay updated with your workspace activity</p>
        </div>

        <div className="flex items-center gap-3">
          <Select value={filter.category || 'all'} onValueChange={(value) => 
            setFilter(prev => ({ ...prev, category: value === 'all' ? undefined : value as NotificationCategory }))
          }>
            <SelectTrigger className="w-40">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="booking">Bookings</SelectItem>
              <SelectItem value="workspace">Workspaces</SelectItem>
              <SelectItem value="recommendation">Recommendations</SelectItem>
              <SelectItem value="passport">Passport</SelectItem>
              <SelectItem value="system">System</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          {unreadCount > 0 && (
            <Button onClick={handleMarkAllRead}>
              <CheckCheck className="w-4 w-4 mr-2" />
              Mark All Read ({unreadCount})
            </Button>
          )}
        </div>
      </div>

      {stats && <NotificationStats stats={stats} />}

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {loading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : error ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Error Loading Notifications</h3>
                <p className="text-gray-600 mb-4">{error}</p>
                <Button onClick={() => fetchNotifications()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : notifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Notifications</h3>
                <p className="text-gray-600">You're all caught up! New notifications will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {notifications.map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="unread" className="space-y-4">
          <div className="space-y-4">
            {notifications
              .filter(n => !n.read)
              .map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))
            }
            
            {notifications.filter(n => !n.read).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <CheckCheck className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
                  <p className="text-gray-600">No unread notifications.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="read" className="space-y-4">
          <div className="space-y-4">
            {notifications
              .filter(n => n.read)
              .map(notification => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                />
              ))
            }
            
            {notifications.filter(n => n.read).length === 0 && (
              <Card>
                <CardContent className="py-12 text-center">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Read Notifications</h3>
                  <p className="text-gray-600">Read notifications will appear here.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}