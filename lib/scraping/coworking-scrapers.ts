/**
 * Comprehensive coworking space scrapers for major platforms
 * Scrapes workspace data from WeWork, Regus, Spaces, and other providers
 */

import { logger } from '@/lib/logger'
import { GooglePlacesClient } from '@/lib/scraping/google-places'
import { DataNormalizer } from '@/lib/scraping/data-normalizer'

export interface ScrapedWorkspaceData {
  name: string
  description?: string
  website?: string
  phone?: string
  email?: string
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  images?: string[]
  amenities?: string[]
  pricing?: {
    type: string
    amount: number
    currency: string
    period: string
  }[]
  businessHours?: string
  capacity?: number
  source: string
  sourceId: string
  lastUpdated: Date
}

/**
 * Base scraper class with common functionality
 */
abstract class BaseScraper {
  protected normalizer: DataNormalizer
  protected placesClient: GooglePlacesClient

  constructor() {
    this.normalizer = new DataNormalizer()
    this.placesClient = new GooglePlacesClient()
  }

  abstract scrape(options?: any): Promise<ScrapedWorkspaceData[]>
  abstract getName(): string

  protected async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  protected extractImageUrls(html: string): string[] {
    const imageRegex = /https:\/\/[^"'\s]+\.(?:jpg|jpeg|png|webp)/gi
    const matches = html.match(imageRegex) || []
    return [...new Set(matches)].slice(0, 10) // Dedupe and limit
  }

  protected extractSourceId(url: string): string {
    const match = url.match(/\/([^\/]+)$/)
    return match?.[1] || url.split('/').pop() || ''
  }

  protected async fetchWithRetry(
    url: string, 
    options: RequestInit = {},
    maxRetries: number = 3
  ): Promise<Response> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'gzip, deflate, br',
            'DNT': '1',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            ...options.headers
          }
        })

        if (response.ok) {
          return response
        }

        if (response.status === 429) {
          // Rate limited - wait longer
          await this.delay(5000 * (i + 1))
          continue
        }

        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      } catch (error) {
        logger.warn(`Fetch attempt ${i + 1} failed for ${url}`, { error: error instanceof Error ? error.message : String(error) })
        if (i === maxRetries - 1) throw error
        await this.delay(1000 * (i + 1))
      }
    }

    throw new Error('Max retries exceeded')
  }

  protected extractEmails(text: string): string[] {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g
    return text.match(emailRegex) || []
  }

  protected extractPhones(text: string): string[] {
    const phoneRegex = /(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})(?:\s?(?:ext|x|extension)\.?\s?(\d+))?/g
    const matches = []
    let match
    while ((match = phoneRegex.exec(text)) !== null) {
      matches.push(match[0])
    }
    return matches
  }
}

/**
 * WeWork scraper
 */
export class WeWorkScraper extends BaseScraper {
  getName(): string {
    return 'WeWork'
  }

