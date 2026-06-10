/**
 * Data Enrichment System using Google Places API
 * Enhances workspace data with additional details, photos, reviews, and metadata
 */

import { GooglePlacesClient, GooglePlace, GooglePlaceDetails } from '@/lib/scraping/google-places'
import { logger, PerformanceTimer } from '@/lib/logger'
import { DataNormalizer } from '@/lib/scraping/data-normalizer'
import { imageCollector } from '@/lib/server/image-collector'

export interface EnrichmentRequest {
  workspaceId: string
  name: string
  address?: string
  city?: string
  country?: string
  website?: string
  phone?: string
  latitude?: number
  longitude?: number
}

export interface EnrichmentResult {
  workspaceId: string
  success: boolean
  enrichedData?: EnrichedWorkspaceData
  error?: string
  confidence: number // 0-1 confidence that we found the right place
  source: 'google_places'
  timestamp: Date
}

export interface EnrichedWorkspaceData {
  // Enhanced basic info
  name?: string
  description?: string
  website?: string
  phone?: string
  email?: string
  
  // Enhanced location data
  address?: string
  latitude?: number
  longitude?: number
  timezone?: string
  
  // Business information
  businessStatus?: 'OPERATIONAL' | 'CLOSED_TEMPORARILY' | 'CLOSED_PERMANENTLY'
  priceLevel?: number // 0-4 scale
  rating?: number
  reviewCount?: number
  
  // Operating hours
  openingHours?: {
    openNow?: boolean
    periods?: Array<{
      open: { day: number; time: string }
      close?: { day: number; time: string }
    }>
    weekdayText?: string[]
  }
  
  // Enhanced images
  photos?: Array<{
    reference: string
    width: number
    height: number
    url?: string
    attribution?: string
  }>
  
  // Reviews and ratings
  reviews?: Array<{
    authorName: string
    authorUrl?: string
    language: string
    profilePhotoUrl?: string
    rating: number
    relativeTimeDescription: string
    text: string
    time: number
  }>
  
  // Additional metadata
  types?: string[]
  vicinity?: string
  internationalPhoneNumber?: string
  formattedPhoneNumber?: string
  utcOffset?: number
  
  // Derived insights
  amenities?: string[]
  tags?: string[]
  accessibility?: {
    wheelchairAccessible?: boolean
  }
}

export interface EnrichmentConfig {
  includePhotos: boolean
  includeReviews: boolean
  maxPhotos: number
  maxReviews: number
  confidenceThreshold: number
  respectRateLimit: boolean
  collectImages: boolean
}

export class PlacesEnricher {
  private googlePlaces: GooglePlacesClient
  private normalizer: DataNormalizer
  private config: EnrichmentConfig

  constructor(config?: Partial<EnrichmentConfig>) {
    this.googlePlaces = new GooglePlacesClient()
    this.normalizer = new DataNormalizer()
    this.config = {
      includePhotos: true,
      includeReviews: true,
      maxPhotos: 10,
      maxReviews: 5,
      confidenceThreshold: 0.7,
      respectRateLimit: true,
      collectImages: true,
      ...config
    }
  }

