/**
 * Google Places API integration for coworking space data
 * Provides comprehensive location data, ratings, reviews, and photos
 */

import { logger, PerformanceTimer } from '@/lib/logger'
import type { ScrapedWorkspaceData } from './coworking-scrapers'

export interface GooglePlacesConfig {
  apiKey: string
  baseUrl: string
}

export interface PlaceSearchQuery {
  query?: string
  location?: {
    lat: number
    lng: number
  }
  radius?: number
  type?: string
  country?: string
  city?: string
}

export interface GooglePlace {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  rating?: number
  user_ratings_total?: number
  price_level?: number
  photos?: Array<{
    photo_reference: string
    height: number
    width: number
  }>
  types: string[]
  business_status?: string
  opening_hours?: {
    open_now: boolean
    weekday_text: string[]
  }
  formatted_phone_number?: string
  website?: string
  vicinity?: string
}

export interface GooglePlaceDetails extends GooglePlace {
  international_phone_number?: string
  url?: string
  utc_offset?: number
  reviews?: Array<{
    author_name: string
    author_url?: string
    language: string
    profile_photo_url?: string
    rating: number
    relative_time_description: string
    text: string
    time: number
  }>
  editorial_summary?: {
    language: string
    overview: string
  }
}

/**
 * Google Places API client
 */
export class GooglePlacesClient {
  private config: GooglePlacesConfig

  constructor() {
    this.config = {
      apiKey: process.env.GOOGLE_PLACES_API_KEY || '',
      baseUrl: 'https://maps.googleapis.com/maps/api/place'
    }

    if (!this.config.apiKey) {
      logger.warn('Google Places API key not configured')
    }
  }

