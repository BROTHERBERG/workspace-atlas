/**
 * Performance monitoring and optimization utilities
 * Provides client-side and server-side performance tracking
 */

'use client'

import { logger } from '@/lib/logger'

export interface PerformanceMetrics {
  name: string
  duration: number
  startTime: number
  endTime: number
  metadata?: Record<string, any>
}

export interface WebVitals {
  CLS: number | null
  FCP: number | null
  FID: number | null
  LCP: number | null
  TTFB: number | null
}

/**
 * Performance tracker for client-side monitoring
 */
export class ClientPerformanceTracker {
  private metrics: PerformanceMetrics[] = []
  private observers: PerformanceObserver[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      this.setupObservers()
    }
  }

  /**
   * Track a custom performance metric
   */
  trackMetric(name: string, startTime: number, metadata?: Record<string, any>): void {
    const endTime = performance.now()
    const duration = endTime - startTime

    const metric: PerformanceMetrics = {
      name,
      duration,
      startTime,
      endTime,
      metadata
    }

    this.metrics.push(metric)

    // Log slow operations
    if (duration > 1000) {
      logger.warn('Slow operation detected', {
        name,
        duration: `${duration.toFixed(2)}ms`,
        metadata
      })
    }

    // Send to analytics if in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToAnalytics(metric)
    }
  }

  /**
   * Start tracking an operation
   */
  startTracking(name: string): () => void {
    const startTime = performance.now()
    
    return (metadata?: Record<string, any>) => {
      this.trackMetric(name, startTime, metadata)
    }
  }

  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = []
  }

  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    try {
      // Track Core Web Vitals
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          if (lastEntry) {
            logger.info('LCP measured', { 
              lcp: `${lastEntry.startTime.toFixed(2)}ms` 
            })
          }
        })
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
        this.observers.push(lcpObserver)

        // First Input Delay
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            if (entry.processingStart && entry.startTime) {
              const fid = entry.processingStart - entry.startTime
              logger.info('FID measured', { 
                fid: `${fid.toFixed(2)}ms` 
              })
            }
          })
        })
        fidObserver.observe({ entryTypes: ['first-input'] })
        this.observers.push(fidObserver)

        // Long Tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry) => {
            if (entry.duration > 50) { // Tasks over 50ms
              logger.warn('Long task detected', {
                duration: `${entry.duration.toFixed(2)}ms`,
                startTime: `${entry.startTime.toFixed(2)}ms`
              })
            }
          })
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.push(longTaskObserver)

        // Navigation timing
        const navObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach((entry: any) => {
            logger.info('Navigation timing', {
              domContentLoaded: `${(entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart).toFixed(2)}ms`,
              loadComplete: `${(entry.loadEventEnd - entry.loadEventStart).toFixed(2)}ms`,
              ttfb: `${(entry.responseStart - entry.requestStart).toFixed(2)}ms`
            })
          })
        })
        navObserver.observe({ entryTypes: ['navigation'] })
        this.observers.push(navObserver)
      }
    } catch (error) {
      logger.warn('Failed to setup performance observers', { 
        error: error instanceof Error ? error.message : String(error) 
      })
    }
  }

  /**
   * Send metrics to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetrics): void {
    try {
      // In a real app, send to Google Analytics, DataDog, etc.
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'performance_metric', {
          event_category: 'Performance',
          event_label: metric.name,
          value: Math.round(metric.duration),
          custom_map: {
            duration: metric.duration,
            ...metric.metadata
          }
        })
      }
    } catch (error) {
      logger.warn('Failed to send performance data to analytics', {
        error: error instanceof Error ? error.message : String(error)
      })
    }
  }

  /**
   * Cleanup observers
   */
  cleanup(): void {
    this.observers.forEach(observer => observer.disconnect())
    this.observers = []
  }
}

/**
 * React hook for performance tracking
 */
export function usePerformanceTracking() {
  const [tracker] = React.useState(() => new ClientPerformanceTracker())

  React.useEffect(() => {
    return () => {
      tracker.cleanup()
    }
  }, [tracker])

  const trackOperation = React.useCallback((name: string, operation: () => Promise<any>) => {
    const endTracking = tracker.startTracking(name)
    
    return operation().finally(() => {
      endTracking()
    })
  }, [tracker])

  const trackRender = React.useCallback((componentName: string) => {
    const endTracking = tracker.startTracking(`${componentName}_render`)
    
    React.useEffect(() => {
      endTracking()
    })
  }, [tracker])

  return { trackOperation, trackRender, tracker }
}

/**
 * Higher-order component for performance tracking
 */
export function withPerformanceTracking<T extends object>(
  Component: React.ComponentType<T>,
  componentName?: string
) {
  const displayName = componentName || Component.displayName || Component.name || 'Component'
  
  const WrappedComponent = React.memo((props: T) => {
    const { trackRender } = usePerformanceTracking()
    
    trackRender(displayName)
    
    return React.createElement(Component, props)
  })
  
  WrappedComponent.displayName = `withPerformanceTracking(${displayName})`
  return WrappedComponent
}

/**
 * Global performance tracker instance
 */
export const performanceTracker = typeof window !== 'undefined' 
  ? new ClientPerformanceTracker() 
  : null

/**
 * Optimize images for performance
 */
export function getOptimizedImageProps(src: string, alt: string, options?: {
  priority?: boolean
  quality?: number
  sizes?: string
}) {
  return {
    src,
    alt,
    loading: options?.priority ? 'eager' as const : 'lazy' as const,
    priority: options?.priority || false,
    quality: options?.quality || 80,
    sizes: options?.sizes || '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
    placeholder: 'blur' as const,
    blurDataURL: 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkqGx0f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
  }
}

// React import for hooks
import React from 'react'