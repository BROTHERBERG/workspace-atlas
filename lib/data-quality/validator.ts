/**
 * Data quality validation and deduplication system
 * Ensures scraped data meets quality standards before database insertion
 */

import { logger } from '@/lib/logger'
import { ScrapedWorkspaceData } from '@/lib/scraping/coworking-scrapers'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  score: number // 0-100 quality score
  suggestions: string[]
}

export interface DeduplicationResult {
  isDuplicate: boolean
  confidence: number // 0-1
  matchedWorkspace?: {
    id: string
    name: string
    similarity: number
  }
  duplicateFields: string[]
}

export interface QualityMetrics {
  completeness: number // 0-100
  accuracy: number // 0-100
  consistency: number // 0-100
  timeliness: number // 0-100
  overall: number // 0-100
}

/**
 * Data quality validator
 */
export class DataQualityValidator {
  private requiredFields = ['name', 'source', 'sourceId']
  private recommendedFields = ['address', 'city', 'country', 'website']
  private qualityThreshold = 60 // Minimum quality score

  /**
   * Validate a single workspace data entry
   */
  validate(data: ScrapedWorkspaceData): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []
    const suggestions: string[] = []
    let score = 100

    // Check required fields
    for (const field of this.requiredFields) {
      if (!data[field as keyof ScrapedWorkspaceData]) {
        errors.push(`Missing required field: ${field}`)
        score -= 20
      }
    }

    // Check recommended fields
    let missingRecommended = 0
    for (const field of this.recommendedFields) {
      if (!data[field as keyof ScrapedWorkspaceData]) {
        warnings.push(`Missing recommended field: ${field}`)
        missingRecommended++
      }
    }
    score -= (missingRecommended / this.recommendedFields.length) * 20

