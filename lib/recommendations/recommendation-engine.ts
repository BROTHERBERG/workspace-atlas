/**
 * Workspace Recommendation Engine
 * Provides personalized workspace suggestions using multiple recommendation strategies
 */

import { PrismaClient } from '@prisma/client'
import { logger, PerformanceTimer } from '@/lib/logger'
import { cache } from '@/lib/cache'
import { prisma } from '@/lib/db'

export interface UserProfile {
  id?: string
  preferences?: {
    workspaceTypes: string[]
    amenities: string[]
    priceRange: { min: number; max: number }
    cities: string[]
    workingStyle: 'quiet' | 'collaborative' | 'flexible'
  }
  behavior?: {
    recentSearches: string[]
    viewedWorkspaces: string[]
    favoriteWorkspaces: string[]
    bookingHistory: string[]
    searchFilters: Array<{
      amenities: string[]
      priceRange?: { min: number; max: number }
      location?: { city: string; country: string }
      timestamp: Date
    }>
  }
}

export interface RecommendationContext {
  currentLocation?: {
    latitude: number
    longitude: number
    city?: string
    country?: string
  }
  timeOfDay?: 'morning' | 'afternoon' | 'evening'
  dayOfWeek?: 'weekday' | 'weekend'
  purpose?: 'work' | 'meeting' | 'event' | 'networking'
  duration?: 'hour' | 'day' | 'week' | 'month'
}

export interface RecommendationOptions {
  count?: number
  includeReasons?: boolean
  diversityWeight?: number // 0-1, higher = more diverse results
  noveltyWeight?: number // 0-1, higher = more new/unexplored options
  locationWeight?: number // 0-1, higher = prioritize location proximity
  personalityMatch?: boolean
  excludeWorkspaceIds?: string[]
}

export interface Recommendation {
  workspace: {
    id: string
    name: string
    slug: string
    description?: string
    city?: string
    country?: string
    latitude?: number
    longitude?: number
    images: string[]
    hotDeskPrice?: number
    dedicatedDeskPrice?: number
    privateOfficePrice?: number
    pricingCurrency: string
    rating?: number
    reviewCount?: number
    digitalScore: number
    amenities: string[]
    workspaceType?: string
    isVerified: boolean
    website?: string
  }
  score: number // 0-100 recommendation confidence
  reasons: string[]
  strategy: 'collaborative' | 'content-based' | 'location' | 'trending' | 'similar-users' | 'hybrid'
  distance?: number
  priceMatch?: 'budget' | 'mid-range' | 'premium'
  noveltyScore?: number // How new/unexplored this is for the user
}

export interface RecommendationResponse {
  recommendations: Recommendation[]
  metadata: {
    strategy: string
    executionTime: number
    userProfile?: 'new' | 'light' | 'active' | 'power'
    personalizationLevel: number // 0-100, how personalized these recommendations are
    nextRefreshTime?: Date
  }
}

export class WorkspaceRecommendationEngine {
  private prisma: PrismaClient

  constructor(prismaClient?: PrismaClient) {
    this.prisma = prismaClient || prisma
  }
  
