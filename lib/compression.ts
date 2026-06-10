/**
 * Request compression and optimization utilities
 */

import { logger } from '@/lib/logger'

// Client-side compression for large payloads
export async function compressData(data: any): Promise<ArrayBuffer> {
  if (typeof window === 'undefined') {
    throw new Error('compressData is client-side only')
  }

  const jsonString = JSON.stringify(data)
  const encoder = new TextEncoder()
  const uint8Array = encoder.encode(jsonString)

  if ('CompressionStream' in window) {
    const stream = new CompressionStream('gzip')
    const writer = stream.writable.getWriter()
    const reader = stream.readable.getReader()

    writer.write(uint8Array)
    writer.close()

    const chunks: Uint8Array[] = []
    let done = false

    while (!done) {
      const { value, done: readerDone } = await reader.read()
      done = readerDone
      if (value) {
        chunks.push(value)
      }
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    return result.buffer
  }

  // Fallback: return uncompressed data
  const buffer = new ArrayBuffer(uint8Array.length)
  new Uint8Array(buffer).set(uint8Array)
  return buffer
}

export async function decompressData(compressedData: ArrayBuffer): Promise<any> {
  if (typeof window === 'undefined') {
    throw new Error('decompressData is client-side only')
  }

  if ('DecompressionStream' in window) {
    const stream = new DecompressionStream('gzip')
    const writer = stream.writable.getWriter()
    const reader = stream.readable.getReader()

    writer.write(compressedData)
    writer.close()

    const chunks: Uint8Array[] = []
    let done = false

    while (!done) {
      const { value, done: readerDone } = await reader.read()
      done = readerDone
      if (value) {
        chunks.push(value)
      }
    }

    const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0)
    const result = new Uint8Array(totalLength)
    let offset = 0

    for (const chunk of chunks) {
      result.set(chunk, offset)
      offset += chunk.length
    }

    const decoder = new TextDecoder()
    const jsonString = decoder.decode(result)
    return JSON.parse(jsonString)
  }

  // Fallback: assume data is uncompressed
  const decoder = new TextDecoder()
  const jsonString = decoder.decode(compressedData)
  return JSON.parse(jsonString)
}

/**
 * Optimized fetch with automatic compression and caching
 */
export async function optimizedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers)
  
  // Add compression headers
  headers.set('Accept-Encoding', 'gzip, deflate, br')
  
  // Add cache headers for GET requests
  if (!options.method || options.method === 'GET') {
    headers.set('Cache-Control', 'public, max-age=300') // 5 minutes
  }

  // Compress request body if large
  if (options.body && typeof options.body === 'string' && options.body.length > 1024) {
    try {
      const compressedBody = await compressData(JSON.parse(options.body))
      headers.set('Content-Encoding', 'gzip')
      headers.set('Content-Type', 'application/json')
      
      return fetch(url, {
        ...options,
        headers,
        body: compressedBody
      })
    } catch {
      // Fall back to uncompressed
    }
  }

  return fetch(url, {
    ...options,
    headers
  })
}

/**
 * Request batching to reduce HTTP overhead
 */
export class RequestBatcher {
  private batches = new Map<string, Array<{
    request: () => Promise<any>
    resolve: (value: any) => void
    reject: (error: any) => void
  }>>()
  
  private timers = new Map<string, NodeJS.Timeout>()
  private batchDelay = 50 // 50ms batching window

  batch<T>(
    batchKey: string,
    request: () => Promise<T>,
    options: { 
      delay?: number
      maxBatchSize?: number 
    } = {}
  ): Promise<T> {
    const { delay = this.batchDelay, maxBatchSize = 10 } = options

    return new Promise<T>((resolve, reject) => {
      if (!this.batches.has(batchKey)) {
        this.batches.set(batchKey, [])
      }

      const batch = this.batches.get(batchKey)!
      batch.push({ request, resolve, reject })

      // Execute immediately if batch is full
      if (batch.length >= maxBatchSize) {
        this.executeBatch(batchKey)
        return
      }

      // Clear existing timer and set new one
      if (this.timers.has(batchKey)) {
        clearTimeout(this.timers.get(batchKey)!)
      }

      this.timers.set(batchKey, setTimeout(() => {
        this.executeBatch(batchKey)
      }, delay))
    })
  }

  private async executeBatch(batchKey: string) {
    const batch = this.batches.get(batchKey)
    if (!batch || batch.length === 0) return

    this.batches.delete(batchKey)
    this.timers.delete(batchKey)

    try {
      // Execute all requests in parallel
      const results = await Promise.allSettled(
        batch.map(item => item.request())
      )

      // Resolve/reject each promise with its result
      results.forEach((result, index) => {
        const item = batch[index]
        if (result.status === 'fulfilled') {
          item.resolve(result.value)
        } else {
          item.reject(result.reason)
        }
      })
    } catch (error) {
      // Reject all promises on batch failure
      batch.forEach(item => item.reject(error))
    }
  }
}

export const requestBatcher = new RequestBatcher()

/**
 * Image optimization and compression
 */
export class ImageOptimizer {
  static compressImage(
    file: File,
    options: {
      maxWidth?: number
      maxHeight?: number
      quality?: number
      format?: 'jpeg' | 'webp' | 'png'
    } = {}
  ): Promise<Blob> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }

        canvas.width = width
        canvas.height = height

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob)
            } else {
              reject(new Error('Failed to compress image'))
            }
          },
          `image/${format}`,
          quality
        )
      }

      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(file)
    })
  }

  static async generateResponsiveImages(
    file: File,
    sizes: number[] = [320, 640, 1024, 1920]
  ): Promise<{ size: number; blob: Blob }[]> {
    const results = await Promise.all(
      sizes.map(async (size) => {
        const blob = await this.compressImage(file, {
          maxWidth: size,
          maxHeight: Math.round(size * 0.75), // 4:3 aspect ratio
          quality: size > 1024 ? 0.8 : 0.9
        })
        return { size, blob }
      })
    )

    return results
  }
}

/**
 * Service Worker for advanced caching
 */
export function registerServiceWorker() {
  if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        logger.info('ServiceWorker registered', { scope: registration.scope })

        // Listen for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, prompt user to refresh
                if (confirm('New content available! Reload to update?')) {
                  window.location.reload()
                }
              }
            })
          }
        })
      } catch (error) {
        logger.warn('ServiceWorker registration failed', { error: error instanceof Error ? error.message : String(error) })
      }
    })
  }
}

/**
 * Connection-aware optimizations
 */
export function getConnectionInfo() {
  if (typeof window === 'undefined' || !('connection' in navigator)) {
    return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false }
  }

  const connection = (navigator as any).connection
  return {
    effectiveType: connection.effectiveType || '4g',
    downlink: connection.downlink || 10,
    rtt: connection.rtt || 100,
    saveData: connection.saveData || false
  }
}

export function getOptimizedConfig() {
  const connection = getConnectionInfo()
  
  if (connection.saveData) {
    return {
      imageQuality: 0.6,
      enableAnimations: false,
      preloadImages: false,
      chunkSize: 'small'
    }
  }

  if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
    return {
      imageQuality: 0.4,
      enableAnimations: false,
      preloadImages: false,
      chunkSize: 'small'
    }
  }

  if (connection.effectiveType === '3g') {
    return {
      imageQuality: 0.7,
      enableAnimations: true,
      preloadImages: false,
      chunkSize: 'medium'
    }
  }

  // 4g and above
  return {
    imageQuality: 0.8,
    enableAnimations: true,
    preloadImages: true,
    chunkSize: 'large'
  }
}