  /**
   * Search for coworking spaces
   */
  async searchCoworkingSpaces(query: PlaceSearchQuery): Promise<GooglePlace[]> {
    const timer = new PerformanceTimer('Google Places search')
    
    try {
      const searchUrl = this.buildSearchUrl(query)
      logger.info('Searching Google Places', { query, url: searchUrl })

      const response = await fetch(searchUrl)
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
      }

      const results = data.results || []
      timer.finish({ resultsCount: results.length, status: data.status })

      logger.info('Google Places search completed', {
        query,
        resultsCount: results.length,
        status: data.status
      })

      return results
    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      logger.error('Google Places search failed', error instanceof Error ? error : new Error(String(error)), { query })
      return []
    }
  }

  /**
   * Get detailed information for a place
   */
  async getPlaceDetails(placeId: string): Promise<GooglePlaceDetails | null> {
    const timer = new PerformanceTimer(`Google Places details ${placeId}`)
    
    try {
      const detailsUrl = this.buildDetailsUrl(placeId)
      logger.debug('Fetching Google Places details', { placeId, url: detailsUrl })

      const response = await fetch(detailsUrl)
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.status !== 'OK') {
        throw new Error(`Google Places API error: ${data.status} - ${data.error_message || 'Unknown error'}`)
      }

      timer.finish({ placeId, status: data.status })
      return data.result
    } catch (error) {
      timer.finish({ placeId, error: error instanceof Error ? error.message : String(error) })
      logger.error('Google Places details failed', error instanceof Error ? error : new Error(String(error)), { placeId })
      return null
    }
  }

  /**
   * Get photo URL from photo reference
   */
  getPhotoUrl(photoReference: string, maxWidth = 800): string {
    return `${this.config.baseUrl}/photo?photoreference=${photoReference}&maxwidth=${maxWidth}&key=${this.config.apiKey}`
  }

  /**
   * Convert Google Place to our ScrapedWorkspaceData format
   */
  convertToWorkspaceData(place: GooglePlaceDetails): ScrapedWorkspaceData {
    // Extract city and country from formatted_address
    const addressParts = place.formatted_address.split(', ')
    const country = addressParts[addressParts.length - 1]
    const city = addressParts.length > 2 ? addressParts[addressParts.length - 2] : ''

    // Extract amenities from place types and reviews
    const amenities = this.extractAmenities(place)

    // Extract pricing from reviews or other sources
    const pricingData = this.extractPricing(place)

    return {
      name: place.name,
      description: place.editorial_summary?.overview || this.generateDescription(place),
      address: place.formatted_address,
      city: city,
      country: country,
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      phone: place.international_phone_number || place.formatted_phone_number,
      website: place.website,
      images: place.photos?.map(photo => this.getPhotoUrl(photo.photo_reference)) || [],
      amenities,
      pricing: this.convertPricingFormat(pricingData),
      businessHours: place.opening_hours?.weekday_text.join('\n'),
      source: 'Google Places',
      sourceId: place.place_id,
      lastUpdated: new Date()
    }
  }

  /**
   * Build search URL
   */
  private buildSearchUrl(query: PlaceSearchQuery): string {
    const params = new URLSearchParams({
      key: this.config.apiKey
    })

    if (query.query) {
      params.append('query', `${query.query} coworking space`)
    } else {
      params.append('type', 'establishment')
      params.append('keyword', 'coworking space')
    }

    if (query.location) {
      params.append('location', `${query.location.lat},${query.location.lng}`)
    }

    if (query.radius) {
      params.append('radius', query.radius.toString())
    }

    if (query.country) {
      params.append('region', query.country.toLowerCase())
    }

    return `${this.config.baseUrl}/textsearch/json?${params.toString()}`
  }

  /**
   * Build details URL
   */
  private buildDetailsUrl(placeId: string): string {
    const fields = [
      'place_id',
      'name',
      'formatted_address',
      'geometry',
      'rating',
      'user_ratings_total',
      'price_level',
      'photos',
      'types',
      'business_status',
      'opening_hours',
      'formatted_phone_number',
      'international_phone_number',
      'website',
      'url',
      'reviews',
      'editorial_summary'
    ].join(',')

    const params = new URLSearchParams({
      place_id: placeId,
      fields,
      key: this.config.apiKey
    })

    return `${this.config.baseUrl}/details/json?${params.toString()}`
  }

  /**
   * Extract amenities from place data
   */
  private extractAmenities(place: GooglePlaceDetails): string[] {
    const amenities: Set<string> = new Set()

    // From place types
    const typeAmenityMap: Record<string, string> = {
      'wifi': 'High-Speed WiFi',
      'parking': 'Parking',
      'restaurant': 'Restaurant',
      'cafe': 'Coffee Bar',
      'gym': 'Fitness Center'
    }

    place.types.forEach(type => {
      if (typeAmenityMap[type]) {
        amenities.add(typeAmenityMap[type])
      }
    })

    // From reviews (basic keyword matching)
    place.reviews?.forEach(review => {
      const reviewText = review.text.toLowerCase()
      if (reviewText.includes('wifi') || reviewText.includes('internet')) {
        amenities.add('High-Speed WiFi')
      }
      if (reviewText.includes('coffee') || reviewText.includes('cafe')) {
        amenities.add('Coffee Bar')
      }
      if (reviewText.includes('parking')) {
        amenities.add('Parking')
      }
      if (reviewText.includes('meeting room')) {
        amenities.add('Meeting Rooms')
      }
    })

    // Default amenities for coworking spaces
    amenities.add('High-Speed WiFi')
    amenities.add('Meeting Rooms')

    return Array.from(amenities)
  }

  /**
   * Extract social media from place data
   */
  private extractSocialMedia(place: GooglePlaceDetails): Record<string, string> {
    // This would require more sophisticated extraction from reviews or website
    // For now, return empty object - could be enhanced with web scraping of the website
    return {}
  }

  /**
   * Extract pricing from place data
   */
  private extractPricing(place: GooglePlaceDetails): { hotDesk?: number; dedicatedDesk?: number; privateOffice?: number; currency?: string } {
    // Google Places price_level is 0-4, but doesn't give specific pricing
    // This would need to be enhanced with web scraping of the actual website
    
    const pricing = {
      currency: 'USD'
    }

    // Basic estimation based on price_level
    if (place.price_level !== undefined) {
      const basePrices = [20, 35, 50, 75, 100] // USD per day estimates
      const basePrice = basePrices[place.price_level] || 50
      
      return {
        ...pricing,
        hotDesk: basePrice,
        dedicatedDesk: Math.round(basePrice * 1.5),
        privateOffice: Math.round(basePrice * 3)
      }
    }

    return pricing
  }

  /**
   * Convert pricing data to ScrapedWorkspaceData format
   */
  private convertPricingFormat(pricingData: { hotDesk?: number; dedicatedDesk?: number; privateOffice?: number; currency?: string }): ScrapedWorkspaceData['pricing'] {
    const result = []
    
    if (pricingData.hotDesk) {
      result.push({
        type: 'Hot Desk',
        amount: pricingData.hotDesk,
        currency: pricingData.currency || 'USD',
        period: 'day'
      })
    }
    
    if (pricingData.dedicatedDesk) {
      result.push({
        type: 'Dedicated Desk',
        amount: pricingData.dedicatedDesk,
        currency: pricingData.currency || 'USD',
        period: 'day'
      })
    }
    
    if (pricingData.privateOffice) {
      result.push({
        type: 'Private Office',
        amount: pricingData.privateOffice,
        currency: pricingData.currency || 'USD',
        period: 'day'
      })
    }
    
    return result
  }

  /**
   * Generate description from available data
   */
  private generateDescription(place: GooglePlaceDetails): string {
    const parts = []
    
    if (place.rating) {
      parts.push(`Highly rated coworking space with ${place.rating} stars`)
    }
    
    if (place.user_ratings_total) {
      parts.push(`from ${place.user_ratings_total} reviews`)
    }
    
    if (place.vicinity) {
      parts.push(`located in ${place.vicinity}`)
    }

    // Add a review excerpt if available
    if (place.reviews && place.reviews.length > 0) {
      const bestReview = place.reviews
        .filter(r => r.rating >= 4)
        .sort((a, b) => b.rating - a.rating)[0]
      
      if (bestReview) {
        const excerpt = bestReview.text.slice(0, 150).trim()
        parts.push(`"${excerpt}${excerpt.length >= 150 ? '...' : ''}"`)
      }
    }

    return parts.join('. ') + '.'
  }
}

