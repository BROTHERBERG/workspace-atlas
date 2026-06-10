'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, MapPin, Filter, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover'
import { logger } from '@/lib/logger'

interface SearchSuggestion {
  text: string
  type: 'workspace' | 'city' | 'amenity'
}

interface SearchFilters {
  city?: string
  amenities: string[]
  minPrice?: number
  maxPrice?: number
  minRating?: number
  isVerified?: boolean
}

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void
  onLocationSearch?: (lat: number, lng: number, radius: number) => void
  initialQuery?: string
  loading?: boolean
  placeholder?: string
  showFilters?: boolean
  className?: string
}

export default function SearchBar({
  onSearch,
  onLocationSearch,
  initialQuery = '',
  loading = false,
  placeholder = 'Search workspaces, cities, or amenities...',
  showFilters = true,
  className = ''
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery)
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    amenities: []
  })
  const [showFilterPopover, setShowFilterPopover] = useState(false)

  const searchInputRef = useRef<HTMLInputElement>(null)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  // Debounced suggestions fetch
  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([])
      setShowSuggestions(false)
      return
    }

    const timeoutId = setTimeout(async () => {
      try {
        const response = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}&limit=8`)
        if (response.ok) {
          const data = await response.json()
          const formattedSuggestions: SearchSuggestion[] = data.suggestions.map((text: string) => ({
            text,
            type: detectSuggestionType(text)
          }))
          setSuggestions(formattedSuggestions)
          setShowSuggestions(true)
        }
      } catch (error) {
        logger.error('Failed to fetch suggestions:', error instanceof Error ? error : new Error(String(error)))
      }
    }, 300)

    return () => clearTimeout(timeoutId)
  }, [query])

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchInputRef.current && 
        !searchInputRef.current.contains(event.target as Node) &&
        suggestionsRef.current && 
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const detectSuggestionType = (text: string): SearchSuggestion['type'] => {
    // Simple heuristics - in production you'd get this from the API
    if (text.includes('WiFi') || text.includes('Coffee') || text.includes('Meeting')) {
      return 'amenity'
    }
    if (text.length > 20) {
      return 'workspace'
    }
    return 'city'
  }

  const handleSearch = () => {
    onSearch(query, filters)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.text)
    setShowSuggestions(false)
    onSearch(suggestion.text, filters)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const addAmenityFilter = (amenity: string) => {
    if (!filters.amenities.includes(amenity)) {
      setFilters(prev => ({
        ...prev,
        amenities: [...prev.amenities, amenity]
      }))
    }
  }

  const removeAmenityFilter = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a !== amenity)
    }))
  }

  const clearAllFilters = () => {
    setFilters({ amenities: [] })
  }

  const hasActiveFilters = () => {
    return filters.city || 
           filters.amenities.length > 0 || 
           filters.minPrice || 
           filters.maxPrice || 
           filters.minRating || 
           filters.isVerified
  }

  const getActiveFilterCount = () => {
    let count = 0
    if (filters.city) count++
    count += filters.amenities.length
    if (filters.minPrice || filters.maxPrice) count++
    if (filters.minRating) count++
    if (filters.isVerified) count++
    return count
  }

  // Get user's location for location-based search
  const handleLocationSearch = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by this browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        onLocationSearch?.(
          position.coords.latitude,
          position.coords.longitude,
          25 // 25km radius
        )
      },
      (error) => {
        logger.error('Error getting location:', error instanceof Error ? error : new Error(String(error)))
        alert('Unable to get your location. Please enable location services.')
      }
    )
  }

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Main search bar */}
      <div className="relative">
        <div className="relative flex items-center">
          <Search className="absolute left-4 h-5 w-5 text-gray-400 z-10" />
          
          <Input
            ref={searchInputRef}
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full pl-12 pr-32 h-14 text-lg border-2 border-gray-200 focus:border-yellow-400 rounded-xl"
            disabled={loading}
          />
          
          <div className="absolute right-2 flex items-center gap-2">
            {onLocationSearch && (
              <Button
                onClick={handleLocationSearch}
                variant="ghost"
                size="sm"
                className="h-10 px-3 hover:bg-yellow-50"
                disabled={loading}
              >
                <MapPin className="h-4 w-4" />
              </Button>
            )}
            
            {showFilters && (
              <Popover open={showFilterPopover} onOpenChange={setShowFilterPopover}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 hover:bg-yellow-50 relative"
                    disabled={loading}
                  >
                    <Filter className="h-4 w-4" />
                    {hasActiveFilters() && (
                      <Badge 
                        className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-yellow-500 text-black"
                      >
                        {getActiveFilterCount()}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <FilterPanel 
                    filters={filters}
                    onFiltersChange={setFilters}
                    onClearAll={clearAllFilters}
                  />
                </PopoverContent>
              </Popover>
            )}
            
            <Button
              onClick={handleSearch}
              className="h-10 px-6 bg-yellow-500 hover:bg-yellow-600 text-black font-medium"
              disabled={loading}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </div>
        </div>

        {/* Search suggestions */}
        {showSuggestions && suggestions.length > 0 && (
          <div 
            ref={suggestionsRef}
            className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex-shrink-0">
                  {suggestion.type === 'workspace' && <Search className="h-4 w-4 text-blue-500" />}
                  {suggestion.type === 'city' && <MapPin className="h-4 w-4 text-green-500" />}
                  {suggestion.type === 'amenity' && <Filter className="h-4 w-4 text-purple-500" />}
                </div>
                <div className="flex-1">
                  <div className="text-gray-900">{suggestion.text}</div>
                  <div className="text-xs text-gray-500 capitalize">{suggestion.type}</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Active filters display */}
      {hasActiveFilters() && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.city && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {filters.city}
              <button 
                onClick={() => setFilters(prev => ({ ...prev, city: undefined }))}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.amenities.map(amenity => (
            <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
              {amenity}
              <button 
                onClick={() => removeAmenityFilter(amenity)}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
          
          {filters.minRating && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Rating {filters.minRating}+
              <button 
                onClick={() => setFilters(prev => ({ ...prev, minRating: undefined }))}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.isVerified && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Verified Only
              <button 
                onClick={() => setFilters(prev => ({ ...prev, isVerified: undefined }))}
                className="ml-1 hover:text-red-500"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={clearAllFilters}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            Clear All
          </Button>
        </div>
      )}
    </div>
  )
}

// Filter panel component
interface FilterPanelProps {
  filters: SearchFilters
  onFiltersChange: (filters: SearchFilters) => void
  onClearAll: () => void
}

function FilterPanel({ filters, onFiltersChange, onClearAll }: FilterPanelProps) {
  const commonAmenities = [
    'High-speed WiFi',
    'Coffee & Tea', 
    'Meeting Rooms',
    'Parking',
    '24/7 Access',
    'Phone Booths',
    'Kitchen',
    'Printing'
  ]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium">Filters</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearAll}
          className="text-red-500 hover:text-red-600"
        >
          Clear All
        </Button>
      </div>
      
      {/* City filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">City</label>
        <Input
          placeholder="Enter city name"
          value={filters.city || ''}
          onChange={(e) => onFiltersChange({ ...filters, city: e.target.value || undefined })}
          className="w-full"
        />
      </div>
      
      {/* Amenities filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Amenities</label>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {commonAmenities.map(amenity => (
            <label key={amenity} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.amenities.includes(amenity)}
                onChange={(e) => {
                  if (e.target.checked) {
                    onFiltersChange({
                      ...filters,
                      amenities: [...filters.amenities, amenity]
                    })
                  } else {
                    onFiltersChange({
                      ...filters,
                      amenities: filters.amenities.filter(a => a !== amenity)
                    })
                  }
                }}
                className="rounded"
              />
              <span className="text-sm">{amenity}</span>
            </label>
          ))}
        </div>
      </div>
      
      {/* Price range */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Min Price</label>
          <Input
            type="number"
            placeholder="$0"
            value={filters.minPrice || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              minPrice: e.target.value ? parseInt(e.target.value) : undefined 
            })}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Max Price</label>
          <Input
            type="number"
            placeholder="$1000"
            value={filters.maxPrice || ''}
            onChange={(e) => onFiltersChange({ 
              ...filters, 
              maxPrice: e.target.value ? parseInt(e.target.value) : undefined 
            })}
          />
        </div>
      </div>
      
      {/* Rating filter */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Minimum Rating</label>
        <select
          value={filters.minRating || ''}
          onChange={(e) => onFiltersChange({ 
            ...filters, 
            minRating: e.target.value ? parseFloat(e.target.value) : undefined 
          })}
          className="w-full p-2 border border-gray-300 rounded-md"
        >
          <option value="">Any Rating</option>
          <option value="4.0">4.0+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="4.8">4.8+ Stars</option>
        </select>
      </div>
      
      {/* Verified only */}
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          checked={filters.isVerified || false}
          onChange={(e) => onFiltersChange({ 
            ...filters, 
            isVerified: e.target.checked || undefined 
          })}
          className="rounded"
        />
        <span className="text-sm font-medium">Verified workspaces only</span>
      </label>
    </div>
  )
}