  /**
   * Enrich a single workspace with Google Places data
   */
  async enrichWorkspace(request: EnrichmentRequest): Promise<EnrichmentResult> {
    const timer = new PerformanceTimer(`Enrich workspace ${request.workspaceId}`)
    
    try {
      logger.info('Starting workspace enrichment', {
        workspaceId: request.workspaceId,
        name: request.name,
        city: request.city
      })

      // Search for the place
      const searchResult = await this.findMatchingPlace(request)
      
      if (!searchResult.place) {
        timer.finish({ success: false, reason: 'no_match' })
        return {
          workspaceId: request.workspaceId,
          success: false,
          error: 'No matching place found',
          confidence: 0,
          source: 'google_places',
          timestamp: new Date()
        }
      }

      // Get detailed place information
      const placeDetails = await this.googlePlaces.getPlaceDetails(
        searchResult.place.place_id
      )

      if (!placeDetails) {
        timer.finish({ success: false, reason: 'no_details' })
        return {
          workspaceId: request.workspaceId,
          success: false,
          error: 'Could not retrieve place details',
          confidence: searchResult.confidence,
          source: 'google_places',
          timestamp: new Date()
        }
      }

      // Convert to enriched data format
      const enrichedData = await this.convertToEnrichedData(placeDetails, request)

      // Collect images if enabled
      if (this.config.collectImages && enrichedData.photos && enrichedData.photos.length > 0) {
        try {
          const photoUrls = enrichedData.photos
            .slice(0, this.config.maxPhotos)
            .map(photo => photo.url)
            .filter(Boolean) as string[]

          if (photoUrls.length > 0) {
            const imageResult = await imageCollector.collectWorkspaceImages(
              request.workspaceId, 
              photoUrls
            )
            
            if (imageResult.success) {
              logger.info('Collected enhanced images', {
                workspaceId: request.workspaceId,
                originalCount: photoUrls.length,
                collectedCount: imageResult.images.length
              })
            }
          }
        } catch (error) {
          logger.warn('Image collection failed during enrichment', {
            workspaceId: request.workspaceId,
            error: error instanceof Error ? error.message : String(error)
          })
        }
      }

      const duration = timer.finish({ 
        success: true, 
        confidence: searchResult.confidence,
        hasPhotos: enrichedData.photos?.length || 0,
        hasReviews: enrichedData.reviews?.length || 0
      })

      logger.info('Workspace enrichment completed', {
        workspaceId: request.workspaceId,
        confidence: searchResult.confidence,
        duration: `${duration}ms`
      })

      return {
        workspaceId: request.workspaceId,
        success: true,
        enrichedData,
        confidence: searchResult.confidence,
        source: 'google_places',
        timestamp: new Date()
      }

    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      logger.error('Workspace enrichment failed', error instanceof Error ? error : new Error(String(error)), {
        workspaceId: request.workspaceId,
        name: request.name
      })

      return {
        workspaceId: request.workspaceId,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        confidence: 0,
        source: 'google_places',
        timestamp: new Date()
      }
    }
  }

  /**
   * Enrich multiple workspaces in batch
   */
  async enrichWorkspaces(
    requests: EnrichmentRequest[], 
    options: { maxConcurrent?: number, delayMs?: number } = {}
  ): Promise<EnrichmentResult[]> {
    const { maxConcurrent = 3, delayMs = 1000 } = options
    const results: EnrichmentResult[] = []
    
    logger.info('Starting batch workspace enrichment', {
      count: requests.length,
      maxConcurrent,
      delayMs
    })

    // Process in chunks to respect rate limits
    for (let i = 0; i < requests.length; i += maxConcurrent) {
      const chunk = requests.slice(i, i + maxConcurrent)
      
      const chunkPromises = chunk.map(request => this.enrichWorkspace(request))
      const chunkResults = await Promise.all(chunkPromises)
      
      results.push(...chunkResults)
      
      // Delay between chunks if respecting rate limits
      if (this.config.respectRateLimit && i + maxConcurrent < requests.length) {
        await this.delay(delayMs)
      }
    }

    const summary = this.summarizeResults(results)
    logger.info('Batch enrichment completed', summary)

    return results
  }

  /**
   * Find matching Google Place for workspace
   */
  private async findMatchingPlace(request: EnrichmentRequest): Promise<{
    place?: GooglePlace
    confidence: number
  }> {
    const queries = this.buildSearchQueries(request)
    let bestMatch: GooglePlace | undefined
    let bestConfidence = 0

    for (const query of queries) {
      try {
        logger.debug('Searching Google Places', { query })
        
        const places = await this.googlePlaces.searchCoworkingSpaces({
          query: query.text,
          location: query.location ? {
            lat: query.location.lat,
            lng: query.location.lng
          } : undefined,
          radius: query.radius
        })

        for (const place of places.slice(0, 3)) { // Check top 3 results
          const confidence = this.calculateMatchConfidence(request, place)
          
          if (confidence > bestConfidence && confidence >= this.config.confidenceThreshold) {
            bestMatch = place
            bestConfidence = confidence
          }
        }

        // If we found a high-confidence match, stop searching
        if (bestConfidence > 0.9) {
          break
        }

      } catch (error) {
        logger.warn('Google Places search failed', {
          query: query.text,
          error: error instanceof Error ? error.message : String(error)
        })
      }
    }

    return {
      place: bestMatch,
      confidence: bestConfidence
    }
  }