    // Validate name quality
    if (data.name) {
      if (data.name.length < 3) {
        errors.push('Name too short (minimum 3 characters)')
        score -= 15
      }
      if (data.name.length > 100) {
        warnings.push('Name very long (over 100 characters)')
        score -= 5
      }
      if (!/^[a-zA-Z0-9\s\-&.,!'()]+$/.test(data.name)) {
        warnings.push('Name contains unusual characters')
        score -= 5
      }
    }

    // Validate description
    if (data.description) {
      if (data.description.length < 10) {
        warnings.push('Description too short for good quality')
        score -= 5
      }
      if (data.description.length > 2000) {
        warnings.push('Description very long (over 2000 characters)')
        score -= 3
      }
    } else {
      suggestions.push('Add description for better user experience')
    }

    // Validate address format
    if (data.address) {
      if (data.address.length < 10) {
        warnings.push('Address seems incomplete')
        score -= 10
      }
      // Basic address validation - should contain numbers and letters
      if (!/\d/.test(data.address) || !/[a-zA-Z]/.test(data.address)) {
        warnings.push('Address format may be invalid')
        score -= 5
      }
    }

    // Validate website URL
    if (data.website) {
      try {
        new URL(data.website)
        if (!data.website.startsWith('http')) {
          warnings.push('Website URL should start with http/https')
          score -= 3
        }
      } catch {
        errors.push('Invalid website URL format')
        score -= 10
      }
    }

    // Validate email format
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push('Invalid email format')
        score -= 10
      }
    }

    // Validate phone format
    if (data.phone) {
      // Basic phone validation - should contain numbers
      if (!/\d{7,}/.test(data.phone.replace(/\D/g, ''))) {
        warnings.push('Phone number format may be invalid')
        score -= 5
      }
    }

    // Validate coordinates
    if (data.latitude !== undefined || data.longitude !== undefined) {
      if (data.latitude === undefined || data.longitude === undefined) {
        warnings.push('Both latitude and longitude should be provided')
        score -= 5
      } else {
        if (data.latitude < -90 || data.latitude > 90) {
          errors.push('Invalid latitude value')
          score -= 15
        }
        if (data.longitude < -180 || data.longitude > 180) {
          errors.push('Invalid longitude value')
          score -= 15
        }
      }
    }

    // Validate images
    if (data.images && data.images.length > 0) {
      let invalidImages = 0
      for (const image of data.images) {
        try {
          new URL(image)
          if (!image.match(/\.(jpg|jpeg|png|webp|gif)$/i)) {
            warnings.push(`Image URL may not be a valid image: ${image}`)
            invalidImages++
          }
        } catch {
          warnings.push(`Invalid image URL: ${image}`)
          invalidImages++
        }
      }
      if (invalidImages > 0) {
        score -= Math.min(invalidImages * 3, 15)
      }
    } else {
      suggestions.push('Add images to improve workspace appeal')
    }

    // Validate amenities
    if (data.amenities && data.amenities.length > 0) {
      if (data.amenities.length > 50) {
        warnings.push('Very large number of amenities listed')
        score -= 5
      }
      // Check for duplicate amenities
      const uniqueAmenities = [...new Set(data.amenities)]
      if (uniqueAmenities.length !== data.amenities.length) {
        warnings.push('Duplicate amenities found')
        score -= 3
      }
    } else {
      suggestions.push('Add amenities information for better listings')
    }

    // Validate pricing
    if (data.pricing && data.pricing.length > 0) {
      for (const price of data.pricing) {
        if (!price.type || !price.amount || !price.currency) {
          warnings.push('Incomplete pricing information')
          score -= 5
          break
        }
        if (price.amount <= 0) {
          warnings.push('Invalid pricing amount')
          score -= 5
        }
      }
    }

    // Check data freshness
    const dataAge = Date.now() - data.lastUpdated.getTime()
    const daysOld = dataAge / (1000 * 60 * 60 * 24)
    if (daysOld > 30) {
      warnings.push('Data is over 30 days old')
      score -= Math.min(daysOld - 30, 20)
    }

    return {
      isValid: errors.length === 0 && score >= this.qualityThreshold,
      errors,
      warnings,
      score: Math.max(0, Math.round(score)),
      suggestions
    }
  }

  /**
   * Batch validate multiple workspace entries
   */
  validateBatch(dataArray: ScrapedWorkspaceData[]): {
    validEntries: { data: ScrapedWorkspaceData; validation: ValidationResult }[]
    invalidEntries: { data: ScrapedWorkspaceData; validation: ValidationResult }[]
    summary: {
      total: number
      valid: number
      invalid: number
      averageScore: number
      commonIssues: string[]
    }
  } {
    const validEntries: { data: ScrapedWorkspaceData; validation: ValidationResult }[] = []
    const invalidEntries: { data: ScrapedWorkspaceData; validation: ValidationResult }[] = []
    const allErrors: string[] = []
    const allWarnings: string[] = []
    let totalScore = 0

    for (const data of dataArray) {
      const validation = this.validate(data)
      totalScore += validation.score

      if (validation.isValid) {
        validEntries.push({ data, validation })
      } else {
        invalidEntries.push({ data, validation })
      }

      allErrors.push(...validation.errors)
      allWarnings.push(...validation.warnings)
    }

    // Calculate common issues
    const errorCounts = this.countOccurrences(allErrors)
    const warningCounts = this.countOccurrences(allWarnings)
    const commonIssues = [
      ...Object.entries(errorCounts).sort(([,a], [,b]) => b - a).slice(0, 5),
      ...Object.entries(warningCounts).sort(([,a], [,b]) => b - a).slice(0, 3)
    ].map(([issue]) => issue)

    return {
      validEntries,
      invalidEntries,
      summary: {
        total: dataArray.length,
        valid: validEntries.length,
        invalid: invalidEntries.length,
        averageScore: Math.round(totalScore / dataArray.length),
        commonIssues
      }
    }
  }

  private countOccurrences(array: string[]): Record<string, number> {
    return array.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1
      return acc
    }, {} as Record<string, number>)
  }

  /**
   * Calculate quality metrics
   */
  calculateMetrics(data: ScrapedWorkspaceData): QualityMetrics {
    let completeness = 0
    let accuracy = 100
    let consistency = 100
    let timeliness = 100

    // Completeness score based on field presence
    const allFields = [
      'name', 'description', 'address', 'city', 'country',
      'website', 'phone', 'email', 'images', 'amenities'
    ]
    const presentFields = allFields.filter(field => {
      const value = data[field as keyof ScrapedWorkspaceData]
      return value && (Array.isArray(value) ? value.length > 0 : true)
    })
    completeness = (presentFields.length / allFields.length) * 100

    // Accuracy deductions based on validation issues
    const validation = this.validate(data)
    accuracy -= validation.errors.length * 10
    accuracy -= validation.warnings.length * 2

    // Consistency checks
    if (data.city && data.address) {
      if (!data.address.toLowerCase().includes(data.city.toLowerCase())) {
        consistency -= 10
      }
    }

    // Timeliness based on data age
    const dataAge = Date.now() - data.lastUpdated.getTime()
    const daysOld = dataAge / (1000 * 60 * 60 * 24)
    if (daysOld > 7) timeliness -= Math.min(daysOld * 2, 80)

    const metrics = {
      completeness: Math.max(0, Math.round(completeness)),
      accuracy: Math.max(0, Math.round(accuracy)),
      consistency: Math.max(0, Math.round(consistency)),
      timeliness: Math.max(0, Math.round(timeliness))
    }

    const overall = Math.round(
      (metrics.completeness * 0.3 + 
       metrics.accuracy * 0.3 + 
       metrics.consistency * 0.2 + 
       metrics.timeliness * 0.2)
    )

    return { ...metrics, overall }
  }
}

