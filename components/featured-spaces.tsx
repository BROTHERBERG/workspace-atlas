import Image from "next/image"
import Link from "next/link"
import { MapPin, Wifi, Coffee, Clock, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import DigitalScoreWidget from "@/components/digital-score-widget"
import { getWorkspaceImageSrc, RESPONSIVE_SIZES, IMAGE_QUALITY } from "@/lib/image-utils"

// Mock data for featured spaces
const featuredSpaces = [
  {
    id: 1,
    name: "The Collective",
    location: "New York, NY",
    image: "/bright-open-workspace.png",
    amenities: ["High-Speed Wifi", "Coffee Bar", "24/7 Access"],
    rating: 4.8,
    digitalScore: 92,
    verified: true,
    featured: true,
  },
  {
    id: 2,
    name: "WorkHub Central",
    location: "London, UK",
    image: "/modern-coworking-hub.png",
    amenities: ["High-Speed Wifi", "Meeting Rooms", "Event Space"],
    rating: 4.7,
    digitalScore: 88,
    verified: true,
    featured: true,
  },
  {
    id: 3,
    name: "Nomad Space",
    location: "Berlin, Germany",
    image: "/urban-jungle-office.png",
    amenities: ["High-Speed Wifi", "Quiet Zones", "Bike Storage"],
    rating: 4.9,
    digitalScore: 95,
    verified: true,
    featured: true,
  },
]

export default function FeaturedSpaces() {
  return (
    <>
      {featuredSpaces.map((space) => (
        <Card key={space.id} className="overflow-hidden card-brutalist">
          <div className="relative">
            <div className="absolute -inset-1 border-2 border-dashed border-yellow rounded-lg -rotate-1 z-10"></div>
            <Image
              src={getWorkspaceImageSrc(space.image)}
              alt={`${space.name} workspace`}
              width={500}
              height={300}
              quality={IMAGE_QUALITY.high}
              sizes={RESPONSIVE_SIZES.workspace_card}
              className="h-48 w-full object-cover relative z-20"
              priority
            />
            {space.featured && (
              <Badge className="absolute left-2 top-2 z-30 bg-yellow text-black hover:bg-yellow">
                Featured
              </Badge>
            )}
            {space.verified && (
              <Badge className="absolute right-2 top-2 z-30 bg-white text-[#1f1f1f] hover:bg-white/80 border-2 border-[#1f1f1f]">
                <Star className="mr-1 h-3 w-3 fill-yellow text-yellow" /> Verified
              </Badge>
            )}
          </div>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="space-y-1">
                <h3 className="font-cal">{space.name}</h3>
                <div className="flex items-center text-sm text-gray-500">
                  <MapPin className="mr-1 h-3 w-3" /> {space.location}
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {space.amenities.map((amenity, index) => {
                  let icon = <Wifi className="mr-1 h-3 w-3" />
                  if (amenity.includes("Coffee")) icon = <Coffee className="mr-1 h-3 w-3" />
                  if (amenity.includes("24/7")) icon = <Clock className="mr-1 h-3 w-3" />

                  return (
                    <Badge key={index} variant="outline" className="flex items-center text-xs border-[#1f1f1f]">
                      {icon} {amenity}
                    </Badge>
                  )
                })}
              </div>
              <div className="pt-2">
                <DigitalScoreWidget score={space.digitalScore} mini />
              </div>
            </div>
          </CardContent>
          <CardFooter className="p-4 pt-0">
            <Link href={`/spaces/${space.id}`} className="w-full">
              <Button
                className="w-full bg-black text-white hover:bg-black/90 hover:text-yellow shadow-brutalist-yellow transition-all hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none"
                variant="outline"
              >
                View Space
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </>
  )
}
