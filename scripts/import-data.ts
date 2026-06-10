#!/usr/bin/env tsx

/**
 * Data import CLI script for Workspace Atlas
 * Imports workspace data from Google Places API into the database
 */

import { logger } from '@/lib/logger'
import { DataImportPipeline } from '@/lib/data-import/import-pipeline'

interface ImportOptions {
  source: 'google-places' | 'manual'
  batchSize: number
  maxConcurrent: number
  dryRun: boolean
  skipExisting: boolean
  validateData: boolean
  collectImages: boolean
  cities?: string[]
}

async function main() {
  const args = process.argv.slice(2)
  const options: ImportOptions = {
    source: 'google-places',
    batchSize: 10,
    maxConcurrent: 3,
    dryRun: false,
    skipExisting: true,
    validateData: true,
    collectImages: true
  }

  // Parse command line arguments
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    
    switch (arg) {
      case '--source':
        options.source = args[++i] as 'google-places' | 'manual'
        break
      case '--batch-size':
        options.batchSize = parseInt(args[++i])
        break
      case '--max-concurrent':
        options.maxConcurrent = parseInt(args[++i])
        break
      case '--dry-run':
        options.dryRun = true
        break
      case '--force':
        options.skipExisting = false
        break
      case '--no-validation':
        options.validateData = false
        break
      case '--no-images':
        options.collectImages = false
        break
      case '--cities':
        options.cities = args[++i].split(',').map(c => c.trim())
        break
      case '--help':
        printHelp()
        process.exit(0)
      default:
        if (arg.startsWith('--')) {
          console.error(`Unknown option: ${arg}`)
          printHelp()
          process.exit(1)
        }
    }
  }

  logger.info('Starting data import', { options })

  try {
    // Create import pipeline
    const pipeline = new DataImportPipeline({
      batchSize: options.batchSize,
      maxConcurrent: options.maxConcurrent,
      skipExisting: options.skipExisting,
      validateData: options.validateData,
      dryRun: options.dryRun,
      collectImages: options.collectImages
    })

    let result
    switch (options.source) {
      case 'google-places':
        if (!process.env.GOOGLE_PLACES_API_KEY) {
          throw new Error('GOOGLE_PLACES_API_KEY environment variable is required')
        }
        result = await pipeline.importFromGooglePlaces()
        break
      default:
        throw new Error(`Unsupported source: ${options.source}`)
    }

    // Print results
    console.log('\n=== Import Results ===')
    console.log(`Success: ${result.success}`)
    console.log(`Processed: ${result.stats.processed}`)
    console.log(`Imported: ${result.stats.imported}`)
    console.log(`Skipped: ${result.stats.skipped}`)
    console.log(`Errors: ${result.stats.errors}`)
    console.log(`Duration: ${result.stats.duration}ms`)

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===')
      result.errors.slice(0, 10).forEach(error => console.log(error))
      if (result.errors.length > 10) {
        console.log(`... and ${result.errors.length - 10} more errors`)
      }
    }

    // Cleanup
    await pipeline.cleanup()

    process.exit(result.success ? 0 : 1)

  } catch (error) {
    logger.error('Import failed', error instanceof Error ? error : new Error(String(error)))
    console.error('Import failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

function printHelp() {
  console.log(`
Workspace Atlas Data Import Tool

Usage: tsx scripts/import-data.ts [options]

Options:
  --source <source>       Data source (google-places, manual) [default: google-places]
  --batch-size <size>     Number of items to process in each batch [default: 10]
  --max-concurrent <num>  Maximum concurrent requests [default: 3]
  --dry-run              Preview what would be imported without making changes
  --force                 Import even if workspace already exists
  --no-validation        Skip data validation
  --no-images            Skip image collection and processing
  --cities <list>        Comma-separated list of cities to process
  --help                 Show this help message

Examples:
  # Import all data from Google Places
  tsx scripts/import-data.ts

  # Dry run to see what would be imported
  tsx scripts/import-data.ts --dry-run

  # Import specific cities only
  tsx scripts/import-data.ts --cities "New York,San Francisco,London"

  # Import with custom batch size and no validation
  tsx scripts/import-data.ts --batch-size 20 --no-validation

Environment Variables:
  DATABASE_URL           PostgreSQL connection string
  GOOGLE_PLACES_API_KEY  Google Places API key (required for google-places source)
`)
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})