  /**
   * Get personalized workspace recommendations
   */
  async getRecommendations(
    userProfile?: UserProfile,
    context?: RecommendationContext,
    options: RecommendationOptions = {}
  ): Promise<RecommendationResponse> {
    const timer = new PerformanceTimer('workspace-recommendations')
    const {
      count = 10,
      includeReasons = true,
      diversityWeight = 0.3,
      noveltyWeight = 0.2,
      locationWeight = 0.4,
      personalityMatch = true,
      excludeWorkspaceIds = []
    } = options

    try {
      logger.info('Generating workspace recommendations', {
        hasProfile: !!userProfile,
        hasContext: !!context,
        options
      })

      // Determine user profile type for strategy selection
      const profileType = this.analyzeUserProfile(userProfile)
      
      // Build cache key
      const cacheKey = this.generateCacheKey(userProfile, context, options)
      
      // Try cache first (10 minute TTL for recommendations)
      const cached = cache.get(cacheKey) as RecommendationResponse | null
      if (cached) {
        logger.info('Recommendation cache hit', { cacheKey, profileType })
        return cached
      }

      // Get base workspace pool
      const workspaces = await this.getWorkspacePool(context, excludeWorkspaceIds)
      
      // Apply multiple recommendation strategies
      const strategies = await this.selectRecommendationStrategies(profileType, userProfile, context)
      
      let allRecommendations: Recommendation[] = []
      
      for (const strategy of strategies) {
        const strategyRecommendations = await this.applyStrategy(
          strategy,
          workspaces,
          userProfile,
          context,
          options
        )
        allRecommendations.push(...strategyRecommendations)
      }
      
      // Remove duplicates and combine scores
      const uniqueRecommendations = this.deduplicateRecommendations(allRecommendations)
      
      // Apply diversity and novelty adjustments
      const diversifiedRecommendations = this.applyDiversity(
        uniqueRecommendations,
        diversityWeight,
        noveltyWeight
      )
      
      // Sort by final score and take top N
      const finalRecommendations = diversifiedRecommendations
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
      
      // Calculate personalization level
      const personalizationLevel = this.calculatePersonalizationLevel(
        userProfile,
        finalRecommendations
      )
      
      const response: RecommendationResponse = {
        recommendations: includeReasons ? finalRecommendations : finalRecommendations.map(r => ({
          ...r,
          reasons: []
        })),
        metadata: {
          strategy: strategies.join(', '),
          executionTime: timer.finish({
            count: finalRecommendations.length,
            profileType,
            personalizationLevel
          }),
          userProfile: profileType,
          personalizationLevel,
          nextRefreshTime: new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
        }
      }
      
      // Cache the response
      await cache.set(cacheKey, response, 600) // 10 minutes
      
      logger.info('Recommendations generated', {
        count: finalRecommendations.length,
        strategies: strategies.join(', '),
        personalizationLevel,
        profileType
      })
      
      return response
      
    } catch (error) {
      timer.finish({ error: error instanceof Error ? error.message : String(error) })
      logger.error('Recommendation generation failed', error instanceof Error ? error : new Error(String(error)))
      throw error
    }
  }
  