/**
 * Deduplication engine
 */
export class DeduplicationEngine {
  private similarityThreshold = 0.85 // 85% similarity threshold

  /**
   * Check if a workspace is a duplicate of existing data
   */
  async checkDuplicate(
    newData: ScrapedWorkspaceData,
    existingWorkspaces: Array<{
      id: string
      name: string
      address?: string | null
      city?: string | null
      website?: string | null
      sourceId?: string
      source?: string
    }>
  ): Promise<DeduplicationResult> {
    let bestMatch: { id: string; name: string; similarity: number } | undefined
    let maxSimilarity = 0
    const duplicateFields: string[] = []

    for (const existing of existingWorkspaces) {
      const similarity = await this.calculateSimilarity(newData, existing)
      
      if (similarity > maxSimilarity) {
        maxSimilarity = similarity
        bestMatch = { id: existing.id, name: existing.name, similarity }
      }

      // Check for exact matches on key fields
      if (existing.sourceId === newData.sourceId && existing.source === newData.source) {
        duplicateFields.push('sourceId')
      }

      if (existing.website === newData.website && existing.website) {
        duplicateFields.push('website')
      }

      // Exact name match in same city
      if (this.normalizeString(existing.name) === this.normalizeString(newData.name) &&
          this.normalizeString(existing.city || '') === this.normalizeString(newData.city || '')) {
        duplicateFields.push('name+city')
      }
    }

    const isDuplicate = maxSimilarity >= this.similarityThreshold || duplicateFields.length > 0

    return {
      isDuplicate,
      confidence: maxSimilarity,
      matchedWorkspace: bestMatch,
      duplicateFields
    }
  }

  private async calculateSimilarity(
    data1: ScrapedWorkspaceData,
    data2: {
      name: string
      address?: string | null
      city?: string | null
      website?: string | null
    }
  ): Promise<number> {
    let score = 0
    let factors = 0

    // Name similarity (most important - 40% weight)
    if (data1.name && data2.name) {
      const nameSim = this.stringSimilarity(data1.name, data2.name)
      score += nameSim * 0.4
      factors += 0.4
    }

    // Address similarity (30% weight)
    if (data1.address && data2.address) {
      const addressSim = this.stringSimilarity(data1.address, data2.address)
      score += addressSim * 0.3
      factors += 0.3
    }

    // City similarity (20% weight)
    if (data1.city && data2.city) {
      const citySim = this.stringSimilarity(data1.city, data2.city)
      score += citySim * 0.2
      factors += 0.2
    }

    // Website similarity (10% weight)
    if (data1.website && data2.website) {
      const websiteSim = data1.website === data2.website ? 1 : 0
      score += websiteSim * 0.1
      factors += 0.1
    }

    return factors > 0 ? score / factors : 0
  }

  private stringSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeString(str1)
    const s2 = this.normalizeString(str2)

    if (s1 === s2) return 1

