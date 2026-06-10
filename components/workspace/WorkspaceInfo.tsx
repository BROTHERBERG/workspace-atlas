import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Users, MapPin, Globe, Mail, Phone } from 'lucide-react'
import Link from 'next/link'

interface WorkspaceInfoProps {
  workspace: {
    id: string
    name: string
    description: string | null
    city: string | null
    country: string | null
    address: string | null
    website: string | null
    phone: string | null
    email: string | null
    verified?: boolean
    createdAt: Date
  }
  owner: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
  totalBookings: number
}

export function WorkspaceInfo({ workspace, owner, totalBookings }: WorkspaceInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About This Space</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Description */}
        {workspace.description && (
          <div>
            <p className="text-gray-600 leading-relaxed">
              {workspace.description}
            </p>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">{totalBookings}</div>
            <div className="text-sm text-gray-500">Total Bookings</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {new Date().getFullYear() - new Date(workspace.createdAt).getFullYear() || '1'}
            </div>
            <div className="text-sm text-gray-500">Years Operating</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">
              {workspace.verified ? 'Yes' : 'No'}
            </div>
            <div className="text-sm text-gray-500">Verified</div>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900">★★★★★</div>
            <div className="text-sm text-gray-500">Quality Rating</div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="font-semibold mb-3">Contact Information</h3>
          <div className="space-y-2">
            {workspace.address && (
              <div className="flex items-center text-sm">
                <MapPin className="mr-2 h-4 w-4 text-gray-400" />
                <span>{workspace.address}</span>
              </div>
            )}
            {workspace.website && (
              <div className="flex items-center text-sm">
                <Globe className="mr-2 h-4 w-4 text-gray-400" />
                <Link 
                  href={workspace.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Visit Website
                </Link>
              </div>
            )}
            {workspace.email && (
              <div className="flex items-center text-sm">
                <Mail className="mr-2 h-4 w-4 text-gray-400" />
                <Link href={`mailto:${workspace.email}`} className="text-blue-600 hover:underline">
                  {workspace.email}
                </Link>
              </div>
            )}
            {workspace.phone && (
              <div className="flex items-center text-sm">
                <Phone className="mr-2 h-4 w-4 text-gray-400" />
                <Link href={`tel:${workspace.phone}`} className="text-blue-600 hover:underline">
                  {workspace.phone}
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Space Owner */}
        <div>
          <h3 className="font-semibold mb-3">Managed by</h3>
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={owner?.image || ''} alt={owner?.name || ''} />
              <AvatarFallback>
                {owner?.name?.charAt(0) || owner?.email?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{owner?.name || 'Space Owner'}</p>
              <p className="text-sm text-gray-500">Space Manager</p>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="pt-4 border-t">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">
              <Users className="mr-1 h-3 w-3" />
              Community Focused
            </Badge>
            {workspace.verified && (
              <Badge variant="secondary" className="bg-green-100 text-green-800">
                Verified Space
              </Badge>
            )}
            <Badge variant="secondary">
              Professional Environment
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}