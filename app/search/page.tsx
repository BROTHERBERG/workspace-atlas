'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import SearchBar from '@/components/search/SearchBar'
import SearchResults from '@/components/search/SearchResults'
import TrendingWorkspaces from '@/components/recommendations/TrendingWorkspaces'
import { SearchResponse } from '@/lib/search/search-engine'
import { logger } from '@/lib/logger'

interface SearchFilters {
  city?: string
  amenities: string[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  isVerified?: boolean
}

export default function SearchPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('relevance')
  const [sortOrder, setSortOrder] = useState('desc')

  // Initialize from URL parameters
  const initialQuery = searchParams.get('q') || ''
  const initialCity = searchParams.get('city') || undefined
  const initialLat = searchParams.get('lat') ? parseFloat(searchParams.get('lat')!) : undefined
  const initialLng = searchParams.get('lng') ? parseFloat(searchParams.get('lng')!) : undefined

  const performSearch = useCallback(async (
    query: string,
    filters: SearchFilters,
    page: number = 1,
    append: boolean = false
  ) => {
    setLoading(true)
    setError(null)

    try {
      // Build search parameters
      const searchParams = new URLSearchParams()
      
      if (query.trim()) searchParams.set('q', query.trim())
      if (filters.city) searchParams.set('city', filters.city)
      if (filters.amenities.length > 0) searchParams.set('amenities', filters.amenities.join(','))
      if (filters.minPrice !== undefined) searchParams.set('minPrice', filters.minPrice.toString())
      if (filters.maxPrice !== undefined) searchParams.set('maxPrice', filters.maxPrice.toString())
      if (filters.minRating !== undefined) searchParams.set('minRating', filters.minRating.toString())
      if (filters.isVerified) searchParams.set('verified', 'true')
      
      searchParams.set('sortBy', sortBy)
      searchParams.set('sortOrder', sortOrder)
      searchParams.set('page', page.toString())
      searchParams.set('limit', '20')

      // Add location parameters if available
      if (initialLat && initialLng) {
        searchParams.set('lat', initialLat.toString())
        searchParams.set('lng', initialLng.toString())
        searchParams.set('radius', '25')
      }

      const response = await fetch(`/api/search?${searchParams.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Search failed')
      }

      const results: SearchResponse = await response.json()
      
      if (append && searchResults) {
        // Append new results for "load more" functionality
        setSearchResults({
          ...results,
          results: [...searchResults.results, ...results.results]
        })
      } else {
        setSearchResults(results)
        setCurrentPage(1)
      }

      // Update URL with search parameters
      const newUrl = `${pathname}?${searchParams.toString()}`
      router.replace(newUrl, { scroll: false })

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
      setError(errorMessage)
      logger.error('Search error', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }, [pathname, router, sortBy, sortOrder, searchResults, initialLat, initialLng])

  const handleSearch = useCallback((query: string, filters: SearchFilters) => {
    performSearch(query, filters)
  }, [performSearch])

  const handleLocationSearch = useCallback((lat: number, lng: number, radius: number) => {
    setLoading(true)
    const searchParams = new URLSearchParams()
    searchParams.set('lat', lat.toString())
    searchParams.set('lng', lng.toString())
    searchParams.set('radius', radius.toString())
    searchParams.set('sortBy', 'distance')
    searchParams.set('sortOrder', 'asc')
    
    const newUrl = `${pathname}?${searchParams.toString()}`
    router.replace(newUrl)
    
    // Perform location-based search
    performLocationSearch(lat, lng, radius)
  }, [pathname, router])

  const performLocationSearch = async (lat: number, lng: number, radius: number) => {
    try {
      const response = await fetch(
        `/api/search?lat=${lat}&lng=${lng}&radius=${radius}&sortBy=distance&sortOrder=asc&limit=20`
      )
      
      if (!response.ok) {
        throw new Error('Location search failed')
      }

      const results: SearchResponse = await response.json()
      setSearchResults(results)
      setError(null)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Location search failed'
      setError(errorMessage)
      logger.error('Location search error', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = useCallback(() => {
    if (searchResults && searchResults.pagination.hasNextPage) {
      const nextPage = currentPage + 1
      setCurrentPage(nextPage)
      
      // Extract current filters from search results
      const currentQuery = searchResults.searchMetadata.query || ''
      const filters: SearchFilters = {
        amenities: [] // Would need to be reconstructed from applied filters
      }
      
      performSearch(currentQuery, filters, nextPage, true)
    }
  }, [searchResults, currentPage, performSearch])

  const handleSortChange = useCallback((newSortBy: string, newSortOrder: string) => {
    setSortBy(newSortBy)
    setSortOrder(newSortOrder)
    
    if (searchResults) {
      // Re-run search with new sorting
      const currentQuery = searchResults.searchMetadata.query || ''
      const filters: SearchFilters = {
        amenities: [] // Would need to be reconstructed
      }
      
      performSearch(currentQuery, filters, 1)
    }
  }, [searchResults, performSearch])

  const handleFilterSelect = useCallback((filterType: string, value: string) => {
    // Apply quick filter from faceted search
    const filters: SearchFilters = {
      amenities: []
    }
    
    switch (filterType) {
      case 'city':
        filters.city = value
        break
      case 'amenity':
        filters.amenities = [value]
        break
      case 'country':
        // Would implement country filtering
        break
    }
    
    const currentQuery = searchResults?.searchMetadata.query || ''
    performSearch(currentQuery, filters, 1)
  }, [searchResults, performSearch])

  // Initial search on page load
  useEffect(() => {
    if (initialQuery || initialCity || (initialLat && initialLng)) {
      const filters: SearchFilters = {
        city: initialCity,
        amenities: []
      }
      
      if (initialLat && initialLng) {
        handleLocationSearch(initialLat, initialLng, 25)
      } else {
        performSearch(initialQuery, filters)
      }
    }
  }, []) // Only run on mount

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Find Your Perfect Workspace</h1>
                <p className="text-gray-600">Discover coworking spaces worldwide</p>
              </div>
              
              {/* Breadcrumb */}
              <div className="text-sm text-gray-500">
                <span>Home</span>
                <span className="mx-2">›</span>
                <span>Search</span>
                {searchResults?.searchMetadata.query && (
                  <>
                    <span className="mx-2">›</span>
                    <span>"{searchResults.searchMetadata.query}"</span>
                  </>
                )}
              </div>
            </div>
            
            <SearchBar
              onSearch={handleSearch}
              onLocationSearch={handleLocationSearch}
              initialQuery={initialQuery}
              loading={loading}
              showFilters={true}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - could add more filters here */}
          <div className="lg:col-span-1">
            {searchResults?.aggregations && (
              <div className="bg-white rounded-lg p-6 border border-gray-200">
                <h3 className="font-semibold text-gray-900 mb-4">Refine Your Search</h3>
                
                {/* Search stats */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    {searchResults.pagination.total.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600">workspaces found</div>
                  {searchResults.searchMetadata.executionTime && (
                    <div className="text-xs text-gray-500 mt-1">
                      in {searchResults.searchMetadata.executionTime}ms
                    </div>
                  )}
                </div>

                {/* Quick stats */}
                {searchResults.aggregations.cities.length > 0 && (
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Cities</h4>
                    <div className="text-sm text-gray-600">
                      Available in {searchResults.aggregations.cities.length} cities across{' '}
                      {searchResults.aggregations.countries.length} countries
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            <SearchResults
              results={searchResults}
              loading={loading}
              error={error || undefined}
              onLoadMore={handleLoadMore}
              onSortChange={handleSortChange}
              onFilterSelect={handleFilterSelect}
              currentSort={{ sortBy, sortOrder }}
              viewMode={viewMode}
              onViewModeChange={setViewMode}
            />
          </div>
        </div>
      </main>

      {/* Trending Recommendations - Show when no search results or small result set */}
      {(!searchResults || searchResults.results.length < 5) && (
        <div className="bg-gray-50 border-t border-gray-200 mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <TrendingWorkspaces 
              count={4}
              currentLocation={initialLat && initialLng ? {
                latitude: initialLat,
                longitude: initialLng
              } : undefined}
            />
          </div>
        </div>
      )}

      {/* Footer info */}
      <div className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center text-sm text-gray-500">
            <p>
              Can't find what you're looking for?{' '}
              <button className="text-yellow-600 hover:text-yellow-700 font-medium">
                Suggest a workspace
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}