/**
 * Progressive Web App utilities for Workspace Atlas
 * Handles installation prompts, offline detection, and PWA features
 */

import { logger } from '@/lib/logger'

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

/**
 * PWA installation state
 */
export interface PWAInstallState {
  canInstall: boolean
  isInstalled: boolean
  isSupported: boolean
}

/**
 * Check if PWA installation is supported and available
 */
export function checkPWASupport(): PWAInstallState {
  if (typeof window === 'undefined') {
    return { canInstall: false, isInstalled: false, isSupported: false }
  }

  const isSupported = 'serviceWorker' in navigator && 'PushManager' in window
  const isInstalled = window.matchMedia('(display-mode: standalone)').matches || 
                     (window.navigator as any).standalone === true
  
  // canInstall will be set by the beforeinstallprompt event
  return {
    canInstall: false,
    isInstalled,
    isSupported
  }
}

/**
 * Register service worker
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    })

    logger.info('Service Worker registered successfully', { scope: registration.scope, updateViaCache: registration.updateViaCache })

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            // New version available, show update notification
            showUpdateAvailableNotification()
          }
        })
      }
    })

    return registration
  } catch (error) {
    logger.error('Service Worker registration failed', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Show update available notification
 */
function showUpdateAvailableNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('Workspace Atlas Update Available', {
      body: 'A new version of Workspace Atlas is available. Refresh to update.',
      icon: '/icons/icon-192x192.png',
      tag: 'app-update'
    })
  }
}

/**
 * Unregister service worker (for development/cleanup)
 */
export async function unregisterServiceWorker(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const unregistered = await registration.unregister()
      logger.info('Service Worker unregistered', { unregistered })
      return unregistered
    }
    return false
  } catch (error) {
    logger.error('Service Worker unregistration failed', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

/**
 * Handle PWA installation
 */
export class PWAInstaller {
  private deferredPrompt: BeforeInstallPromptEvent | null = null
  private listeners: Set<(state: PWAInstallState) => void> = new Set()

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      logger.info('PWA install prompt available')
      e.preventDefault()
      this.deferredPrompt = e as BeforeInstallPromptEvent
      this.notifyListeners()
    })

    // Listen for the appinstalled event
    window.addEventListener('appinstalled', () => {
      logger.info('PWA app installed successfully')
      this.deferredPrompt = null
      this.notifyListeners()
    })

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    mediaQuery.addEventListener('change', () => {
      this.notifyListeners()
    })
  }

  /**
   * Get current PWA state
   */
  getState(): PWAInstallState {
    const baseState = checkPWASupport()
    return {
      ...baseState,
      canInstall: !!this.deferredPrompt
    }
  }

  /**
   * Show installation prompt
   */
  async showInstallPrompt(): Promise<{ outcome: 'accepted' | 'dismissed' } | null> {
    if (!this.deferredPrompt) {
      logger.warn('PWA no install prompt available')
      return null
    }

    try {
      await this.deferredPrompt.prompt()
      const choiceResult = await this.deferredPrompt.userChoice
      
      logger.info('PWA user install choice', { outcome: choiceResult.outcome })
      
      if (choiceResult.outcome === 'accepted') {
        logger.info('PWA user accepted install prompt')
      } else {
        logger.info('PWA user dismissed install prompt')
      }

      this.deferredPrompt = null
      this.notifyListeners()
      
      return choiceResult
    } catch (error) {
      logger.error('PWA install prompt error', error instanceof Error ? error : new Error(String(error)))
      return null
    }
  }

  /**
   * Subscribe to PWA state changes
   */
  subscribe(listener: (state: PWAInstallState) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately notify with current state
    listener(this.getState())
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners() {
    const state = this.getState()
    this.listeners.forEach(listener => listener(state))
  }
}

/**
 * Global PWA installer instance
 */
export const pwaInstaller = new PWAInstaller()

/**
 * Online/Offline detection utilities
 */
export class ConnectionStatus {
  private listeners: Set<(online: boolean) => void> = new Set()
  
  constructor() {
    if (typeof window !== 'undefined') {
      this.setupEventListeners()
    }
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      logger.info('Connection back online')
      this.notifyListeners(true)
    })

    window.addEventListener('offline', () => {
      logger.warn('Connection gone offline')
      this.notifyListeners(false)
    })
  }

  /**
   * Check if currently online
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true
  }

  /**
   * Subscribe to connection status changes
   */
  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener)
    
    // Immediately notify with current state
    listener(this.isOnline())
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener)
    }
  }

  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online))
  }
}

/**
 * Global connection status instance
 */
export const connectionStatus = new ConnectionStatus()

/**
 * Request notification permission
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    logger.warn('Browser does not support notifications')
    return 'denied'
  }

  if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    logger.info('Notification permission requested', { permission })
    return permission
  }

  return Notification.permission
}

/**
 * Show local notification
 */
export function showNotification(title: string, options?: NotificationOptions) {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options
    })
  }
  return null
}

/**
 * Background sync registration
 */
export async function registerBackgroundSync(tag: string): Promise<void> {
  if ('serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype) {
    try {
      const registration = await navigator.serviceWorker.ready
      await (registration as any).sync.register(tag)
      logger.info('Background sync registered', { tag })
    } catch (error) {
      logger.error('Background sync registration failed', error instanceof Error ? error : new Error(String(error)), { tag })
    }
  }
}

/**
 * Analytics service interface
 */
export interface AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): void
  identify(userId: string, properties?: Record<string, unknown>): void
  page(name: string, properties?: Record<string, unknown>): void
}

/**
 * Mock analytics service for development
 * TODO: Replace with real analytics service (e.g., Mixpanel, Amplitude)
 */
class MockAnalyticsService implements AnalyticsService {
  track(event: string, properties?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(`📊 Analytics - Track: ${event}`, properties)
  }

  identify(userId: string, properties?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(`📊 Analytics - Identify: ${userId}`, properties)
  }

  page(name: string, properties?: Record<string, unknown>): void {
    // eslint-disable-next-line no-console
    console.log(`📊 Analytics - Page: ${name}`, properties)
  }
}

// Global analytics instance
export const analytics = new MockAnalyticsService()

/**
 * PWA-specific analytics events
 */
export function trackPWAEvent(event: 'install_prompt_shown' | 'install_accepted' | 'install_dismissed' | 'offline_usage', properties?: Record<string, unknown>) {
  analytics.track('pwa_event', {
    event,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    ...properties
  })
}

/**
 * Track workspace interactions
 */
export function trackWorkspaceEvent(event: 'view' | 'search' | 'filter' | 'contact' | 'score_request', workspaceId?: string, properties?: Record<string, unknown>) {
  analytics.track('workspace_event', {
    event,
    workspaceId,
    timestamp: new Date().toISOString(),
    ...properties
  })
}

/**
 * Track user journey events
 */
export function trackUserEvent(event: 'signup' | 'login' | 'profile_update' | 'subscription' | 'onboarding_complete', properties?: Record<string, unknown>) {
  analytics.track('user_event', {
    event,
    timestamp: new Date().toISOString(),
    ...properties
  })
}

/**
 * Track performance metrics
 */
export function trackPerformance(metric: 'page_load' | 'api_call' | 'search_speed', duration: number, properties?: Record<string, unknown>) {
  analytics.track('performance_metric', {
    metric,
    duration,
    timestamp: new Date().toISOString(),
    ...properties
  })
}