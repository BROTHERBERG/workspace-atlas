'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Download, Smartphone, X, Zap, Globe, Bell } from 'lucide-react'
import { pwaInstaller, PWAInstallState, trackPWAEvent } from '@/lib/pwa-utils'
import { logger } from '@/lib/logger'

export function PWAInstallPrompt() {
  const [pwaState, setPWAState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    isSupported: false
  })
  const [showPrompt, setShowPrompt] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    // Subscribe to PWA state changes
    const unsubscribe = pwaInstaller.subscribe(setPWAState)
    
    // Show prompt after a delay if installation is available
    const timer = setTimeout(() => {
      if (pwaState.canInstall && !pwaState.isInstalled) {
        setShowPrompt(true)
        trackPWAEvent('install_prompt_shown')
      }
    }, 10000) // Show after 10 seconds

    return () => {
      unsubscribe()
      clearTimeout(timer)
    }
  }, [pwaState.canInstall, pwaState.isInstalled])

  const handleInstall = async () => {
    setInstalling(true)
    
    try {
      const result = await pwaInstaller.showInstallPrompt()
      
      if (result?.outcome === 'accepted') {
        trackPWAEvent('install_accepted')
        setShowPrompt(false)
      } else {
        trackPWAEvent('install_dismissed')
      }
    } catch (error) {
      logger.error('Installation failed:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setInstalling(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    trackPWAEvent('install_dismissed')
  }

  // Don't show anything if PWA is not supported or already installed
  if (!pwaState.isSupported || pwaState.isInstalled) {
    return null
  }

  // Mini install button (always visible when installation is available)
  if (!showPrompt && pwaState.canInstall) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowPrompt(true)}
          className="bg-[#f9cb16] text-black hover:bg-[#f9cb16]/90 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] border-2 border-black"
          size="sm"
        >
          <Download className="h-4 w-4 mr-2" />
          Install App
        </Button>
      </div>
    )
  }

  // Full installation prompt
  if (showPrompt && pwaState.canInstall) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <Card className="w-full max-w-md bg-white border-2 border-black shadow-[5px_5px_0px_0px_rgba(249,203,22,1)]">
          <CardHeader className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-2"
              onClick={handleDismiss}
            >
              <X className="h-4 w-4" />
            </Button>
            
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#f9cb16] rounded-lg flex items-center justify-center border-2 border-black">
                <Globe className="h-6 w-6 text-black" />
              </div>
              <div>
                <CardTitle className="font-cal">Install Workspace Atlas</CardTitle>
                <CardDescription>
                  Get the full app experience
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <Zap className="h-4 w-4 text-[#f9cb16]" />
                <span>Faster loading</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Smartphone className="h-4 w-4 text-[#f9cb16]" />
                <span>Works offline</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Bell className="h-4 w-4 text-[#f9cb16]" />
                <span>Push notifications</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-4 w-4 text-[#f9cb16]" />
                <span>Full screen</span>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                onClick={handleInstall}
                disabled={installing}
                className="flex-1 bg-[#f9cb16] text-black hover:bg-[#f9cb16]/90 border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
              >
                {installing ? (
                  'Installing...'
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Install
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDetails(true)}
                className="border-2 border-black"
              >
                Learn More
              </Button>
            </div>
            
            <p className="text-xs text-gray-500 text-center">
              No app store required. Install directly from your browser.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}

export function PWAInstallButton() {
  const [pwaState, setPWAState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    isSupported: false
  })
  const [installing, setInstalling] = useState(false)

  useEffect(() => {
    const unsubscribe = pwaInstaller.subscribe(setPWAState)
    return unsubscribe
  }, [])

  if (!pwaState.isSupported || pwaState.isInstalled || !pwaState.canInstall) {
    return null
  }

  const handleInstall = async () => {
    setInstalling(true)
    
    try {
      const result = await pwaInstaller.showInstallPrompt()
      
      if (result?.outcome === 'accepted') {
        trackPWAEvent('install_accepted')
      } else {
        trackPWAEvent('install_dismissed')
      }
    } catch (error) {
      logger.error('Installation failed:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setInstalling(false)
    }
  }

  return (
    <Button
      onClick={handleInstall}
      disabled={installing}
      variant="outline"
      size="sm"
      className="border-2 border-black hover:bg-[#f9cb16]/10"
    >
      <Download className="h-4 w-4 mr-2" />
      {installing ? 'Installing...' : 'Install App'}
    </Button>
  )
}

export function PWAStatus() {
  const [pwaState, setPWAState] = useState<PWAInstallState>({
    canInstall: false,
    isInstalled: false,
    isSupported: false
  })

  useEffect(() => {
    const unsubscribe = pwaInstaller.subscribe(setPWAState)
    return unsubscribe
  }, [])

  if (!pwaState.isSupported) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      {pwaState.isInstalled ? (
        <Badge className="bg-green-100 text-green-800 border-green-300">
          <Smartphone className="h-3 w-3 mr-1" />
          Installed
        </Badge>
      ) : pwaState.canInstall ? (
        <Badge className="bg-[#f9cb16]/20 text-[#f9cb16] border-[#f9cb16]">
          <Download className="h-3 w-3 mr-1" />
          Install Available
        </Badge>
      ) : (
        <Badge variant="outline">
          <Globe className="h-3 w-3 mr-1" />
          Web App
        </Badge>
      )}
    </div>
  )
}