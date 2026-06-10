/**
 * Data normalization utilities for workspace data from different sources
 */

import { logger } from '@/lib/logger'
import { ScrapedWorkspaceData } from './coworking-scrapers'

export class DataNormalizer {
  /**
   * Normalize workspace name
   */
  normalizeName(name: string): string {
    return name
      .trim()
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/^(WeWork\s*-?\s*|Regus\s*-?\s*|Spaces\s*-?\s*)/i, '') // Remove brand prefixes
      .trim()
  }

  /**
   * Normalize address
   */
  normalizeAddress(address: string): string {
    return address
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/,\s*,/g, ',') // Remove double commas
      .trim()
  }

  /**
   * Normalize phone number
   */
  normalizePhone(phone: string): string {
    // Remove all non-digit characters except +
    const cleaned = phone.replace(/[^\d+]/g, '')
    
    // Format US numbers
    if (cleaned.match(/^\d{10}$/)) {
      return `+1${cleaned}`
    }
    
    // Return as-is if already formatted
    if (cleaned.startsWith('+')) {
      return cleaned
    }
    
    return phone
  }

  /**
   * Normalize website URL
   */
  normalizeWebsite(website: string): string {
    if (!website) return website
    
    let url = website.trim().toLowerCase()
    
    // Add https if no protocol
    if (!url.startsWith('http')) {
      url = `https://${url}`
    }
    
    // Remove trailing slash
    url = url.replace(/\/$/, '')
    
    return url
  }

  /**
   * Normalize email
   */
  normalizeEmail(email: string): string {
    return email.toLowerCase().trim()
  }

  /**
   * Normalize city name
   */
  normalizeCity(city: string): string {
    return city
      .trim()
      .replace(/\s+/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Normalize country name
   */
  normalizeCountry(country: string): string {
    const countryMap: Record<string, string> = {
      'usa': 'United States',
      'us': 'United States',
      'united states of america': 'United States',
      'uk': 'United Kingdom',
      'gb': 'United Kingdom',
      'great britain': 'United Kingdom',
      'england': 'United Kingdom',
      'de': 'Germany',
      'deutschland': 'Germany',
      'fr': 'France',
      'jp': 'Japan',
      'au': 'Australia',
      'ca': 'Canada',
      'sg': 'Singapore',
      'nl': 'Netherlands',
      'es': 'Spain',
      'ae': 'United Arab Emirates',
    }

    const normalized = country.toLowerCase().trim()
    return countryMap[normalized] || country
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  /**
   * Normalize amenities list
   */
  normalizeAmenities(amenities: string[]): string[] {
    const amenityMap: Record<string, string> = {
      'wifi': 'High-Speed WiFi',
      'high-speed wifi': 'High-Speed WiFi',
      'high speed wifi': 'High-Speed WiFi',
      'internet': 'High-Speed WiFi',
      'high-speed internet': 'High-Speed WiFi',
      'coffee': 'Coffee & Tea',
      'coffee & tea': 'Coffee & Tea',
      'coffee bar': 'Coffee & Tea',
      'tea': 'Coffee & Tea',
      'meeting rooms': 'Meeting Rooms',
      'meeting room': 'Meeting Rooms',
      'conference rooms': 'Meeting Rooms',
      'phone booths': 'Phone Booths',
      'phone booth': 'Phone Booths',
      'printing': 'Printing Services',
      'printer': 'Printing Services',
      'printing services': 'Printing Services',
      'parking': 'Parking',
      'parking available': 'Parking',
      'bike storage': 'Bike Storage',
      'bike parking': 'Bike Storage',
      'lockers': 'Lockers',
      'storage': 'Storage',
      '24/7 access': '24/7 Access',
      '24-7 access': '24/7 Access',
      'round the clock access': '24/7 Access',
      'kitchen': 'Kitchen Facilities',
      'kitchenette': 'Kitchen Facilities',
      'microwave': 'Kitchen Facilities',
      'fridge': 'Kitchen Facilities',
      'gym': 'Fitness Center',
      'fitness': 'Fitness Center',
      'fitness center': 'Fitness Center',
      'shower': 'Shower Facilities',
      'showers': 'Shower Facilities',
      'shower facilities': 'Shower Facilities',
      'lounge': 'Lounge Area',
      'lounge area': 'Lounge Area',
      'common area': 'Common Areas',
      'common areas': 'Common Areas',
      'event space': 'Event Space',
      'events': 'Event Space',
      'networking events': 'Networking Events',
      'security': 'Security System',
      'secure access': 'Security System',
      'reception': 'Reception Services',
      'receptionist': 'Reception Services',
      'mail handling': 'Mail Handling',
      'mail service': 'Mail Handling',
    }

    return amenities
      .map(amenity => amenity.toLowerCase().trim())
      .filter(amenity => amenity.length > 0)
      .map(amenity => amenityMap[amenity] || this.titleCase(amenity))
      .filter((amenity, index, arr) => arr.indexOf(amenity) === index) // Remove duplicates
      .sort()
  }

  /**
   * Normalize coordinates
   */
  normalizeCoordinates(lat: number, lng: number): { latitude: number; longitude: number } | null {
    if (isNaN(lat) || isNaN(lng)) return null
    if (lat < -90 || lat > 90) return null
    if (lng < -180 || lng > 180) return null
    
    return {
      latitude: parseFloat(lat.toFixed(6)),
      longitude: parseFloat(lng.toFixed(6))
    }
  }

  /**
   * Normalize images array
   */
  normalizeImages(images: string[]): string[] {
    return images
      .filter(url => this.isValidImageUrl(url))
      .map(url => url.trim())
      .filter((url, index, arr) => arr.indexOf(url) === index) // Remove duplicates
      .slice(0, 20) // Limit to 20 images
  }

  /**
   * Normalize entire workspace data object
   */
  normalizeWorkspaceData(data: ScrapedWorkspaceData): ScrapedWorkspaceData {
    try {
      const normalized: ScrapedWorkspaceData = {
        name: this.normalizeName(data.name),
        description: data.description?.trim() || undefined,
        website: data.website ? this.normalizeWebsite(data.website) : undefined,
        phone: data.phone ? this.normalizePhone(data.phone) : undefined,
        email: data.email ? this.normalizeEmail(data.email) : undefined,
        address: data.address ? this.normalizeAddress(data.address) : undefined,
        city: data.city ? this.normalizeCity(data.city) : undefined,
        country: data.country ? this.normalizeCountry(data.country) : undefined,
        latitude: data.latitude,
        longitude: data.longitude,
        images: data.images ? this.normalizeImages(data.images) : undefined,
        amenities: data.amenities ? this.normalizeAmenities(data.amenities) : undefined,
        pricing: data.pricing,
        businessHours: data.businessHours?.trim() || undefined,
        capacity: data.capacity,
        source: data.source,
        sourceId: data.sourceId,
        lastUpdated: data.lastUpdated
      }

      // Normalize coordinates if both lat/lng are provided
      if (normalized.latitude !== undefined && normalized.longitude !== undefined) {
        const coords = this.normalizeCoordinates(normalized.latitude, normalized.longitude)
        if (coords) {
          normalized.latitude = coords.latitude
          normalized.longitude = coords.longitude
        } else {
          normalized.latitude = undefined
          normalized.longitude = undefined
        }
      }

      return normalized
    } catch (error) {
      logger.error('Failed to normalize workspace data', error instanceof Error ? error : new Error(String(error)))
      return data
    }
  }

  /**
   * Batch normalize multiple workspace entries
   */
  normalizeWorkspaceDataBatch(dataArray: ScrapedWorkspaceData[]): ScrapedWorkspaceData[] {
    return dataArray.map((data, index) => {
      try {
        return this.normalizeWorkspaceData(data)
      } catch (error) {
        logger.error(`Failed to normalize workspace data at index ${index}`, error instanceof Error ? error : new Error(String(error)))
        return data
      }
    })
  }

  /**
   * Extract and normalize city from address
   */
  extractCityFromAddress(address: string): string | undefined {
    if (!address) return undefined
    
    const parts = address.split(',').map(p => p.trim())
    
    // Common patterns:
    // "123 Street, City, State, Country"
    // "123 Street, City, Country"
    if (parts.length >= 3) {
      return this.normalizeCity(parts[parts.length - 2])
    }
    
    return undefined
  }

  /**
   * Extract and normalize country from address
   */
  extractCountryFromAddress(address: string): string | undefined {
    if (!address) return undefined
    
    const parts = address.split(',').map(p => p.trim())
    const lastPart = parts[parts.length - 1]
    
    return this.normalizeCountry(lastPart)
  }

  private titleCase(str: string): string {
    return str
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ')
  }

  private isValidImageUrl(url: string): boolean {
    try {
      const urlObj = new URL(url)
      return /\.(jpg|jpeg|png|webp|gif)$/i.test(urlObj.pathname) || 
             url.includes('googleusercontent.com') ||
             url.includes('unsplash.com') ||
             url.includes('images.unsplash.com')
    } catch {
      return false
    }
  }
}

// Export singleton instance
export const dataNormalizer = new DataNormalizer()