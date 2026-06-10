#!/usr/bin/env npx tsx

/**
 * Premium Coworking Spaces Scraper
 * Scrapes world-class coworking spaces from major platforms
 */

import { ScraperOrchestrator } from '@/lib/scraping/coworking-scrapers'
import { DataQualityOrchestrator } from '@/lib/data-quality/validator'
import { GooglePlacesClient } from '@/lib/scraping/google-places'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

interface ScrapeOptions {
  cities?: string[]
  providers?: string[]
  limit?: number
  dryRun?: boolean
  skipValidation?: boolean
  batchSize?: number
  enableGooglePlaces?: boolean
}

class PremiumSpacesScraper {
  private scraperOrchestrator: ScraperOrchestrator
  private qualityOrchestrator: DataQualityOrchestrator
  private googlePlaces?: GooglePlacesClient

  constructor() {
    this.scraperOrchestrator = new ScraperOrchestrator()
    this.qualityOrchestrator = new DataQualityOrchestrator()
    
    // Initialize Google Places if API key is available
    if (process.env.GOOGLE_PLACES_API_KEY) {
      this.googlePlaces = new GooglePlacesClient()
    }
  }

  async scrape(options: ScrapeOptions = {}) {
    const {
      cities = this.getDefaultCities(),
      providers = ['wework', 'regus', 'coworker'],
      limit,
      dryRun = false,
      skipValidation = false,
      batchSize = 25,
      enableGooglePlaces = true
    } = options

    logger.info('Starting premium coworking spaces scrape', {
      cities: cities.length,
      providers,
      limit,
      dryRun,
      googlePlacesEnabled: enableGooglePlaces && !!this.googlePlaces
    })

    const allScrapedData = []

    try {
      // Phase 1: Scrape from existing scrapers
      logger.info('Phase 1: Scraping from existing providers...')
      
      const providerData = await this.scraperOrchestrator.scrapeAll({
        sources: providers,
        maxConcurrent: 1,
        respectRateLimit: true
      })

      allScrapedData.push(...providerData)
      logger.info(`Phase 1 completed: ${providerData.length} spaces scraped`)

      // Phase 2: Google Places (if enabled and API key available)
      if (enableGooglePlaces && this.googlePlaces) {
        logger.info('Phase 2: Enriching with Google Places data...')
        
        for (const city of cities.slice(0, 10)) { // Limit to avoid API quota issues
          try {
            const googleData = await this.scrapeFromGooglePlaces(city)
            allScrapedData.push(...googleData)
            
            // Respectful delay between cities
            await this.delay(2000)
          } catch (error) {
            logger.warn(`Failed to scrape Google Places for ${city}`, { 
              error: error instanceof Error ? error.message : String(error) 
            })
          }
        }
        
        logger.info(`Phase 2 completed: Total ${allScrapedData.length} spaces`)
      } else {
        logger.info('Phase 2 skipped: Google Places API key not configured')
      }

      // Phase 3: Add manually curated premium spaces
      logger.info('Phase 3: Adding curated premium spaces...')
      const curatedSpaces = this.getCuratedPremiumSpaces()
      allScrapedData.push(...curatedSpaces)
      
      logger.info(`Phase 3 completed: Total ${allScrapedData.length} spaces`)

      // Limit results if specified
      const dataToProcess = limit ? allScrapedData.slice(0, limit) : allScrapedData

      if (dryRun) {
        logger.info('Dry run completed', {
          totalSpaces: dataToProcess.length,
          sources: [...new Set(dataToProcess.map(d => d.source))],
          cities: [...new Set(dataToProcess.map(d => d.city).filter(Boolean))]
        })
        
        // Show sample data
        console.log('\n📋 Sample scraped data:')
        dataToProcess.slice(0, 5).forEach((space, i) => {
          console.log(`${i + 1}. ${space.name} (${space.city}) - ${space.source}`)
        })
        
        return
      }

      // Phase 4: Data quality and validation
      let processedData
      if (skipValidation) {
        processedData = {
          processed: dataToProcess.map(data => ({
            data,
            metrics: { completeness: 100, accuracy: 100, consistency: 100, timeliness: 100, overall: 100 }
          })),
          rejected: [],
          summary: { processed: dataToProcess.length, rejected: 0, duplicates: 0, errors: 0 }
        }
      } else {
        logger.info('Phase 4: Validating and processing data...')
        processedData = await this.qualityOrchestrator.processWorkspaceData(dataToProcess)
        
        logger.info('Data quality results', {
          processed: processedData.processed.length,
          rejected: processedData.rejected.length,
          duplicates: processedData.summary.duplicates,
          errors: processedData.summary.errors
        })
      }

      // Phase 5: Import to database
      if (processedData.processed.length > 0) {
        logger.info('Phase 5: Importing to database...')
        
        const importResults = await this.importToDatabase(
          processedData.processed.map(p => p.data),
          batchSize
        )
        
        logger.info('Import completed', importResults)
      } else {
        logger.warn('No data to import after quality validation')
      }

    } catch (error) {
      logger.error('Premium spaces scraping failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  private async scrapeFromGooglePlaces(city: string) {
    if (!this.googlePlaces) return []

    try {
      const query = {
        query: `coworking spaces in ${city}`,
        location: city,
        type: 'coworking_space' as const
      }

      const places = await this.googlePlaces.searchCoworkingSpaces(query)
      const detailedSpaces = []

      for (const place of places.slice(0, 10)) { // Limit per city
        try {
          const details = await this.googlePlaces.getPlaceDetails(place.place_id)
          if (details) {
            const workspaceData = this.googlePlaces.convertToWorkspaceData(details)
            detailedSpaces.push(workspaceData)
          }
          
          // Respectful delay between requests
          await this.delay(1000)
        } catch (error) {
          logger.warn(`Failed to get details for place ${place.place_id}`, { 
            error: error instanceof Error ? error.message : String(error) 
          })
        }
      }

      logger.info(`Google Places: ${detailedSpaces.length} spaces scraped from ${city}`)
      return detailedSpaces

    } catch (error) {
      logger.error(`Google Places scraping failed for ${city}`, error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }

  private getCuratedPremiumSpaces() {
    // Manually curated list of world-class coworking spaces
    const premiumSpaces = [
      {
        name: 'NeueHouse New York',
        description: 'A members-only work and social club in the heart of NYC',
        address: '110 E 25th St, New York, NY 10010',
        city: 'New York',
        country: 'United States',
        website: 'https://neuehouse.com/houses/new-york/',
        phone: '(212) 660-6400',
        amenities: [
          'Meeting Rooms', 'Event Spaces', 'Restaurant', 'Bar', 'Gym',
          'Screening Room', 'Library', 'Terrace', '24/7 Access', 'Printing'
        ],
        pricing: [
          { type: 'Day Pass', amount: 75, currency: 'USD', period: 'day' },
          { type: 'Monthly Membership', amount: 450, currency: 'USD', period: 'month' }
        ],
        images: [
          'https://neuehouse.com/wp-content/uploads/2023/01/NeueHouse-NY-Lobby.jpg',
          'https://neuehouse.com/wp-content/uploads/2023/01/NeueHouse-NY-Workspace.jpg'
        ],
        source: 'Curated',
        sourceId: 'neuehouse-ny',
        lastUpdated: new Date()
      },
      {
        name: 'Soho Works New York',
        description: 'Premium coworking and social space by Soho House',
        address: '180 Varick St, New York, NY 10014',
        city: 'New York',
        country: 'United States',
        website: 'https://sohoworks.com/new-york',
        amenities: [
          'Private Offices', 'Meeting Rooms', 'Phone Booths', 'Event Space',
          'Restaurant', 'Gym', 'Yoga Studio', '24/7 Access', 'Concierge'
        ],
        pricing: [
          { type: 'Hot Desk', amount: 350, currency: 'USD', period: 'month' },
          { type: 'Dedicated Desk', amount: 650, currency: 'USD', period: 'month' }
        ],
        source: 'Curated',
        sourceId: 'soho-works-ny',
        lastUpdated: new Date()
      },
      {
        name: 'The Office Group Shoreditch',
        description: 'Design-led flexible workspace in the heart of Shoreditch',
        address: '2 Tabernacle St, London EC2A 4LU, UK',
        city: 'London',
        country: 'United Kingdom',
        website: 'https://tog.com/buildings/2-tabernacle-street/',
        amenities: [
          'Hot Desks', 'Private Offices', 'Meeting Rooms', 'Event Space',
          'Coffee Bar', 'Bike Storage', 'Shower Facilities', 'Printing'
        ],
        pricing: [
          { type: 'Hot Desk', amount: 299, currency: 'GBP', period: 'month' },
          { type: 'Dedicated Desk', amount: 449, currency: 'GBP', period: 'month' }
        ],
        source: 'Curated',
        sourceId: 'tog-shoreditch',
        lastUpdated: new Date()
      },
      {
        name: 'Mindspace Berlin',
        description: 'Boutique coworking with premium design and amenities',
        address: 'Krausenstraße 9-10, 10117 Berlin, Germany',
        city: 'Berlin',
        country: 'Germany',
        website: 'https://mindspace.me/berlin/',
        amenities: [
          'Open Space', 'Private Offices', 'Meeting Rooms', 'Phone Booths',
          'Kitchen', 'Coffee Bar', 'Event Space', 'Yoga Classes', 'Bike Storage'
        ],
        pricing: [
          { type: 'Hot Desk', amount: 259, currency: 'EUR', period: 'month' },
          { type: 'Dedicated Desk', amount: 379, currency: 'EUR', period: 'month' }
        ],
        source: 'Curated',
        sourceId: 'mindspace-berlin',
        lastUpdated: new Date()
      },
      {
        name: 'The Hive Singapore',
        description: 'Asia\'s leading coworking space with multiple locations',
        address: '120 Robinson Rd, #06-01, Singapore 068913',
        city: 'Singapore',
        country: 'Singapore',
        website: 'https://thehive.com.sg/',
        amenities: [
          'Hot Desks', 'Private Offices', 'Meeting Rooms', 'Event Space',
          'Podcast Studio', 'Gym', 'Wellness Room', 'Rooftop Terrace', 'Cafe'
        ],
        pricing: [
          { type: 'Hot Desk', amount: 280, currency: 'SGD', period: 'month' },
          { type: 'Dedicated Desk', amount: 450, currency: 'SGD', period: 'month' }
        ],
        source: 'Curated',
        sourceId: 'thehive-singapore',
        lastUpdated: new Date()
      },
      {
        name: 'WeWork Tokyo Station',
        description: 'Premium WeWork location in Tokyo\'s business district',
        address: '1-9-2 Marunouchi, Chiyoda City, Tokyo 100-0005, Japan',
        city: 'Tokyo',
        country: 'Japan',
        website: 'https://wework.com/buildings/tokyo-station--tokyo',
        amenities: [
          'Hot Desks', 'Private Offices', 'Meeting Rooms', 'Phone Booths',
          'Community Kitchen', 'Game Room', 'Wellness Room', '24/7 Access'
        ],
        pricing: [
          { type: 'Hot Desk', amount: 45000, currency: 'JPY', period: 'month' },
          { type: 'Dedicated Desk', amount: 75000, currency: 'JPY', period: 'month' }
        ],
        source: 'Curated',
        sourceId: 'wework-tokyo-station',
        lastUpdated: new Date()
      }
    ]

    return premiumSpaces
  }

  private getDefaultCities() {
    return [
      'New York',
      'San Francisco', 
      'London',
      'Berlin',
      'Paris',
      'Amsterdam',
      'Tokyo',
      'Singapore',
      'Sydney',
      'Toronto',
      'Los Angeles',
      'Chicago',
      'Boston',
      'Seattle',
      'Austin',
      'Barcelona',
      'Melbourne',
      'Dubai',
      'Hong Kong',
      'Stockholm'
    ]
  }

  private async importToDatabase(workspaces: any[], batchSize: number) {
    let imported = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < workspaces.length; i += batchSize) {
      const batch = workspaces.slice(i, i + batchSize)
      
      for (const workspace of batch) {
        try {
          // Check if workspace already exists
          const existing = await prisma.workspace.findFirst({
            where: {
              OR: [
                { sourceId: workspace.sourceId },
                { 
                  AND: [
                    { name: workspace.name },
                    { city: workspace.city }
                  ]
                }
              ]
            }
          })

          if (existing) {
            skipped++
            continue
          }

          // Generate unique slug
          const baseSlug = this.generateSlug(workspace.name, workspace.city)
          const slug = await this.ensureUniqueSlug(baseSlug)

          // Import workspace
          await prisma.workspace.create({
            data: {
              name: workspace.name,
              slug,
              description: workspace.description || '',
              website: workspace.website || '',
              phone: workspace.phone || '',
              email: workspace.email || '',
              address: workspace.address || '',
              city: workspace.city || '',
              country: workspace.country || '',
              latitude: workspace.latitude,
              longitude: workspace.longitude,
              images: workspace.images || [],
              amenities: workspace.amenities || [],
              pricingCurrency: workspace.pricing?.[0]?.currency || 'USD',
              hotDeskPrice: this.extractPricing(workspace.pricing, 'hot desk'),
              dedicatedDeskPrice: this.extractPricing(workspace.pricing, 'dedicated desk'),
              privateOfficePrice: this.extractPricing(workspace.pricing, 'private office'),
              hoursDescription: workspace.businessHours || '',
              rating: workspace.rating || null,
              reviewCount: workspace.reviewCount || null,
              source: workspace.source,
              sourceId: workspace.sourceId,
              scrapedAt: workspace.lastUpdated || new Date(),
              status: 'ACTIVE',
              featured: this.isPremiumSpace(workspace),
              digitalScore: this.calculateDigitalScore(workspace)
            }
          })

          imported++

        } catch (error) {
          errors++
          logger.error(`Failed to import workspace: ${workspace.name}`, error instanceof Error ? error : new Error(String(error)))
        }
      }

      // Progress logging
      logger.info(`Batch ${Math.floor(i / batchSize) + 1} completed`, {
        imported: imported - (errors > 0 ? 1 : 0),
        skipped,
        errors
      })
    }

    return { imported, skipped, errors, total: workspaces.length }
  }

  private generateSlug(name: string, city?: string): string {
    let slug = name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()

    if (city) {
      const citySlug = city
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
      slug += `-${citySlug}`
    }

    return slug
  }

  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (true) {
      const existing = await prisma.workspace.findUnique({
        where: { slug }
      })

      if (!existing) {
        return slug
      }

      slug = `${baseSlug}-${counter}`
      counter++
    }
  }

  private extractPricing(pricing: any[], type: string): number | null {
    if (!pricing || !Array.isArray(pricing)) return null

    const priceOption = pricing.find(p => 
      p.type.toLowerCase().includes(type.toLowerCase())
    )

    return priceOption?.amount || null
  }

  private isPremiumSpace(workspace: any): boolean {
    const premiumBrands = [
      'neuehouse', 'soho works', 'mindspace', 'wework', 'spaces',
      'the office group', 'industrious', 'convene', 'the hive'
    ]

    return premiumBrands.some(brand => 
      workspace.name.toLowerCase().includes(brand) ||
      workspace.source.toLowerCase().includes(brand)
    )
  }

  private calculateDigitalScore(workspace: any): number {
    let score = 50 // Base score

    // Website presence
    if (workspace.website) score += 15

    // Social media presence
    if (workspace.socialMedia) {
      Object.values(workspace.socialMedia).forEach(url => {
        if (url) score += 5
      })
    }

    // Contact information
    if (workspace.phone) score += 5
    if (workspace.email) score += 5

    // Content quality
    if (workspace.description && workspace.description.length > 100) score += 10
    if (workspace.images && workspace.images.length > 3) score += 10

    // Reviews and ratings
    if (workspace.rating && workspace.rating >= 4.0) score += 10
    if (workspace.reviewCount && workspace.reviewCount > 10) score += 5

    return Math.min(100, score)
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  
  const options: ScrapeOptions = {
    dryRun: args.includes('--dry-run'),
    skipValidation: args.includes('--skip-validation'),
    enableGooglePlaces: !args.includes('--no-google-places')
  }

  // Parse cities
  const citiesIndex = args.findIndex(arg => arg === '--cities')
  if (citiesIndex !== -1 && args[citiesIndex + 1]) {
    options.cities = args[citiesIndex + 1].split(',').map(c => c.trim())
  }

  // Parse providers
  const providersIndex = args.findIndex(arg => arg === '--providers')
  if (providersIndex !== -1 && args[providersIndex + 1]) {
    options.providers = args[providersIndex + 1].split(',').map(p => p.trim())
  }

  // Parse limit
  const limitIndex = args.findIndex(arg => arg === '--limit')
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    options.limit = parseInt(args[limitIndex + 1])
  }

  // Parse batch size
  const batchIndex = args.findIndex(arg => arg === '--batch-size')
  if (batchIndex !== -1 && args[batchIndex + 1]) {
    options.batchSize = parseInt(args[batchIndex + 1])
  }

  console.log('🏢 Premium Coworking Spaces Scraper')
  console.log('=====================================')

  const scraper = new PremiumSpacesScraper()
  
  try {
    await scraper.scrape(options)
  } catch (error) {
    console.error('❌ Scraping failed:', error)
    process.exit(1)
  }
}

if (require.main === module) {
  main()
}

export { PremiumSpacesScraper }