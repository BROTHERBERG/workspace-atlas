import Image from "next/image"
import Link from "next/link"
import { MapPin, Wifi, Coffee, Clock, Star, Printer, Phone, Bike, Utensils } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import DigitalScoreWidget from "@/components/digital-score-widget"
import { getWorkspace, WorkspaceData } from "@/lib/mock-data"

interface SpaceCardProps {
  id: number
  workspace?: WorkspaceData
}

export default function SpaceCard({ id, workspace }: SpaceCardProps) {
  // Get workspace data from our mock data generator
  const space = workspace || getWorkspace(id)

  return (
    <Card className="overflow-hidden border-2 border-black shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all hover:-translate-y-1">
      <div className="relative">
        <Image
          src={space.images[0]}
          alt={space.name}
          width={500}
          height={300}
          className="h-48 w-full object-cover"
        />
        {space.featured && (
          <Badge className="absolute left-2 top-2 bg-[#f9cb16] text-black border-2 border-black hover:bg-[#f9cb16]">
            Featured
          </Badge>
        )}
        {space.verified && (
          <Badge className="absolute right-2 top-2 bg-white text-black border-2 border-black hover:bg-white/80">
            <Star className="mr-1 h-3 w-3 fill-[#f9cb16] text-[#f9cb16]" /> Verified
          </Badge>
        )}
      </div>
      <CardContent className="p-4">
        <div className="space-y-2">
          <div className="space-y-1">
            <h3 className="font-bold font-cal">{space.name}</h3>
            <div className="flex items-center text-sm text-gray-500">
              <MapPin className="mr-1 h-3 w-3" />
              {space.location.city}, {space.location.country}
            </div>
          </div>
          <div className="flex flex-wrap gap-1">
            {space.amenities.slice(0, 3).map((amenity, index) => {
              let icon = <Wifi className="mr-1 h-3 w-3" />
              if (amenity.includes("Coffee") || amenity.includes("Kitchen")) icon = <Coffee className="mr-1 h-3 w-3" />
              if (amenity.includes("24/7")) icon = <Clock className="mr-1 h-3 w-3" />
              if (amenity.includes("Print")) icon = <Printer className="mr-1 h-3 w-3" />
              if (amenity.includes("Phone")) icon = <Phone className="mr-1 h-3 w-3" />
              if (amenity.includes("Bike")) icon = <Bike className="mr-1 h-3 w-3" />
              if (amenity.includes("Kitchen") || amenity.includes("Lounge")) icon = <Utensils className="mr-1 h-3 w-3" />

              return (
                <Badge key={index} variant="outline" className="flex items-center text-xs border-black">
                  {icon} {amenity}
                </Badge>
              )
            })}
          </div>
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center">
              <Star className="mr-1 h-4 w-4 fill-[#f9cb16] text-[#f9cb16]" />
              <span className="text-sm font-medium">{space.rating.toFixed(1)}</span>
              <span className="text-xs text-gray-500">({space.reviewCount} reviews)</span>
            </div>
            <DigitalScoreWidget score={space.digitalScore} mini />
          </div>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <div className="flex w-full gap-2">
          <Link href={`/spaces/${space.id}`} className="flex-1">
            <Button className="w-full bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(250,204,21,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
              View Space
            </Button>
          </Link>
          <Link href={`/admin/spaces/${space.id}/edit`} className="hidden admin-only">
            <Button variant="outline" size="icon" className="border-2 border-black">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="lucide lucide-pencil"
              >
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
            </Button>
          </Link>
        </div>
      </CardFooter>
    </Card>
  )
}
