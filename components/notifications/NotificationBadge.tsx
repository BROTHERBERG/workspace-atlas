'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Bell } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { logger } from '@/lib/logger'
import { NotificationStats } from '@/lib/notifications/notification-engine'

interface NotificationBadgeProps {
  onClick?: () => void
  className?: string
  showZero?: boolean
  maxCount?: number
}

export default function NotificationBadge({ 
  onClick, 
  className = '',
  showZero = false,
  maxCount = 99
}: NotificationBadgeProps) {
  const { data: session } = useSession()
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchUnreadCount = async () => {
    if (!session?.user) return

    try {
      setLoading(true)
      
      const response = await fetch('/api/notifications?action=stats')
      
      if (response.ok) {
        const stats: NotificationStats = await response.json()
        setUnreadCount(stats.unread)
      } else {
        logger.error('Failed to fetch notification stats', new Error(`HTTP ${response.status}`))
      }
    } catch (error) {
      logger.error('Notification stats fetch failed', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session?.user) {
      fetchUnreadCount()
      
      // Poll for updates every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000)
      return () => clearInterval(interval)
    }
  }, [session?.user])

  const displayCount = unreadCount > maxCount ? `${maxCount}+` : unreadCount.toString()
  const shouldShowBadge = unreadCount > 0 || showZero

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      onClick={onClick}
      className={`relative ${className}`}
      disabled={loading}
    >
      <Bell className="h-4 w-4" />
      
      {shouldShowBadge && (
        <Badge 
          className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs bg-red-500 text-white border-none"
          variant="secondary"
        >
          {displayCount}
        </Badge>
      )}
      
      <span className="sr-only">
        {unreadCount === 0 
          ? 'No unread notifications'
          : `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
        }
      </span>
    </Button>
  )
}