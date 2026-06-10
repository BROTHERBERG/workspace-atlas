/**
 * Scrape coworking spaces from various sources
 * Usage: npx tsx scripts/scrape-coworking-spaces.ts --city "New York" --count 50
 *
 * Note: This creates a CSV file that you can then import using import-workspaces.ts
 */

import * as fs from 'fs'
import { stringify } from 'csv-stringify/sync'

interface CoworkingSpace {
  name: string
  city: string
  country: string
  address?: string
  latitude?: number
  longitude?: number
  website?: string
  phone?: string
  email?: string
  description?: string
  instagramUrl?: string
  twitterUrl?: string
  linkedinUrl?: string
  facebookUrl?: string
  hotDeskPrice?: number
  dedicatedDeskPrice?: number
  privateOfficePrice?: number
  pricingCurrency?: string
  amenities?: string
  images?: string
  source?: string
  sourceId?: string
  featured?: boolean
  verified?: boolean
}

// Sample data for major coworking brands and spaces
const KNOWN_SPACES: CoworkingSpace[] = [
  // WeWork locations
  {
    name: 'WeWork Times Square',
    city: 'New York',
    country: 'USA',
    address: '1460 Broadway, New York, NY 10036',
    latitude: 40.7589,
    longitude: -73.9851,
    website: 'https://www.wework.com/buildings/times-square--new-york--NY',
    phone: '+1-212-555-0100',
    description: 'Premium coworking space in the heart of Times Square with stunning city views and modern amenities',
    amenities: 'WiFi,Coffee,Meeting Rooms,24/7 Access,Phone Booths,Printing,Events,Kitchen',
    hotDeskPrice: 450,
    dedicatedDeskPrice: 650,
    privateOfficePrice: 1200,
    pricingCurrency: 'USD',
    images: 'https://images.unsplash.com/photo-1497366216548-37526070297c,https://images.unsplash.com/photo-1497366811353-6870744d04b2',
    source: 'Manual',
    sourceId: 'wework-times-square',
    featured: true,
    verified: true,
  },
  {
    name: 'WeWork Bryant Park',
    city: 'New York',
    country: 'USA',
    address: '7 W 34th St, New York, NY 10001',
    latitude: 40.7506,
    longitude: -73.9881,
    website: 'https://www.wework.com/buildings/bryant-park--new-york--NY',
    phone: '+1-212-555-0101',
    description: 'Beautiful coworking space near Bryant Park with excellent natural light',
    amenities: 'WiFi,Coffee,Meeting Rooms,24/7 Access,Phone Booths,Printing,Events',
    hotDeskPrice: 425,
    dedicatedDeskPrice: 625,
    privateOfficePrice: 1150,
    pricingCurrency: 'USD',
    images: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
    source: 'Manual',
    sourceId: 'wework-bryant-park',
    verified: true,
  },
  // Regus locations
  {
    name: 'Regus Empire State Building',
    city: 'New York',
    country: 'USA',
    address: '350 Fifth Avenue, Suite 5935, New York, NY 10118',
    latitude: 40.7484,
    longitude: -73.9857,
    website: 'https://www.regus.com/en-us/united-states/new-york/new-york-empire-state-building',
    phone: '+1-212-555-0200',
    description: 'Prestigious office space in the iconic Empire State Building',
    amenities: 'WiFi,Meeting Rooms,Reception,Phone Booths,Printing,Admin Support',
    hotDeskPrice: 500,
    dedicatedDeskPrice: 700,
    privateOfficePrice: 1500,
    pricingCurrency: 'USD',
    images: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72',
    source: 'Manual',
    sourceId: 'regus-empire-state',
    verified: true,
  },
  // San Francisco
  {
    name: 'WeWork SOMA',
    city: 'San Francisco',
    country: 'USA',
    address: '535 Mission St, San Francisco, CA 94105',
    latitude: 37.7886,
    longitude: -122.3988,
    website: 'https://www.wework.com/buildings/535-mission-street--san-francisco--CA',
    phone: '+1-415-555-0100',
    description: 'Modern coworking space in SOMA with tech startup community',
    amenities: 'WiFi,Coffee,Meeting Rooms,24/7 Access,Phone Booths,Printing,Events,Bike Storage',
    hotDeskPrice: 550,
    dedicatedDeskPrice: 750,
    privateOfficePrice: 1400,
    pricingCurrency: 'USD',
    images: 'https://images.unsplash.com/photo-1497366216548-37526070297c',
    source: 'Manual',
    sourceId: 'wework-soma-sf',
    featured: true,
    verified: true,
  },
  // London
  {
    name: 'WeWork Chancery Lane',
    city: 'London',
    country: 'UK',
    address: '7-10 Chandos Street, London W1G 9DQ',
    latitude: 51.5158,
    longitude: -0.1249,
    website: 'https://www.wework.com/en-GB/buildings/chancery-lane--london',
    phone: '+44-20-5555-0100',
    description: 'Historic building transformed into modern workspace in central London',
    amenities: 'WiFi,Coffee,Meeting Rooms,Reception,Phone Booths,Printing,Events',
    hotDeskPrice: 350,
    dedicatedDeskPrice: 500,
    privateOfficePrice: 900,
    pricingCurrency: 'GBP',
    images: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2',
    source: 'Manual',
    sourceId: 'wework-chancery-london',
    verified: true,
  },
]

async function generateCSV(spaces: CoworkingSpace[], outputPath: string) {
  const csv = stringify(spaces, {
    header: true,
    columns: [
      'name',
      'city',
      'country',
      'address',
      'latitude',
      'longitude',
      'website',
      'phone',
      'email',
      'description',
      'instagramUrl',
      'twitterUrl',
      'linkedinUrl',
      'facebookUrl',
      'hotDeskPrice',
      'dedicatedDeskPrice',
      'privateOfficePrice',
      'pricingCurrency',
      'amenities',
      'images',
      'source',
      'sourceId',
      'featured',
      'verified',
    ]
  })

  fs.writeFileSync(outputPath, csv)
  console.log(`✅ Generated CSV with ${spaces.length} spaces: ${outputPath}`)
}

async function main() {
  const outputPath = 'data/workspaces-sample.csv'

  // For now, use known spaces
  // TODO: Implement actual scraping with Google Places API or other sources
  console.log('📊 Generating sample workspace data...')
  console.log('💡 To add more spaces, you can:')
  console.log('   1. Manually add rows to the CSV')
  console.log('   2. Use Google Places API (set GOOGLE_PLACES_API_KEY in .env)')
  console.log('   3. Scrape from coworking directories')
  console.log('')

  await generateCSV(KNOWN_SPACES, outputPath)

  console.log('\n📋 Next steps:')
  console.log(`   1. Review/edit: ${outputPath}`)
  console.log(`   2. Import: npx tsx scripts/import-workspaces.ts ${outputPath}`)
}

main().catch(console.error)