  /**
   * Get trending workspaces
   */
  async getTrendingWorkspaces(
    context?: RecommendationContext,
    count: number = 10
  ): Promise<Recommendation[]> {
    try {
      const cacheKey = `trending-workspaces:${JSON.stringify(context)}:${count}`
      const cached = cache.get(cacheKey) as Recommendation[] | null
      if (cached) return cached
      
      // Get workspaces with high recent activity (views, bookings, searches)
      const workspaces = await this.prisma.workspace.findMany({
        where: {
          isActive: true,
          status: 'ACTIVE',
          rating: { gte: 4.0 }, // Good rating threshold
          reviewCount: { gte: 5 } // Minimum reviews for trending
        },
        orderBy: [
          { reviewCount: 'desc' },
          { rating: 'desc' },
          { digitalScore: 'desc' },
          { updatedAt: 'desc' }
        ],
        take: count * 2 // Get more for filtering
      })
      
      const recommendations = await Promise.all(
        workspaces.slice(0, count).map(async (workspace, index) => {
          const recommendation: Recommendation = {
            workspace: this.formatWorkspaceForRecommendation(workspace),
            score: 80 - (index * 2), // Decreasing score by position
            reasons: [
              'Trending workspace',
              'High user rating',
              'Popular choice',
              'Recently updated'
            ],
            strategy: 'trending' as const,
            noveltyScore: Math.random() * 30 + 20 // Random novelty for trending
          }
          
          // Add distance if location provided
          if (context?.currentLocation && workspace.latitude && workspace.longitude) {
            recommendation.distance = this.calculateDistance(
              context.currentLocation.latitude,
              context.currentLocation.longitude,
              workspace.latitude,
              workspace.longitude
            )
          }
          
          return recommendation
        })
      )
      
      await cache.set(cacheKey, recommendations, 300) // 5 minute cache
      return recommendations
      
    } catch (error) {
      logger.error('Trending workspaces failed', error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }
  
  /**
   * Get similar workspaces to a given workspace
   */
  async getSimilarWorkspaces(
    workspaceId: string,
    count: number = 6
  ): Promise<Recommendation[]> {
    try {
      const cacheKey = `similar-workspaces:${workspaceId}:${count}`
      const cached = cache.get(cacheKey) as Recommendation[] | null
      if (cached) return cached
      
      // Get the target workspace
      const targetWorkspace = await this.prisma.workspace.findUnique({
        where: { id: workspaceId },
      })
      
      if (!targetWorkspace) {
        throw new Error('Target workspace not found')
      }
      
      // Find similar workspaces based on multiple criteria
      const similarWorkspaces = await this.prisma.workspace.findMany({
        where: {
          id: { not: workspaceId },
          isActive: true,
          status: 'ACTIVE',
          OR: [
            // Same city
            {
              city: targetWorkspace.city,
              country: targetWorkspace.country
            },
            // Similar price range
            {
              hotDeskPrice: {
                gte: (targetWorkspace.hotDeskPrice || 0) * 0.7,
                lte: (targetWorkspace.hotDeskPrice || 999) * 1.3
              }
            },
            // Same workspace type
            {
              workspaceTypeId: targetWorkspace.workspaceTypeId
            }
          ]
        },
        take: count * 3 // Get more for similarity scoring
      })
      
      // Calculate similarity scores
      const recommendations = similarWorkspaces
        .map(workspace => {
          const similarity = this.calculateWorkspaceSimilarity(targetWorkspace, workspace)
          
          const recommendation: Recommendation = {
            workspace: this.formatWorkspaceForRecommendation(workspace),
            score: Math.round(similarity * 100),
            reasons: this.generateSimilarityReasons(targetWorkspace, workspace),
            strategy: 'content-based' as const,
            noveltyScore: Math.random() * 50 + 25
          }
          
          return recommendation
        })
        .filter(r => r.score > 30) // Only include reasonably similar
        .sort((a, b) => b.score - a.score)
        .slice(0, count)
      
      await cache.set(cacheKey, recommendations, 600) // 10 minute cache
      return recommendations
      
    } catch (error) {
      logger.error('Similar workspaces failed', error instanceof Error ? error : new Error(String(error)), { workspaceId })
      return []
    }
  }
  
  /**
   * Get recommendations for a specific location
   */
  async getLocationBasedRecommendations(
    latitude: number,
    longitude: number,
    radiusKm: number = 5,
    count: number = 10
  ): Promise<Recommendation[]> {
    try {
      // Use raw SQL for geographic search
      const nearbyWorkspaces = await this.prisma.$queryRaw<any[]>`
        SELECT 
          *,
          (6371 * acos(
            cos(radians(${latitude})) * 
            cos(radians(latitude)) * 
            cos(radians(longitude) - radians(${longitude})) + 
            sin(radians(${latitude})) * 
            sin(radians(latitude))
          )) AS distance
        FROM "Workspace" 
        WHERE 
          latitude IS NOT NULL 
          AND longitude IS NOT NULL
          AND "isActive" = true
          AND "status" = 'ACTIVE'
        HAVING distance <= ${radiusKm}
        ORDER BY distance, rating DESC, "digitalScore" DESC
        LIMIT ${count * 2}
      `
      
      const recommendations = nearbyWorkspaces.slice(0, count).map((workspace, index) => {
        const distance = parseFloat(workspace.distance)
        const proximityScore = Math.max(0, 100 - (distance * 10)) // Closer = higher score
        const qualityScore = (workspace.digitalScore || 50) + ((workspace.rating || 0) * 10)
        
        return {
          workspace: this.formatWorkspaceForRecommendation(workspace),
          score: Math.round((proximityScore * 0.6) + (qualityScore * 0.4)),
          reasons: [
            `${distance.toFixed(1)} km away`,
            'Near your location',
            ...(workspace.rating >= 4.5 ? ['Highly rated'] : []),
            ...(workspace.digitalScore >= 80 ? ['Great digital presence'] : [])
          ],
          strategy: 'location' as const,
          distance,
          noveltyScore: Math.random() * 40 + 30
        } as Recommendation
      })
      
      return recommendations
      
    } catch (error) {
      logger.error('Location-based recommendations failed', error instanceof Error ? error : new Error(String(error)))
      return []
    }
  }
  
  // Private helper methods
  
  private analyzeUserProfile(userProfile?: UserProfile): 'new' | 'light' | 'active' | 'power' {
    if (!userProfile || !userProfile.behavior) return 'new'
    
    const behavior = userProfile.behavior
    const activityScore = 
      (behavior.recentSearches?.length || 0) +
      (behavior.viewedWorkspaces?.length || 0) * 2 +
      (behavior.favoriteWorkspaces?.length || 0) * 3 +
      (behavior.bookingHistory?.length || 0) * 5
    
    if (activityScore > 50) return 'power'
    if (activityScore > 20) return 'active'
    if (activityScore > 5) return 'light'
    return 'new'
  }
  
  private async getWorkspacePool(
    context?: RecommendationContext,
    excludeIds: string[] = []
  ): Promise<any[]> {
    const whereClause: any = {
      isActive: true,
      status: 'ACTIVE'
    }
    
    if (excludeIds.length > 0) {
      whereClause.id = { notIn: excludeIds }
    }
    
    // Add location filtering if context provided
    if (context?.currentLocation?.city) {
      whereClause.OR = [
        { city: context.currentLocation.city },
        { country: context.currentLocation.country }
      ]
    }
    
    return await this.prisma.workspace.findMany({
      where: whereClause,
      take: 200, // Large pool for recommendation algorithms
      orderBy: [
        { digitalScore: 'desc' },
        { rating: 'desc' },
        { reviewCount: 'desc' }
      ]
    })
  }
  
  private async selectRecommendationStrategies(
    profileType: string,
    userProfile?: UserProfile,
    context?: RecommendationContext
  ): Promise<string[]> {
    const strategies: string[] = []
    
    // Always include some content-based recommendations
    strategies.push('content-based')
    
    // For new users, focus on trending and location
    if (profileType === 'new') {
      strategies.push('trending', 'location')
    }
    
    // For active users, add collaborative filtering
    if (profileType === 'active' || profileType === 'power') {
      strategies.push('collaborative', 'similar-users')
    }
    
    // Add location strategy if location context is available
    if (context?.currentLocation) {
      if (!strategies.includes('location')) {
        strategies.push('location')
      }
    }
    
    // Always include hybrid approach
    strategies.push('hybrid')
    
    return strategies
  }
  
  private async applyStrategy(
    strategy: string,
    workspaces: any[],
    userProfile?: UserProfile,
    context?: RecommendationContext,
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    switch (strategy) {
      case 'collaborative':
        return this.applyCollaborativeFiltering(workspaces, userProfile, options)
      
      case 'content-based':
        return this.applyContentBasedFiltering(workspaces, userProfile, context, options)
      
      case 'location':
        return this.applyLocationBasedFiltering(workspaces, context, options)
      
      case 'trending':
        return this.applyTrendingFiltering(workspaces, options)
      
      case 'similar-users':
        return this.applySimilarUsersFiltering(workspaces, userProfile, options)
      
      case 'hybrid':
        return this.applyHybridFiltering(workspaces, userProfile, context, options)
      
      default:
        return []
    }
  }
  
  private async applyContentBasedFiltering(
    workspaces: any[],
    userProfile?: UserProfile,
    context?: RecommendationContext,
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    const recommendations: Recommendation[] = []
    
    for (const workspace of workspaces.slice(0, 20)) {
      let score = workspace.digitalScore || 50
      const reasons: string[] = []
      
      // Preference matching
      if (userProfile?.preferences) {
        const prefs = userProfile.preferences
        
        // Amenity preferences
        if (prefs.amenities?.length) {
          const workspaceAmenities = workspace.amenities as string[] || []
          const matchingAmenities = prefs.amenities.filter(pref => 
            workspaceAmenities.some(amenity => 
              amenity.toLowerCase().includes(pref.toLowerCase())
            )
          )
          
          if (matchingAmenities.length > 0) {
            score += matchingAmenities.length * 10
            reasons.push(`Matches ${matchingAmenities.length} preferred amenities`)
          }
        }
        
        // Price range preferences
        if (prefs.priceRange && workspace.hotDeskPrice) {
          if (workspace.hotDeskPrice >= prefs.priceRange.min && 
              workspace.hotDeskPrice <= prefs.priceRange.max) {
            score += 15
            reasons.push('Within your price range')
          }
        }
        
        // City preferences
        if (prefs.cities?.includes(workspace.city)) {
          score += 20
          reasons.push('In your preferred city')
        }
      }
      
      // Quality indicators
      if (workspace.rating >= 4.5) {
        score += 10
        reasons.push('Highly rated workspace')
      }
      
      if (workspace.isVerified) {
        score += 5
        reasons.push('Verified workspace')
      }
      
      // Context matching
      if (context?.purpose) {
        // This would be more sophisticated with workspace tags/categories
        if (context.purpose === 'meeting' && 
            (workspace.amenities as string[])?.some(a => a.toLowerCase().includes('meeting'))) {
          score += 15
          reasons.push('Great for meetings')
        }
      }
      
      recommendations.push({
        workspace: this.formatWorkspaceForRecommendation(workspace),
        score: Math.min(score, 100),
        reasons,
        strategy: 'content-based',
        noveltyScore: Math.random() * 50 + 25
      })
    }
    
    return recommendations
  }
  
  private async applyLocationBasedFiltering(
    workspaces: any[],
    context?: RecommendationContext,
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    if (!context?.currentLocation) return []
    
    const recommendations: Recommendation[] = []
    const { latitude, longitude } = context.currentLocation
    
    for (const workspace of workspaces) {
      if (!workspace.latitude || !workspace.longitude) continue
      
      const distance = this.calculateDistance(
        latitude,
        longitude,
        workspace.latitude,
        workspace.longitude
      )
      
      // Only include workspaces within reasonable distance
      if (distance > 50) continue // 50km max
      
      const proximityScore = Math.max(0, 100 - (distance * 2))
      const qualityScore = workspace.digitalScore || 50
      
      const score = (proximityScore * 0.6) + (qualityScore * 0.4)
      
      recommendations.push({
        workspace: this.formatWorkspaceForRecommendation(workspace),
        score: Math.round(score),
        reasons: [
          `${distance.toFixed(1)} km from your location`,
          'Convenient location',
          ...(workspace.rating >= 4.0 ? ['Good rating'] : [])
        ],
        strategy: 'location',
        distance,
        noveltyScore: Math.random() * 40 + 20
      })
    }
    
    return recommendations.sort((a, b) => (a.distance || 999) - (b.distance || 999))
  }
  
  private async applyTrendingFiltering(
    workspaces: any[],
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    // Simple trending based on rating and review count
    return workspaces
      .filter(w => (w.rating || 0) >= 4.0 && (w.reviewCount || 0) >= 5)
      .slice(0, 10)
      .map((workspace, index) => ({
        workspace: this.formatWorkspaceForRecommendation(workspace),
        score: 80 - (index * 3),
        reasons: ['Trending workspace', 'Popular choice', 'High user satisfaction'],
        strategy: 'trending' as const,
        noveltyScore: Math.random() * 30 + 40
      }))
  }
  
  private async applyCollaborativeFiltering(
    workspaces: any[],
    userProfile?: UserProfile,
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    // Simplified collaborative filtering
    // In production, this would use actual user similarity data
    if (!userProfile?.behavior?.favoriteWorkspaces?.length) return []
    
    // This is a placeholder - real collaborative filtering would:
    // 1. Find users with similar preferences
    // 2. Recommend workspaces liked by similar users
    // 3. Use matrix factorization or item-based collaborative filtering
    
    return workspaces.slice(0, 8).map((workspace, index) => ({
      workspace: this.formatWorkspaceForRecommendation(workspace),
      score: 70 - (index * 2),
      reasons: ['Users like you also liked this', 'Recommended based on similar preferences'],
      strategy: 'collaborative' as const,
      noveltyScore: Math.random() * 60 + 20
    }))
  }
  
  private async applySimilarUsersFiltering(
    workspaces: any[],
    userProfile?: UserProfile,
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    // Placeholder for similar users strategy
    return []
  }
  
  private async applyHybridFiltering(
    workspaces: any[],
    userProfile?: UserProfile,
    context?: RecommendationContext,
    options?: RecommendationOptions
  ): Promise<Recommendation[]> {
    // Combine multiple strategies with weighted scores
    const contentBased = await this.applyContentBasedFiltering(workspaces, userProfile, context, options)
    const locationBased = await this.applyLocationBasedFiltering(workspaces, context, options)
    const trending = await this.applyTrendingFiltering(workspaces, options)
    
    // Merge and reweight
    const allRecommendations = [
      ...contentBased.map(r => ({ ...r, score: r.score * 0.5, strategy: 'hybrid' as const })),
      ...locationBased.map(r => ({ ...r, score: r.score * 0.3, strategy: 'hybrid' as const })),
      ...trending.map(r => ({ ...r, score: r.score * 0.2, strategy: 'hybrid' as const }))
    ]
    
    return this.deduplicateRecommendations(allRecommendations)
  }
  
  private deduplicateRecommendations(recommendations: Recommendation[]): Recommendation[] {
    const seen = new Map<string, Recommendation>()
    
    for (const rec of recommendations) {
      const existing = seen.get(rec.workspace.id)
      if (!existing || rec.score > existing.score) {
        seen.set(rec.workspace.id, rec)
      }
    }
    
    return Array.from(seen.values())
  }
  
  private applyDiversity(
    recommendations: Recommendation[],
    diversityWeight: number,
    noveltyWeight: number
  ): Recommendation[] {
    // Apply diversity and novelty adjustments
    return recommendations.map(rec => {
      const diversityBonus = Math.random() * diversityWeight * 10
      const noveltyBonus = (rec.noveltyScore || 0) * noveltyWeight * 0.3
      
      return {
        ...rec,
        score: Math.min(100, rec.score + diversityBonus + noveltyBonus)
      }
    })
  }
  
  private calculatePersonalizationLevel(
    userProfile?: UserProfile,
    recommendations?: Recommendation[]
  ): number {
    if (!userProfile) return 0
    
    let level = 0
    
    // Base personalization from profile completeness
    if (userProfile.preferences?.amenities?.length) level += 20
    if (userProfile.preferences?.cities?.length) level += 15
    if (userProfile.preferences?.priceRange) level += 15
    if (userProfile.behavior?.recentSearches?.length) level += 10
    if (userProfile.behavior?.favoriteWorkspaces?.length) level += 20
    if (userProfile.behavior?.bookingHistory?.length) level += 20
    
    return Math.min(100, level)
  }
  
  private calculateWorkspaceSimilarity(workspace1: any, workspace2: any): number {
    let similarity = 0
    let factors = 0
    
    // Location similarity
    if (workspace1.city === workspace2.city) {
      similarity += 0.3
    }
    factors += 0.3
    
    // Price similarity
    if (workspace1.hotDeskPrice && workspace2.hotDeskPrice) {
      const priceDiff = Math.abs(workspace1.hotDeskPrice - workspace2.hotDeskPrice)
      const avgPrice = (workspace1.hotDeskPrice + workspace2.hotDeskPrice) / 2
      const priceSimilarity = Math.max(0, 1 - (priceDiff / avgPrice))
      similarity += priceSimilarity * 0.2
    }
    factors += 0.2
    
    // Amenity similarity
    const amenities1 = (workspace1.amenities as string[]) || []
    const amenities2 = (workspace2.amenities as string[]) || []
    const commonAmenities = amenities1.filter(a => amenities2.includes(a))
    const totalAmenities = new Set([...amenities1, ...amenities2]).size
    
    if (totalAmenities > 0) {
      const amenitySimilarity = commonAmenities.length / totalAmenities
      similarity += amenitySimilarity * 0.3
    }
    factors += 0.3
    
    // Rating similarity
    if (workspace1.rating && workspace2.rating) {
      const ratingDiff = Math.abs(workspace1.rating - workspace2.rating)
      const ratingSimilarity = Math.max(0, 1 - (ratingDiff / 5))
      similarity += ratingSimilarity * 0.2
    }
    factors += 0.2
    
    return factors > 0 ? similarity / factors : 0
  }
  
  private generateSimilarityReasons(workspace1: any, workspace2: any): string[] {
    const reasons: string[] = []
    
    if (workspace1.city === workspace2.city) {
      reasons.push(`Same city: ${workspace1.city}`)
    }
    
    if (workspace1.workspaceTypeId === workspace2.workspaceTypeId) {
      reasons.push('Similar workspace type')
    }
    
    const amenities1 = (workspace1.amenities as string[]) || []
    const amenities2 = (workspace2.amenities as string[]) || []
    const commonAmenities = amenities1.filter(a => amenities2.includes(a))
    
    if (commonAmenities.length > 0) {
      reasons.push(`Shared amenities: ${commonAmenities.slice(0, 2).join(', ')}`)
    }
    
    if (workspace1.hotDeskPrice && workspace2.hotDeskPrice) {
      const priceDiff = Math.abs(workspace1.hotDeskPrice - workspace2.hotDeskPrice)
      if (priceDiff <= workspace1.hotDeskPrice * 0.2) {
        reasons.push('Similar pricing')
      }
    }
    
    return reasons.length > 0 ? reasons : ['Similar workspace characteristics']
  }
  
  private formatWorkspaceForRecommendation(workspace: any): Recommendation['workspace'] {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      city: workspace.city,
      country: workspace.country,
      latitude: workspace.latitude,
      longitude: workspace.longitude,
      images: (workspace.images as string[]) || [],
      hotDeskPrice: workspace.hotDeskPrice,
      dedicatedDeskPrice: workspace.dedicatedDeskPrice,
      privateOfficePrice: workspace.privateOfficePrice,
      pricingCurrency: workspace.pricingCurrency,
      rating: workspace.rating,
      reviewCount: workspace.reviewCount || 0,
      digitalScore: workspace.digitalScore,
      amenities: (workspace.amenities as string[]) || [],
      workspaceType: workspace.workspaceType?.name,
      isVerified: workspace.isVerified,
      website: workspace.website
    }
  }
  
  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }
  
  private generateCacheKey(
    userProfile?: UserProfile,
    context?: RecommendationContext,
    options?: RecommendationOptions
  ): string {
    return `recommendations:${JSON.stringify({ userProfile: userProfile?.id, context, options })}`
  }
  
  /**
   * Clean up resources
   */
  async cleanup(): Promise<void> {
    await this.prisma.$disconnect()
  }
}

// Global recommendation engine instance
export const recommendationEngine = new WorkspaceRecommendationEngine()