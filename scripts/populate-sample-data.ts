#!/usr/bin/env npx tsx

/**
 * Populate database with sample data for development and testing
 * This script generates realistic workspace data without requiring external API calls
 */

import { PrismaClient } from '@prisma/client'
import { DataQualityValidator } from '@/lib/data-quality/validator'
import { DataNormalizer } from '@/lib/scraping/data-normalizer'
import { logger, PerformanceTimer } from '@/lib/logger'
import { faker } from '@faker-js/faker'

const prisma = new PrismaClient()

interface SampleWorkspace {
  name: string
  description: string
  address: string
  city: string
  country: string
  latitude: number
  longitude: number
  phone?: string
  email?: string
  website?: string
  images: string[]
  amenities: string[]
  pricingCurrency: string
  hotDeskPrice?: number
  dedicatedDeskPrice?: number
  privateOfficePrice?: number
  source: string
  sourceId: string
  rating?: number
  reviewCount?: number
}

const SAMPLE_CITIES = [
  { name: 'New York', country: 'United States', lat: 40.7128, lng: -74.0060 },
  { name: 'London', country: 'United Kingdom', lat: 51.5074, lng: -0.1278 },
  { name: 'San Francisco', country: 'United States', lat: 37.7749, lng: -122.4194 },
  { name: 'Berlin', country: 'Germany', lat: 52.5200, lng: 13.4050 },
  { name: 'Tokyo', country: 'Japan', lat: 35.6762, lng: 139.6503 },
  { name: 'Toronto', country: 'Canada', lat: 43.6532, lng: -79.3832 },
  { name: 'Sydney', country: 'Australia', lat: -33.8688, lng: 151.2093 },
  { name: 'Amsterdam', country: 'Netherlands', lat: 52.3676, lng: 4.9041 },
  { name: 'Singapore', country: 'Singapore', lat: 1.3521, lng: 103.8198 },
  { name: 'Barcelona', country: 'Spain', lat: 41.3851, lng: 2.1734 }
]

const WORKSPACE_TYPES = [
  'coworking space',
  'business center',
  'shared office',
  'innovation hub',
  'startup incubator',
  'creative studio',
  'tech hub',
  'flex office'
]

const AMENITIES_POOL = [
  'High-speed WiFi',
  'Coffee & Tea',
  '24/7 Access',
  'Meeting Rooms',
  'Phone Booths',
  'Printing & Scanning',
  'Reception Service',
  'Mail Handling',
  'Event Space',
  'Parking',
  'Bike Storage',
  'Lockers',
  'Kitchen Facilities',
  'Outdoor Terrace',
  'Gym Access',
  'Pet Friendly',
  'Air Conditioning',
  'Standing Desks',
  'Monitor Available',
  'Whiteboard Access',
  'Podcast Studio',
  'Photography Studio',
  'Virtual Office',
  'Business Address',
  'IT Support'
]

class SampleDataGenerator {
  private validator = new DataQualityValidator()
  private normalizer = new DataNormalizer()

