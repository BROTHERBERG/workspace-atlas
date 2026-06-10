#!/usr/bin/env tsx

/**
 * Test script for the data import pipeline
 * Creates mock data and tests the import process
 */

import { logger } from '@/lib/logger'
import { DataImportPipeline } from '@/lib/data-import/import-pipeline'
import type { WorkspaceRawData } from '@/lib/scraping/scraper-core'

// Mock workspace data for testing
const mockWorkspaces: WorkspaceRawData[] = [
  {
    name: 'WeWork Manhattan',
    description: 'Modern coworking space in the heart of Manhattan with amazing amenities and networking opportunities.',
    address: '1460 Broadway, New York, NY 10036, USA',
    city: 'New York',
    country: 'United States',
    coordinates: [40.7589, -73.9851],
    phone: '+1 (555) 123-4567',
    email: 'manhattan@wework.com',
    website: 'https://www.wework.com/buildings/broadway--new-york--NY',
    images: [
      'https://example.com/images/wework-manhattan-1.jpg',
      'https://example.com/images/wework-manhattan-2.jpg'
    ],
    amenities: [
      'High-Speed WiFi',
      'Meeting Rooms',
      'Coffee Bar',
      'Printing',
      'Phone Booths',
      'Reception Services'
    ],
    pricing: {
      hotDesk: 50,
      dedicatedDesk: 75,
      privateOffice: 200,
      currency: 'USD'
    },
    socialMedia: {
      instagram: '@wework',
      twitter: '@wework',
      linkedin: 'company/wework'
    },
    hours: 'Monday-Friday: 8:00 AM - 6:00 PM\\nWeekend: 9:00 AM - 5:00 PM',
    rating: 4.5,
    reviewCount: 247,
    source: 'Test Data',
    sourceId: 'test-wework-manhattan',
    scrapedAt: new Date()
  },
  {
    name: 'Spaces London Bridge',
    description: 'Creative workspace with stunning Thames views and modern facilities for entrepreneurs and teams.',
    address: '32 London Bridge St, London SE1 9SG, UK',
    city: 'London',
    country: 'United Kingdom',
    coordinates: [51.5045, -0.0865],
    phone: '+44 20 1234 5678',
    website: 'https://www.spaces.com/london/london-bridge',
    images: [
      'https://example.com/images/spaces-london-1.jpg'
    ],
    amenities: [
      'High-Speed WiFi',
      'Meeting Rooms',
      'Event Space',
      'Bike Storage',
      'Wellness Room'
    ],
    pricing: {
      hotDesk: 35,
      dedicatedDesk: 55,
      privateOffice: 150,
      currency: 'GBP'
    },
    socialMedia: {
      instagram: '@spacesworks',
      linkedin: 'company/spaces'
    },
    hours: 'Monday-Sunday: 24/7 Access for Members',
    rating: 4.2,
    reviewCount: 89,
    source: 'Test Data',
    sourceId: 'test-spaces-london',
    scrapedAt: new Date()
  },
  {
    name: 'The Hive Tokyo',
    description: 'International coworking community in Shibuya with bilingual support and networking events.',
    address: '1-2-3 Shibuya, Shibuya City, Tokyo 150-0002, Japan',
    city: 'Tokyo',
    country: 'Japan',
    coordinates: [35.6596, 139.7006],
    phone: '+81 3-1234-5678',
    website: 'https://thehive.tokyo',
    images: [
      'https://example.com/images/hive-tokyo-1.jpg',
      'https://example.com/images/hive-tokyo-2.jpg',
      'https://example.com/images/hive-tokyo-3.jpg'
    ],
    amenities: [
      'High-Speed WiFi',
      'Meeting Rooms',
      'Translation Services',
      'International Community',
      'Event Space'
    ],
    pricing: {
      hotDesk: 3000,
      dedicatedDesk: 5000,
      privateOffice: 12000,
      currency: 'JPY'
    },
    hours: 'Monday-Friday: 9:00 AM - 6:00 PM',
    rating: 4.8,
    reviewCount: 156,
    source: 'Test Data',
    sourceId: 'test-hive-tokyo',
    scrapedAt: new Date()
  }
]

async function main() {
  const args = process.argv.slice(2)
  const dryRun = args.includes('--dry-run')

  logger.info('Starting import pipeline test', { 
    dryRun,
    mockDataCount: mockWorkspaces.length 
  })

  try {
    // Create import pipeline with test configuration
    const pipeline = new DataImportPipeline({
      batchSize: 2,
      maxConcurrent: 1,
      skipExisting: true,
      validateData: true,
      dryRun: dryRun,
      collectImages: false // Disable for test to avoid downloading real images
    })

    // Import mock data
    const result = await pipeline.importWorkspaceData(mockWorkspaces)

    // Print detailed results
    console.log('\n=== Test Import Results ===')
    console.log(`Success: ${result.success}`)
    console.log(`Processed: ${result.stats.processed}`)
    console.log(`Imported: ${result.stats.imported}`)
    console.log(`Skipped: ${result.stats.skipped}`)
    console.log(`Errors: ${result.stats.errors}`)
    console.log(`Duration: ${result.stats.duration}ms`)
    console.log(`Started: ${result.stats.startTime.toISOString()}`)

    if (result.errors.length > 0) {
      console.log('\n=== Errors ===')
      result.errors.forEach(error => console.log(`- ${error}`))
    }

    // Cleanup
    await pipeline.cleanup()

    if (result.success) {
      console.log('\n✅ Import test completed successfully!')
      
      if (dryRun) {
        console.log('📝 This was a dry run - no data was actually imported.')
      } else {
        console.log('💾 Test data has been imported to the database.')
        console.log('🌐 You can now view the imported workspaces in your application.')
      }
    } else {
      console.log('\n❌ Import test failed!')
    }

    process.exit(result.success ? 0 : 1)

  } catch (error) {
    logger.error('Import test failed', error instanceof Error ? error : new Error(String(error)))
    console.error('\n❌ Import test crashed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  }
}

function printHelp() {
  console.log(`
Workspace Atlas Import Pipeline Test

Usage: tsx scripts/test-import.ts [options]

Options:
  --dry-run      Preview what would be imported without making changes
  --help         Show this help message

This script tests the import pipeline using mock workspace data.
`)
}

// Handle help flag
if (process.argv.includes('--help')) {
  printHelp()
  process.exit(0)
}

// Run the main function
main().catch((error) => {
  console.error('Unhandled error:', error)
  process.exit(1)
})