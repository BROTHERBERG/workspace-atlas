import { createContext, useContext, useEffect, useRef, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { logger } from '@/lib/logger'
import type {
  AdminMetricsUpdate,
  AdminNewSubmission,
  UserAchievementUnlocked,
  UserScoreCompleted,
  UserWorkspaceApproved,
  ActivityUpdate,
  NotificationData
} from '@/types/websocket'

interface WebSocketContextType {
  socket: Socket | null
  isConnected: boolean
  emit: (event: string, data?: unknown) => void
  subscribe: <T = unknown>(event: string, handler: (data: T) => void) => () => void
}

const WebSocketContext = createContext<WebSocketContextType | null>(null)

export function useWebSocket() {
  const context = useContext(WebSocketContext)
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider')
  }
  return context
}

export interface WebSocketProviderProps {
  children: React.ReactNode
  userId?: string
  userRole?: string
}

export function WebSocketProvider({ children, userId, userRole }: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const maxReconnectAttempts = 5
  const reconnectAttempts = useRef(0)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const initSocket = () => {
      const newSocket = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3007', {
        auth: {
          userId,
          userRole
        },
        transports: ['websocket'],
        timeout: 10000,
        retries: 3
      })

      // Connection events
      newSocket.on('connect', () => {
        logger.info('WebSocket connected', { socketId: newSocket.id, userId, userRole })
        setIsConnected(true)
        reconnectAttempts.current = 0
        
        // Join user-specific room
        if (userId) {
          newSocket.emit('join', { userId, userRole })
        }
      })

      newSocket.on('disconnect', (reason) => {
        logger.warn('WebSocket disconnected', { reason, userId, userRole })
        setIsConnected(false)
        
        // Auto-reconnect logic
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, try to reconnect
          attemptReconnect()
        }
      })

      newSocket.on('connect_error', (error) => {
        logger.error('WebSocket connection error', error instanceof Error ? error : new Error(String(error)), { userId, userRole })
        setIsConnected(false)
        attemptReconnect()
      })

      // Admin-specific events
      if (userRole === 'ADMIN') {
        newSocket.on('admin:metrics_update', (data) => {
          logger.info('Admin metrics updated', { userId, totalWorkspaces: data.totalWorkspaces, totalUsers: data.totalUsers })
        })

        newSocket.on('admin:new_submission', (data) => {
          logger.info('New submission received', { userId, submissionType: data.type, submissionId: data.submissionId })
        })
      }

      // User events
      newSocket.on('user:achievement_unlocked', (data) => {
        logger.info('Achievement unlocked', { userId, achievementId: data.achievementId, achievementName: data.achievementName })
      })

      newSocket.on('user:score_completed', (data) => {
        logger.info('Score completed', { userId, workspaceId: data.workspaceId, score: data.score })
      })

      newSocket.on('user:workspace_approved', (data) => {
        logger.info('Workspace approved', { userId, workspaceId: data.workspaceId, workspaceName: data.workspaceName })
      })

      setSocket(newSocket)

      return newSocket
    }

    const attemptReconnect = () => {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        logger.error('Max WebSocket reconnection attempts reached', undefined, { userId, userRole, maxAttempts: maxReconnectAttempts })
        return
      }

      const delay = Math.pow(2, reconnectAttempts.current) * 1000 // Exponential backoff
      reconnectTimeoutRef.current = setTimeout(() => {
        logger.info('Attempting WebSocket reconnection', { userId, userRole, attempt: reconnectAttempts.current + 1, maxAttempts: maxReconnectAttempts })
        reconnectAttempts.current++
        initSocket()
      }, delay)
    }

    const socketInstance = initSocket()

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
      }
      socketInstance.disconnect()
    }
  }, [userId, userRole])

  const emit = (event: string, data?: unknown) => {
    if (socket && isConnected) {
      socket.emit(event, data)
    } else {
      logger.warn('WebSocket not connected, cannot emit event', { userId, userRole, event, isConnected })
    }
  }

  const subscribe = <T = unknown>(event: string, handler: (data: T) => void) => {
    if (socket) {
      socket.on(event, handler)
      return () => socket.off(event, handler)
    }
    return () => {}
  }

  const contextValue: WebSocketContextType = {
    socket,
    isConnected,
    emit,
    subscribe
  }

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  )
}

// Custom hooks for specific real-time features

export function useRealtimeMetrics() {
  const { subscribe, isConnected } = useWebSocket()
  const [metrics, setMetrics] = useState<AdminMetricsUpdate | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  useEffect(() => {
    const unsubscribe = subscribe<AdminMetricsUpdate>('admin:metrics_update', (data) => {
      setMetrics(data)
      setLastUpdate(new Date())
    })

    return unsubscribe
  }, [subscribe])

  return {
    metrics,
    lastUpdate,
    isConnected
  }
}

export function useRealtimeNotifications() {
  const { subscribe, isConnected } = useWebSocket()
  const [notifications, setNotifications] = useState<NotificationData[]>([])

  useEffect(() => {
    const unsubscribes = [
      subscribe<UserAchievementUnlocked>('user:achievement_unlocked', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'achievement',
          title: 'Achievement Unlocked! 🏆',
          message: `You earned: ${data.achievementName}`,
          timestamp: new Date(),
          data
        }])
      }),

      subscribe<UserScoreCompleted>('user:score_completed', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'score',
          title: 'Digital Score Complete! 🎯',
          message: `${data.workspaceName} scored ${data.score}/100`,
          timestamp: new Date(),
          data
        }])
      }),

      subscribe<UserWorkspaceApproved>('user:workspace_approved', (data) => {
        setNotifications(prev => [...prev, {
          id: Date.now(),
          type: 'approval',
          title: 'Workspace Approved! ✅',
          message: `${data.workspaceName} is now live`,
          timestamp: new Date(),
          data
        }])
      })
    ]

    return () => {
      unsubscribes.forEach(fn => fn())
    }
  }, [subscribe])

  const removeNotification = (id: number) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
  }

  const markAllAsRead = () => {
    setNotifications([])
  }

  return {
    notifications,
    removeNotification,
    markAllAsRead,
    isConnected
  }
}

export function useRealtimeActivity() {
  const { subscribe, isConnected } = useWebSocket()
  const [activities, setActivities] = useState<ActivityUpdate[]>([])

  useEffect(() => {
    const unsubscribe = subscribe<ActivityUpdate>('activity:new', (data) => {
      setActivities(prev => [data, ...prev.slice(0, 49)]) // Keep last 50 activities
    })

    return unsubscribe
  }, [subscribe])

  return {
    activities,
    isConnected
  }
}