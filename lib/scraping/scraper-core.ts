/**
 * Core web scraping utilities for Workspace Atlas
 * Provides rate-limited, resilient web scraping with proper error handling
 */

import { logger, PerformanceTimer } from '@/lib/logger'

export interface ScrapingConfig {
  userAgent: string
  delay: number
  maxRetries: number
  timeout: number
  concurrent: number
}

export interface ScrapingResult<T = unknown> {
  success: boolean
  data?: T
  error?: string
  statusCode?: number
  retryCount: number
  duration: number
}

export interface WorkspaceRawData {
  name: string
  description?: string
  address?: string
  city?: string
  country?: string
  coordinates?: [number, number]
  phone?: string
  email?: string
  website?: string
  images?: string[]
  amenities?: string[]
  pricing?: {
    hotDesk?: number
    dedicatedDesk?: number
    privateOffice?: number
    currency?: string
  }
  socialMedia?: {
    instagram?: string
    twitter?: string
    linkedin?: string
    facebook?: string
  }
  hours?: string
  rating?: number
  reviewCount?: number
  source: string
  sourceId?: string
  scrapedAt: Date
}

/**
 * Core scraper class with rate limiting and error handling
 */
export class WebScraper {
  private config: ScrapingConfig
  private requestQueue: Array<() => Promise<void>> = []
  private activeRequests = 0
  private lastRequestTime = 0

  constructor(config?: Partial<ScrapingConfig>) {
    this.config = {
      userAgent: process.env.SCRAPER_USER_AGENT || 'Mozilla/5.0 (compatible; WorkspaceAtlas/1.0)',
      delay: parseInt(process.env.SCRAPER_DELAY_MS || '1000'),
      maxRetries: parseInt(process.env.SCRAPER_MAX_RETRIES || '3'),
      timeout: parseInt(process.env.SCRAPER_TIMEOUT_MS || '30000'),
      concurrent: 3, // Max concurrent requests
      ...config
    }
  }

  /**
   * Fetch a URL with rate limiting and retries
   */
  async fetchWithRetry(url: string, options?: RequestInit): Promise<ScrapingResult<Response>> {
    const timer = new PerformanceTimer(`fetch ${url}`)
    let retryCount = 0
    let lastError: Error | null = null

    while (retryCount <= this.config.maxRetries) {
      try {
        // Rate limiting
        await this.enforceRateLimit()

        const response = await fetch(url, {
          headers: {
            'User-Agent': this.config.userAgent,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            ...options?.headers
          },
          signal: AbortSignal.timeout(this.config.timeout),
          ...options
        })

        const duration = timer.finish({ 
          url, 
          statusCode: response.status, 
          retryCount,
          success: response.ok 
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        logger.info('Scraping request successful', {
          url,
          statusCode: response.status,
          retryCount,
          duration: `${duration}ms`
        })

        return {
          success: true,
          data: response,
          statusCode: response.status,
          retryCount,
          duration
        }

      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error))
        retryCount++

        logger.warn('Scraping request failed', {
          url,
          error: lastError.message,
          retryCount,
          maxRetries: this.config.maxRetries
        })

        if (retryCount <= this.config.maxRetries) {
          // Exponential backoff
          const backoffDelay = this.config.delay * Math.pow(2, retryCount - 1)
          await this.sleep(backoffDelay)
        }
      }
    }

    const duration = timer.finish({ 
      url, 
      retryCount, 
      success: false,
      error: lastError?.message 
    })

    logger.error('Scraping request failed after all retries', lastError || new Error('Unknown error'), {
      url,
      retryCount,
      maxRetries: this.config.maxRetries,
      duration: `${duration}ms`
    })

    return {
      success: false,
      error: lastError?.message || 'Unknown error',
      retryCount,
      duration
    }
  }

  /**
   * Parse HTML content safely
   */
  parseHTML(html: string): Document {
    // In a real implementation, you'd use a proper HTML parser like jsdom or cheerio
    // For now, we'll use the browser's DOMParser or a fallback
    if (typeof window !== 'undefined' && window.DOMParser) {
      return new DOMParser().parseFromString(html, 'text/html')
    }
    
    // Node.js fallback - in production, use jsdom or cheerio
    throw new Error('HTML parsing requires jsdom or cheerio in Node.js environment')
  }

  /**
   * Extract text content safely
   */
  extractText(element: Element | null): string {
    if (!element) return ''
    return element.textContent?.trim() || ''
  }

  /**
   * Extract attribute safely
   */
  extractAttribute(element: Element | null, attribute: string): string {
    if (!element) return ''
    return element.getAttribute(attribute) || ''
  }

  /**
   * Extract multiple elements
   */
  extractMultiple(document: Document, selector: string): Element[] {
    return Array.from(document.querySelectorAll(selector))
  }

  /**
   * Clean and normalize text
   */
  cleanText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple whitespace -> single space
      .replace(/\n/g, ' ')   // Newlines -> space
      .replace(/\t/g, ' ')   // Tabs -> space
      .trim()
  }

  /**
   * Extract email from text
   */
  extractEmail(text: string): string | null {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/
    const match = text.match(emailRegex)
    return match ? match[0] : null
  }

  /**
   * Extract phone from text
   */
  extractPhone(text: string): string | null {
    const phoneRegex = /(?:\+?1[-. ]?)?(?:\(?[0-9]{3}\)?[-. ]?)?[0-9]{3}[-. ]?[0-9]{4}/
    const match = text.match(phoneRegex)
    return match ? match[0].replace(/[^+\d]/g, '') : null
  }

  /**
   * Extract URLs from text
   */
  extractUrls(text: string): string[] {
    const urlRegex = /https?:\/\/[^\s<>"]{2,}/gi
    return text.match(urlRegex) || []
  }

  /**
   * Rate limiting enforcement
   */
  private async enforceRateLimit(): Promise<void> {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.config.delay) {
      const waitTime = this.config.delay - timeSinceLastRequest
      await this.sleep(waitTime)
    }
    
    this.lastRequestTime = Date.now()
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Validate URL
   */
  isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }

  /**
   * Get absolute URL
   */
  getAbsoluteUrl(baseUrl: string, relativePath: string): string {
    try {
      return new URL(relativePath, baseUrl).href
    } catch {
      return relativePath
    }
  }
}

/**
 * Global scraper instance
 */
export const scraper = new WebScraper()