import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Navigation, Car, Train, Bus, Plane } from 'lucide-react'

interface WorkspaceLocationProps {
  workspace: {
    id: string
    name: string
    address: string | null
    city: string
    country: string
    latitude: number | null
    longitude: number | null
  }
}

export function WorkspaceLocation({ workspace }: WorkspaceLocationProps) {
  const fullAddress = workspace.address || `${workspace.city}, ${workspace.country}`
  
  const handleGetDirections = () => {
    if (workspace.latitude && workspace.longitude) {
      window.open(`https://maps.google.com?q=${workspace.latitude},${workspace.longitude}`, '_blank')
    } else {
      window.open(`https://maps.google.com?q=${encodeURIComponent(fullAddress)}`, '_blank')
    }
  }

  const handleViewOnMap = () => {
    if (workspace.latitude && workspace.longitude) {
      window.open(`https://www.google.com/maps/@${workspace.latitude},${workspace.longitude},15z`, '_blank')
    } else {
      window.open(`https://maps.google.com/maps?q=${encodeURIComponent(fullAddress)}`, '_blank')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <MapPin className="mr-2 h-5 w-5" />
          Location & Getting There
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Address */}
        <div>
          <h3 className="font-semibold mb-2">Address</h3>
          <p className="text-gray-700">{fullAddress}</p>
          <div className="flex gap-2 mt-3">
            <Button size="sm" onClick={handleGetDirections}>
              <Navigation className="mr-2 h-4 w-4" />
              Get Directions
            </Button>
            <Button variant="outline" size="sm" onClick={handleViewOnMap}>
              <MapPin className="mr-2 h-4 w-4" />
              View on Map
            </Button>
          </div>
        </div>

        {/* Map Placeholder */}
        <div className="relative">
          <div className="aspect-[2/1] bg-gray-100 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500 font-medium">Interactive Map</p>
              <p className="text-sm text-gray-400">Click "View on Map" to open in Google Maps</p>
            </div>
          </div>
        </div>

        {/* Transportation */}
        <div>
          <h3 className="font-semibold mb-3">Transportation</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
                <Train className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Public Transit</p>
                <p className="text-xs text-gray-500">Multiple lines nearby</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                <Car className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Parking</p>
                <p className="text-xs text-gray-500">Street & garage options</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow-100">
                <Bus className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Bus Routes</p>
                <p className="text-xs text-gray-500">Several bus stops nearby</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-100">
                <Plane className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-sm">Airport Access</p>
                <p className="text-xs text-gray-500">Easy connection to airport</p>
              </div>
            </div>
          </div>
        </div>

        {/* Neighborhood Info */}
        <div>
          <h3 className="font-semibold mb-3">Neighborhood</h3>
          <div className="space-y-3">
            <p className="text-gray-600 text-sm">
              Located in the heart of {workspace.city}, this workspace is surrounded by 
              cafes, restaurants, and other businesses, making it an ideal location for 
              networking and collaboration.
            </p>
            
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">Business District</Badge>
              <Badge variant="secondary">Restaurants Nearby</Badge>
              <Badge variant="secondary">Shopping</Badge>
              <Badge variant="secondary">Well Connected</Badge>
            </div>
          </div>
        </div>

        {/* Coordinates (for debugging, can be removed) */}
        {workspace.latitude && workspace.longitude && (
          <div className="text-xs text-gray-400 font-mono">
            Coordinates: {workspace.latitude.toFixed(6)}, {workspace.longitude.toFixed(6)}
          </div>
        )}
      </CardContent>
    </Card>
  )
}