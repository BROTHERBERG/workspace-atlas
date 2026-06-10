#!/usr/bin/env npx ts-node

/**
 * Database population script
 * Scrapes coworking spaces from major platforms and populates the database
 */

import { ScraperOrchestrator } from '@/lib/scraping/coworking-scrapers'
import { DataQualityOrchestrator } from '@/lib/data-quality/validator'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

interface PopulateOptions {
  sources?: string[]
  limit?: number
  dryRun?: boolean
  skipValidation?: boolean
  batchSize?: number
}

class DatabasePopulator {
  private scraperOrchestrator: ScraperOrchestrator
  private qualityOrchestrator: DataQualityOrchestrator

  constructor() {
    this.scraperOrchestrator = new ScraperOrchestrator()
    this.qualityOrchestrator = new DataQualityOrchestrator()
  }

  async populate(options: PopulateOptions = {}) {
    const {
      sources,
      limit,
      dryRun = false,
      skipValidation = false,
      batchSize = 50
    } = options

    logger.info('Starting database population', { options })

    try {
      // Step 1: Get existing workspaces for deduplication
      let existingWorkspaces: any[]
      try {
        existingWorkspaces = await prisma.workspace.findMany({
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            website: true,
            sourceId: true,
            source: true
          }
        }).then(workspaces => workspaces.map(w => ({
          ...w,
          sourceId: w.sourceId || undefined,
          source: w.source || undefined
        })))
      } catch (dbError) {
        logger.warn('Database not available, using empty existing workspaces list for test')
        existingWorkspaces = []
      }

      logger.info('Found existing workspaces', { count: existingWorkspaces.length })

      // Step 2: Scrape new data
      logger.info('Starting data scraping...')
      const scrapedData = await this.scraperOrchestrator.scrapeAll({
        sources,
        maxConcurrent: 1,
        respectRateLimit: true
      })

      logger.info('Scraping completed', { totalScraped: scrapedData.length })

      if (scrapedData.length === 0) {
        logger.warn('No data scraped, exiting')
        return
      }

      // Limit results if specified
      const dataToProcess = limit ? scrapedData.slice(0, limit) : scrapedData

      // Step 3: Process data quality and deduplication
      let processedData
      if (skipValidation) {
        processedData = {
          processed: dataToProcess.map(data => ({
            data,
            metrics: {
              completeness: 100,
              accuracy: 100,
              consistency: 100,
              timeliness: 100,
              overall: 100
            }
          })),
          rejected: [],
          summary: {
            input: dataToProcess.length,
            processed: dataToProcess.length,
            rejected: 0,
            duplicates: 0,
            averageQuality: 100
          }
        }
      } else {
        logger.info('Processing data quality and deduplication...')
        processedData = await this.qualityOrchestrator.processWorkspaces(
          dataToProcess,
          existingWorkspaces
        )
      }

      logger.info('Data quality processing completed', processedData.summary)

      if (dryRun) {
        logger.info('Dry run mode - not saving to database')
        this.printSummary(processedData)
        return
      }

      // Step 4: Insert valid data into database
      if (processedData.processed.length > 0) {
        logger.info('Inserting data into database...')
        await this.insertWorkspaces(processedData.processed, batchSize)
      }

      // Step 5: Log rejected data
      if (processedData.rejected.length > 0) {
        logger.warn('Rejected workspaces', {
          count: processedData.rejected.length,
          examples: processedData.rejected.slice(0, 5).map(r => ({
            name: r.data.name,
            reasons: r.reasons
          }))
        })
      }

      this.printSummary(processedData)

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error))
      logger.error('Database population failed', errorObj)
      throw errorObj
    }
  }

  private async insertWorkspaces(
    processedWorkspaces: Array<{
      data: any
      metrics: any
    }>,
    batchSize: number
  ): Promise<void> {
    const total = processedWorkspaces.length
    let inserted = 0
    let skipped = 0
    let errors = 0

    for (let i = 0; i < total; i += batchSize) {
      const batch = processedWorkspaces.slice(i, i + batchSize)
      
      logger.info(`Processing batch ${Math.floor(i / batchSize) + 1}`, {
        batchSize: batch.length,
        progress: `${i + batch.length}/${total}`
      })

      for (const { data, metrics } of batch) {
        try {
          // Find or create user (for now, use a default system user)
          let user = await prisma.user.findFirst({
            where: { email: 'system@workscapeatlas.com' }
          })

          if (!user) {
            user = await prisma.user.create({
              data: {
                email: 'system@workscapeatlas.com',
                name: 'System',
                role: 'ADMIN'
              }
            })
          }

          // Create workspace
          const workspaceData = {
            name: data.name,
            description: data.description || null,
            website: data.website || null,
            phone: data.phone || null,
            email: data.email || null,
            address: data.address || null,
            city: data.city || null,
            country: data.country || null,
            latitude: data.latitude || null,
            longitude: data.longitude || null,
            images: data.images || [],
            amenities: data.amenities || [],
            businessHours: data.businessHours || null,
            capacity: data.capacity || null,
            source: data.source || null,
            sourceId: data.sourceId || null,
            digitalScore: Math.round(metrics.overall),
            status: 'ACTIVE' as const,
            featured: false,
            userId: user.id,
            slug: this.createSlug(data.name, data.city)
          }

          const workspace = await prisma.workspace.create({
            data: workspaceData
          })

          // Add pricing if available
          if (data.pricing && data.pricing.length > 0) {
            await prisma.workspacePricing.createMany({
              data: data.pricing.map((pricing: any) => ({
                workspaceId: workspace.id,
                type: pricing.type || 'DAILY',
                price: pricing.amount,
                currency: pricing.currency || 'USD',
                description: pricing.period ? `Per ${pricing.period}` : null
              }))
            })
          }

          inserted++
          logger.debug(`Inserted workspace: ${data.name}`)

        } catch (error) {
          if (error instanceof Error && error.message.includes('Unique constraint')) {
            skipped++
            logger.debug(`Skipped duplicate workspace: ${data.name}`)
          } else {
            errors++
            logger.error(`Failed to insert workspace: ${data.name}`, error instanceof Error ? error : new Error(String(error)))
          }
        }
      }

      // Small delay between batches to be respectful to the database
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    logger.info('Database insertion completed', {
      total,
      inserted,
      skipped,
      errors
    })
  }

  private createSlug(name: string, city?: string): string {
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '')

    const citySlug = city
      ? city.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 3)
      : ''

    return citySlug ? `${baseSlug}-${citySlug}` : baseSlug
  }

  private printSummary(results: any): void {
    console.log('\n=== DATABASE POPULATION SUMMARY ===')
    console.log(`Input workspaces: ${results.summary.input}`)
    console.log(`Processed: ${results.summary.processed}`)
    console.log(`Rejected: ${results.summary.rejected}`)
    console.log(`Duplicates: ${results.summary.duplicates}`)
    console.log(`Average quality score: ${results.summary.averageQuality}/100`)

    if (results.rejected.length > 0) {
      console.log('\nTop rejection reasons:')
      const reasonCounts: Record<string, number> = {}
      results.rejected.forEach((r: any) => {
        r.reasons.forEach((reason: string) => {
          reasonCounts[reason] = (reasonCounts[reason] || 0) + 1
        })
      })

      Object.entries(reasonCounts)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .forEach(([reason, count]) => {
          console.log(`  - ${reason}: ${count}`)
        })
    }

    console.log('=====================================\n')
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  const options: PopulateOptions = {}

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    switch (arg) {
      case '--sources':
        options.sources = args[++i]?.split(',') || []
        break
      case '--limit':
        options.limit = parseInt(args[++i] || '0') || undefined
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--skip-validation':
        options.skipValidation = true
        break
      case '--batch-size':
        options.batchSize = parseInt(args[++i] || '50') || 50
        break
      case '--help':
        console.log(`
Usage: npx ts-node scripts/populate-database.ts [options]

Options:
  --sources <sources>      Comma-separated list of sources (wework,regus,coworker)
  --limit <number>         Limit number of workspaces to process
  --dry-run               Run without saving to database
  --skip-validation       Skip data quality validation
  --batch-size <number>   Batch size for database operations (default: 50)
  --help                  Show this help message

Examples:
  npx ts-node scripts/populate-database.ts --dry-run
  npx ts-node scripts/populate-database.ts --sources wework,regus --limit 100
  npx ts-node scripts/populate-database.ts --skip-validation --batch-size 25
        `)
        process.exit(0)
        break
    }
  }

  const populator = new DatabasePopulator()

  try {
    await populator.populate(options)
    console.log('Database population completed successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Database population failed:', error)
    process.exit(1)
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
}

export { DatabasePopulator }