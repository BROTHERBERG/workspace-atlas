import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ArrowLeft, Building, ImageIcon, MapPin, Save, Star, Trash2 } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default async function EditSpacePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const isNew = id === "new"
  const title = isNew ? "Add New Space" : "Edit Space"

  // Mock data for existing space (would be fetched from API in real app)
  const space = isNew
    ? {
        name: "",
        description: "",
        location: "",
        address: "",
        website: "",
        phone: "",
        email: "",
        amenities: [] as string[],
        featured: false,
        verified: false,
        status: "draft",
        digitalScore: 0,
        images: [],
      }
    : {
        id: Number.parseInt(id),
        name: `Workspace ${id}`,
        description: "A premium coworking environment designed for productivity and collaboration.",
        location: "New York, USA",
        address: "123 Workspace Street, New York, NY 10001",
        website: "https://example.com",
        phone: "+1 (234) 567-890",
        email: "info@workspace.com",
        amenities: ["High-Speed Wifi", "Coffee Bar", "24/7 Access", "Meeting Rooms"],
        featured: Number.parseInt(id) % 5 === 0,
        verified: Number.parseInt(id) % 3 === 0 || Number.parseInt(id) % 7 === 0,
        status: ["active", "pending", "draft"][Number.parseInt(id) % 3],
        digitalScore: Math.floor(70 + Math.random() * 25),
        images: [
          `/placeholder.svg?height=600&width=1000&query=modern coworking space interior ${id}`,
          `/placeholder.svg?height=300&width=500&query=coworking meeting room ${id}`,
          `/placeholder.svg?height=300&width=500&query=coworking lounge area ${id}`,
        ],
      }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/spaces">
            <Button variant="outline" size="icon" className="h-8 w-8 border-2 border-black">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-cal">{title}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="border-2 border-black">
            Preview
          </Button>
          <Button className="bg-black text-white border-2 border-black shadow-brutalist-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            <Save className="mr-2 h-4 w-4" /> Save Space
          </Button>
        </div>
      </div>

      <Tabs defaultValue="details">
        <TabsList className="w-full border-b border-gray-200 bg-transparent p-0">
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-black data-[state=active]:bg-transparent"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="images"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-black data-[state=active]:bg-transparent"
          >
            Images
          </TabsTrigger>
          <TabsTrigger
            value="amenities"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-black data-[state=active]:bg-transparent"
          >
            Amenities
          </TabsTrigger>
          <TabsTrigger
            value="pricing"
            className="rounded-none border-b-2 border-transparent px-4 py-2 data-[state=active]:border-black data-[state=active]:bg-transparent"
          >
            Pricing
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="pt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-2 border-black shadow-brutalist">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" /> Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Space Name</Label>
                  <Input id="name" defaultValue={space.name} className="border-2 border-black" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    defaultValue={space.description}
                    rows={5}
                    className="border-2 border-black"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select defaultValue={space.status}>
                    <SelectTrigger className="border-2 border-black">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-4 sm:flex-row">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="featured" defaultChecked={space.featured} />
                    <Label
                      htmlFor="featured"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Featured Space
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="verified" defaultChecked={space.verified} />
                    <Label
                      htmlFor="verified"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Verified Space
                    </Label>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-2 border-black shadow-brutalist">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" /> Location & Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location (City, Country)</Label>
                  <Input id="location" defaultValue={space.location} className="border-2 border-black" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Full Address</Label>
                  <Textarea id="address" defaultValue={space.address} className="border-2 border-black" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue={space.website} className="border-2 border-black" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" defaultValue={space.phone} className="border-2 border-black" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue={space.email} className="border-2 border-black" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="images" className="pt-6">
          <Card className="border-2 border-black shadow-brutalist">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" /> Space Images
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-6">
                <div className="flex items-center justify-center w-full">
                  <label
                    htmlFor="dropzone-file"
                    className="flex flex-col items-center justify-center w-full h-64 border-2 border-black border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                  >
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <ImageIcon className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500">SVG, PNG, JPG or GIF (MAX. 2MB)</p>
                    </div>
                    <input id="dropzone-file" type="file" className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {space.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="relative aspect-video overflow-hidden rounded-lg border-2 border-black">
                      <Image
                        src={image || "/placeholder.svg"}
                        alt={`Space image ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all"></div>
                    </div>
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-white text-red-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {index === 0 && (
                      <Badge className="absolute top-2 left-2 bg-yellow text-black">Main Image</Badge>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="amenities" className="pt-6">
          <Card className="border-2 border-black shadow-brutalist">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" /> Amenities & Features
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                {[
                  "High-Speed Wifi",
                  "Coffee Bar",
                  "24/7 Access",
                  "Meeting Rooms",
                  "Event Space",
                  "Quiet Zones",
                  "Phone Booths",
                  "Printing Services",
                  "Kitchen",
                  "Bike Storage",
                  "Showers",
                  "Parking",
                  "Mail Handling",
                  "Childcare",
                  "Pet Friendly",
                ].map((amenity) => (
                  <div key={amenity} className="flex items-center space-x-2">
                    <Checkbox
                      id={`amenity-${amenity.toLowerCase().replace(/\s+/g, "-")}`}
                      defaultChecked={space.amenities.includes(amenity)}
                    />
                    <Label
                      htmlFor={`amenity-${amenity.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {amenity}
                    </Label>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pricing" className="pt-6">
          <Card className="border-2 border-black shadow-brutalist">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" /> Pricing Options
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {["Hot Desk", "Dedicated Desk", "Private Office", "Meeting Room"].map((type, index) => (
                  <div key={type} className="rounded-lg border-2 border-black p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-cal">{type}</h3>
                      <div className="flex items-center space-x-2">
                        <Checkbox id={`active-${type.toLowerCase().replace(/\s+/g, "-")}`} defaultChecked={true} />
                        <Label
                          htmlFor={`active-${type.toLowerCase().replace(/\s+/g, "-")}`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Active
                        </Label>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor={`price-${index}`}>Price ($/month)</Label>
                        <Input
                          id={`price-${index}`}
                          type="number"
                          defaultValue={(150 + index * 100).toString()}
                          className="border-2 border-black"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor={`capacity-${index}`}>Capacity/Quantity</Label>
                        <Input
                          id={`capacity-${index}`}
                          type="number"
                          defaultValue={(10 - index * 2).toString()}
                          className="border-2 border-black"
                        />
                      </div>
                    </div>
                    <div className="mt-4 space-y-2">
                      <Label htmlFor={`description-${index}`}>Description</Label>
                      <Textarea
                        id={`description-${index}`}
                        defaultValue={`${type} with all amenities included.`}
                        className="border-2 border-black"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter className="flex justify-between border-t p-6">
              <Button variant="outline" className="border-2 border-black">
                Cancel
              </Button>
              <Button className="bg-black text-white border-2 border-black shadow-brutalist-yellow hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                <Save className="mr-2 h-4 w-4" /> Save Pricing
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
