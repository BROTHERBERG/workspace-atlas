'use client'

import { useSession } from 'next-auth/react'
import { WebSocketProvider as WS, useRealtimeNotifications } from '@/lib/websocket'
import { useEffect } from 'react'
import { showSuccessToast, showInfoToast, showWarningToast } from '@/hooks/use-toast'

interface AppWebSocketProviderProps {
  children: React.ReactNode
}

function NotificationHandler() {
  const { notifications, removeNotification } = useRealtimeNotifications()

  useEffect(() => {
    // Display new notifications as toasts
    notifications.forEach((notification) => {
      const { type, title, message } = notification
      
      switch (type) {
        case 'achievement':
          showSuccessToast(title, message)
          break
        case 'score':
          showInfoToast(title, message)
          break
        case 'approval':
          showSuccessToast(title, message)
          break
        default:
          showInfoToast(title, message)
      }
      
      // Auto-remove notification after showing toast
      setTimeout(() => removeNotification(notification.id), 1000)
    })
  }, [notifications, removeNotification])

  return null
}

export function AppWebSocketProvider({ children }: AppWebSocketProviderProps) {
  const { data: session } = useSession()

  return (
    <WS 
      userId={session?.user?.id} 
      userRole={session?.user?.role}
    >
      <NotificationHandler />
      {children}
    </WS>
  )
}