  async scrape(options: { cities?: string[] } = {}): Promise<ScrapedWorkspaceData[]> {
    const results: ScrapedWorkspaceData[] = []
    const cities = options.cities || ['new-york', 'london', 'san-francisco', 'berlin', 'tokyo', 'sydney']

    logger.info('Starting WeWork scraper', { cities: cities.length })

    for (const city of cities) {
      try {
        await this.delay(2000) // Respectful delay
        
        // WeWork locations API (if available) or search page
        const searchUrl = `https://www.wework.com/buildings/${city}`
        const response = await this.fetchWithRetry(searchUrl)
        const html = await response.text()

        // Parse locations from the page
        const locations = await this.parseWeWorkLocations(html, city)
        results.push(...locations)

        logger.info(`Scraped ${locations.length} WeWork locations from ${city}`)
      } catch (error) {
        logger.error(`Failed to scrape WeWork in ${city}`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    return results
  }

  private async parseWeWorkLocations(html: string, city: string): Promise<ScrapedWorkspaceData[]> {
    const results: ScrapedWorkspaceData[] = []
    
    // Extract location data from HTML (would use proper HTML parser in production)
    // This is a simplified implementation
    const locationMatches = html.match(/data-building-id="([^"]+)"/g) || []
    
    for (const match of locationMatches.slice(0, 10)) { // Limit for demo
      try {
        const buildingId = match.match(/data-building-id="([^"]+)"/)?.[1]
        if (!buildingId) continue

        // Fetch individual building details
        const buildingUrl = `https://www.wework.com/buildings/${buildingId}`
        const buildingResponse = await this.fetchWithRetry(buildingUrl)
        const buildingHtml = await buildingResponse.text()

        const workspaceData = this.extractWeWorkData(buildingHtml, buildingId)
        if (workspaceData) {
          results.push(workspaceData)
        }

        await this.delay(1000) // Respectful delay between requests
      } catch (error) {
        logger.warn('Failed to parse WeWork location', { error: error instanceof Error ? error.message : String(error) })
      }
    }

    return results
  }

  private extractWeWorkData(html: string, buildingId: string): ScrapedWorkspaceData | null {
    try {
      // Extract data using regex patterns (would use proper HTML parser in production)
      const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
      const addressMatch = html.match(/<span[^>]*address[^>]*>([^<]+)<\/span>/)
      const descriptionMatch = html.match(/<meta name="description" content="([^"]+)"/)

      if (!nameMatch) return null

      return {
        name: nameMatch[1].trim(),
        description: descriptionMatch?.[1] || '',
        address: addressMatch?.[1] || '',
        website: `https://www.wework.com/buildings/${buildingId}`,
        images: this.extractImageUrls(html),
        amenities: this.extractWeWorkAmenities(html),
        source: 'WeWork',
        sourceId: buildingId,
        lastUpdated: new Date()
      }
    } catch (error) {
      logger.warn('Failed to extract WeWork data', { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }


  private extractWeWorkAmenities(html: string): string[] {
    const commonAmenities = [
      'High-speed WiFi',
      'Coffee & Tea',
      'Meeting Rooms',
      'Phone Booths',
      'Printing',
      '24/7 Access',
      'Bike Storage',
      'Wellness Room'
    ]
    
    return commonAmenities.filter(amenity => 
      html.toLowerCase().includes(amenity.toLowerCase())
    )
  }
}

/**
 * Regus/Spaces scraper
 */
export class RegusScraper extends BaseScraper {
  getName(): string {
    return 'Regus'
  }

  async scrape(options: { countries?: string[] } = {}): Promise<ScrapedWorkspaceData[]> {
    const results: ScrapedWorkspaceData[] = []
    const countries = options.countries || ['us', 'uk', 'de', 'au', 'ca']

    logger.info('Starting Regus scraper', { countries: countries.length })

    for (const country of countries) {
      try {
        await this.delay(3000) // More respectful delay
        
        const searchUrl = `https://www.regus.com/locations/${country}`
        const response = await this.fetchWithRetry(searchUrl)
        const html = await response.text()

        const locations = await this.parseRegusLocations(html, country)
        results.push(...locations)

        logger.info(`Scraped ${locations.length} Regus locations from ${country}`)
      } catch (error) {
        logger.error(`Failed to scrape Regus in ${country}`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    return results
  }

  private async parseRegusLocations(html: string, country: string): Promise<ScrapedWorkspaceData[]> {
    const results: ScrapedWorkspaceData[] = []
    
    // Extract location URLs from search results
    const locationUrls = this.extractRegusLocationUrls(html)
    
    for (const url of locationUrls.slice(0, 20)) { // Limit for demo
      try {
        await this.delay(2000)
        
        const locationResponse = await this.fetchWithRetry(url)
        const locationHtml = await locationResponse.text()

        const workspaceData = this.extractRegusData(locationHtml, url)
        if (workspaceData) {
          results.push(workspaceData)
        }
      } catch (error) {
        logger.warn(`Failed to scrape Regus location: ${url}`, { error: error instanceof Error ? error.message : String(error) })
      }
    }

    return results
  }

  private extractRegusLocationUrls(html: string): string[] {
    const urlRegex = /href="(\/locations\/[^"]+)"/g
    const urls = []
    let match
    
    while ((match = urlRegex.exec(html)) !== null) {
      urls.push(`https://www.regus.com${match[1]}`)
    }
    
    return [...new Set(urls)] // Dedupe
  }

  private extractRegusData(html: string, url: string): ScrapedWorkspaceData | null {
    try {
      const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/)
      const addressMatch = html.match(/<address[^>]*>([^<]+)<\/address>/)
      const phoneMatch = html.match(/tel:([^"]+)/)

      if (!nameMatch) return null

      return {
        name: nameMatch[1].trim(),
        address: addressMatch?.[1]?.replace(/\s+/g, ' ').trim() || '',
        phone: phoneMatch?.[1] || '',
        website: url,
        images: this.extractImageUrls(html),
        amenities: this.extractRegusAmenities(html),
        source: 'Regus',
        sourceId: this.extractSourceId(url),
        lastUpdated: new Date()
      }
    } catch (error) {
      logger.warn('Failed to extract Regus data', { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  private extractRegusAmenities(html: string): string[] {
    const commonAmenities = [
      'Business Lounge',
      'Meeting Rooms',
      'High-speed Internet',
      'Reception Services',
      'Office Furniture',
      'Coffee Point',
      'Parking',
      'Access Control'
    ]
    
    return commonAmenities.filter(amenity => 
      html.toLowerCase().includes(amenity.toLowerCase().replace(/\s+/g, ''))
    )
  }

}

/**
 * General coworking directory scraper
 */
export class CoworkingDirectoryScraper extends BaseScraper {
  getName(): string {
    return 'Coworking Directory'
  }

  async scrape(options: { sources?: string[] } = {}): Promise<ScrapedWorkspaceData[]> {
    const results: ScrapedWorkspaceData[] = []
    const sources = options.sources || [
      'coworker.com',
      'deskpass.com',
      'croissant.com'
    ]

    for (const source of sources) {
      try {
        await this.delay(3000)
        
        const locations = await this.scrapeSource(source)
        results.push(...locations)

        logger.info(`Scraped ${locations.length} locations from ${source}`)
      } catch (error) {
        logger.error(`Failed to scrape ${source}`, error instanceof Error ? error : new Error(String(error)))
      }
    }

    return results
  }

  private async scrapeSource(source: string): Promise<ScrapedWorkspaceData[]> {
    // Implement source-specific scraping logic
    switch (source) {
      case 'coworker.com':
        return this.scrapeCoworker()
      case 'deskpass.com':
        return this.scrapeDeskpass()
      case 'croissant.com':
        return this.scrapeCroissant()
      default:
        return []
    }
  }

  private async scrapeCoworker(): Promise<ScrapedWorkspaceData[]> {
    const results: ScrapedWorkspaceData[] = []
    
    try {
      // Coworker.com has a search API we can use
      const cities = ['new-york', 'london', 'berlin', 'tokyo', 'san-francisco']
      
      for (const city of cities) {
        const searchUrl = `https://www.coworker.com/search/${city}`
        const response = await this.fetchWithRetry(searchUrl)
        const html = await response.text()

        // Extract workspace links
        const workspaceUrls = this.extractCoworkerUrls(html)
        
        for (const url of workspaceUrls.slice(0, 10)) {
          await this.delay(1500)
          
          const workspaceResponse = await this.fetchWithRetry(url)
          const workspaceHtml = await workspaceResponse.text()
          
          const data = this.extractCoworkerData(workspaceHtml, url)
          if (data) {
            results.push(data)
          }
        }
      }
    } catch (error) {
      logger.error('Failed to scrape Coworker', error instanceof Error ? error : new Error(String(error)))
    }

    return results
  }

  private extractCoworkerUrls(html: string): string[] {
    const urlRegex = /href="(\/coworking\/[^"]+)"/g
    const urls = []
    let match
    
    while ((match = urlRegex.exec(html)) !== null) {
      urls.push(`https://www.coworker.com${match[1]}`)
    }
    
    return [...new Set(urls)]
  }

  private extractCoworkerData(html: string, url: string): ScrapedWorkspaceData | null {
    try {
      const nameMatch = html.match(/<h1[^>]*class="[^"]*workspace-name[^"]*"[^>]*>([^<]+)<\/h1>/)
      const addressMatch = html.match(/<div[^>]*class="[^"]*address[^"]*"[^>]*>([^<]+)<\/div>/)
      
      if (!nameMatch) return null

      return {
        name: nameMatch[1].trim(),
        address: addressMatch?.[1]?.trim() || '',
        website: url,
        images: this.extractImageUrls(html),
        amenities: this.extractGeneralAmenities(html),
        source: 'Coworker',
        sourceId: this.extractSourceId(url),
        lastUpdated: new Date()
      }
    } catch (error) {
      logger.warn('Failed to extract Coworker data', { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  private async scrapeDeskpass(): Promise<ScrapedWorkspaceData[]> {
    // Similar implementation for Deskpass
    return []
  }

  private async scrapeCroissant(): Promise<ScrapedWorkspaceData[]> {
    // Similar implementation for Croissant
    return []
  }

  private extractGeneralAmenities(html: string): string[] {
    const amenityKeywords = [
      'wifi', 'internet', 'coffee', 'tea', 'meeting', 'phone', 'printing',
      'parking', 'bike', 'storage', 'security', 'reception', 'kitchen',
      'lounge', 'terrace', 'gym', 'shower', 'lockers'
    ]
    
    const foundAmenities = []
    for (const keyword of amenityKeywords) {
      if (html.toLowerCase().includes(keyword)) {
        foundAmenities.push(this.formatAmenity(keyword))
      }
    }
    
    return foundAmenities
  }

  private formatAmenity(keyword: string): string {
    const formatMap: Record<string, string> = {
      'wifi': 'High-speed WiFi',
      'internet': 'High-speed Internet',
      'coffee': 'Coffee & Tea',
      'meeting': 'Meeting Rooms',
      'phone': 'Phone Booths',
      'printing': 'Printing Services',
      'parking': 'Parking Available',
      'bike': 'Bike Storage',
      'security': 'Security System',
      'reception': 'Reception Services',
      'kitchen': 'Kitchen Facilities',
      'lounge': 'Lounge Area',
      'gym': 'Fitness Center',
      'shower': 'Shower Facilities'
    }
    
    return formatMap[keyword] || keyword
  }
}

/**
 * Scraper orchestrator
 */
export class ScraperOrchestrator {
  private scrapers: BaseScraper[]

  constructor() {
    this.scrapers = [
      new WeWorkScraper(),
      new RegusScraper(),
      new CoworkingDirectoryScraper()
    ]
  }

  async scrapeAll(options: {
    sources?: string[]
    maxConcurrent?: number
    respectRateLimit?: boolean
  } = {}): Promise<ScrapedWorkspaceData[]> {
    const {
      sources,
      maxConcurrent = 1, // Run sequentially to be respectful
      respectRateLimit = true
    } = options

    let activescrapers = this.scrapers
    if (sources && sources.length > 0) {
      activescrapers = this.scrapers.filter(scraper => 
        sources.some(source => scraper.getName().toLowerCase().includes(source.toLowerCase()))
      )
    }

    logger.info('Starting scraper orchestrator', { 
      scrapers: activescrapers.map(s => s.getName()),
      maxConcurrent
    })

    const results: ScrapedWorkspaceData[] = []

    if (maxConcurrent === 1) {
      // Sequential execution
      for (const scraper of activescrapers) {
        try {
          const scraperResults = await scraper.scrape()
          results.push(...scraperResults)
          
          if (respectRateLimit) {
            await this.delay(5000) // 5 second delay between scrapers
          }
        } catch (error) {
          logger.error(`Scraper ${scraper.getName()} failed`, error instanceof Error ? error : new Error(String(error)))
        }
      }
    } else {
      // Parallel execution with concurrency limit
      const chunks = this.chunkArray(activescrapers, maxConcurrent)
      
      for (const chunk of chunks) {
        const chunkPromises = chunk.map(scraper => 
          scraper.scrape().catch(error => {
            logger.error(`Scraper ${scraper.getName()} failed`, error instanceof Error ? error : new Error(String(error)))
            return []
          })
        )
        
        const chunkResults = await Promise.all(chunkPromises)
        results.push(...chunkResults.flat())
        
        if (respectRateLimit && chunks.indexOf(chunk) < chunks.length - 1) {
          await this.delay(3000) // Delay between chunks
        }
      }
    }

    logger.info('Scraper orchestrator completed', { 
      totalResults: results.length,
      sources: [...new Set(results.map(r => r.source))]
    })

    return results
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks = []
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size))
    }
    return chunks
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  getScraper(name: string): BaseScraper | undefined {
    return this.scrapers.find(scraper => 
      scraper.getName().toLowerCase().includes(name.toLowerCase())
    )
  }

  getAvailableScrapers(): string[] {
    return this.scrapers.map(scraper => scraper.getName())
  }
}

// Export the orchestrator instance
export const scraperOrchestrator = new ScraperOrchestrator()