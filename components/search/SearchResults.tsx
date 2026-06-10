'use client'

import { useState } from 'react'
import { 
  Star, 
  MapPin, 
  Globe, 
  Phone, 
  Wifi, 
  Coffee,
  Clock,
  Navigation,
  Filter,
  Grid,
  List,
  TrendingUp,
  Award,
  Heart,
  Share2
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface SearchResult {
  id: string
  name: string
  slug: string
  description?: string
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  images: string[]
  primaryImage?: string
  hotDeskPrice?: number
  dedicatedDeskPrice?: number
  privateOfficePrice?: number
  pricingCurrency: string
  rating?: number
  reviewCount?: number
  digitalScore: number
  amenities: string[]
  workspaceType?: string
  distance?: number
  relevanceScore?: number
  matchingAmenities?: string[]
  isVerified: boolean
  isActive: boolean
  website?: string
  phone?: string
  source: string
  createdAt: Date
  updatedAt: Date
}

interface SearchResponse {
  results: SearchResult[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPrevPage: boolean
  }
  aggregations: {
    cities: Array<{ name: string; count: number }>
    countries: Array<{ name: string; count: number }>
    amenities: Array<{ name: string; count: number }>
    priceRanges: Array<{ range: string; count: number }>
    ratings: Array<{ rating: number; count: number }>
  }
  searchMetadata: {
    query?: string
    executionTime: number
    totalResults: number
    appliedFilters: string[]
    suggestions?: string[]
  }
}

interface SearchResultsProps {
  results: SearchResponse | null
  loading?: boolean
  error?: string
  onLoadMore?: () => void
  onSortChange?: (sortBy: string, sortOrder: string) => void
  onFilterSelect?: (filterType: string, value: string) => void
  currentSort?: { sortBy: string; sortOrder: string }
  viewMode?: 'grid' | 'list'
  onViewModeChange?: (mode: 'grid' | 'list') => void
  className?: string
}

export default function SearchResults({
  results,
  loading = false,
  error,
  onLoadMore,
  onSortChange,
  onFilterSelect,
  currentSort = { sortBy: 'relevance', sortOrder: 'desc' },
  viewMode = 'grid',
  onViewModeChange,
  className = ''
}: SearchResultsProps) {
  const [favorites, setFavorites] = useState<Set<string>>(new Set())

  if (loading && !results) {
    return <LoadingSkeleton />
  }

  if (error) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-red-500 text-lg font-medium mb-2">Search Error</div>
            <p className="text-gray-600">{error}</p>
            <p className="text-sm text-gray-400 mt-2">Please try again with different search terms.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!results || results.results.length === 0) {
    return (
      <div className={`w-full ${className}`}>
        <Card className="text-center py-12">
          <CardContent>
            <div className="text-gray-400 mb-4">
              <Filter className="w-16 h-16 mx-auto mb-4" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No workspaces found</h3>
            <p className="text-gray-600 mb-4">
              {results?.searchMetadata.query 
                ? `No results for "${results.searchMetadata.query}"`
                : 'Try adjusting your search criteria'
              }
            </p>
            {results?.searchMetadata.suggestions && results.searchMetadata.suggestions.length > 0 && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Try these suggestions:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {results.searchMetadata.suggestions.map((suggestion, index) => (
                    <Badge key={index} variant="outline" className="cursor-pointer hover:bg-yellow-50">
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const toggleFavorite = (workspaceId: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(workspaceId)) {
      newFavorites.delete(workspaceId)
    } else {
      newFavorites.add(workspaceId)
    }
    setFavorites(newFavorites)
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Results header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <div>
            <div className="text-xl font-semibold text-gray-900">
              {results.pagination.total.toLocaleString()} workspaces
            </div>
            <div className="text-sm text-gray-500">
              {results.searchMetadata.query && `for "${results.searchMetadata.query}"`}
              {results.searchMetadata.executionTime && 
                ` • Found in ${results.searchMetadata.executionTime}ms`
              }
            </div>
          </div>
          
          {results.searchMetadata.appliedFilters.length > 0 && (
            <Badge variant="secondary">
              {results.searchMetadata.appliedFilters.length} filters applied
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Sort selector */}
          <Select
            value={`${currentSort.sortBy}-${currentSort.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-')
              onSortChange?.(sortBy, sortOrder)
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance-desc">Most Relevant</SelectItem>
              <SelectItem value="rating-desc">Highest Rated</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="distance-asc">Nearest First</SelectItem>
              <SelectItem value="newest-desc">Newest</SelectItem>
              <SelectItem value="popular-desc">Most Popular</SelectItem>
            </SelectContent>
          </Select>

          {/* View mode toggle */}
          {onViewModeChange && (
            <div className="flex items-center border rounded-md">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('grid')}
                className="rounded-r-none"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onViewModeChange('list')}
                className="rounded-l-none"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Faceted search filters */}
      {results.aggregations && (
        <FacetedFilters
          aggregations={results.aggregations}
          onFilterSelect={onFilterSelect}
        />
      )}

      {/* Results grid/list */}
      <div className={
        viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
          : 'space-y-4'
      }>
        {results.results.map((workspace) => (
          <WorkspaceCard
            key={workspace.id}
            workspace={workspace}
            viewMode={viewMode}
            isFavorite={favorites.has(workspace.id)}
            onToggleFavorite={() => toggleFavorite(workspace.id)}
          />
        ))}
      </div>

      {/* Pagination */}
      {results.pagination.hasNextPage && (
        <div className="flex justify-center pt-8">
          <Button
            onClick={onLoadMore}
            disabled={loading}
            size="lg"
            variant="outline"
            className="min-w-[200px]"
          >
            {loading ? 'Loading...' : `Load More (${results.pagination.total - results.results.length} remaining)`}
          </Button>
        </div>
      )}

      {/* Results pagination info */}
      <div className="text-center text-sm text-gray-500">
        Showing {results.results.length} of {results.pagination.total} results
        {results.pagination.totalPages > 1 && (
          <> • Page {results.pagination.page} of {results.pagination.totalPages}</>
        )}
      </div>
    </div>
  )
}

// Workspace card component
interface WorkspaceCardProps {
  workspace: SearchResult
  viewMode: 'grid' | 'list'
  isFavorite: boolean
  onToggleFavorite: () => void
}

function WorkspaceCard({ workspace, viewMode, isFavorite, onToggleFavorite }: WorkspaceCardProps) {
  const formatPrice = (price?: number) => {
    if (!price) return null
    return `${workspace.pricingCurrency === 'USD' ? '$' : workspace.pricingCurrency} ${price}`
  }

  const getLowestPrice = () => {
    const prices = [
      workspace.hotDeskPrice,
      workspace.dedicatedDeskPrice,
      workspace.privateOfficePrice
    ].filter(Boolean)
    
    return prices.length > 0 ? Math.min(...prices as number[]) : null
  }

  if (viewMode === 'list') {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <div className="flex">
          {/* Image */}
          <div className="relative w-48 h-32 flex-shrink-0">
            <Image
              src={workspace.primaryImage || workspace.images[0] || '/placeholder-workspace.jpg'}
              alt={workspace.name}
              fill
              className="object-cover rounded-l-lg"
            />
            {workspace.isVerified && (
              <Badge className="absolute top-2 left-2 bg-green-500">
                <Award className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <Link href={`/spaces/${workspace.slug}`}>
                  <h3 className="font-semibold text-lg hover:text-yellow-600 transition-colors">
                    {workspace.name}
                  </h3>
                </Link>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <MapPin className="w-4 h-4" />
                  {workspace.city}, {workspace.country}
                  {workspace.distance && (
                    <span>• {workspace.distance.toFixed(1)} km away</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onToggleFavorite}
                  className="p-2"
                >
                  <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
                </Button>
                <Button variant="ghost" size="sm" className="p-2">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
              {workspace.description}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {workspace.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="font-medium">{workspace.rating}</span>
                    <span className="text-gray-500 text-sm">
                      ({workspace.reviewCount} reviews)
                    </span>
                  </div>
                )}
                
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">{workspace.digitalScore}/100</span>
                </div>
              </div>

              <div className="text-right">
                {getLowestPrice() && (
                  <div className="font-semibold text-lg">
                    {formatPrice(getLowestPrice()!)}<span className="text-sm font-normal text-gray-500">/day</span>
                  </div>
                )}
                <div className="text-xs text-gray-500">from hot desk</div>
              </div>
            </div>
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      {/* Image */}
      <div className="relative aspect-video">
        <Image
          src={workspace.primaryImage || workspace.images[0] || '/placeholder-workspace.jpg'}
          alt={workspace.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
        
        {workspace.isVerified && (
          <Badge className="absolute top-3 left-3 bg-green-500">
            <Award className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        )}
        
        <div className="absolute top-3 right-3 flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onToggleFavorite}
            className="p-2 bg-white/90 hover:bg-white"
          >
            <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="p-2 bg-white/90 hover:bg-white"
          >
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <CardContent className="p-4">
        <div className="mb-2">
          <Link href={`/spaces/${workspace.slug}`}>
            <h3 className="font-semibold text-lg hover:text-yellow-600 transition-colors line-clamp-1">
              {workspace.name}
            </h3>
          </Link>
          <div className="flex items-center gap-1 text-sm text-gray-500">
            <MapPin className="w-3 h-3" />
            {workspace.city}, {workspace.country}
            {workspace.distance && (
              <span className="ml-2">• {workspace.distance.toFixed(1)} km away</span>
            )}
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {workspace.description}
        </p>

        {/* Amenities */}
        {workspace.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {workspace.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {amenity.includes('WiFi') && <Wifi className="w-3 h-3 mr-1" />}
                {amenity.includes('Coffee') && <Coffee className="w-3 h-3 mr-1" />}
                {amenity}
              </Badge>
            ))}
            {workspace.amenities.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{workspace.amenities.length - 3} more
              </Badge>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {workspace.rating && (
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                <span className="font-medium text-sm">{workspace.rating}</span>
                <span className="text-gray-500 text-xs">
                  ({workspace.reviewCount})
                </span>
              </div>
            )}
            
            <div className="flex items-center gap-1">
              <TrendingUp className="w-4 h-4 text-blue-500" />
              <span className="text-sm">{workspace.digitalScore}</span>
            </div>
          </div>

          <div className="text-right">
            {getLowestPrice() && (
              <div className="font-semibold">
                {formatPrice(getLowestPrice()!)}
                <span className="text-xs font-normal text-gray-500">/day</span>
              </div>
            )}
            <div className="text-xs text-gray-500">from hot desk</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Faceted filters component
interface FacetedFiltersProps {
  aggregations: SearchResponse['aggregations']
  onFilterSelect?: (filterType: string, value: string) => void
}

function FacetedFilters({ aggregations, onFilterSelect }: FacetedFiltersProps) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Cities */}
        {aggregations.cities.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Popular Cities</h4>
            <div className="space-y-1">
              {aggregations.cities.slice(0, 5).map((city) => (
                <button
                  key={city.name}
                  onClick={() => onFilterSelect?.('city', city.name)}
                  className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-white text-sm"
                >
                  <span>{city.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {city.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Amenities */}
        {aggregations.amenities.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Top Amenities</h4>
            <div className="space-y-1">
              {aggregations.amenities.slice(0, 5).map((amenity) => (
                <button
                  key={amenity.name}
                  onClick={() => onFilterSelect?.('amenity', amenity.name)}
                  className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-white text-sm"
                >
                  <span className="line-clamp-1">{amenity.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {amenity.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Price ranges */}
        {aggregations.priceRanges.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Price Ranges</h4>
            <div className="space-y-1">
              {aggregations.priceRanges.map((range) => (
                <button
                  key={range.range}
                  onClick={() => onFilterSelect?.('priceRange', range.range)}
                  className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-white text-sm"
                >
                  <span>{range.range}</span>
                  <Badge variant="secondary" className="text-xs">
                    {range.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Countries */}
        {aggregations.countries.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Countries</h4>
            <div className="space-y-1">
              {aggregations.countries.slice(0, 5).map((country) => (
                <button
                  key={country.name}
                  onClick={() => onFilterSelect?.('country', country.name)}
                  className="flex items-center justify-between w-full text-left p-2 rounded hover:bg-white text-sm"
                >
                  <span>{country.name}</span>
                  <Badge variant="secondary" className="text-xs">
                    {country.count}
                  </Badge>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Loading skeleton
function LoadingSkeleton() {
  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <Skeleton className="h-8 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
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