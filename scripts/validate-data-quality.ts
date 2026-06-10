#!/usr/bin/env npx tsx

/**
 * Data Quality Validation and Deduplication Tool
 * Validates workspace data quality and removes duplicates
 */

import { getWorkspaces } from '@/lib/mock-data'
import { logger } from '@/lib/logger'

interface ValidationResult {
  id: string
  name: string
  issues: string[]
  score: number
  isDuplicate: boolean
  duplicateOf?: string
}

interface QualityMetrics {
  total: number
  valid: number
  invalid: number
  duplicates: number
  averageScore: number
  issueBreakdown: Record<string, number>
}

class DataQualityValidator {
  
  validateWorkspaces(limit: number = 100): { results: ValidationResult[], metrics: QualityMetrics } {
    logger.info(`Starting data quality validation for ${limit} workspaces`)
    
    const workspaces = getWorkspaces(limit)
    const results: ValidationResult[] = []
    const issueBreakdown: Record<string, number> = {}
    
    // Track potential duplicates by name and location
    const duplicateMap = new Map<string, string[]>()
    
    workspaces.forEach((workspace, index) => {
      const issues: string[] = []
      let score = 100 // Start with perfect score
      
      // Validate basic fields
      if (!workspace.name?.trim()) {
        issues.push('Missing workspace name')
        score -= 20
      }
      
      if (!workspace.description?.trim()) {
        issues.push('Missing description')
        score -= 10
      } else if (workspace.description.length < 50) {
        issues.push('Description too short (less than 50 characters)')
        score -= 5
      }
      
      // Validate location data
      if (!workspace.location?.city?.trim()) {
        issues.push('Missing city information')
        score -= 15
      }
      
      if (!workspace.location?.country?.trim()) {
        issues.push('Missing country information')
        score -= 10
      }
      
      if (!workspace.location?.address?.trim()) {
        issues.push('Missing address')
        score -= 10
      }
      
      if (!workspace.location?.coordinates?.lat || !workspace.location?.coordinates?.lng) {
        issues.push('Missing or invalid coordinates')
        score -= 15
      }
      
      // Validate contact information
      if (!workspace.contactInfo?.email?.trim()) {
        issues.push('Missing email')
        score -= 10
      } else if (!this.isValidEmail(workspace.contactInfo.email)) {
        issues.push('Invalid email format')
        score -= 5
      }
      
      if (!workspace.contactInfo?.phone?.trim()) {
        issues.push('Missing phone number')
        score -= 8
      }
      
      if (!workspace.contactInfo?.website?.trim()) {
        issues.push('Missing website')
        score -= 10
      } else if (!this.isValidUrl(workspace.contactInfo.website)) {
        issues.push('Invalid website URL')
        score -= 5
      }
      
      // Validate amenities
      if (!workspace.amenities || workspace.amenities.length === 0) {
        issues.push('No amenities listed')
        score -= 15
      } else if (workspace.amenities.length < 3) {
        issues.push('Too few amenities (less than 3)')
        score -= 8
      }
      
      // Validate pricing
      if (!workspace.pricing?.monthly) {
        issues.push('Missing monthly pricing')
        score -= 10
      }
      
      if (!workspace.pricing?.currency?.trim()) {
        issues.push('Missing currency')
        score -= 5
      }
      
      // Validate images
      if (!workspace.images || workspace.images.length === 0) {
        issues.push('No images provided')
        score -= 15
      } else if (workspace.images.length < 2) {
        issues.push('Too few images (less than 2)')
        score -= 8
      }
      
      // Validate rating and reviews
      if (workspace.rating === undefined || workspace.rating === null) {
        issues.push('Missing rating')
        score -= 5
      } else if (workspace.rating < 3.0) {
        issues.push('Low rating (below 3.0)')
        score -= 3
      }
      
      if (!workspace.reviewCount || workspace.reviewCount < 5) {
        issues.push('Too few reviews (less than 5)')
        score -= 5
      }
      
      // Check for duplicates
      const locationKey = `${workspace.name?.toLowerCase().trim()}-${workspace.location?.city?.toLowerCase().trim()}`
      if (duplicateMap.has(locationKey)) {
        duplicateMap.get(locationKey)!.push(workspace.id.toString())
      } else {
        duplicateMap.set(locationKey, [workspace.id.toString()])
      }
      
      // Track issue types for breakdown
      issues.forEach(issue => {
        issueBreakdown[issue] = (issueBreakdown[issue] || 0) + 1
      })
      
      // Ensure score doesn't go below 0
      score = Math.max(0, score)
      
      results.push({
        id: workspace.id.toString(),
        name: workspace.name || 'Unnamed Workspace',
        issues,
        score,
        isDuplicate: false, // Will be updated after duplicate detection
        duplicateOf: undefined
      })
    })
    
    // Identify duplicates
    let duplicateCount = 0
    duplicateMap.forEach((ids, locationKey) => {
      if (ids.length > 1) {
        // Mark all but the first as duplicates
        const [originalId, ...duplicateIds] = ids
        duplicateIds.forEach(duplicateId => {
          const result = results.find(r => r.id === duplicateId)
          if (result) {
            result.isDuplicate = true
            result.duplicateOf = originalId
            duplicateCount++
          }
        })
      }
    })
    
    // Calculate metrics
    const validResults = results.filter(r => r.score >= 70 && !r.isDuplicate)
    const invalidResults = results.filter(r => r.score < 70 || r.isDuplicate)
    const averageScore = results.length > 0 
      ? results.reduce((sum, r) => sum + r.score, 0) / results.length 
      : 0
    
    const metrics: QualityMetrics = {
      total: results.length,
      valid: validResults.length,
      invalid: invalidResults.length,
      duplicates: duplicateCount,
      averageScore: Math.round(averageScore * 10) / 10,
      issueBreakdown
    }
    
    logger.info('Data quality validation completed', {
      total: metrics.total,
      valid: metrics.valid,
      invalid: metrics.invalid,
      duplicates: metrics.duplicates,
      averageScore: metrics.averageScore
    })
    
    return { results, metrics }
  }
  
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }
  
  private isValidUrl(url: string): boolean {
    try {
      new URL(url)
      return true
    } catch {
      return false
    }
  }
  
  generateQualityReport(results: ValidationResult[], metrics: QualityMetrics): void {
    console.log('\n📊 DATA QUALITY REPORT')
    console.log('======================')
    
    console.log(`\n📈 Overall Metrics:`)
    console.log(`   Total Workspaces: ${metrics.total}`)
    console.log(`   ✅ Valid: ${metrics.valid} (${Math.round(metrics.valid / metrics.total * 100)}%)`)
    console.log(`   ❌ Invalid: ${metrics.invalid} (${Math.round(metrics.invalid / metrics.total * 100)}%)`)
    console.log(`   🔄 Duplicates: ${metrics.duplicates}`)
    console.log(`   📊 Average Quality Score: ${metrics.averageScore}/100`)
    
    // Quality score distribution
    const scoreRanges = {
      'Excellent (90-100)': results.filter(r => r.score >= 90).length,
      'Good (80-89)': results.filter(r => r.score >= 80 && r.score < 90).length,
      'Fair (70-79)': results.filter(r => r.score >= 70 && r.score < 80).length,
      'Poor (60-69)': results.filter(r => r.score >= 60 && r.score < 70).length,
      'Very Poor (0-59)': results.filter(r => r.score < 60).length
    }
    
    console.log(`\n🎯 Quality Score Distribution:`)
    Object.entries(scoreRanges).forEach(([range, count]) => {
      if (count > 0) {
        console.log(`   ${range}: ${count}`)
      }
    })
    
    // Top issues
    const sortedIssues = Object.entries(metrics.issueBreakdown)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
    
    if (sortedIssues.length > 0) {
      console.log(`\n⚠️  Most Common Issues:`)
      sortedIssues.forEach(([issue, count], index) => {
        console.log(`   ${index + 1}. ${issue}: ${count} workspaces`)
      })
    }
    
    // Show some examples of low-quality entries
    const lowQualityEntries = results
      .filter(r => r.score < 70)
      .sort((a, b) => a.score - b.score)
      .slice(0, 5)
    
    if (lowQualityEntries.length > 0) {
      console.log(`\n🔍 Lowest Quality Entries:`)
      lowQualityEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.name} (Score: ${entry.score}/100)`)
        if (entry.issues.length > 0) {
          console.log(`      Issues: ${entry.issues.slice(0, 3).join(', ')}${entry.issues.length > 3 ? '...' : ''}`)
        }
      })
    }
    
    // Show duplicates
    const duplicates = results.filter(r => r.isDuplicate)
    if (duplicates.length > 0) {
      console.log(`\n🔄 Duplicate Entries:`)
      duplicates.slice(0, 5).forEach((duplicate, index) => {
        console.log(`   ${index + 1}. ${duplicate.name} (duplicate of ${duplicate.duplicateOf})`)
      })
    }
    
    // Show high-quality entries
    const highQualityEntries = results
      .filter(r => r.score >= 90 && !r.isDuplicate)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
    
    if (highQualityEntries.length > 0) {
      console.log(`\n🌟 Highest Quality Entries:`)
      highQualityEntries.forEach((entry, index) => {
        console.log(`   ${index + 1}. ${entry.name} (Score: ${entry.score}/100)`)
      })
    }
    
    console.log(`\n📋 Recommendations:`)
    if (metrics.invalid > metrics.total * 0.2) {
      console.log(`   • High invalid rate (${Math.round(metrics.invalid / metrics.total * 100)}%) - Review data sources`)
    }
    if (metrics.duplicates > 0) {
      console.log(`   • ${metrics.duplicates} duplicates found - Run deduplication`)
    }
    if (metrics.averageScore < 80) {
      console.log(`   • Low average score (${metrics.averageScore}) - Improve data collection`)
    }
    if (sortedIssues.length > 0) {
      console.log(`   • Address top issues: ${sortedIssues.slice(0, 3).map(([issue]) => issue).join(', ')}`)
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2)
  let limit = 100
  
  if (args.includes('--help')) {
    console.log(`
Data Quality Validation Tool

Usage:
  npx tsx scripts/validate-data-quality.ts [--limit <number>]

Options:
  --limit <number>    Number of workspaces to validate (default: 100)
  --help             Show this help
    `)
    process.exit(0)
  }
  
  const limitIndex = args.findIndex(arg => arg === '--limit')
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limit = parseInt(args[limitIndex + 1])
  }
  
  console.log('🔍 Data Quality Validation')
  console.log('=========================')
  
  const validator = new DataQualityValidator()
  const { results, metrics } = validator.validateWorkspaces(limit)
  
  validator.generateQualityReport(results, metrics)
  
  console.log(`\n✅ Validation completed successfully!`)
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error)
}

export { DataQualityValidator }