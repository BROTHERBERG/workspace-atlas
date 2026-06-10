'use client'

import { useEffect, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { WifiOff, Wifi, RefreshCw } from 'lucide-react'
import { connectionStatus, trackPWAEvent } from '@/lib/pwa-utils'

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [showOfflineAlert, setShowOfflineAlert] = useState(false)
  const [wasOffline, setWasOffline] = useState(false)

  useEffect(() => {
    const unsubscribe = connectionStatus.subscribe((online) => {
      if (!online && isOnline) {
        // Just went offline
        setShowOfflineAlert(true)
        setWasOffline(true)
        trackPWAEvent('offline_usage')
      } else if (online && !isOnline && wasOffline) {
        // Back online after being offline
        setTimeout(() => setShowOfflineAlert(false), 3000) // Hide alert after 3 seconds
      }
      
      setIsOnline(online)
    })

    return unsubscribe
  }, [isOnline, wasOffline])

  if (isOnline && !showOfflineAlert) {
    return null
  }

  return (
    <div className="fixed top-16 left-0 right-0 z-40 px-4">
      <Alert 
        className={`max-w-md mx-auto border-2 ${
          isOnline 
            ? 'bg-green-50 border-green-500 text-green-800' 
            : 'bg-orange-50 border-orange-500 text-orange-800'
        }`}
      >
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-4 w-4" />
          ) : (
            <WifiOff className="h-4 w-4" />
          )}
          <AlertDescription className="flex-1">
            {isOnline 
              ? 'Back online! Your changes will now sync.' 
              : 'You\'re offline. Some features may be limited, but you can still browse cached content.'
            }
          </AlertDescription>
          {!isOnline && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
              className="ml-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    const unsubscribe = connectionStatus.subscribe(setIsOnline)
    return unsubscribe
  }, [])

  if (isOnline) {
    return null
  }

  return (
    <Badge 
      variant="outline" 
      className="bg-orange-100 text-orange-800 border-orange-300"
    >
      <WifiOff className="h-3 w-3 mr-1" />
      Offline
    </Badge>
  )
}

export function ConnectionStatusProvider({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <OfflineStatus />
    </>
  )
}