/**
 * Global Google Places client instance
 */
export const googlePlaces = new GooglePlacesClient()

/**
 * Predefined search queries for major cities
 */
export const MAJOR_CITIES_QUERIES: PlaceSearchQuery[] = [
  // US Cities
  { query: 'coworking space New York', country: 'US', city: 'New York' },
  { query: 'coworking space San Francisco', country: 'US', city: 'San Francisco' },
  { query: 'coworking space Los Angeles', country: 'US', city: 'Los Angeles' },
  { query: 'coworking space Chicago', country: 'US', city: 'Chicago' },
  { query: 'coworking space Austin', country: 'US', city: 'Austin' },
  { query: 'coworking space Seattle', country: 'US', city: 'Seattle' },
  { query: 'coworking space Boston', country: 'US', city: 'Boston' },
  { query: 'coworking space Miami', country: 'US', city: 'Miami' },

  // International Cities
  { query: 'coworking space London', country: 'UK', city: 'London' },
  { query: 'coworking space Berlin', country: 'DE', city: 'Berlin' },
  { query: 'coworking space Paris', country: 'FR', city: 'Paris' },
  { query: 'coworking space Amsterdam', country: 'NL', city: 'Amsterdam' },
  { query: 'coworking space Barcelona', country: 'ES', city: 'Barcelona' },
  { query: 'coworking space Tokyo', country: 'JP', city: 'Tokyo' },
  { query: 'coworking space Singapore', country: 'SG', city: 'Singapore' },
  { query: 'coworking space Toronto', country: 'CA', city: 'Toronto' },
  { query: 'coworking space Sydney', country: 'AU', city: 'Sydney' },
  { query: 'coworking space Dubai', country: 'AE', city: 'Dubai' }
]