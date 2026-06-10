/**
 * Import workspaces from CSV file
 * Usage: npx tsx scripts/import-workspaces.ts data/workspaces.csv
 */

import { PrismaClient } from '@prisma/client'
import * as fs from 'fs'
import * as path from 'path'
import { parse } from 'csv-parse/sync'

const prisma = new PrismaClient()

interface WorkspaceCSVRow {
  name: string
  city: string
  country: string
  address?: string
  latitude?: string
  longitude?: string
  website?: string
  phone?: string
  email?: string
  description?: string

  // Social media
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  facebookUrl?: string

  // Pricing (comma-separated values)
  hotDeskPrice?: string
  dedicatedDeskPrice?: string
  privateOfficePrice?: string
  pricingCurrency?: string

  // Amenities (comma-separated)
  amenities?: string

  // Images (comma-separated URLs)
  images?: string

  // Metadata
  source?: string
  sourceId?: string
  featured?: string
  verified?: string
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function parseFloat(value: string | undefined): number | undefined {
  if (!value || value.trim() === '') return undefined
  const parsed = Number.parseFloat(value)
  return isNaN(parsed) ? undefined : parsed
}

function parseBoolean(value: string | undefined): boolean {
  if (!value) return false
  return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes'
}

function parseArray(value: string | undefined): string[] {
  if (!value || value.trim() === '') return []
  return value.split(',').map(item => item.trim()).filter(Boolean)
}

async function importWorkspaces(csvPath: string) {
  console.log(`📂 Reading CSV file: ${csvPath}`)

  if (!fs.existsSync(csvPath)) {
    console.error(`❌ File not found: ${csvPath}`)
    process.exit(1)
  }

  const fileContent = fs.readFileSync(csvPath, 'utf-8')
  const records: WorkspaceCSVRow[] = parse(fileContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  })

  console.log(`📊 Found ${records.length} workspaces to import`)

  let imported = 0
  let skipped = 0
  let errors = 0

  for (const row of records) {
    try {
      // Generate unique slug
      const baseSlug = slugify(row.name)
      let slug = baseSlug
      let counter = 1

      while (await prisma.workspace.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`
        counter++
      }

      // Check if workspace already exists by source
      if (row.sourceId && row.source) {
        const existing = await prisma.workspace.findFirst({
          where: {
            source: row.source,
            sourceId: row.sourceId,
          }
        })

        if (existing) {
          console.log(`⏭️  Skipping ${row.name} (already exists)`)
          skipped++
          continue
        }
      }

      // Create workspace
      const workspace = await prisma.workspace.create({
        data: {
          name: row.name,
          slug,
          city: row.city,
          country: row.country,
          address: row.address,
          latitude: parseFloat(row.latitude),
          longitude: parseFloat(row.longitude),

          website: row.website,
          phone: row.phone,
          email: row.email,
          description: row.description,

          instagramUrl: row.instagramUrl,
          twitterUrl: row.twitterUrl,
          linkedinUrl: row.linkedinUrl,
          facebookUrl: row.facebookUrl,

          hotDeskPrice: parseFloat(row.hotDeskPrice),
          dedicatedDeskPrice: parseFloat(row.dedicatedDeskPrice),
          privateOfficePrice: parseFloat(row.privateOfficePrice),
          pricingCurrency: row.pricingCurrency || 'USD',

          amenities: parseArray(row.amenities),
          images: parseArray(row.images),

          source: row.source || 'Manual Import',
          sourceId: row.sourceId,
          scrapedAt: new Date(),

          featured: parseBoolean(row.featured),
          verified: parseBoolean(row.verified),

          status: 'ACTIVE',
          isActive: true,
        }
      })

      console.log(`✅ Imported: ${workspace.name} (${workspace.city}, ${workspace.country})`)
      imported++

    } catch (error) {
      console.error(`❌ Error importing ${row.name}:`, error instanceof Error ? error.message : String(error))
      errors++
    }
  }

  console.log('\n📈 Import Summary:')
  console.log(`   ✅ Imported: ${imported}`)
  console.log(`   ⏭️  Skipped: ${skipped}`)
  console.log(`   ❌ Errors: ${errors}`)
  console.log(`   📊 Total: ${records.length}`)
}

async function main() {
  const csvPath = process.argv[2]

  if (!csvPath) {
    console.error('Usage: npx tsx scripts/import-workspaces.ts <path-to-csv>')
    console.error('Example: npx tsx scripts/import-workspaces.ts data/workspaces.csv')
    process.exit(1)
  }

  await importWorkspaces(csvPath)
  await prisma.$disconnect()
}

main().catch((error) => {
  console.error('Fatal error:', error)
  prisma.$disconnect()
  process.exit(1)
})
