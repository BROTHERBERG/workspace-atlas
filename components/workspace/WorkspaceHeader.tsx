import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Star, Share2, Bookmark, Calendar } from 'lucide-react'
import Link from 'next/link'

interface WorkspaceHeaderProps {
  workspace: {
    id: string
    name: string
    city: string | null
    country: string | null
    rating: number | null
    reviewCount?: number
    featured?: boolean
    verified?: boolean
    digitalScore: number | null
    _count?: {
      reviews: number
    }
  }
}

export function WorkspaceHeader({ workspace }: WorkspaceHeaderProps) {
  return (
    <div className="bg-white border-b">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl lg:text-3xl font-bold">{workspace.name}</h1>
              {workspace.verified && (
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  <Star className="mr-1 h-3 w-3 fill-current" />
                  Verified
                </Badge>
              )}
              {workspace.featured && (
                <Badge className="bg-yellow text-black">Featured</Badge>
              )}
              {workspace.digitalScore && (
                <Badge variant="outline" className="border-yellow text-yellow-700">
                  Score: {workspace.digitalScore}
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              {(workspace.city || workspace.country) && (
                <div className="flex items-center">
                  <MapPin className="mr-1 h-4 w-4" />
                  <span>
                    {[workspace.city, workspace.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              
              {workspace.rating && (
                <div className="flex items-center">
                  <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-medium">{workspace.rating.toFixed(1)}</span>
                  {((workspace.reviewCount || workspace._count?.reviews) && (workspace.reviewCount || workspace._count?.reviews)! > 0) && (
                    <span className="ml-1 text-gray-500">
                      ({workspace.reviewCount || workspace._count?.reviews} review{(workspace.reviewCount || workspace._count?.reviews) !== 1 ? 's' : ''})
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm">
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Bookmark className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Button size="sm" className="bg-yellow text-black hover:bg-yellow/80">
              <Calendar className="mr-2 h-4 w-4" />
              Book Tour
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}