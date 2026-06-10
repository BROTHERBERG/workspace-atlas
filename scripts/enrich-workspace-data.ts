#!/usr/bin/env npx tsx

/**
 * Data Enrichment CLI Tool
 * Enriches workspace data with Google Places API details
 */

import { PrismaClient } from '@prisma/client'
import { PlacesEnricher, EnrichmentRequest, EnrichmentResult } from '@/lib/data-enrichment/places-enricher'
import { logger, PerformanceTimer } from '@/lib/logger'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

interface EnrichmentConfig {
  limit?: number
  batchSize?: number
  maxConcurrent?: number
  delayMs?: number
  dryRun?: boolean
  outputFile?: string
  includePhotos?: boolean
  includeReviews?: boolean
  confidenceThreshold?: number
  workspaceIds?: string[]
  cities?: string[]
  countries?: string[]
}

interface EnrichmentStats {
  totalProcessed: number
  successful: number
  failed: number
  averageConfidence: number
  processingTime: number
  enrichmentDetails: {
    withPhotos: number
    withReviews: number
    withOpeningHours: number
    withPricing: number
  }
}

class DataEnrichmentManager {
  private enricher: PlacesEnricher
  private config: EnrichmentConfig

  constructor(config: EnrichmentConfig = {}) {
    this.config = {
      limit: 50,
      batchSize: 10,
      maxConcurrent: 3,
      delayMs: 1000,
      dryRun: false,
      includePhotos: true,
      includeReviews: true,
      confidenceThreshold: 0.7,
      ...config
    }

    this.enricher = new PlacesEnricher({
      includePhotos: this.config.includePhotos,
      includeReviews: this.config.includeReviews,
      confidenceThreshold: this.config.confidenceThreshold,
      respectRateLimit: true,
      collectImages: !this.config.dryRun
    })
  }

