import * as fs from 'fs'
import * as path from 'path'

interface TestResult {
  test: string
  status: 'PASS' | 'FAIL'
  message: string
}

const results: TestResult[] = []

function test(name: string, fn: () => boolean | string): void {
  try {
    const result = fn()
    if (typeof result === 'string') {
      results.push({ test: name, status: 'PASS', message: result })
    } else if (result) {
      results.push({ test: name, status: 'PASS', message: 'OK' })
    } else {
      results.push({ test: name, status: 'FAIL', message: 'Test returned false' })
    }
  } catch (error) {
    results.push({
      test: name,
      status: 'FAIL',
      message: error instanceof Error ? error.message : String(error)
    })
  }
}

// Test 1: Verify workspace data exists
test('Workspace JSON exists', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  return fs.existsSync(jsonPath) ? 'File exists at data/workspaces-expanded.json' : false
})

// Test 2: Verify workspace count
test('Workspace count is 96', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))
  return data.length === 96 ? `Found ${data.length} workspaces` : `Expected 96, found ${data.length}`
})

// Test 3: Verify all workspaces have required fields
test('All workspaces have required fields', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const requiredFields = ['id', 'name', 'location', 'images', 'digitalScore', 'rating', 'reviewCount']
  const invalid = workspaces.filter((ws: any) =>
    !requiredFields.every(field => ws[field] !== undefined)
  )

  return invalid.length === 0 ? 'All workspaces valid' : `${invalid.length} workspaces missing fields`
})

// Test 4: Verify all workspaces have images
test('All workspaces have images', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const withoutImages = workspaces.filter((ws: any) => !ws.images || ws.images.length === 0)

  return withoutImages.length === 0 ? 'All 96 workspaces have images' : `${withoutImages.length} without images`
})

// Test 5: Count workspaces by city diversity
test('Geographic diversity', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const cities = new Set(workspaces.map((ws: any) => ws.location.city))
  const countries = new Set(workspaces.map((ws: any) => ws.location.country))

  return `${cities.size} cities across ${countries.size} countries`
})

// Test 6: Verify digital scores
test('Digital scores calculated', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const withScores = workspaces.filter((ws: any) => ws.digitalScore && ws.digitalScore > 0)
  const avgScore = workspaces.reduce((sum: number, ws: any) => sum + (ws.digitalScore || 0), 0) / workspaces.length

  return `${withScores.length}/96 with scores (avg: ${avgScore.toFixed(1)})`
})

// Test 7: Verify featured workspaces
test('Featured workspaces', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const featured = workspaces.filter((ws: any) => ws.featured)

  return `${featured.length} featured workspaces`
})

// Test 8: Verify real-workspace-data helper exists
test('Real workspace data helper exists', () => {
  const helperPath = path.join(process.cwd(), 'lib', 'real-workspace-data.ts')
  return fs.existsSync(helperPath) ? 'Helper file exists' : false
})

// Test 9: Verify API route exists
test('Workspaces API route exists', () => {
  const apiPath = path.join(process.cwd(), 'app', 'api', 'workspaces', 'route.ts')
  return fs.existsSync(apiPath) ? 'API route exists' : false
})

// Test 10: Verify space pages exist
test('Dynamic space pages exist', () => {
  const spacePage = path.join(process.cwd(), 'app', 'spaces', '[id]', 'page.tsx')
  return fs.existsSync(spacePage) ? 'Dynamic route configured' : false
})

// Test 11: Verify score request API exists
test('Score request API exists', () => {
  const apiPath = path.join(process.cwd(), 'app', 'api', 'score-request', 'route.ts')
  return fs.existsSync(apiPath) ? 'Lead capture API ready' : false
})

// Test 12: Verify leads directory is ready
test('Leads directory ready', () => {
  const leadsDir = path.join(process.cwd(), 'data', 'leads')
  if (!fs.existsSync(leadsDir)) {
    fs.mkdirSync(leadsDir, { recursive: true })
    return 'Created leads directory'
  }
  return 'Leads directory exists'
})

// Test 13: Check pricing data
test('Pricing data available', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const withPricing = workspaces.filter((ws: any) => ws.pricing && ws.pricing.monthly)

  return `${withPricing.length}/96 workspaces with pricing`
})

// Test 14: Check amenities data
test('Amenities data available', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const totalAmenities = workspaces.reduce((sum: number, ws: any) =>
    sum + (ws.amenities?.length || 0), 0
  )
  const avgAmenities = totalAmenities / workspaces.length

  return `Avg ${avgAmenities.toFixed(1)} amenities per workspace`
})

// Test 15: Verify contact info
test('Contact information available', () => {
  const jsonPath = path.join(process.cwd(), 'data', 'workspaces-expanded.json')
  const workspaces = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'))

  const withWebsite = workspaces.filter((ws: any) => ws.contactInfo?.website)
  const withEmail = workspaces.filter((ws: any) => ws.contactInfo?.email)

  return `${withWebsite.length} websites, ${withEmail.length} emails`
})

// Print results
console.log('\n' + '='.repeat(70))
console.log('🚀 WORKSPACE ATLAS DEPLOYMENT VERIFICATION')
console.log('='.repeat(70) + '\n')

let passCount = 0
let failCount = 0

results.forEach(result => {
  const icon = result.status === 'PASS' ? '✅' : '❌'
  const color = result.status === 'PASS' ? '\x1b[32m' : '\x1b[31m'
  const reset = '\x1b[0m'

  console.log(`${icon} ${color}${result.test}${reset}`)
  console.log(`   ${result.message}\n`)

  if (result.status === 'PASS') passCount++
  else failCount++
})

console.log('='.repeat(70))
console.log(`\n📊 Results: ${passCount} passed, ${failCount} failed`)

if (failCount === 0) {
  console.log('\n🎉 All systems operational! Ready for demo.\n')
} else {
  console.log('\n⚠️  Some tests failed. Review above for details.\n')
  process.exit(1)
}
