'use client'

import { useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import type { WorkspaceFilters, AmenityOption, SpaceTypeOption } from '@/types/filters'

const amenities: AmenityOption[] = [
  { id: 'wifi', label: 'High-Speed WiFi' },
  { id: 'meeting-rooms', label: 'Meeting Rooms' },
  { id: '24-7-access', label: '24/7 Access' },
  { id: 'coffee', label: 'Coffee Bar' },
  { id: 'events', label: 'Event Space' },
  { id: 'childcare', label: 'Childcare' },
  { id: 'parking', label: 'Parking' },
  { id: 'phone-booths', label: 'Phone Booths' },
  { id: 'printing', label: 'Printing' },
  { id: 'kitchen', label: 'Kitchen' },
]

const spaceTypes: SpaceTypeOption[] = [
  { id: 'hot-desk', label: 'Hot Desk' },
  { id: 'dedicated-desk', label: 'Dedicated Desk' },
  { id: 'private-office', label: 'Private Office' },
  { id: 'meeting-room', label: 'Meeting Room' },
]

interface WorkspaceFiltersProps {
  onFiltersChange?: (filters: WorkspaceFilters) => void
}

export function WorkspaceFilters({ onFiltersChange }: WorkspaceFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Initialize state from URL params
  const [priceRange, setPriceRange] = useState([
    parseInt(searchParams.get('maxPrice') || '500')
  ])
  const [digitalScoreMin, setDigitalScoreMin] = useState([
    parseInt(searchParams.get('minScore') || '0')
  ])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(
    searchParams.get('amenities')?.split(',').filter(Boolean) || []
  )
  const [selectedTypes, setSelectedTypes] = useState<string[]>(
    searchParams.get('types')?.split(',').filter(Boolean) || []
  )

  const updateURL = useCallback((newFilters: WorkspaceFilters) => {
    const params = new URLSearchParams(searchParams.toString())
    
    // Update price
    if (newFilters.maxPrice && newFilters.maxPrice > 0) {
      params.set('maxPrice', newFilters.maxPrice.toString())
    } else {
      params.delete('maxPrice')
    }
    
    // Update digital score
    if (newFilters.minScore && newFilters.minScore > 0) {
      params.set('minScore', newFilters.minScore.toString())
    } else {
      params.delete('minScore')
    }
    
    // Update amenities
    if (newFilters.amenities && newFilters.amenities.length > 0) {
      params.set('amenities', newFilters.amenities.join(','))
    } else {
      params.delete('amenities')
    }
    
    // Update types
    if (newFilters.types && newFilters.types.length > 0) {
      params.set('types', newFilters.types.join(','))
    } else {
      params.delete('types')
    }
    
    // Reset page when filters change
    params.delete('page')
    
    router.push(`/directory?${params.toString()}`)
    onFiltersChange?.(newFilters)
  }, [searchParams, router, onFiltersChange])

  const handleAmenityChange = useCallback((amenityId: string, checked: boolean) => {
    const newAmenities = checked
      ? [...selectedAmenities, amenityId]
      : selectedAmenities.filter(id => id !== amenityId)
    
    setSelectedAmenities(newAmenities)
    updateURL({
      maxPrice: priceRange[0],
      minScore: digitalScoreMin[0],
      amenities: newAmenities,
      types: selectedTypes,
    })
  }, [selectedAmenities, priceRange, digitalScoreMin, selectedTypes, updateURL])

  const handleTypeChange = useCallback((typeId: string, checked: boolean) => {
    const newTypes = checked
      ? [...selectedTypes, typeId]
      : selectedTypes.filter(id => id !== typeId)
    
    setSelectedTypes(newTypes)
    updateURL({
      maxPrice: priceRange[0],
      minScore: digitalScoreMin[0],
      amenities: selectedAmenities,
      types: newTypes,
    })
  }, [selectedTypes, priceRange, digitalScoreMin, selectedAmenities, updateURL])

  const handlePriceChange = useCallback((value: number[]) => {
    setPriceRange(value)
    updateURL({
      maxPrice: value[0],
      minScore: digitalScoreMin[0],
      amenities: selectedAmenities,
      types: selectedTypes,
    })
  }, [digitalScoreMin, selectedAmenities, selectedTypes, updateURL])

  const handleScoreChange = useCallback((value: number[]) => {
    setDigitalScoreMin(value)
    updateURL({
      maxPrice: priceRange[0],
      minScore: value[0],
      amenities: selectedAmenities,
      types: selectedTypes,
    })
  }, [priceRange, selectedAmenities, selectedTypes, updateURL])

  const resetFilters = useCallback(() => {
    setPriceRange([500])
    setDigitalScoreMin([0])
    setSelectedAmenities([])
    setSelectedTypes([])
    router.push('/directory')
  }, [router])

  const hasActiveFilters = priceRange[0] < 500 || digitalScoreMin[0] > 0 || 
                          selectedAmenities.length > 0 || selectedTypes.length > 0

  return (
    <div className="sticky top-20 rounded-lg border-2 border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Filters</h2>
        {hasActiveFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 px-2 text-xs"
            onClick={resetFilters}
          >
            Reset
          </Button>
        )}
      </div>

      {hasActiveFilters && (
        <div className="mt-2 space-y-2">
          <div className="flex flex-wrap gap-1">
            {priceRange[0] < 500 && (
              <Badge variant="secondary" className="text-xs">
                Max $${priceRange[0]}
                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handlePriceChange([500])} />
              </Badge>
            )}
            {digitalScoreMin[0] > 0 && (
              <Badge variant="secondary" className="text-xs">
                Score {digitalScoreMin[0]}+
                <X className="ml-1 h-3 w-3 cursor-pointer" onClick={() => handleScoreChange([0])} />
              </Badge>
            )}
            {selectedAmenities.map(amenityId => {
              const amenity = amenities.find(a => a.id === amenityId)
              return amenity ? (
                <Badge key={amenityId} variant="secondary" className="text-xs">
                  {amenity.label}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleAmenityChange(amenityId, false)} 
                  />
                </Badge>
              ) : null
            })}
            {selectedTypes.map(typeId => {
              const type = spaceTypes.find(t => t.id === typeId)
              return type ? (
                <Badge key={typeId} variant="secondary" className="text-xs">
                  {type.label}
                  <X 
                    className="ml-1 h-3 w-3 cursor-pointer" 
                    onClick={() => handleTypeChange(typeId, false)} 
                  />
                </Badge>
              ) : null
            })}
          </div>
        </div>
      )}

      <Separator className="my-4" />
      
      <Accordion type="multiple" defaultValue={["price", "amenities", "type", "digital-score"]}>
        <AccordionItem value="price">
          <AccordionTrigger>Price Range</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider 
                value={priceRange}
                onValueChange={handlePriceChange}
                max={1000} 
                min={0}
                step={25} 
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">$0</span>
                <span className="text-sm font-medium">${priceRange[0]}</span>
                <span className="text-sm text-gray-500">$1000+</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="amenities">
          <AccordionTrigger>Amenities</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {amenities.map((amenity) => (
                <div key={amenity.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={amenity.id}
                    checked={selectedAmenities.includes(amenity.id)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity.id, !!checked)}
                  />
                  <label
                    htmlFor={amenity.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {amenity.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="type">
          <AccordionTrigger>Space Type</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-2">
              {spaceTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={type.id}
                    checked={selectedTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleTypeChange(type.id, !!checked)}
                  />
                  <label
                    htmlFor={type.id}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {type.label}
                  </label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="digital-score">
          <AccordionTrigger>Digital Score</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <Slider 
                value={digitalScoreMin}
                onValueChange={handleScoreChange}
                max={100} 
                min={0}
                step={5} 
              />
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">0</span>
                <span className="text-sm font-medium">{digitalScoreMin[0]}+</span>
                <span className="text-sm text-gray-500">100</span>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}