  /**
   * Enrich workspace data from database
   */
  async enrichDatabaseWorkspaces(): Promise<EnrichmentStats> {
    const timer = new PerformanceTimer('Database enrichment')
    logger.info('Starting database workspace enrichment', { config: this.config })

    try {
      // Build query filters
      const whereClause: any = {
        isActive: true,
        status: 'ACTIVE'
      }

      if (this.config.workspaceIds?.length) {
        whereClause.id = { in: this.config.workspaceIds }
      }

      if (this.config.cities?.length) {
        whereClause.city = { in: this.config.cities }
      }

      if (this.config.countries?.length) {
        whereClause.country = { in: this.config.countries }
      }

      // Fetch workspaces to enrich
      const workspaces = await prisma.workspace.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          country: true,
          website: true,
          phone: true,
          latitude: true,
          longitude: true,
          rating: true,
          images: true,
          source: true,
          updatedAt: true
        },
        ...(this.config.limit && { take: this.config.limit }),
        orderBy: { updatedAt: 'asc' } // Enrich oldest data first
      })

      logger.info(`Found ${workspaces.length} workspaces to enrich`)

      if (workspaces.length === 0) {
        return {
          totalProcessed: 0,
          successful: 0,
          failed: 0,
          averageConfidence: 0,
          processingTime: timer.finish(),
          enrichmentDetails: {
            withPhotos: 0,
            withReviews: 0,
            withOpeningHours: 0,
            withPricing: 0
          }
        }
      }

      // Convert to enrichment requests
      const enrichmentRequests: EnrichmentRequest[] = workspaces.map(workspace => ({
        workspaceId: workspace.id,
        name: workspace.name,
        address: workspace.address || undefined,
        city: workspace.city || undefined,
        country: workspace.country || undefined,
        website: workspace.website || undefined,
        phone: workspace.phone || undefined,
        latitude: workspace.latitude || undefined,
        longitude: workspace.longitude || undefined
      }))

      // Process enrichment in batches
      const allResults: EnrichmentResult[] = []
      
      for (let i = 0; i < enrichmentRequests.length; i += this.config.batchSize!) {
        const batch = enrichmentRequests.slice(i, i + this.config.batchSize!)
        
        logger.info(`Processing batch ${Math.floor(i / this.config.batchSize!) + 1}`, {
          batchSize: batch.length,
          processed: i,
          total: enrichmentRequests.length
        })

        const batchResults = await this.enricher.enrichWorkspaces(batch, {
          maxConcurrent: this.config.maxConcurrent,
          delayMs: this.config.delayMs
        })

        allResults.push(...batchResults)

        // Save results to database if not dry run
        if (!this.config.dryRun) {
          await this.saveBatchResults(batchResults)
        }

        // Progress logging
        const successfulInBatch = batchResults.filter(r => r.success).length
        logger.info(`Batch completed`, {
          successful: successfulInBatch,
          failed: batchResults.length - successfulInBatch,
          totalProcessed: i + batch.length
        })
      }

      // Calculate statistics
      const stats = this.calculateStats(allResults, timer.finish({
        total: allResults.length,
        successful: allResults.filter(r => r.success).length
      }))

      // Output results
      await this.outputResults(allResults, stats)

      logger.info('Database enrichment completed', { stats })
      return stats

    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      logger.error('Database enrichment failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }

  /**
   * Save enrichment results to database
   */
  private async saveBatchResults(results: EnrichmentResult[]): Promise<void> {
    const successfulResults = results.filter(r => r.success && r.enrichedData)

    for (const result of successfulResults) {
      try {
        const updateData: any = {}
        const enriched = result.enrichedData!

        // Update basic information
        if (enriched.website && enriched.website !== '') {
          updateData.website = enriched.website
        }
        
        if (enriched.phone && enriched.phone !== '') {
          updateData.phone = enriched.phone
        }

        if (enriched.address && enriched.address !== '') {
          updateData.address = enriched.address
        }

        // Update coordinates if more precise
        if (enriched.latitude && enriched.longitude) {
          updateData.latitude = enriched.latitude
          updateData.longitude = enriched.longitude
        }

        // Update ratings
        if (enriched.rating && enriched.rating > 0) {
          updateData.rating = enriched.rating
        }

        if (enriched.reviewCount && enriched.reviewCount > 0) {
          updateData.reviewCount = enriched.reviewCount
        }

        // Update business status
        if (enriched.businessStatus) {
          updateData.businessStatus = enriched.businessStatus
        }

        // Update amenities if enriched data provides more
        if (enriched.amenities && enriched.amenities.length > 0) {
          const existing = await prisma.workspace.findUnique({
            where: { id: result.workspaceId },
            select: { amenities: true }
          })

          if (existing) {
            const existingAmenities = (existing.amenities as string[]) || []
            const mergedAmenities = [...new Set([...existingAmenities, ...enriched.amenities])]
            updateData.amenities = mergedAmenities
          }
        }

        // Update images with enhanced photos
        if (enriched.photos && enriched.photos.length > 0) {
          const photoUrls = enriched.photos
            .map(photo => photo.url)
            .filter(Boolean) as string[]
          
          if (photoUrls.length > 0) {
            const existing = await prisma.workspace.findUnique({
              where: { id: result.workspaceId },
              select: { images: true }
            })

            if (existing) {
              const existingImages = (existing.images as string[]) || []
              const mergedImages = [...new Set([...existingImages, ...photoUrls])]
              updateData.images = mergedImages.slice(0, 20) // Limit to 20 images
            }
          }
        }

        // Update opening hours description
        if (enriched.openingHours?.weekdayText) {
          updateData.hoursDescription = enriched.openingHours.weekdayText.join('; ')
        }

        // Update workspace if we have data to update
        if (Object.keys(updateData).length > 0) {
          updateData.updatedAt = new Date()
          updateData.lastEnriched = new Date()

          await prisma.workspace.update({
            where: { id: result.workspaceId },
            data: updateData
          })

          logger.debug('Workspace enriched and saved', {
            workspaceId: result.workspaceId,
            fieldsUpdated: Object.keys(updateData).length,
            confidence: result.confidence
          })
        }

      } catch (error) {
        logger.error('Failed to save enrichment result', error instanceof Error ? error : new Error(String(error)), {
          workspaceId: result.workspaceId
        })
      }
    }
  }

  /**
   * Calculate enrichment statistics
   */
  private calculateStats(results: EnrichmentResult[], processingTime: number): EnrichmentStats {
    const successful = results.filter(r => r.success)
    const failed = results.filter(r => !r.success)

    const avgConfidence = successful.length > 0 
      ? successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length
      : 0

    const enrichmentDetails = {
      withPhotos: successful.filter(r => r.enrichedData?.photos?.length).length,
      withReviews: successful.filter(r => r.enrichedData?.reviews?.length).length,
      withOpeningHours: successful.filter(r => r.enrichedData?.openingHours).length,
      withPricing: successful.filter(r => r.enrichedData?.priceLevel !== undefined).length
    }

    return {
      totalProcessed: results.length,
      successful: successful.length,
      failed: failed.length,
      averageConfidence: Math.round(avgConfidence * 100) / 100,
      processingTime,
      enrichmentDetails
    }
  }

  /**
   * Output enrichment results
   */
  private async outputResults(results: EnrichmentResult[], stats: EnrichmentStats): Promise<void> {
    const output = {
      timestamp: new Date().toISOString(),
      config: this.config,
      stats,
      results: this.config.dryRun ? results : results.filter(r => r.success).slice(0, 10), // Sample results
      failedWorkspaces: results.filter(r => !r.success).map(r => ({
        workspaceId: r.workspaceId,
        error: r.error
      }))
    }

    if (this.config.outputFile) {
      const outputPath = path.resolve(this.config.outputFile)
      await fs.promises.writeFile(outputPath, JSON.stringify(output, null, 2))
      logger.info(`Results saved to ${outputPath}`)
    }
  }

  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect()
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2)
  const config: EnrichmentConfig = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--limit':
        config.limit = parseInt(args[++i])
        break
      case '--batch-size':
        config.batchSize = parseInt(args[++i])
        break
      case '--concurrent':
        config.maxConcurrent = parseInt(args[++i])
        break
      case '--delay':
        config.delayMs = parseInt(args[++i])
        break
      case '--output':
        config.outputFile = args[++i]
        break
      case '--confidence':
        config.confidenceThreshold = parseFloat(args[++i])
        break
      case '--workspaces':
        config.workspaceIds = args[++i].split(',')
        break
      case '--cities':
        config.cities = args[++i].split(',')
        break
      case '--countries':
        config.countries = args[++i].split(',')
        break
      case '--no-photos':
        config.includePhotos = false
        break
      case '--no-reviews':
        config.includeReviews = false
        break
      case '--dry-run':
        config.dryRun = true
        break
      case '--help':
        console.log(`
Data Enrichment Tool

Usage:
  npx tsx scripts/enrich-workspace-data.ts [options]

Options:
  --limit <number>         Limit number of workspaces to enrich (default: 50)
  --batch-size <number>    Batch size for processing (default: 10)
  --concurrent <number>    Max concurrent API calls (default: 3)
  --delay <ms>             Delay between batches in ms (default: 1000)
  --output <file>          Save detailed results to JSON file
  --confidence <float>     Minimum confidence threshold 0-1 (default: 0.7)
  --workspaces <ids>       Comma-separated workspace IDs to enrich
  --cities <names>         Comma-separated cities to enrich
  --countries <names>      Comma-separated countries to enrich
  --no-photos              Don't include photo data
  --no-reviews             Don't include review data
  --dry-run                Don't save results to database
  --help                   Show this help

Examples:
  # Enrich 20 workspaces with photos and reviews
  npx tsx scripts/enrich-workspace-data.ts --limit 20

  # Enrich specific workspaces
  npx tsx scripts/enrich-workspace-data.ts --workspaces id1,id2,id3

  # Enrich workspaces in specific cities
  npx tsx scripts/enrich-workspace-data.ts --cities "New York,London,Tokyo"

  # Dry run with detailed output
  npx tsx scripts/enrich-workspace-data.ts --limit 10 --dry-run --output enrichment-test.json

  # Conservative enrichment with high confidence threshold
  npx tsx scripts/enrich-workspace-data.ts --confidence 0.85 --limit 100
        `)
        process.exit(0)
    }
  }

  // Validate Google Places API key
  if (!process.env.GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY environment variable is required')
    console.log('Please set your Google Places API key in the .env file')
    process.exit(1)
  }

  const manager = new DataEnrichmentManager(config)

  try {
    console.log(`🔍 Starting workspace data enrichment...`)
    console.log(`📊 Config: ${config.limit || 50} workspaces, ${config.batchSize || 10} batch size, ${config.maxConcurrent || 3} concurrent`)
    
    if (config.dryRun) {
      console.log(`🧪 DRY RUN MODE - No data will be saved`)
    }

    const stats = await manager.enrichDatabaseWorkspaces()

    console.log('\\n✅ Data enrichment completed!')
    console.log(`📊 Processed: ${stats.totalProcessed}`)
    console.log(`✅ Successful: ${stats.successful}`)
    console.log(`❌ Failed: ${stats.failed}`)
    console.log(`🎯 Success rate: ${Math.round((stats.successful / stats.totalProcessed) * 100)}%`)
    console.log(`📈 Average confidence: ${stats.averageConfidence}`)
    console.log(`⏱️  Processing time: ${stats.processingTime}ms`)

    console.log('\\n📸 Enrichment Details:')
    console.log(`   Photos: ${stats.enrichmentDetails.withPhotos}`)
    console.log(`   Reviews: ${stats.enrichmentDetails.withReviews}`)
    console.log(`   Hours: ${stats.enrichmentDetails.withOpeningHours}`)
    console.log(`   Pricing: ${stats.enrichmentDetails.withPricing}`)

    if (stats.averageConfidence < 0.8) {
      console.log('\\n⚠️  Consider increasing confidence threshold for better match quality')
    }

    process.exit(0)

  } catch (error) {
    console.error('❌ Data enrichment failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  } finally {
    await manager.cleanup()
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { DataEnrichmentManager }