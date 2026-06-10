'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, RefreshCw, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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

interface TrendingResponse {
  trending: Recommendation[]
  metadata: {
    count: number
    hasLocation: boolean
    timestamp: string
  }
}

interface TrendingWorkspacesProps {
  currentLocation?: {
    latitude: number
    longitude: number
    city?: string
    country?: string
  }
  count?: number
  onToggleFavorite?: (workspaceId: string) => void
  favoriteWorkspaces?: Set<string>
  className?: string
}

export default function TrendingWorkspaces({
  currentLocation,
  count = 8,
  onToggleFavorite,
  favoriteWorkspaces = new Set(),
  className = ''
}: TrendingWorkspacesProps) {
  const [trending, setTrending] = useState<TrendingResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchTrending = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      setError(null)

      const params = new URLSearchParams()
      params.set('count', count.toString())
      
      if (currentLocation) {
        params.set('lat', currentLocation.latitude.toString())
        params.set('lng', currentLocation.longitude.toString())
        if (currentLocation.city) params.set('city', currentLocation.city)
        if (currentLocation.country) params.set('country', currentLocation.country)
      }

      const response = await fetch(`/api/recommendations/trending?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch trending workspaces')
      }

      const data: TrendingResponse = await response.json()
      setTrending(data)

      logger.info('Trending workspaces loaded', {
        count: data.trending.length,
        hasLocation: data.metadata.hasLocation
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load trending workspaces'
      setError(errorMessage)
      logger.error('Trending fetch failed', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchTrending()
  }, [currentLocation?.latitude, currentLocation?.longitude, count])

  if (loading && !trending) {
    return <LoadingSkeleton count={count} className={className} />
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Trending Workspaces
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Failed to Load Trending</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchTrending()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!trending || trending.trending.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            Trending Workspaces
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="text-gray-400 mb-4">
            <TrendingUp className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Trending Workspaces</h3>
          <p className="text-gray-600 mb-4">
            No trending workspaces available at this time.
          </p>
          <Button onClick={() => fetchTrending()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="text-2xl font-bold text-gray-900">
              <TrendingUp className="w-6 h-6 inline mr-2 text-red-500" />
              Trending Workspaces
            </h2>
          </div>
          <p className="text-gray-600">
            Popular workspaces with high user engagement
            {currentLocation && ' near you'}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchTrending(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Trending Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {trending.trending.map((recommendation, index) => (
          <RecommendationCard
            key={`trending-${recommendation.workspace.id}-${index}`}
            recommendation={recommendation}
            showReasons={true}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favoriteWorkspaces.has(recommendation.workspace.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Updated: {new Date(trending.metadata.timestamp).toLocaleString()}
        {trending.metadata.hasLocation && ' • Location-based results'}
      </div>
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