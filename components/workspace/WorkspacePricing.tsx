import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Clock, DollarSign, Users, Calendar } from 'lucide-react'

interface WorkspacePricing {
  id: string
  type: string
  price: number
  currency: string
  description: string | null
  capacity: number | null
  active: boolean
}

interface WorkspaceHours {
  id: string
  monday: string | null
  tuesday: string | null
  wednesday: string | null
  thursday: string | null
  friday: string | null
  saturday: string | null
  sunday: string | null
}

interface WorkspacePricingProps {
  pricing: WorkspacePricing[]
  openingHours: WorkspaceHours | null
}

const pricingTypeLabels: Record<string, string> = {
  HOURLY: 'Hourly Rate',
  DAILY: 'Day Pass',
  MONTHLY: 'Monthly',
  HOT_DESK: 'Hot Desk',
  DEDICATED_DESK: 'Dedicated Desk',
  PRIVATE_OFFICE: 'Private Office',
  MEETING_ROOM: 'Meeting Room',
}

const pricingTypeIcons: Record<string, React.ReactNode> = {
  HOURLY: <Clock className="h-5 w-5" />,
  DAILY: <Calendar className="h-5 w-5" />,
  MONTHLY: <Calendar className="h-5 w-5" />,
  HOT_DESK: <Users className="h-5 w-5" />,
  DEDICATED_DESK: <Users className="h-5 w-5" />,
  PRIVATE_OFFICE: <Users className="h-5 w-5" />,
  MEETING_ROOM: <Users className="h-5 w-5" />,
}

export function WorkspacePricing({ pricing, openingHours }: WorkspacePricingProps) {
  const formatPrice = (price: number, currency: string, type: string) => {
    const symbol = currency === 'USD' ? '$' : currency
    const suffix = type === 'HOURLY' ? '/hr' : type === 'DAILY' ? '/day' : type === 'MONTHLY' ? '/mo' : ''
    return `${symbol}${price}${suffix}`
  }

  const formatHours = (hours: string | null) => {
    if (!hours) return 'Closed'
    if (hours.toLowerCase().includes('24') || hours.toLowerCase().includes('24/7')) {
      return '24/7'
    }
    return hours
  }

  const daysOfWeek = [
    { key: 'monday', label: 'Monday' },
    { key: 'tuesday', label: 'Tuesday' },
    { key: 'wednesday', label: 'Wednesday' },
    { key: 'thursday', label: 'Thursday' },
    { key: 'friday', label: 'Friday' },
    { key: 'saturday', label: 'Saturday' },
    { key: 'sunday', label: 'Sunday' },
  ]

  return (
    <div className="space-y-6">
      {/* Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="mr-2 h-5 w-5" />
            Pricing Options
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pricing.length === 0 ? (
            <p className="text-gray-500">No pricing information available.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {pricing.map((price) => (
                <div key={price.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                        {pricingTypeIcons[price.type] || <DollarSign className="h-5 w-5" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          {pricingTypeLabels[price.type] || price.type}
                        </h3>
                        {price.description && (
                          <p className="text-sm text-gray-500">{price.description}</p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {formatPrice(price.price, price.currency, price.type)}
                      </div>
                      {price.capacity && (
                        <p className="text-xs text-gray-500">Up to {price.capacity} people</p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary" className="text-xs">
                      {pricingTypeLabels[price.type] || price.type}
                    </Badge>
                    {price.capacity && (
                      <Badge variant="outline" className="text-xs">
                        {price.capacity} capacity
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Opening Hours */}
      {openingHours && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="mr-2 h-5 w-5" />
              Opening Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {daysOfWeek.map((day) => {
                const hours = openingHours[day.key as keyof WorkspaceHours] as string | null
                const isToday = new Date().getDay() === (daysOfWeek.indexOf(day) + 1) % 7
                
                return (
                  <div 
                    key={day.key} 
                    className={`flex justify-between items-center py-2 px-3 rounded ${
                      isToday ? 'bg-yellow/20 font-medium' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={isToday ? 'text-yellow-800' : 'text-gray-700'}>
                      {day.label}
                    </span>
                    <span className={`${
                      isToday ? 'text-yellow-800 font-medium' : 'text-gray-600'
                    } ${hours === null || hours.toLowerCase() === 'closed' ? 'text-red-500' : ''}`}>
                      {formatHours(hours)}
                    </span>
                  </div>
                )
              })}
            </div>
            
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">
                💡 Hours may vary on holidays. Contact the space directly to confirm availability.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}