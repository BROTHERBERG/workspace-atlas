'use client'

import { useState, useCallback, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, MapPin, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

const popularCities = [
  'New York',
  'London', 
  'Berlin',
  'Singapore',
  'Tokyo',
  'Barcelona',
  'Sydney',
  'Toronto'
]

interface WorkspaceSearchProps {
  onSearch?: (query: string, city?: string) => void
}

export function WorkspaceSearch({ onSearch }: WorkspaceSearchProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [selectedCity, setSelectedCity] = useState(searchParams.get('city') || '')

  const handleSearch = useCallback((e?: React.FormEvent) => {
    e?.preventDefault()
    
    const params = new URLSearchParams(searchParams.toString())
    
    if (query) {
      params.set('q', query)
    } else {
      params.delete('q')
    }
    
    if (selectedCity) {
      params.set('city', selectedCity)
    } else {
      params.delete('city')
    }
    
    // Reset page to 1 when searching
    params.delete('page')
    
    router.push(`/directory?${params.toString()}`)
    
    // Call optional callback
    onSearch?.(query, selectedCity)
  }, [query, selectedCity, searchParams, router, onSearch])

  const handleCitySelect = useCallback((city: string) => {
    if (selectedCity === city) {
      setSelectedCity('')
    } else {
      setSelectedCity(city)
    }
  }, [selectedCity])

  const clearFilters = useCallback(() => {
    setQuery('')
    setSelectedCity('')
    router.push('/directory')
  }, [router])

  const hasFilters = useMemo(() => {
    return query || selectedCity
  }, [query, selectedCity])

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex w-full items-center space-x-2 rounded-lg bg-white p-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="search"
            placeholder="City, neighborhood, or space name"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <div className="flex flex-wrap gap-2">
        {popularCities.map((city) => (
          <Badge
            key={city}
            variant={selectedCity === city ? "default" : "outline"}
            className={`cursor-pointer transition-colors ${
              selectedCity === city
                ? 'bg-yellow text-black hover:bg-yellow/80'
                : 'bg-midnight/20 text-white hover:bg-midnight/30'
            }`}
            onClick={() => handleCitySelect(city)}
          >
            <MapPin className="mr-1 h-3 w-3" />
            {city}
          </Badge>
        ))}
      </div>

      {hasFilters && (
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-300">Active filters:</span>
            {query && (
              <Badge variant="secondary" className="bg-yellow/20 text-yellow-800">
                Search: "{query}"
              </Badge>
            )}
            {selectedCity && (
              <Badge variant="secondary" className="bg-yellow/20 text-yellow-800">
                City: {selectedCity}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-gray-300 hover:text-white"
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
}