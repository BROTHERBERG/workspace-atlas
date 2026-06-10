'use client'

import React from 'react'
import { performanceTracker } from '@/lib/performance'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface LazyLoadOptions {
  threshold?: number
  rootMargin?: string
  fallback?: React.ReactNode
  onLoad?: () => void
  onError?: (error: Error) => void
}

/**
 * Lazy loading wrapper for React components
 */
export function LazyLoad({ 
  children, 
  fallback = <div className="animate-pulse bg-gray-200 rounded h-32" />,
  threshold = 0.1,
  rootMargin = '50px',
  onLoad,
  onError
}: LazyLoadOptions & { children: React.ReactNode }) {
  const [isVisible, setIsVisible] = React.useState(false)
  const [hasLoaded, setHasLoaded] = React.useState(false)
  const elementRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const element = elementRef.current
    if (!element || hasLoaded) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const startTime = performance.now()
            setIsVisible(true)
            setHasLoaded(true)
            
            performanceTracker?.trackMetric('lazy_load_trigger', startTime, {
              component: 'LazyLoad',
              threshold,
              rootMargin
            })
            
            onLoad?.()
            observer.unobserve(element)
          }
        })
      },
      {
        threshold,
        rootMargin
      }
    )

    observer.observe(element)

    return () => {
      observer.disconnect()
    }
  }, [threshold, rootMargin, hasLoaded, onLoad])

  return (
    <div ref={elementRef}>
      {isVisible ? (
        <ErrorBoundary onError={onError}>
          <React.Suspense fallback={fallback}>
            {children}
          </React.Suspense>
        </ErrorBoundary>
      ) : (
        fallback
      )}
    </div>
  )
}

/**
 * Lazy load images with progressive loading
 */
export function LazyImage({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  onLoad,
  onError,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement> & {
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
}) {
  const [isLoaded, setIsLoaded] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)
  const [isVisible, setIsVisible] = React.useState(priority)
  const imgRef = React.useRef<HTMLImageElement>(null)

  // Progressive image loading
  React.useEffect(() => {
    if (!isVisible || !src) return

    const img = new Image()
    const startTime = performance.now()

    img.onload = () => {
      setIsLoaded(true)
      performanceTracker?.trackMetric('image_load', startTime, {
        src,
        size: `${width}x${height}`,
        priority
      })
      onLoad?.()
    }

    img.onerror = () => {
      setHasError(true)
      onError?.()
    }

    img.src = typeof src === 'string' ? src : src?.toString() || ''
  }, [isVisible, src, width, height, priority, onLoad, onError])

  // Intersection observer for non-priority images
  React.useEffect(() => {
    if (priority) return

    const element = imgRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true)
            observer.unobserve(element)
          }
        })
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [priority])

  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500 text-sm">Failed to load image</span>
      </div>
    )
  }

  return (
    <div ref={imgRef} className="relative">
      {/* Placeholder */}
      {!isLoaded && (
        <div 
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
          style={{ width, height }}
        />
      )}
      
      {/* Actual image */}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`${className} ${!isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          width={width}
          height={height}
          loading={priority ? 'eager' : 'lazy'}
          {...props}
        />
      )}
    </div>
  )
}

/**
 * Lazy load component with retry logic
 */
export function LazyComponentWithRetry<T extends Record<string, any>>({
  importFn,
  fallback,
  errorFallback,
  maxRetries = 3,
  retryDelay = 1000,
  ...props
}: {
  importFn: () => Promise<{ default: React.ComponentType<T> }>
  fallback?: React.ReactNode
  errorFallback?: React.ComponentType<{ error: Error; retry: () => void }>
  maxRetries?: number
  retryDelay?: number
} & T) {
  const [Component, setComponent] = React.useState<React.ComponentType<T> | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<Error | null>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  const loadComponent = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const startTime = performance.now()
      const module = await importFn()
      
      performanceTracker?.trackMetric('component_lazy_load', startTime, {
        component: module.default.name,
        retryCount
      })

      setComponent(() => module.default)
      setLoading(false)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      
      if (retryCount < maxRetries) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
          loadComponent()
        }, retryDelay * Math.pow(2, retryCount)) // Exponential backoff
      } else {
        setError(error)
        setLoading(false)
      }
    }
  }, [importFn, retryCount, maxRetries, retryDelay])

  React.useEffect(() => {
    loadComponent()
  }, [loadComponent])

  const retry = React.useCallback(() => {
    setRetryCount(0)
    loadComponent()
  }, [loadComponent])

  if (loading) {
    return fallback || <div className="animate-pulse bg-gray-200 rounded h-32" />
  }

  if (error) {
    if (errorFallback) {
      const ErrorComponent = errorFallback
      return <ErrorComponent error={error} retry={retry} />
    }
    
    return (
      <div className="p-4 border-2 border-red-200 bg-red-50 rounded">
        <h3 className="font-medium text-red-800">Failed to load component</h3>
        <p className="text-sm text-red-600 mt-1">{error.message}</p>
        <button 
          onClick={retry}
          className="mt-2 px-3 py-1 bg-red-100 hover:bg-red-200 rounded text-sm"
        >
          Retry
        </button>
      </div>
    )
  }

  if (!Component) {
    return fallback || <div>Component not found</div>
  }

  return <Component {...(props as any)} />
}

/**
 * Virtual scrolling for large lists
 */
export function VirtualScrollList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className
}: {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
}) {
  const [scrollTop, setScrollTop] = React.useState(0)
  const scrollElementRef = React.useRef<HTMLDivElement>(null)

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  )

  const visibleItems = items.slice(startIndex, endIndex + 1)
  const totalHeight = items.length * itemHeight
  const offsetY = startIndex * itemHeight

  const handleScroll = React.useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  return (
    <div
      ref={scrollElementRef}
      className={className}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((item, index) => (
            <div
              key={startIndex + index}
              style={{ height: itemHeight }}
            >
              {renderItem(item, startIndex + index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}