  /**
   * Build search queries for finding the workspace
   */
  private buildSearchQueries(request: EnrichmentRequest): Array<{
    text: string
    location?: { lat: number; lng: number }
    radius?: number
  }> {
    const queries: Array<{
      text: string
      location?: { lat: number; lng: number }
      radius?: number
    }> = []

    const location = request.latitude && request.longitude ? {
      lat: request.latitude,
      lng: request.longitude
    } : undefined

    // Primary query: exact name with location
    if (request.city) {
      queries.push({
        text: `${request.name} ${request.city}`,
        location,
        radius: 1000
      })
    }

    // Secondary query: name with address
    if (request.address) {
      queries.push({
        text: `${request.name} ${request.address}`,
        location,
        radius: 2000
      })
    }

    // Tertiary query: just name with coworking keywords
    queries.push({
      text: `${request.name} coworking space`,
      location,
      radius: 5000
    })

    // Fallback: name only with tight radius if we have coordinates
    if (location) {
      queries.push({
        text: request.name,
        location,
        radius: 500
      })
    }

    return queries
  }

  /**
   * Calculate confidence that a Google Place matches our workspace
   */
  private calculateMatchConfidence(request: EnrichmentRequest, place: GooglePlace): number {
    let confidence = 0
    let factors = 0

    // Name similarity (most important)
    if (request.name && place.name) {
      const nameSimilarity = this.stringSimilarity(
        request.name.toLowerCase(),
        place.name.toLowerCase()
      )
      confidence += nameSimilarity * 0.4
      factors += 0.4
    }

    // Address similarity
    if (request.address && place.formatted_address) {
      const addressSimilarity = this.stringSimilarity(
        request.address.toLowerCase(),
        place.formatted_address.toLowerCase()
      )
      confidence += addressSimilarity * 0.3
      factors += 0.3
    }

    // Location proximity (if coordinates available)
    if (request.latitude && request.longitude && place.geometry?.location) {
      const distance = this.calculateDistance(
        request.latitude,
        request.longitude,
        place.geometry.location.lat,
        place.geometry.location.lng
      )
      
      // Consider within 1km as good match
      const locationScore = Math.max(0, 1 - (distance / 1000))
      confidence += locationScore * 0.2
      factors += 0.2
    }

    // Business type relevance
    const relevantTypes = [
      'establishment',
      'point_of_interest', 
      'office',
      'business_park'
    ]
    
    if (place.types?.some(type => relevantTypes.includes(type))) {
      confidence += 0.1
      factors += 0.1
    }

    return factors > 0 ? confidence / factors : 0
  }

  /**
   * Convert Google Places details to enriched workspace data
   */
  private async convertToEnrichedData(
    placeDetails: GooglePlaceDetails,
    originalRequest: EnrichmentRequest
  ): Promise<EnrichedWorkspaceData> {
    const enrichedData: EnrichedWorkspaceData = {
      name: placeDetails.name,
      website: placeDetails.website,
      phone: placeDetails.formatted_phone_number,
      internationalPhoneNumber: placeDetails.international_phone_number,
      
      address: placeDetails.formatted_address,
      latitude: placeDetails.geometry?.location?.lat,
      longitude: placeDetails.geometry?.location?.lng,
      
      businessStatus: this.mapBusinessStatus(placeDetails.business_status),
      priceLevel: placeDetails.price_level,
      rating: placeDetails.rating,
      reviewCount: placeDetails.user_ratings_total,
      
      types: placeDetails.types,
      vicinity: placeDetails.vicinity,
      utcOffset: placeDetails.utc_offset,
      
      reviews: placeDetails.reviews?.map(review => ({
        authorName: review.author_name,
        authorUrl: review.author_url,
        language: review.language,
        profilePhotoUrl: review.profile_photo_url,
        rating: review.rating,
        relativeTimeDescription: review.relative_time_description,
        text: review.text,
        time: review.time
      }))
    }

    // Process opening hours
    if (placeDetails.opening_hours) {
      enrichedData.openingHours = {
        openNow: placeDetails.opening_hours.open_now,
        weekdayText: placeDetails.opening_hours.weekday_text,
      }
    }

    // Process photos
    if (placeDetails.photos) {
      enrichedData.photos = await Promise.all(
        placeDetails.photos.slice(0, this.config.maxPhotos).map(async (photo) => {
          try {
            const photoUrl = this.googlePlaces.getPhotoUrl(photo.photo_reference, 1200)
            
            return {
              reference: photo.photo_reference,
              width: photo.width,
              height: photo.height,
              url: photoUrl,
              attribution: ''
            }
          } catch (error) {
            logger.warn('Failed to get photo URL', { photoRef: photo.photo_reference })
            return {
              reference: photo.photo_reference,
              width: photo.width,
              height: photo.height
            }
          }
        })
      )
    }

    // Extract amenities from reviews and place types
    enrichedData.amenities = this.extractAmenities(placeDetails)
    enrichedData.tags = this.extractTags(placeDetails)

    // Accessibility info not available in current schema
    enrichedData.accessibility = {
      wheelchairAccessible: undefined
    }

    return enrichedData
  }

