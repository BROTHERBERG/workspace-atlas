'use client'

import { useState, useEffect } from 'react'
import { Copy, RefreshCw, ExternalLink } from 'lucide-react'
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

interface SimilarResponse {
  similar: Recommendation[]
  metadata: {
    workspaceId: string
    count: number
    timestamp: string
  }
}

interface SimilarWorkspacesProps {
  workspaceId: string
  workspaceName?: string
  count?: number
  onToggleFavorite?: (workspaceId: string) => void
  favoriteWorkspaces?: Set<string>
  className?: string
}

export default function SimilarWorkspaces({
  workspaceId,
  workspaceName,
  count = 6,
  onToggleFavorite,
  favoriteWorkspaces = new Set(),
  className = ''
}: SimilarWorkspacesProps) {
  const [similar, setSimilar] = useState<SimilarResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchSimilar = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      
      setError(null)

      const params = new URLSearchParams()
      params.set('workspaceId', workspaceId)
      params.set('count', count.toString())

      const response = await fetch(`/api/recommendations/similar?${params.toString()}`)
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Workspace not found')
        }
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch similar workspaces')
      }

      const data: SimilarResponse = await response.json()
      setSimilar(data)

      logger.info('Similar workspaces loaded', {
        workspaceId,
        count: data.similar.length
      })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load similar workspaces'
      setError(errorMessage)
      logger.error('Similar workspaces fetch failed', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    if (workspaceId) {
      fetchSimilar()
    }
  }, [workspaceId, count])

  if (loading && !similar) {
    return <LoadingSkeleton count={count} workspaceName={workspaceName} className={className} />
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-blue-500" />
            Similar Workspaces
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="text-red-500 text-lg font-medium mb-2">Failed to Load Similar Workspaces</div>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => fetchSimilar()} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!similar || similar.similar.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Copy className="w-5 h-5 text-blue-500" />
            Similar Workspaces
            {workspaceName && (
              <span className="text-sm font-normal text-gray-500">
                to {workspaceName}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8 text-center">
          <div className="text-gray-400 mb-4">
            <Copy className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No Similar Workspaces Found</h3>
          <p className="text-gray-600 mb-4">
            We couldn't find workspaces similar to this one at this time.
          </p>
          <Button onClick={() => fetchSimilar()} variant="outline">
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
              <Copy className="w-6 h-6 inline mr-2 text-blue-500" />
              Similar Workspaces
            </h2>
            {workspaceName && (
              <span className="text-lg text-gray-600">
                to {workspaceName}
              </span>
            )}
          </div>
          <p className="text-gray-600">
            Workspaces with similar features, location, and amenities
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchSimilar(true)}
          disabled={refreshing}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Similar Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {similar.similar.map((recommendation, index) => (
          <RecommendationCard
            key={`similar-${recommendation.workspace.id}-${index}`}
            recommendation={recommendation}
            showReasons={true}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favoriteWorkspaces.has(recommendation.workspace.id)}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center text-sm text-gray-500">
        Updated: {new Date(similar.metadata.timestamp).toLocaleString()}
      </div>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton({ 
  count, 
  workspaceName, 
  className 
}: { 
  count: number
  workspaceName?: string
  className?: string 
}) {
  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Skeleton className="h-8 w-48" />
            {workspaceName && <Skeleton className="h-6 w-32" />}
          </div>
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-24" />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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