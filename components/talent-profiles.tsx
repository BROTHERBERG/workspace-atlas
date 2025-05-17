import Image from "next/image"
import Link from "next/link"
import { MapPin, Briefcase, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

// Mock data for talent profiles
const talentProfiles = [
  {
    id: 1,
    name: "Emma Wilson",
    title: "Community Manager",
    location: "New York, NY",
    experience: "5+ years",
    skills: ["Member Experience", "Event Planning", "Community Building"],
    featured: true,
    image: "/confident-professional.png",
  },
  {
    id: 2,
    name: "David Kim",
    title: "Operations Director",
    location: "San Francisco, CA",
    experience: "8+ years",
    skills: ["Team Management", "Process Optimization", "Financial Planning"],
    featured: true,
    image: "/placeholder.svg?height=100&width=100&query=professional headshot man asian",
  },
  {
    id: 3,
    name: "Sophia Martinez",
    title: "General Manager",
    location: "Miami, FL",
    experience: "7+ years",
    skills: ["Leadership", "Revenue Growth", "Member Retention"],
    featured: false,
    image: "/placeholder.svg?height=100&width=100&query=professional headshot woman latina",
  },
  {
    id: 4,
    name: "James Johnson",
    title: "Marketing Manager",
    location: "Chicago, IL",
    experience: "6+ years",
    skills: ["Digital Marketing", "Content Strategy", "Brand Development"],
    featured: false,
    image: "/confident-businessman.png",
  },
  {
    id: 5,
    name: "Aisha Patel",
    title: "Community Experience Lead",
    location: "London, UK",
    experience: "4+ years",
    skills: ["Event Management", "Member Onboarding", "Community Engagement"],
    featured: false,
    image: "/placeholder.svg?height=100&width=100&query=professional headshot woman indian",
  },
]

export default function TalentProfiles() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {talentProfiles.map((profile) => (
        <Card key={profile.id} className={profile.featured ? "border-gold" : ""}>
          <CardContent className="p-6">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <Image
                  src={profile.image || "/placeholder.svg"}
                  alt={profile.name}
                  width={100}
                  height={100}
                  className="rounded-full"
                />
                {profile.featured && (
                  <Badge className="absolute -right-2 -top-2 bg-gold text-midnight hover:bg-gold/80">
                    <Star className="mr-1 h-3 w-3" /> Featured
                  </Badge>
                )}
              </div>
              <div className="mt-4 space-y-2">
                <h3 className="font-bold">{profile.name}</h3>
                <p className="text-gray-500">{profile.title}</p>
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                  <MapPin className="h-3 w-3" />
                  <span>{profile.location}</span>
                </div>
                <div className="flex items-center justify-center space-x-1 text-sm text-gray-500">
                  <Briefcase className="h-3 w-3" />
                  <span>{profile.experience}</span>
                </div>
                <div className="flex flex-wrap justify-center gap-1">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
                <div className="pt-4">
                  <Link href={`/talent/${profile.id}`}>
                    <Button variant="outline" className="w-full">
                      View Profile
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
