/**
 * Data import pipeline for populating database with scraped workspace data
 * Handles validation, normalization, and batch processing
 */

import { logger, PerformanceTimer } from '@/lib/logger'
import { googlePlaces, MAJOR_CITIES_QUERIES } from '@/lib/scraping/google-places'
import { imageCollector } from '@/lib/server/image-collector'
import type { WorkspaceRawData } from '@/lib/scraping/scraper-core'
import { prisma } from '@/lib/db'

export interface ImportConfig {
  batchSize: number
  maxConcurrent: number
  skipExisting: boolean
  validateData: boolean
  dryRun: boolean
  collectImages: boolean
}

export interface ImportStats {
  processed: number
  imported: number
  skipped: number
  errors: number
  duration: number
  startTime: Date
}

export interface ImportResult {
  success: boolean
  stats: ImportStats
  errors: string[]
}

/**
 * Main data import pipeline
 */
export class DataImportPipeline {
  private config: ImportConfig

  constructor(config?: Partial<ImportConfig>) {
    this.config = {
      batchSize: 10,
      maxConcurrent: 3,
      skipExisting: true,
      validateData: true,
      dryRun: false,
      collectImages: true,
      ...config
    }
  }

  /**
   * Import workspace data from Google Places
   */
  async importFromGooglePlaces(): Promise<ImportResult> {
    const timer = new PerformanceTimer('Google Places import')
    const stats: ImportStats = {
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      duration: 0,
      startTime: new Date()
    }
    const errors: string[] = []

    logger.info('Starting Google Places data import', {
      config: this.config,
      citiesCount: MAJOR_CITIES_QUERIES.length
    })

    try {
      // Process each city query
      for (const query of MAJOR_CITIES_QUERIES) {
        logger.info('Processing city', { city: query.city, country: query.country })

        try {
          // Search for coworking spaces
          const places = await googlePlaces.searchCoworkingSpaces(query)
          logger.info('Found places', { city: query.city, count: places.length })

          // Process places in batches
          for (let i = 0; i < places.length; i += this.config.batchSize) {
            const batch = places.slice(i, i + this.config.batchSize)
            
            const batchResults = await this.processBatch(batch)
            stats.processed += batchResults.processed
            stats.imported += batchResults.imported
            stats.skipped += batchResults.skipped
            stats.errors += batchResults.errors
            // batchResults.errors is a number, not array

            // Rate limiting between batches
            if (i + this.config.batchSize < places.length) {
              await this.sleep(1000)
            }
          }
        } catch (error) {
          const errorMsg = `Failed to process city ${query.city}: ${error instanceof Error ? error.message : String(error)}`
          errors.push(errorMsg)
          stats.errors++
          logger.error('City processing failed', error instanceof Error ? error : new Error(String(error)), { city: query.city })
        }
      }

      stats.duration = timer.finish({
        processed: stats.processed,
        imported: stats.imported,
        skipped: stats.skipped,
        errors: stats.errors
      })

      logger.info('Google Places import completed', { stats })

      return {
        success: stats.errors < stats.processed / 2, // Consider success if less than 50% errors
        stats,
        errors
      }
    } catch (error) {
      stats.duration = timer.finish({ error: error instanceof Error ? error.message : String(error) })
      const errorMsg = `Import pipeline failed: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      logger.error('Import pipeline failed', error instanceof Error ? error : new Error(String(error)), { stats })

      return {
        success: false,
        stats,
        errors
      }
    }
  }

  /**
   * Process a batch of Google Places
   */
  private async processBatch(places: any[]): Promise<ImportStats> {
    const batchStats: ImportStats = {
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      duration: 0,
      startTime: new Date()
    }

    const promises = places.map(async (place) => {
      try {
        batchStats.processed++

        // Get detailed place information
        const details = await googlePlaces.getPlaceDetails(place.place_id)
        if (!details) {
          batchStats.errors++
          return
        }

        // Convert to our format
        const workspaceData = googlePlaces.convertToWorkspaceData(details)

        // Validate data
        if (this.config.validateData && !this.validateWorkspaceData(workspaceData)) {
          batchStats.skipped++
          return
        }

        // Check if already exists
        if (this.config.skipExisting) {
          const existing = await this.findExistingWorkspace(workspaceData)
          if (existing) {
            batchStats.skipped++
            return
          }
        }

        // Import to database
        if (!this.config.dryRun) {
          await this.importWorkspace(workspaceData)
        }
        batchStats.imported++

      } catch (error) {
        batchStats.errors++
        logger.error('Failed to process place', error instanceof Error ? error : new Error(String(error)), { placeId: place.place_id })
      }
    })

    await Promise.all(promises)
    return batchStats
  }

  /**
   * Validate workspace data
   */
  private validateWorkspaceData(data: any): boolean {
    // Basic validation
    if (!data.name || data.name.trim().length < 2) {
      logger.warn('Invalid workspace name', { name: data.name })
      return false
    }

    if (!data.address || data.address.trim().length < 10) {
      logger.warn('Invalid workspace address', { address: data.address })
      return false
    }

    if (!data.coordinates || data.coordinates.length !== 2) {
      logger.warn('Invalid workspace coordinates', { coordinates: data.coordinates })
      return false
    }

    return true
  }

  /**
   * Find existing workspace to avoid duplicates
   */
  private async findExistingWorkspace(data: any): Promise<any> {
    try {
      // Check by source ID first
      if (data.sourceId) {
        const existing = await prisma.workspace.findFirst({
          where: {
            OR: [
              { sourceId: data.sourceId },
              { 
                name: { contains: data.name, mode: 'insensitive' },
                address: { contains: data.address?.slice(0, 50) || '', mode: 'insensitive' }
              }
            ]
          }
        })
        return existing
      }

      // Fallback to name/address matching
      return await prisma.workspace.findFirst({
        where: {
          name: { contains: data.name, mode: 'insensitive' },
          address: { contains: data.address?.slice(0, 50) || '', mode: 'insensitive' }
        }
      })
    } catch (error) {
      logger.warn('Failed to check existing workspace', { error: error instanceof Error ? error.message : String(error) })
      return null
    }
  }

  /**
   * Import workspace to database
   */
  private async importWorkspace(data: any): Promise<void> {
    try {
      // Generate unique slug from name
      const baseSlug = this.generateSlug(data.name)
      const slug = await this.ensureUniqueSlug(baseSlug)

      const workspace = await prisma.workspace.create({
        data: {
          name: data.name,
          slug: slug,
          description: data.description,
          address: data.address,
          city: data.city,
          country: data.country,
          latitude: data.coordinates?.[0],
          longitude: data.coordinates?.[1],
          phone: data.phone,
          email: data.email,
          website: data.website,
          images: data.images || [],
          amenities: data.amenities || [],
          hoursDescription: data.hours,
          rating: data.rating,
          reviewCount: data.reviewCount || 0,
          source: data.source,
          sourceId: data.sourceId,
          scrapedAt: data.scrapedAt,
          
          // Pricing data
          pricingCurrency: data.pricing?.currency || 'USD',
          hotDeskPrice: data.pricing?.hotDesk,
          dedicatedDeskPrice: data.pricing?.dedicatedDesk,
          privateOfficePrice: data.pricing?.privateOffice,

          // Social media data
          instagramUrl: data.socialMedia?.instagram,
          twitterUrl: data.socialMedia?.twitter,
          linkedinUrl: data.socialMedia?.linkedin,
          facebookUrl: data.socialMedia?.facebook,

          // Default values for required fields
          isActive: true,
          digitalScore: 0, // Will be calculated later
          workspaceTypeId: 1, // Default workspace type
          planId: 1, // Default plan
          userId: null // System-imported
        }
      })

      // Collect and process images if enabled
      let processedImages: string[] = data.images || []
      if (this.config.collectImages && data.images && data.images.length > 0 && !this.config.dryRun) {
        try {
          const imageResult = await imageCollector.collectWorkspaceImages(workspace.id, data.images)
          if (imageResult.success && imageResult.images.length > 0) {
            processedImages = imageResult.images.map(img => img.filename)
            
            // Update workspace with processed image paths
            await prisma.workspace.update({
              where: { id: workspace.id },
              data: { images: processedImages }
            })

            logger.info('Images collected for workspace', {
              workspaceId: workspace.id,
              originalCount: data.images.length,
              processedCount: imageResult.images.length,
              totalSize: `${Math.round(imageResult.stats.totalSize / 1024)}KB`
            })
          }
        } catch (error) {
          logger.warn('Image collection failed for workspace', {
            workspaceId: workspace.id,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      logger.info('Workspace imported', { 
        id: workspace.id, 
        name: workspace.name,
        source: data.source,
        images: processedImages.length
      })
    } catch (error) {
      logger.error('Failed to import workspace', error instanceof Error ? error : new Error(String(error)), {
        workspaceName: data.name,
        source: data.source
      })
      throw error
    }
  }

  /**
   * Import raw workspace data array
   */
  async importWorkspaceData(workspaces: WorkspaceRawData[]): Promise<ImportResult> {
    const timer = new PerformanceTimer('Workspace data import')
    const stats: ImportStats = {
      processed: 0,
      imported: 0,
      skipped: 0,
      errors: 0,
      duration: 0,
      startTime: new Date()
    }
    const errors: string[] = []

    logger.info('Starting workspace data import', {
      config: this.config,
      workspacesCount: workspaces.length
    })

    try {
      // Process workspaces in batches
      for (let i = 0; i < workspaces.length; i += this.config.batchSize) {
        const batch = workspaces.slice(i, i + this.config.batchSize)
        
        const promises = batch.map(async (workspace) => {
          try {
            stats.processed++

            // Validate data
            if (this.config.validateData && !this.validateWorkspaceData(workspace)) {
              stats.skipped++
              return
            }

            // Check if already exists
            if (this.config.skipExisting) {
              const existing = await this.findExistingWorkspace(workspace)
              if (existing) {
                stats.skipped++
                return
              }
            }

            // Import to database
            if (!this.config.dryRun) {
              await this.importWorkspace(workspace)
            }
            stats.imported++

          } catch (error) {
            stats.errors++
            const errorMsg = `Failed to import ${workspace.name}: ${error instanceof Error ? error.message : String(error)}`
            errors.push(errorMsg)
            logger.error('Workspace import failed', error instanceof Error ? error : new Error(String(error)), { workspace: workspace.name })
          }
        })

        await Promise.all(promises)

        // Rate limiting between batches
        if (i + this.config.batchSize < workspaces.length) {
          await this.sleep(500)
        }
      }

      stats.duration = timer.finish({
        processed: stats.processed,
        imported: stats.imported,
        skipped: stats.skipped,
        errors: stats.errors
      })

      logger.info('Workspace data import completed', { stats })

      return {
        success: stats.errors < stats.processed / 2,
        stats,
        errors
      }
    } catch (error) {
      stats.duration = timer.finish({ error: error instanceof Error ? error.message : String(error) })
      const errorMsg = `Import failed: ${error instanceof Error ? error.message : String(error)}`
      errors.push(errorMsg)
      logger.error('Workspace import failed', error instanceof Error ? error : new Error(String(error)), { stats })

      return {
        success: false,
        stats,
        errors
      }
    }
  }

  /**
   * Generate slug from workspace name
   */
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim()
      .slice(0, 60) // Limit length
  }

  /**
   * Ensure slug is unique by appending number if needed
   */
  private async ensureUniqueSlug(baseSlug: string): Promise<string> {
    let slug = baseSlug
    let counter = 1

    while (true) {
      try {
        const existing = await prisma.workspace.findUnique({
          where: { slug }
        })
        
        if (!existing) {
          return slug
        }

        slug = `${baseSlug}-${counter}`
        counter++
      } catch (error) {
        logger.warn('Error checking slug uniqueness', { slug, error: error instanceof Error ? error.message : String(error) })
        return `${baseSlug}-${Date.now()}` // Fallback to timestamp
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Close database connections
   */
  async cleanup(): Promise<void> {
    await prisma.$disconnect()
  }
}

/**
 * Global import pipeline instance
 */
export const importPipeline = new DataImportPipeline()