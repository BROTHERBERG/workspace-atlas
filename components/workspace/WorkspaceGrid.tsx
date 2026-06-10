'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import SpaceCard from '@/components/space-card'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'
import { logger } from '@/lib/logger'

interface Workspace {
  id: string
  name: string
  slug: string
  description: string | null
  city: string
  country: string
  address: string | null
  latitude: number | null
  longitude: number | null
  website: string | null
  digitalScore: number | null
  rating: number | null
  reviewCount: number
  featured: boolean
  verified: boolean
  images: Array<{
    id: string
    url: string
    alt: string | null
    isMain: boolean
  }>
  amenities: Array<{
    id: string
    amenity: string
  }>
  _count: {
    reviews: number
  }
}

interface WorkspaceGridProps {
  initialWorkspaces?: Workspace[]
}

export function WorkspaceGrid({ initialWorkspaces = [] }: WorkspaceGridProps) {
  const searchParams = useSearchParams()
  const [workspaces, setWorkspaces] = useState<Workspace[]>(initialWorkspaces)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)

  const fetchWorkspaces = useCallback(async (pageNumber: number = 1, isNewSearch: boolean = false) => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams(searchParams.toString())
      params.set('page', pageNumber.toString())
      params.set('limit', '12')

      const response = await fetch(`/api/workspaces?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch workspaces')
      }

      const data = await response.json()
      
      if (isNewSearch) {
        setWorkspaces(data.workspaces)
      } else {
        setWorkspaces(prev => [...prev, ...data.workspaces])
      }
      
      setHasMore(data.workspaces.length === 12)
      setPage(pageNumber)
    } catch (err) {
      logger.error('Error fetching workspaces:', err instanceof Error ? err : new Error(String(err)))
      setError(err instanceof Error ? err.message : 'Failed to load workspaces')
    } finally {
      setLoading(false)
    }
  }, [searchParams])

  // Fetch workspaces when search params change
  useEffect(() => {
    fetchWorkspaces(1, true)
  }, [searchParams, fetchWorkspaces])

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchWorkspaces(page + 1, false)
    }
  }

  if (error && workspaces.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-4">
          <p className="text-lg font-semibold">Error loading workspaces</p>
          <p className="text-sm">{error}</p>
        </div>
        <Button 
          onClick={() => fetchWorkspaces(1, true)}
          variant="outline"
        >
          Try Again
        </Button>
      </div>
    )
  }

  if (loading && workspaces.length === 0) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[4/3] bg-gray-200 rounded-lg mb-4" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-3 bg-gray-200 rounded w-1/2" />
              <div className="h-3 bg-gray-200 rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (workspaces.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-500 mb-4">
          <p className="text-lg font-semibold">No workspaces found</p>
          <p className="text-sm">Try adjusting your search criteria or filters</p>
        </div>
        <Button 
          onClick={() => {
            // Clear all filters and search
            window.location.href = '/directory'
          }}
          variant="outline"
        >
          Clear All Filters
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {workspaces.map((workspace) => (
          <SpaceCard 
            key={workspace.id} 
            id={parseInt(workspace.id) || 1} 
          />
        ))}
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-6">
          <Button 
            onClick={loadMore}
            disabled={loading}
            variant="outline"
            size="lg"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              'Load More Workspaces'
            )}
          </Button>
        </div>
      )}

      {!hasMore && workspaces.length > 12 && (
        <div className="text-center pt-6">
          <p className="text-sm text-gray-500">
            You've seen all {workspaces.length} workspaces matching your criteria
          </p>
        </div>
      )}

      {error && workspaces.length > 0 && (
        <div className="text-center pt-6">
          <p className="text-sm text-red-600 mb-2">
            Error loading more workspaces: {error}
          </p>
          <Button 
            onClick={() => fetchWorkspaces(page + 1, false)}
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}
    </div>
  )
}