  /**
   * Extract amenities from place data and reviews
   */
  private extractAmenities(placeDetails: GooglePlaceDetails): string[] {
    const amenities = new Set<string>()

    // From place types
    if (placeDetails.types?.includes('wifi')) amenities.add('WiFi')
    if (placeDetails.types?.includes('parking')) amenities.add('Parking')

    // From reviews text analysis
    const reviewTexts = placeDetails.reviews?.map(r => r.text.toLowerCase()).join(' ') || ''
    
    const amenityKeywords = {
      'WiFi': ['wifi', 'internet', 'wireless'],
      'Coffee': ['coffee', 'cafe', 'espresso', 'latte'],
      'Parking': ['parking', 'garage', 'valet'],
      'Meeting Rooms': ['meeting room', 'conference room', 'boardroom'],
      'Kitchen': ['kitchen', 'fridge', 'microwave'],
      'Printer': ['printer', 'printing', 'scanner'],
      '24/7 Access': ['24/7', 'twenty four', 'always open'],
      'Security': ['security', 'keycard', 'access control']
    }

    Object.entries(amenityKeywords).forEach(([amenity, keywords]) => {
      if (keywords.some(keyword => reviewTexts.includes(keyword))) {
        amenities.add(amenity)
      }
    })

    return Array.from(amenities)
  }

  /**
   * Extract tags from place data
   */
  private extractTags(placeDetails: GooglePlaceDetails): string[] {
    const tags = new Set<string>()

    // From place types
    if (placeDetails.types?.includes('establishment')) tags.add('Business')
    if (placeDetails.types?.includes('point_of_interest')) tags.add('Popular')
    
    // From rating
    if (placeDetails.rating && placeDetails.rating >= 4.5) tags.add('Highly Rated')
    if (placeDetails.user_ratings_total && placeDetails.user_ratings_total > 100) tags.add('Well Reviewed')

    // From price level
    if (placeDetails.price_level === 0) tags.add('Free')
    if (placeDetails.price_level === 1) tags.add('Affordable')
    if (placeDetails.price_level === 4) tags.add('Premium')

    return Array.from(tags)
  }

  /**
   * String similarity using Levenshtein distance
   */
  private stringSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2
    const shorter = str1.length > str2.length ? str2 : str1
    
    if (longer.length === 0) return 1.0
    
    const editDistance = this.levenshteinDistance(longer, shorter)
    return (longer.length - editDistance) / longer.length
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = []
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i]
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1]
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          )
        }
      }
    }
    
    return matrix[str2.length][str1.length]
  }

  /**
   * Calculate distance between two coordinates in meters
   */
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3 // Earth radius in meters
    const φ1 = lat1 * Math.PI/180
    const φ2 = lat2 * Math.PI/180
    const Δφ = (lat2-lat1) * Math.PI/180
    const Δλ = (lon2-lon1) * Math.PI/180

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))

    return R * c
  }

  private mapBusinessStatus(status?: string): EnrichedWorkspaceData['businessStatus'] {
    switch (status) {
      case 'OPERATIONAL': return 'OPERATIONAL'
      case 'CLOSED_TEMPORARILY': return 'CLOSED_TEMPORARILY'
      case 'CLOSED_PERMANENTLY': return 'CLOSED_PERMANENTLY'
      default: return 'OPERATIONAL'
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  private summarizeResults(results: EnrichmentResult[]) {
    const successful = results.filter(r => r.success).length
    const failed = results.length - successful
    const avgConfidence = results
      .filter(r => r.success)
      .reduce((sum, r) => sum + r.confidence, 0) / Math.max(successful, 1)

    return {
      total: results.length,
      successful,
      failed,
      successRate: `${Math.round((successful / results.length) * 100)}%`,
      averageConfidence: Math.round(avgConfidence * 100) / 100
    }
  }
}

/**
 * Global enricher instance
 */
export const placesEnricher = new PlacesEnricher()