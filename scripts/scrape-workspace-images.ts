import * as fs from 'fs'
import * as path from 'path'
import * as https from 'https'
import * as http from 'http'
import { URL } from 'url'

interface WorkspaceData {
  id: number
  name: string
  location: {
    city: string
    country: string
  }
  contactInfo: {
    website?: string
  }
  images: string[]
}

// Function to fetch HTML from a URL
async function fetchHTML(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url)
    const protocol = parsedUrl.protocol === 'https:' ? https : http

    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      timeout: 10000
    }, (res) => {
      let data = ''
      res.on('data', (chunk) => data += chunk)
      res.on('end', () => resolve(data))
    }).on('error', reject)
  })
}

// Extract image URLs from HTML
function extractImages(html: string, baseUrl: string): string[] {
  const images: string[] = []
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/gi
  const ogImageRegex = /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/gi

  let match

  // Extract og:image (usually the best quality hero image)
  while ((match = ogImageRegex.exec(html)) !== null) {
    const imgUrl = resolveUrl(match[1], baseUrl)
    if (imgUrl && isValidImageUrl(imgUrl)) {
      images.push(imgUrl)
    }
  }

  // Extract regular img tags
  while ((match = imgRegex.exec(html)) !== null) {
    const imgUrl = resolveUrl(match[1], baseUrl)
    if (imgUrl && isValidImageUrl(imgUrl)) {
      images.push(imgUrl)
    }
  }

  // Remove duplicates and filter out small images, icons, logos
  const uniqueImages = Array.from(new Set(images))
  return uniqueImages.filter(url => {
    const lower = url.toLowerCase()
    return !lower.includes('logo') &&
           !lower.includes('icon') &&
           !lower.includes('favicon') &&
           !lower.includes('.svg') &&
           !lower.match(/\d+x\d+/) // Skip sized icons like 32x32
  }).slice(0, 6) // Limit to 6 images per workspace
}

function resolveUrl(url: string, baseUrl: string): string | null {
  try {
    if (url.startsWith('data:')) return null
    if (url.startsWith('//')) return 'https:' + url
    if (url.startsWith('http')) return url
    return new URL(url, baseUrl).href
  } catch {
    return null
  }
}

function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return /\.(jpg|jpeg|png|webp)$/i.test(parsed.pathname) ||
           parsed.pathname.includes('/photo/') ||
           parsed.pathname.includes('/image/') ||
           parsed.pathname.includes('/img/')
  } catch {
    return false
  }
}

// Fallback to Unsplash images based on workspace type
function getUnsplashFallback(workspace: WorkspaceData): string[] {
  const queries = [
    'coworking-space-office',
    'modern-office-interior',
    'collaborative-workspace',
    'meeting-room-office',
    'open-office-space'
  ]

  return queries.map((query, idx) =>
    `https://images.unsplash.com/photo-${1497366000000 + idx}?q=80&w=1200&auto=format&fit=crop`
  )
}

async function scrapeWorkspaceImages(workspace: WorkspaceData): Promise<string[]> {
  if (!workspace.contactInfo.website) {
    console.log(`⚠️  No website for ${workspace.name}, using fallback images`)
    return getUnsplashFallback(workspace)
  }

  try {
    console.log(`🔍 Scraping images for ${workspace.name} from ${workspace.contactInfo.website}`)

    const html = await fetchHTML(workspace.contactInfo.website)
    const images = extractImages(html, workspace.contactInfo.website)

    if (images.length > 0) {
      console.log(`✅ Found ${images.length} images for ${workspace.name}`)
      return images
    } else {
      console.log(`⚠️  No images found for ${workspace.name}, using fallback`)
      return getUnsplashFallback(workspace)
    }
  } catch (error) {
    console.error(`❌ Error scraping ${workspace.name}:`, error instanceof Error ? error.message : String(error))
    return getUnsplashFallback(workspace)
  }
}

async function main() {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')

  console.log('📖 Loading workspace data...')
  const workspaces: WorkspaceData[] = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  console.log(`\n🚀 Scraping images for ${workspaces.length} workspaces...\n`)

  // Process workspaces in batches to avoid overwhelming servers
  const batchSize = 5
  for (let i = 0; i < workspaces.length; i += batchSize) {
    const batch = workspaces.slice(i, i + batchSize)

    await Promise.all(
      batch.map(async (workspace) => {
        const images = await scrapeWorkspaceImages(workspace)
        workspace.images = images

        // Add a small delay to be respectful to servers
        await new Promise(resolve => setTimeout(resolve, 1000))
      })
    )

    console.log(`\n📊 Progress: ${Math.min(i + batchSize, workspaces.length)}/${workspaces.length} workspaces processed\n`)
  }

  console.log('\n💾 Saving updated workspace data...')
  fs.writeFileSync(jsonPath, JSON.stringify(workspaces, null, 2))

  console.log('✨ Image scraping complete!')
  console.log(`\n📈 Summary:`)
  const withRealImages = workspaces.filter(ws =>
    ws.images.length > 0 && !ws.images[0].includes('unsplash')
  ).length
  console.log(`  - Workspaces with scraped images: ${withRealImages}`)
  console.log(`  - Workspaces with fallback images: ${workspaces.length - withRealImages}`)
}

main().catch(console.error)
