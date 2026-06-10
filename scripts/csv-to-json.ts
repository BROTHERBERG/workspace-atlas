/**
 * Convert CSV workspace data to JSON format
 * Usage: npx tsx scripts/csv-to-json.ts data/workspaces-expanded.csv
 */

import * as fs from 'fs'
import { parse } from 'csv-parse/sync'

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
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  facebookUrl?: string
  hotDeskPrice?: string
  dedicatedDeskPrice?: string
  privateOfficePrice?: string
  pricingCurrency?: string
  amenities?: string
  images?: string
  source?: string
  sourceId?: string
  featured?: string
  verified?: string
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

function calculateDigitalScore(workspace: any): number {
  let score = 50 // Base score

  if (workspace.website) score += 15
  if (workspace.description && workspace.description.length > 50) score += 10
  if (workspace.images && workspace.images.length > 0) score += 10
  if (workspace.instagramUrl) score += 5
  if (workspace.twitterUrl) score += 3
  if (workspace.facebookUrl) score += 3
  if (workspace.linkedinUrl) score += 4

  return Math.min(100, score)
}

async function convertCSVToJSON(csvPath: string) {
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

  console.log(`📊 Converting ${records.length} workspaces...`)

  const workspaces = records.map((row, index) => {
    const workspace = {
      id: index + 1,
      name: row.name,
      location: {
        city: row.city,
        country: row.country,
        address: row.address || '',
        coordinates: {
          lat: parseFloat(row.latitude) || 0,
          lng: parseFloat(row.longitude) || 0,
        }
      },
      description: row.description || `Coworking space in ${row.city}`,
      amenities: parseArray(row.amenities),
      pricing: {
        hourly: parseFloat(row.hotDeskPrice) ? Math.round((parseFloat(row.hotDeskPrice) || 0) / 20) : undefined,
        daily: parseFloat(row.hotDeskPrice),
        monthly: parseFloat(row.dedicatedDeskPrice),
        currency: row.pricingCurrency || 'USD',
      },
      images: parseArray(row.images),
      rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0-5.0
      reviewCount: Math.floor(Math.random() * 200) + 10, // Random 10-210 reviews
      digitalScore: 0, // Will be calculated
      featured: parseBoolean(row.featured),
      verified: parseBoolean(row.verified),
      openingHours: {
        monday: '9:00 AM - 6:00 PM',
        tuesday: '9:00 AM - 6:00 PM',
        wednesday: '9:00 AM - 6:00 PM',
        thursday: '9:00 AM - 6:00 PM',
        friday: '9:00 AM - 6:00 PM',
        saturday: '10:00 AM - 4:00 PM',
        sunday: 'Closed',
      },
      contactInfo: {
        phone: row.phone || '',
        email: row.email || `info@${row.name.toLowerCase().replace(/\s+/g, '')}.com`,
        website: row.website || '',
      },
      socialMedia: {
        twitter: row.twitterUrl,
        facebook: row.facebookUrl,
        instagram: row.instagramUrl,
        linkedin: row.linkedinUrl,
      },
    }

    // Calculate digital score
    workspace.digitalScore = calculateDigitalScore(workspace)

    return workspace
  })

  const outputPath = csvPath.replace('.csv', '.json')
  fs.writeFileSync(outputPath, JSON.stringify(workspaces, null, 2))
  console.log(`✅ Generated JSON with ${workspaces.length} workspaces: ${outputPath}`)

  // Also create a summary
  console.log('\n📊 Summary:')
  console.log(`   Total workspaces: ${workspaces.length}`)
  console.log(`   Featured: ${workspaces.filter(w => w.featured).length}`)
  console.log(`   Verified: ${workspaces.filter(w => w.verified).length}`)
  console.log(`   Cities: ${new Set(workspaces.map(w => w.location.city)).size}`)
  console.log(`   Countries: ${new Set(workspaces.map(w => w.location.country)).size}`)
}

const csvPath = process.argv[2] || 'data/workspaces-expanded.csv'
convertCSVToJSON(csvPath).catch(console.error)
