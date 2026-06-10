'use client'

import { useEffect } from 'react'
import { registerServiceWorker, requestNotificationPermission } from '@/lib/pwa-utils'
import { logger } from '@/lib/logger'

interface PWAProviderProps {
  children: React.ReactNode
}

export function PWAProvider({ children }: PWAProviderProps) {
  useEffect(() => {
    // Register service worker on mount
    const initializePWA = async () => {
      try {
        // Register service worker
        const registration = await registerServiceWorker()
        
        if (registration) {
          logger.info('PWA: Service Worker registered successfully')

          // Request notification permission after a delay
          setTimeout(async () => {
            if ('Notification' in window && Notification.permission === 'default') {
              await requestNotificationPermission()
            }
          }, 5000) // Wait 5 seconds before asking for permission
        }
      } catch (error) {
        logger.error('PWA: Initialization failed:', error instanceof Error ? error : new Error(String(error)))
      }
    }

    initializePWA()
  }, [])

  return <>{children}</>
}