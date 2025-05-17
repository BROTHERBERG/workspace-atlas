import Image from "next/image"
import { MapPin, Wifi, Coffee, Clock, Star, Calendar, Phone, Share2, Bookmark, ChevronRight, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import DigitalScoreWidget from "@/components/digital-score-widget"
import ContactForm from "@/components/contact-form"

// Mock data for space amenities
const amenities = [
  { name: "High-Speed Wifi", icon: <Wifi className="h-5 w-5" /> },
  { name: "Coffee Bar", icon: <Coffee className="h-5 w-5" /> },
  { name: "24/7 Access", icon: <Clock className="h-5 w-5" /> },
  { name: "Meeting Rooms", icon: <Calendar className="h-5 w-5" /> },
  { name: "Event Space", icon: <Star className="h-5 w-5" /> },
  { name: "Quiet Zones", icon: <Phone className="h-5 w-5" /> },
]

export default function SpacePage({ params }: { params: { id: string } }) {
  const id = Number.parseInt(params.id)

  // Generate different data based on id to create variety
  const featured = id % 5 === 0
  const verified = id % 3 === 0 || id % 7 === 0
  const digitalScore = Math.floor(70 + Math.random() * 25)
  const rating = (4 + Math.random()).toFixed(1)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white">
        <div className="container px-4 py-8 md:px-6">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-3xl font-bold">Workspace {id}</h1>
                {verified && (
                  <Badge className="bg-white text-midnight">
                    <Star className="mr-1 h-3 w-3 fill-gold text-gold" /> Verified
                  </Badge>
                )}
                {featured && <Badge className="bg-gold text-midnight">Featured</Badge>}
              </div>
              <div className="mt-2 flex items-center text-gray-500">
                <MapPin className="mr-1 h-4 w-4" />
                <span>
                  {["New York", "London", "Berlin", "Singapore", "Tokyo", "Paris"][id % 6]},
                  {["USA", "UK", "Germany", "Singapore", "Japan", "France"][id % 6]}
                </span>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" size="sm">
                <Share2 className="mr-2 h-4 w-4" /> Share
              </Button>
              <Button variant="outline" size="sm">
                <Bookmark className="mr-2 h-4 w-4" /> Save
              </Button>
              <Button size="sm">Book a Tour</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Gallery */}
      <div className="container px-4 py-6 md:px-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="md:col-span-2">
            <Image
              src={`/placeholder.svg?height=600&width=1000&query=modern coworking space interior ${id}`}
              alt={`Workspace ${id} main image`}
              width={1000}
              height={600}
              className="h-[400px] w-full rounded-lg object-cover"
            />
          </div>
          <div className="hidden grid-rows-2 gap-4 lg:grid">
            <Image
              src={`/placeholder.svg?height=300&width=500&query=coworking meeting room ${id}`}
              alt={`Workspace ${id} meeting room`}
              width={500}
              height={300}
              className="h-[192px] w-full rounded-lg object-cover"
            />
            <Image
              src={`/placeholder.svg?height=300&width=500&query=coworking lounge area ${id}`}
              alt={`Workspace ${id} lounge area`}
              width={500}
              height={300}
              className="h-[192px] w-full rounded-lg object-cover"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container px-4 py-8 md:px-6">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Left Column - Details */}
          <div className="md:col-span-2 space-y-8">
            <Tabs defaultValue="overview">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="amenities">Amenities</TabsTrigger>
                <TabsTrigger value="leadership">Need Leadership?</TabsTrigger>
              </TabsList>
              <TabsContent value="overview" className="space-y-6 pt-6">
                <div>
                  <h2 className="text-xl font-bold">About This Space</h2>
                  <p className="mt-2 text-gray-600">
                    Workspace {id} is a premium coworking environment designed for productivity and collaboration.
                    Located in the heart of {["New York", "London", "Berlin", "Singapore", "Tokyo", "Paris"][id % 6]},
                    our space offers flexible membership options, state-of-the-art amenities, and a vibrant community of
                    professionals.
                  </p>
                  <p className="mt-4 text-gray-600">
                    Whether you need a hot desk for the day, a dedicated workspace, or a private office for your team,
                    we have options to suit your needs. Our space is designed to inspire creativity and foster
                    connections between members.
                  </p>
                </div>

                <div>
                  <h2 className="text-xl font-bold">Membership Options</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-bold">Hot Desk</h3>
                        <p className="text-sm text-gray-500">Access to shared workspace</p>
                        <p className="mt-2 text-xl font-bold">${150 + id * 10}/mo</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li className="flex items-center">
                            <ChevronRight className="mr-2 h-4 w-4 text-green-500" />
                            Flexible seating
                          </li>
                          <li className="flex items-center">
                            <ChevronRight className="mr-2 h-4 w-4 text-green-500" />
                            High-speed internet
                          </li>
                          <li className="flex items-center">
                            <ChevronRight className="mr-2 h-4 w-4 text-green-500" />
                            Access to common areas
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <h3 className="font-bold">Dedicated Desk</h3>
                        <p className="text-sm text-gray-500">Your own permanent desk</p>
                        <p className="mt-2 text-xl font-bold">${250 + id * 15}/mo</p>
                        <ul className="mt-2 space-y-1 text-sm">
                          <li className="flex items-center">
                            <ChevronRight className="mr-2 h-4 w-4 text-green-500" />
                            Personal desk
                          </li>
                          <li className="flex items-center">
                            <ChevronRight className="mr-2 h-4 w-4 text-green-500" />
                            Storage locker
                          </li>
                          <li className="flex items-center">
                            <ChevronRight className="mr-2 h-4 w-4 text-green-500" />
                            24/7 access
                          </li>
                        </ul>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold">Location</h2>
                  <div className="mt-4 rounded-lg border bg-white p-4">
                    <Image
                      src={`/placeholder.svg?height=300&width=800&query=map of ${["New York", "London", "Berlin", "Singapore", "Tokyo", "Paris"][id % 6]}`}
                      alt="Location Map"
                      width={800}
                      height={300}
                      className="h-[300px] w-full rounded-lg object-cover"
                    />
                    <div className="mt-4">
                      <p className="font-medium">
                        123 Workspace Street, {["New York", "London", "Berlin", "Singapore", "Tokyo", "Paris"][id % 6]}
                      </p>
                      <p className="text-sm text-gray-500">
                        Located in the heart of the city, easily accessible by public transportation.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="amenities" className="space-y-6 pt-6">
                <div>
                  <h2 className="text-xl font-bold">Amenities</h2>
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {amenities.map((amenity, index) => (
                      <div key={index} className="flex items-center space-x-2 rounded-lg border bg-white p-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                          {amenity.icon}
                        </div>
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold">Additional Services</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">Meeting Room Booking</h3>
                      <p className="text-sm text-gray-500">
                        Book meeting rooms by the hour or day. Various sizes available.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">Event Space</h3>
                      <p className="text-sm text-gray-500">
                        Host workshops, meetups, or company events in our flexible event space.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">Virtual Office</h3>
                      <p className="text-sm text-gray-500">Business address and mail handling services available.</p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">Printing & Scanning</h3>
                      <p className="text-sm text-gray-500">High-quality printing and scanning services on-site.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="leadership" className="space-y-6 pt-6">
                <div>
                  <h2 className="text-xl font-bold">Need Leadership Talent?</h2>
                  <p className="mt-2 text-gray-600">
                    Looking for a top-tier Community Manager or General Manager to take your space to the next level?
                    Our partner, Bottle Rocket Search Group, specializes in connecting coworking spaces with exceptional
                    leadership talent.
                  </p>

                  <div className="mt-6 rounded-lg border bg-white p-6">
                    <div className="flex flex-col items-center space-y-4 text-center sm:flex-row sm:items-start sm:space-x-6 sm:space-y-0 sm:text-left">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-midnight text-white">
                        <Users className="h-10 w-10" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Bottle Rocket Search Group</h3>
                        <p className="text-gray-600">
                          Specialized recruitment for coworking and flexible workspace operators. We connect spaces with
                          exceptional Community Managers, General Managers, and Operations leaders.
                        </p>
                        <div className="pt-2">
                          <Button>Get Connected</Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h2 className="text-xl font-bold">Leadership Roles We Fill</h2>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">Community Manager</h3>
                      <p className="text-sm text-gray-500">
                        The heart of your space, focused on member experience and community building.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">General Manager</h3>
                      <p className="text-sm text-gray-500">
                        Oversees all operations, revenue growth, and team management.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">Operations Director</h3>
                      <p className="text-sm text-gray-500">
                        Ensures smooth day-to-day operations and process optimization.
                      </p>
                    </div>
                    <div className="rounded-lg border bg-white p-4">
                      <h3 className="font-bold">Sales Manager</h3>
                      <p className="text-sm text-gray-500">Drives membership growth and retention strategies.</p>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Contact & Score */}
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h2 className="text-xl font-bold">Contact This Space</h2>
                <ContactForm />
              </CardContent>
            </Card>

            <DigitalScoreWidget score={digitalScore} detailed />

            <Card>
              <CardContent className="p-6">
                <h2 className="text-lg font-bold">Reviews</h2>
                <div className="mt-2 flex items-center">
                  <Star className="mr-1 h-5 w-5 fill-gold text-gold" />
                  <span className="text-lg font-bold">{rating}</span>
                  <span className="ml-1 text-sm text-gray-500">({Math.floor(10 + id * 3)} reviews)</span>
                </div>
                <Separator className="my-4" />
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">
                          {["John D.", "Sarah M.", "Michael L.", "Emma W.", "David K."][i % 5]}
                        </div>
                        <div className="flex">
                          {[...Array(5)].map((_, j) => (
                            <Star
                              key={j}
                              className={`h-4 w-4 ${j < 4 + (i % 2) ? "fill-gold text-gold" : "text-gray-300"}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600">
                        {
                          [
                            "Great space with excellent amenities. The community is very welcoming.",
                            "Perfect location and the staff is incredibly helpful. Highly recommend!",
                            "Love the atmosphere and the coffee is amazing. Fast internet too!",
                          ][i % 3]
                        }
                      </p>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" className="w-full">
                    Read All Reviews
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
