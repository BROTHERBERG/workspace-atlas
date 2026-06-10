'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar, Clock, DollarSign, Users, MapPin, Star } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface WorkspacePricing {
  id: string
  type: string
  price: number
  currency: string
  description: string | null
  capacity: number | null
}

interface Workspace {
  id: string
  name: string
  city: string
  country: string
  rating: number | null
  reviewCount: number
  digitalScore: number | null
  featured: boolean
}

interface WorkspaceBookingProps {
  workspace: Workspace
  pricing: WorkspacePricing[]
  isLoggedIn: boolean
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

export function WorkspaceBooking({ workspace, pricing, isLoggedIn }: WorkspaceBookingProps) {
  const [selectedPricing, setSelectedPricing] = useState<string>('')
  const [isBooking, setIsBooking] = useState(false)

  const selectedPricingOption = pricing.find(p => p.id === selectedPricing)

  const formatPrice = (price: number, currency: string, type: string) => {
    const symbol = currency === 'USD' ? '$' : currency
    const suffix = type === 'HOURLY' ? '/hr' : type === 'DAILY' ? '/day' : type === 'MONTHLY' ? '/mo' : ''
    return `${symbol}${price}${suffix}`
  }

  const handleBooking = async () => {
    if (!isLoggedIn) {
      toast.error('Please sign in to make a booking')
      return
    }

    if (!selectedPricingOption) {
      toast.error('Please select a pricing option')
      return
    }

    setIsBooking(true)
    try {
      // This would normally make an API call to create a booking
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast.success('Booking request submitted! We\'ll contact you soon.')
    } catch (error) {
      toast.error('Failed to submit booking request')
    } finally {
      setIsBooking(false)
    }
  }

  const handleContactSpace = () => {
    if (workspace.city && workspace.name) {
      const subject = encodeURIComponent(`Inquiry about ${workspace.name}`)
      const body = encodeURIComponent(
        `Hi,\n\nI'm interested in learning more about ${workspace.name} in ${workspace.city}.\n\nCan you please provide more information about availability and pricing?\n\nThank you!`
      )
      window.location.href = `mailto:?subject=${subject}&body=${body}`
    }
  }

  return (
    <div className="space-y-4">
      {/* Main Booking Card */}
      <Card className="sticky top-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Book This Space</span>
            {workspace.featured && (
              <Badge className="bg-yellow text-black">Featured</Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Workspace Summary */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-gray-600">
              <MapPin className="mr-1 h-4 w-4" />
              <span>{workspace.city}, {workspace.country}</span>
            </div>
            
            {workspace.rating && (
              <div className="flex items-center text-sm">
                <Star className="mr-1 h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="font-medium">{workspace.rating.toFixed(1)}</span>
                <span className="ml-1 text-gray-500">
                  ({workspace.reviewCount} review{workspace.reviewCount !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {workspace.digitalScore && (
              <div className="flex items-center text-sm">
                <DollarSign className="mr-1 h-4 w-4 text-green-600" />
                <span className="font-medium text-green-600">
                  Digital Score: {workspace.digitalScore}
                </span>
              </div>
            )}
          </div>

          {/* Pricing Selection */}
          {pricing.length > 0 && (
            <div className="space-y-3">
              <label className="text-sm font-medium">Select Option</label>
              <Select value={selectedPricing} onValueChange={setSelectedPricing}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose pricing option" />
                </SelectTrigger>
                <SelectContent>
                  {pricing.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{pricingTypeLabels[option.type] || option.type}</span>
                        <span className="ml-2 font-medium text-green-600">
                          {formatPrice(option.price, option.currency, option.type)}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {selectedPricingOption && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">
                      {pricingTypeLabels[selectedPricingOption.type]}
                    </span>
                    <span className="text-xl font-bold text-green-600">
                      {formatPrice(selectedPricingOption.price, selectedPricingOption.currency, selectedPricingOption.type)}
                    </span>
                  </div>
                  {selectedPricingOption.description && (
                    <p className="text-sm text-gray-600">{selectedPricingOption.description}</p>
                  )}
                  {selectedPricingOption.capacity && (
                    <div className="flex items-center mt-2 text-sm text-gray-500">
                      <Users className="mr-1 h-4 w-4" />
                      <span>Up to {selectedPricingOption.capacity} people</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-2">
            {!isLoggedIn ? (
              <div className="space-y-2">
                <Link href="/auth/signin">
                  <Button className="w-full bg-yellow text-black hover:bg-yellow/80">
                    Sign In to Book
                  </Button>
                </Link>
                <p className="text-xs text-center text-gray-500">
                  Sign in to make bookings and access member features
                </p>
              </div>
            ) : (
              <Button 
                onClick={handleBooking}
                disabled={isBooking || (!selectedPricingOption && pricing.length > 0)}
                className="w-full bg-yellow text-black hover:bg-yellow/80"
              >
                {isBooking ? (
                  'Processing...'
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Request Booking
                  </>
                )}
              </Button>
            )}

            <Button 
              variant="outline" 
              onClick={handleContactSpace}
              className="w-full"
            >
              Contact Space
            </Button>
          </div>

          {/* Additional Info */}
          <div className="pt-3 border-t text-xs text-gray-500 space-y-1">
            <div className="flex items-center">
              <Clock className="mr-1 h-3 w-3" />
              <span>Instant confirmation for most bookings</span>
            </div>
            <div className="flex items-center">
              <Calendar className="mr-1 h-3 w-3" />
              <span>Free cancellation up to 24 hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Tour
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <Users className="mr-2 h-4 w-4" />
            Ask About Events
          </Button>
          <Button variant="outline" size="sm" className="w-full justify-start">
            <DollarSign className="mr-2 h-4 w-4" />
            Custom Quote
          </Button>
        </CardContent>
      </Card>

      {/* Booking Policies */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Booking Policies</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-600 space-y-2">
          <p>• Free cancellation up to 24 hours before booking</p>
          <p>• Valid ID required for check-in</p>
          <p>• Guest access must be arranged in advance</p>
          <p>• Outside food and drinks may be restricted</p>
        </CardContent>
      </Card>
    </div>
  )
}