    // Levenshtein distance similarity
    const matrix = Array.from({ length: s1.length + 1 }, (_, i) =>
      Array.from({ length: s2.length + 1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0)
    )

    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j] + 1,     // deletion
            matrix[i][j - 1] + 1,     // insertion
            matrix[i - 1][j - 1] + 1  // substitution
          )
        }
      }
    }

    const maxLength = Math.max(s1.length, s2.length)
    return maxLength > 0 ? (maxLength - matrix[s1.length][s2.length]) / maxLength : 1
  }

  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special characters
      .replace(/\s+/g, ' ')     // Normalize whitespace
      .trim()
  }

  /**
   * Batch deduplication
   */
  async deduplicateBatch(
    newData: ScrapedWorkspaceData[],
    existingWorkspaces: Array<{
      id: string
      name: string
      address?: string | null
      city?: string | null
      website?: string | null
      sourceId?: string
      source?: string
    }>
  ): Promise<{
    unique: ScrapedWorkspaceData[]
    duplicates: { data: ScrapedWorkspaceData; duplicate: DeduplicationResult }[]
    summary: {
      total: number
      unique: number
      duplicates: number
      avgConfidence: number
    }
  }> {
    const unique: ScrapedWorkspaceData[] = []
    const duplicates: { data: ScrapedWorkspaceData; duplicate: DeduplicationResult }[] = []
    let totalConfidence = 0

    for (const data of newData) {
      const result = await this.checkDuplicate(data, existingWorkspaces)
      totalConfidence += result.confidence

      if (result.isDuplicate) {
        duplicates.push({ data, duplicate: result })
      } else {
        unique.push(data)
      }
    }

    return {
      unique,
      duplicates,
      summary: {
        total: newData.length,
        unique: unique.length,
        duplicates: duplicates.length,
        avgConfidence: totalConfidence / newData.length
      }
    }
  }
}

/**
 * Data quality orchestrator
 */
export class DataQualityOrchestrator {
  private validator: DataQualityValidator
  private deduplicator: DeduplicationEngine

  constructor() {
    this.validator = new DataQualityValidator()
    this.deduplicator = new DeduplicationEngine()
  }

  async processWorkspaces(
    scrapedData: ScrapedWorkspaceData[],
    existingWorkspaces: Array<{
      id: string
      name: string
      address?: string | null
      city?: string | null
      website?: string | null
      sourceId?: string
      source?: string
    }> = []
  ): Promise<{
    processed: { data: ScrapedWorkspaceData; metrics: QualityMetrics }[]
    rejected: { data: ScrapedWorkspaceData; reasons: string[] }[]
    summary: {
      input: number
      processed: number
      rejected: number
      duplicates: number
      averageQuality: number
    }
  }> {
    logger.info('Starting data quality processing', { 
      totalWorkspaces: scrapedData.length,
      existingWorkspaces: existingWorkspaces.length 
    })

    // Step 1: Validate all data
    const validationResults = this.validator.validateBatch(scrapedData)
    logger.info('Validation completed', validationResults.summary)

    // Step 2: Deduplicate valid entries
    const validData = validationResults.validEntries.map(entry => entry.data)
    const deduplicationResults = await this.deduplicator.deduplicateBatch(
      validData,
      existingWorkspaces
    )
    logger.info('Deduplication completed', deduplicationResults.summary)

    // Step 3: Calculate quality metrics for unique entries
    const processed: { data: ScrapedWorkspaceData; metrics: QualityMetrics }[] = []
    let totalQuality = 0

    for (const workspace of deduplicationResults.unique) {
      const metrics = this.validator.calculateMetrics(workspace)
      processed.push({ data: workspace, metrics })
      totalQuality += metrics.overall
    }

    // Step 4: Compile rejected entries
    const rejected: { data: ScrapedWorkspaceData; reasons: string[] }[] = []

    // Add invalid entries
    for (const entry of validationResults.invalidEntries) {
      rejected.push({
        data: entry.data,
        reasons: entry.validation.errors
      })
    }

    // Add duplicates
    for (const duplicate of deduplicationResults.duplicates) {
      rejected.push({
        data: duplicate.data,
        reasons: [
          `Duplicate workspace (${(duplicate.duplicate.confidence * 100).toFixed(1)}% similarity)`,
          ...duplicate.duplicate.duplicateFields.map(field => `Duplicate field: ${field}`)
        ]
      })
    }

    const summary = {
      input: scrapedData.length,
      processed: processed.length,
      rejected: rejected.length,
      duplicates: deduplicationResults.duplicates.length,
      averageQuality: processed.length > 0 ? Math.round(totalQuality / processed.length) : 0
    }

    logger.info('Data quality processing completed', summary)

    return { processed, rejected, summary }
  }
}

// Export instances
export const dataQualityValidator = new DataQualityValidator()
export const deduplicationEngine = new DeduplicationEngine()
export const dataQualityOrchestrator = new DataQualityOrchestrator()