  /**
   * Generate a single sample workspace
   */
  generateWorkspace(city: typeof SAMPLE_CITIES[0]): SampleWorkspace {
    const workspaceType = faker.helpers.arrayElement(WORKSPACE_TYPES)
    const baseId = faker.string.alphanumeric(8)
    
    // Generate coordinates near the city center
    const latVariation = (faker.number.float() - 0.5) * 0.1 // ±0.05 degrees
    const lngVariation = (faker.number.float() - 0.5) * 0.1
    
    const workspace: SampleWorkspace = {
      name: `${faker.company.name()} ${faker.helpers.arrayElement(['Hub', 'Space', 'Studio', 'Center', 'Labs', 'Works'])}`,
      description: this.generateDescription(workspaceType, city.name),
      address: `${faker.location.buildingNumber()} ${faker.location.street()}, ${city.name}`,
      city: city.name,
      country: city.country,
      latitude: city.lat + latVariation,
      longitude: city.lng + lngVariation,
      phone: faker.helpers.maybe(() => faker.phone.number(), { probability: 0.7 }),
      email: faker.helpers.maybe(() => faker.internet.email(), { probability: 0.6 }),
      website: faker.helpers.maybe(() => faker.internet.url(), { probability: 0.8 }),
      images: this.generateImageUrls(),
      amenities: faker.helpers.arrayElements(AMENITIES_POOL, { min: 5, max: 15 }),
      pricingCurrency: this.getCurrencyForCountry(city.country),
      hotDeskPrice: faker.helpers.maybe(() => faker.number.int({ min: 20, max: 80 }), { probability: 0.9 }),
      dedicatedDeskPrice: faker.helpers.maybe(() => faker.number.int({ min: 100, max: 300 }), { probability: 0.8 }),
      privateOfficePrice: faker.helpers.maybe(() => faker.number.int({ min: 300, max: 1200 }), { probability: 0.6 }),
      source: 'sample_generator',
      sourceId: `sample_${baseId}`,
      rating: faker.helpers.maybe(() => faker.number.float({ min: 3.0, max: 5.0, fractionDigits: 1 }), { probability: 0.8 }),
      reviewCount: faker.helpers.maybe(() => faker.number.int({ min: 5, max: 150 }), { probability: 0.8 })
    }

    return workspace
  }

  private generateDescription(type: string, city: string): string {
    const templates = [
      `Modern ${type} in the heart of ${city}. Perfect for entrepreneurs, freelancers, and growing teams.`,
      `Premium ${type} offering flexible workspace solutions in ${city}'s business district.`,
      `Creative ${type} designed to inspire productivity and collaboration in ${city}.`,
      `Professional ${type} with state-of-the-art facilities in a prime ${city} location.`,
      `Innovative ${type} fostering community and connection for professionals in ${city}.`
    ]
    
    const additional = [
      'Features include high-speed internet, meeting rooms, and complimentary refreshments.',
      'Our community includes startups, established companies, and independent professionals.',
      'Network with like-minded professionals in our vibrant coworking community.',
      'Enjoy flexible membership options with 24/7 access and premium amenities.',
      'Located minutes from public transportation and major business centers.'
    ]
    
    return faker.helpers.arrayElement(templates) + ' ' + faker.helpers.arrayElement(additional)
  }

  private generateImageUrls(): string[] {
    const imageCount = faker.number.int({ min: 3, max: 8 })
    const images: string[] = []
    
    for (let i = 0; i < imageCount; i++) {
      // Use Unsplash for realistic office/coworking space images
      const keywords = ['office', 'coworking', 'workspace', 'desk', 'meeting-room']
      const keyword = faker.helpers.arrayElement(keywords)
      const width = faker.helpers.arrayElement([800, 1000, 1200])
      const height = faker.helpers.arrayElement([600, 800, 900])
      
      images.push(`https://images.unsplash.com/photo-${Date.now() + i}?w=${width}&h=${height}&q=80&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=${faker.string.alphanumeric(20)}`)
    }
    
    return images
  }

  private getCurrencyForCountry(country: string): string {
    const currencyMap: Record<string, string> = {
      'United States': 'USD',
      'United Kingdom': 'GBP',
      'Germany': 'EUR',
      'Japan': 'JPY',
      'Canada': 'CAD',
      'Australia': 'AUD',
      'Netherlands': 'EUR',
      'Singapore': 'SGD',
      'Spain': 'EUR'
    }
    return currencyMap[country] || 'USD'
  }

  /**
   * Generate multiple workspaces
   */
  generateWorkspaces(count: number): SampleWorkspace[] {
    const workspaces: SampleWorkspace[] = []
    
    for (let i = 0; i < count; i++) {
      const city = faker.helpers.arrayElement(SAMPLE_CITIES)
      const workspace = this.generateWorkspace(city)
      workspaces.push(workspace)
    }
    
    return workspaces
  }
}

