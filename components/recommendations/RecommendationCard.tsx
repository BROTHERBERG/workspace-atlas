'use client'

import { useState } from 'react'
import { 
  Star, 
  MapPin, 
  TrendingUp, 
  Award, 
  Heart, 
  Share2,
  Info,
  ExternalLink
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

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

interface RecommendationCardProps {
  recommendation: Recommendation
  showReasons?: boolean
  onToggleFavorite?: (workspaceId: string) => void
  isFavorite?: boolean
  className?: string
}

export default function RecommendationCard({
  recommendation,
  showReasons = true,
  onToggleFavorite,
  isFavorite = false,
  className = ''
}: RecommendationCardProps) {
  const [imageError, setImageError] = useState(false)
  
  const { workspace, score, reasons, strategy, distance, priceMatch } = recommendation

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

  const getStrategyColor = (strategy: string) => {
    switch (strategy) {
      case 'trending': return 'bg-red-100 text-red-700'
      case 'location': return 'bg-blue-100 text-blue-700'
      case 'content-based': return 'bg-green-100 text-green-700'
      case 'collaborative': return 'bg-purple-100 text-purple-700'
      case 'hybrid': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStrategyLabel = (strategy: string) => {
    switch (strategy) {
      case 'trending': return 'Trending'
      case 'location': return 'Near You'
      case 'content-based': return 'For You'
      case 'collaborative': return 'Popular'
      case 'hybrid': return 'Best Match'
      default: return 'Recommended'
    }
  }

  return (
    <TooltipProvider>
      <Card className={`overflow-hidden hover:shadow-lg transition-all duration-300 group border-2 border-transparent hover:border-yellow-200 ${className}`}>
        {/* Image */}
        <div className="relative aspect-video">
          <Image
            src={!imageError && workspace.images?.[0] 
              ? workspace.images[0] 
              : '/placeholder-workspace.jpg'
            }
            alt={workspace.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImageError(true)}
          />
          
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all" />
          
          {/* Top badges */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            <Badge className={`${getStrategyColor(strategy)} text-xs font-medium`}>
              {getStrategyLabel(strategy)}
            </Badge>
            
            {workspace.isVerified && (
              <Badge className="bg-green-500 text-white text-xs">
                <Award className="w-3 h-3 mr-1" />
                Verified
              </Badge>
            )}
            
            {score >= 90 && (
              <Badge className="bg-yellow-500 text-black text-xs font-bold">
                Top Pick
              </Badge>
            )}
          </div>
          
          {/* Top right actions */}
          <div className="absolute top-3 right-3 flex gap-2">
            {onToggleFavorite && (
              <Button
                variant="secondary"
                size="sm"
                onClick={(e) => {
                  e.preventDefault()
                  onToggleFavorite(workspace.id)
                }}
                className="p-2 bg-white/90 hover:bg-white transition-colors"
              >
                <Heart className={`w-4 h-4 ${isFavorite ? 'fill-red-500 text-red-500' : ''}`} />
              </Button>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              className="p-2 bg-white/90 hover:bg-white transition-colors"
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Bottom overlay with confidence score */}
          <div className="absolute bottom-3 right-3">
            <Tooltip>
              <TooltipTrigger>
                <Badge variant="outline" className="bg-white/90 backdrop-blur-sm">
                  {score}% match
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                Recommendation confidence score
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        <CardContent className="p-4 space-y-3">
          {/* Header */}
          <div className="space-y-1">
            <Link href={`/spaces/${workspace.slug}`}>
              <h3 className="font-semibold text-lg hover:text-yellow-600 transition-colors line-clamp-1 group-hover:text-yellow-600">
                {workspace.name}
              </h3>
            </Link>
            
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">
                {workspace.city}{workspace.country ? `, ${workspace.country}` : ''}
              </span>
              
              {distance && (
                <>
                  <span>•</span>
                  <span className="whitespace-nowrap">{distance.toFixed(1)} km away</span>
                </>
              )}
            </div>
          </div>

          {/* Description */}
          {workspace.description && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {workspace.description}
            </p>
          )}

          {/* Amenities */}
          {workspace.amenities.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {workspace.amenities.slice(0, 3).map((amenity, index) => (
                <Badge key={index} variant="outline" className="text-xs">
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

          {/* Recommendations reasons */}
          {showReasons && reasons.length > 0 && (
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-start gap-2">
                <Info className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-yellow-800">
                  <div className="font-medium mb-1">Why we recommend this:</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {reasons.slice(0, 2).map((reason, index) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                  {reasons.length > 2 && (
                    <div className="text-yellow-600 font-medium mt-1">
                      +{reasons.length - 2} more reasons
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-3">
              {workspace.rating && (
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-medium text-sm">{workspace.rating}</span>
                  {workspace.reviewCount && (
                    <span className="text-gray-500 text-xs">
                      ({workspace.reviewCount})
                    </span>
                  )}
                </div>
              )}
              
              <Tooltip>
                <TooltipTrigger>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">{workspace.digitalScore}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  Digital presence score out of 100
                </TooltipContent>
              </Tooltip>

              {workspace.website && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="p-1 h-auto"
                >
                  <a 
                    href={workspace.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                  </a>
                </Button>
              )}
            </div>

            <div className="text-right">
              {getLowestPrice() && (
                <div className="font-semibold text-lg">
                  {formatPrice(getLowestPrice()!)}
                  <span className="text-xs font-normal text-gray-500">/day</span>
                </div>
              )}
              <div className="text-xs text-gray-500">
                {priceMatch && (
                  <span className="capitalize">{priceMatch} • </span>
                )}
                from hot desk
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}