import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  Wifi, 
  Coffee, 
  Clock, 
  Calendar, 
  Phone, 
  Printer, 
  Car, 
  Shield, 
  Utensils,
  Users,
  Bike,
  Zap,
  CheckCircle
} from 'lucide-react'

// Map amenity names to icons
const amenityIcons: Record<string, React.ReactNode> = {
  'High-speed WiFi': <Wifi className="h-5 w-5" />,
  'High-Speed WiFi': <Wifi className="h-5 w-5" />,
  'Coffee & Tea': <Coffee className="h-5 w-5" />,
  'Coffee Bar': <Coffee className="h-5 w-5" />,
  'Meeting Rooms': <Calendar className="h-5 w-5" />,
  'Phone Booths': <Phone className="h-5 w-5" />,
  'Printing': <Printer className="h-5 w-5" />,
  '24/7 Access': <Clock className="h-5 w-5" />,
  'Parking': <Car className="h-5 w-5" />,
  'Kitchen': <Utensils className="h-5 w-5" />,
  'Event Space': <Users className="h-5 w-5" />,
  'Bike Storage': <Bike className="h-5 w-5" />,
  'Lockers': <Shield className="h-5 w-5" />,
  'Shower Facilities': <Zap className="h-5 w-5" />,
}

interface WorkspaceAmenity {
  id: string
  amenity: string
}

interface WorkspaceAmenitiesProps {
  amenities: WorkspaceAmenity[]
}

export function WorkspaceAmenities({ amenities }: WorkspaceAmenitiesProps) {
  if (amenities.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Amenities</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">No amenities listed for this workspace.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Amenities</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {amenities.map((amenity) => (
            <div key={amenity.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
                {amenityIcons[amenity.amenity] || <CheckCircle className="h-5 w-5 text-green-500" />}
              </div>
              <span className="font-medium text-sm">{amenity.amenity}</span>
            </div>
          ))}
        </div>

        {/* Additional Services Section */}
        <div className="mt-8">
          <h3 className="font-semibold mb-4">Additional Services</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Meeting Room Booking</h4>
              <p className="text-sm text-gray-600">
                Book meeting rooms by the hour or day. Various sizes available for teams of all sizes.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Event Hosting</h4>
              <p className="text-sm text-gray-600">
                Host workshops, meetups, or company events in our flexible event spaces.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Virtual Office</h4>
              <p className="text-sm text-gray-600">
                Business address and mail handling services for remote professionals.
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium mb-2">Printing Services</h4>
              <p className="text-sm text-gray-600">
                High-quality printing, scanning, and copying services available on-site.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}