class SampleDataPopulator {
  private generator = new SampleDataGenerator()
  private validator = new DataQualityValidator()

  async populateDatabase(options: {
    count?: number
    validateData?: boolean
    dryRun?: boolean
    batchSize?: number
  } = {}) {
    const {
      count = 50,
      validateData = true,
      dryRun = false,
      batchSize = 10
    } = options

    const timer = new PerformanceTimer('Sample data population')
    logger.info('Starting sample data population', { options })

    try {
      // Generate sample workspaces
      logger.info(`Generating ${count} sample workspaces`)
      const workspaces = this.generator.generateWorkspaces(count)

      let validWorkspaces = workspaces
      let validationStats: any = null

      // Validate data if requested
      if (validateData) {
        logger.info('Validating generated data')
        
        const validationData = workspaces.map(ws => ({
          name: ws.name,
          description: ws.description,
          address: ws.address,
          city: ws.city,
          country: ws.country,
          latitude: ws.latitude,
          longitude: ws.longitude,
          phone: ws.phone,
          email: ws.email,
          website: ws.website,
          images: ws.images,
          amenities: ws.amenities,
          pricing: [
            ...(ws.hotDeskPrice ? [{ type: 'hot_desk', amount: ws.hotDeskPrice, currency: ws.pricingCurrency }] : []),
            ...(ws.dedicatedDeskPrice ? [{ type: 'dedicated_desk', amount: ws.dedicatedDeskPrice, currency: ws.pricingCurrency }] : []),
            ...(ws.privateOfficePrice ? [{ type: 'private_office', amount: ws.privateOfficePrice, currency: ws.pricingCurrency }] : [])
          ],
          socialMedia: {},
          hours: undefined,
          rating: ws.rating,
          reviewCount: ws.reviewCount || 0,
          source: ws.source,
          sourceId: ws.sourceId,
          lastUpdated: new Date()
        })) as any[]

        const validation = this.validator.validateBatch(validationData)
        validationStats = validation.summary

        logger.info('Validation results', {
          total: validation.summary.total,
          valid: validation.summary.valid,
          invalid: validation.summary.invalid,
          averageScore: validation.summary.averageScore
        })

        // Filter to only valid workspaces
        validWorkspaces = validation.validEntries.map((entry, index) => workspaces[index])
      }

      if (dryRun) {
        logger.info('Dry run completed - no data saved to database', {
          generated: workspaces.length,
          valid: validWorkspaces.length,
          validationStats
        })
        
        const duration = timer.finish({ dryRun: true, count: workspaces.length })
        return {
          success: true,
          generated: workspaces.length,
          valid: validWorkspaces.length,
          saved: 0,
          duration,
          validationStats
        }
      }

      // Save to database in batches
      let savedCount = 0
      const errors: string[] = []

      logger.info(`Saving ${validWorkspaces.length} workspaces to database`)

      for (let i = 0; i < validWorkspaces.length; i += batchSize) {
        const batch = validWorkspaces.slice(i, i + batchSize)
        
        try {
          for (const workspace of batch) {
            // Check if workspace already exists (by sourceId)
            const existing = await prisma.workspace.findFirst({
              where: { sourceId: workspace.sourceId }
            })

            if (existing) {
              logger.debug('Workspace already exists, skipping', { sourceId: workspace.sourceId })
              continue
            }

            // Create workspace
            await prisma.workspace.create({
              data: {
                name: workspace.name,
                slug: this.generateSlug(workspace.name),
                description: workspace.description,
                address: workspace.address,
                city: workspace.city,
                country: workspace.country,
                latitude: workspace.latitude,
                longitude: workspace.longitude,
                phone: workspace.phone,
                email: workspace.email,
                website: workspace.website,
                images: workspace.images,
                amenities: workspace.amenities,
                pricingCurrency: workspace.pricingCurrency,
                hotDeskPrice: workspace.hotDeskPrice,
                dedicatedDeskPrice: workspace.dedicatedDeskPrice,
                privateOfficePrice: workspace.privateOfficePrice,
                source: workspace.source,
                sourceId: workspace.sourceId,
                rating: workspace.rating,
                reviewCount: workspace.reviewCount || 0,
                // Default required fields
                isActive: true,
                status: 'ACTIVE',
                digitalScore: faker.number.int({ min: 60, max: 95 }),
                workspaceTypeId: 1, // Default workspace type
                planId: 1, // Default plan
                userId: null // System-generated
              }
            })

            savedCount++
          }

          logger.info(`Processed batch ${Math.floor(i / batchSize) + 1}`, {
            processed: Math.min(i + batchSize, validWorkspaces.length),
            total: validWorkspaces.length,
            saved: savedCount
          })

        } catch (error) {
          const errorMsg = `Batch ${Math.floor(i / batchSize) + 1} failed: ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMsg)
          logger.error('Batch processing failed', error instanceof Error ? error : new Error(String(error)), { batch: Math.floor(i / batchSize) + 1 })
        }
      }

      const duration = timer.finish({
        generated: workspaces.length,
        saved: savedCount,
        errors: errors.length
      })

      logger.info('Sample data population completed', {
        generated: workspaces.length,
        valid: validWorkspaces.length,
        saved: savedCount,
        errors: errors.length,
        duration: `${duration}ms`
      })

      return {
        success: savedCount > 0,
        generated: workspaces.length,
        valid: validWorkspaces.length,
        saved: savedCount,
        errors,
        duration,
        validationStats
      }

    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      logger.error('Sample data population failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim()
      .slice(0, 60)
  }

  async cleanup(): Promise<void> {
    await prisma.$disconnect()
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  
  let count = 50
  let validateData = true
  let dryRun = false
  let batchSize = 10

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--count':
        count = parseInt(args[++i])
        break
      case '--no-validation':
        validateData = false
        break
      case '--dry-run':
        dryRun = true
        break
      case '--batch-size':
        batchSize = parseInt(args[++i])
        break
      case '--help':
        console.log(`
Sample Data Population Tool

Usage:
  npx tsx scripts/populate-sample-data.ts [options]

Options:
  --count <number>      Number of sample workspaces to generate (default: 50)
  --no-validation      Skip data quality validation
  --dry-run            Generate data but don't save to database
  --batch-size <number> Database batch size (default: 10)
  --help               Show this help

Examples:
  # Generate 50 sample workspaces with validation
  npx tsx scripts/populate-sample-data.ts

  # Generate 100 workspaces without validation
  npx tsx scripts/populate-sample-data.ts --count 100 --no-validation

  # Dry run to test data generation
  npx tsx scripts/populate-sample-data.ts --count 20 --dry-run

  # Use smaller batch size for memory constraints
  npx tsx scripts/populate-sample-data.ts --count 200 --batch-size 5
        `)
        process.exit(0)
    }
  }

  const populator = new SampleDataPopulator()

  try {
    console.log(`🏢 Generating ${count} sample workspaces...`)
    
    const result = await populator.populateDatabase({
      count,
      validateData,
      dryRun,
      batchSize
    })

    console.log('\\n✅ Sample data population completed!')
    console.log(`📊 Generated: ${result.generated}`)
    console.log(`✅ Valid: ${result.valid}`)
    console.log(`💾 Saved: ${result.saved}`)
    
    if (result.validationStats) {
      console.log(`📈 Average quality score: ${result.validationStats.averageScore}/100`)
    }

    if (result.errors.length > 0) {
      console.log(`⚠️  Errors: ${result.errors.length}`)
      result.errors.forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`)
      })
    }

    console.log(`⏱️  Duration: ${result.duration}ms`)

    process.exit(0)

  } catch (error) {
    console.error('❌ Sample data population failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    await populator.cleanup()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { SampleDataGenerator, SampleDataPopulator }