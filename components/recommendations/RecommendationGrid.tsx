'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, MapPin, Users, RefreshCw, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import RecommendationCard from './RecommendationCard'
import { logger } from '@/lib/logger'

interface Recommendation {
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
  score: number
  reasons: string[]
  strategy: 'collaborative' | 'content-based' | 'location' | 'trending' | 'similar-users' | 'hybrid'
  distance?: number
  priceMatch?: 'budget' | 'mid-range' | 'premium'
  noveltyScore?: number
}

interface RecommendationResponse {
  recommendations: Recommendation[]
  metadata: {
    strategy: string
    executionTime: number
    userProfile?: 'new' | 'light' | 'active' | 'power'
    personalizationLevel: number
    nextRefreshTime?: string
  }
}

interface RecommendationGridProps {
  userProfile?: {
    id?: string
    preferences?: {
      workspaceTypes?: string[]
      amenities?: string[]
      cities?: string[]
      workingStyle?: 'quiet' | 'collaborative' | 'flexible'
      priceRange?: { min: number; max: number }
    }
    behavior?: {
      recentSearches?: string[]
      viewedWorkspaces?: string[]
      favoriteWorkspaces?: string[]
      bookingHistory?: string[]
    }
  }
  context?: {
    currentLocation?: {
      latitude: number
      longitude: number
      city?: string
      country?: string
    }
    timeOfDay?: 'morning' | 'afternoon' | 'evening'
    dayOfWeek?: 'weekday' | 'weekend'
    purpose?: 'work' | 'meeting' | 'event' | 'networking'
  }
  count?: number
  showReasons?: boolean
  onToggleFavorite?: (workspaceId: string) => void
  favoriteWorkspaces?: Set<string>
  className?: string
}

export default function RecommendationGrid({
  userProfile,
  context,
  count = 8,
  showReasons = true,
  onToggleFavorite,
  favoriteWorkspaces = new Set(),
  className = ''
}: RecommendationGridProps) {
  const [recommendations, setRecommendations] = useState<RecommendationResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRecommendations = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      setError(null)

      const params = new URLSearchParams()
      
      if (userProfile?.id) params.set('userId', userProfile.id)
      params.set('count', count.toString())
      params.set('includeReasons', showReasons.toString())
      
      // Add preferences
      if (userProfile?.preferences) {
        const prefs = userProfile.preferences
        if (prefs.workspaceTypes?.length) params.set('workspaceTypes', prefs.workspaceTypes.join(','))
        if (prefs.amenities?.length) params.set('amenities', prefs.amenities.join(','))
        if (prefs.cities?.length) params.set('cities', prefs.cities.join(','))
        if (prefs.workingStyle) params.set('workingStyle', prefs.workingStyle)
        if (prefs.priceRange) {
          params.set('minPrice', prefs.priceRange.min.toString())
          params.set('maxPrice', prefs.priceRange.max.toString())
        }
      }

      // Add behavior data
      if (userProfile?.behavior) {
        const behavior = userProfile.behavior
        if (behavior.recentSearches?.length) params.set('recentSearches', behavior.recentSearches.join(','))
        if (behavior.viewedWorkspaces?.length) params.set('viewedWorkspaces', behavior.viewedWorkspaces.join(','))
        if (behavior.favoriteWorkspaces?.length) params.set('favoriteWorkspaces', behavior.favoriteWorkspaces.join(','))
        if (behavior.bookingHistory?.length) params.set('bookingHistory', behavior.bookingHistory.join(','))
      }

      // Add context
      if (context?.currentLocation) {
        const loc = context.currentLocation
        params.set('lat', loc.latitude.toString())
        params.set('lng', loc.longitude.toString())
        if (loc.city) params.set('city', loc.city)
        if (loc.country) params.set('country', loc.country)
      }

      if (context?.timeOfDay) params.set('timeOfDay', context.timeOfDay)
      if (context?.dayOfWeek) params.set('dayOfWeek', context.dayOfWeek)
      if (context?.purpose) params.set('purpose', context.purpose)

      const response = await fetch(`/api/recommendations?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch recommendations')
      }

      const data: RecommendationResponse = await response.json()
      setRecommendations(data)

      logger.info('Recommendations loaded', {
        count: data.recommendations.length,
        strategy: data.metadata.strategy,
        personalizationLevel: data.metadata.personalizationLevel
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load recommendations'
      setError(errorMessage)
      logger.error('Recommendation fetch failed', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchRecommendations()
  }, [userProfile?.id, context?.currentLocation?.latitude, context?.currentLocation?.longitude])

  const getPersonalizationBadge = (level: number, profileType?: string) => {
    if (level >= 80) return { text: 'Highly Personalized', color: 'bg-green-100 text-green-700' }
    if (level >= 50) return { text: 'Personalized', color: 'bg-blue-100 text-blue-700' }
    if (level >= 20) return { text: 'Lightly Personalized', color: 'bg-yellow-100 text-yellow-700' }
    return { text: 'Generic', color: 'bg-gray-100 text-gray-700' }
  }

  if (loading && !recommendations) {
    return <LoadingSkeleton count={count} className={className} />
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Failed to Load Recommendations</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchRecommendations()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!recommendations || recommendations.recommendations.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="py-12 text-center">
          <div className="text-gray-400 mb-4">
            <Sparkles className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Recommendations Available</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find any workspace recommendations at this time.
          </p>
          <Button onClick={() => fetchRecommendations()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  const personalizationBadge = getPersonalizationBadge(
    recommendations.metadata.personalizationLevel,
    recommendations.metadata.userProfile
  )

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              <Sparkles className="w-6 h-6 inline mr-2 text-yellow-500" />
              Recommended for You
            </h2>
            <Badge className={personalizationBadge.color}>
              {personalizationBadge.text}
            </Badge>
          </div>
          <p className="text-gray-600">
            Based on {recommendations.metadata.strategy} • {recommendations.recommendations.length} workspaces
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchRecommendations(true)}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap gap-2 text-sm text-gray-500">
        {recommendations.metadata.userProfile && (
          <Badge variant="outline">
            <Users className="w-3 h-3 mr-1" />
            {recommendations.metadata.userProfile} user
          </Badge>
        )}
        
        {context?.currentLocation && (
          <Badge variant="outline">
            <MapPin className="w-3 h-3 mr-1" />
            Location-aware
          </Badge>
        )}
        
        <Badge variant="outline">
          <TrendingUp className="w-3 h-3 mr-1" />
          {recommendations.metadata.personalizationLevel}% personalized
        </Badge>
        
        <Badge variant="outline">
          {recommendations.metadata.executionTime}ms response time
        </Badge>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {recommendations.recommendations.map((recommendation, index) => (
          <RecommendationCard
            key={`${recommendation.workspace.id}-${index}`}
            recommendation={recommendation}
            showReasons={showReasons}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favoriteWorkspaces.has(recommendation.workspace.id)}
          />
        ))}
      </div>

      {/* Next Refresh Info */}
      {recommendations.metadata.nextRefreshTime && (
        <div className="text-center text-sm text-gray-500 pt-4">
          Recommendations refresh at{' '}
          {new Date(recommendations.metadata.nextRefreshTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton({ count, className }: { count: number; className?: string }) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-8 w-64 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="flex gap-2">
        <Skeleton className="h-6 w-20" />
        <Skeleton className="h-6 w-24" />
        <Skeleton className="h-6 w-28" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <Card key={i} className="overflow-hidden">
            <Skeleton className="aspect-video" />
            <CardContent className="p-4 space-y-3">
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-16" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}