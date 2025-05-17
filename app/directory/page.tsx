import { Search, Filter, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import SpaceCard from "@/components/space-card"
import Link from "next/link"
import { Suspense } from "react"
import DirectoryLoading from "./loading"
import { getWorkspaces } from "@/lib/mock-data"

export default function DirectoryPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-black py-12 text-white">
        <div className="container px-4 md:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Find Your Perfect Workspace</h1>
            <p className="mt-4 text-gray-300">Browse through thousands of verified coworking spaces worldwide.</p>
          </div>
          <div className="mx-auto mt-8 max-w-xl">
            <div className="flex w-full items-center space-x-2 rounded-lg bg-white p-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="City, neighborhood, or space name"
                  className="w-full border-0 bg-transparent pl-8 shadow-none focus-visible:ring-0"
                />
              </div>
              <Button type="submit">Search</Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="outline" className="bg-midnight/20 text-white hover:bg-midnight/30">
                <MapPin className="mr-1 h-3 w-3" /> New York
              </Badge>
              <Badge variant="outline" className="bg-midnight/20 text-white hover:bg-midnight/30">
                <MapPin className="mr-1 h-3 w-3" /> London
              </Badge>
              <Badge variant="outline" className="bg-midnight/20 text-white hover:bg-midnight/30">
                <MapPin className="mr-1 h-3 w-3" /> Berlin
              </Badge>
              <Badge variant="outline" className="bg-midnight/20 text-white hover:bg-midnight/30">
                <MapPin className="mr-1 h-3 w-3" /> Singapore
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 py-8 md:px-6 md:py-12">
        <Tabs defaultValue="grid">
          <div className="flex flex-col-reverse items-start justify-between gap-4 md:flex-row md:items-center">
            <TabsList className="h-9 w-full md:w-auto">
              <TabsTrigger value="grid" className="flex-1 md:flex-initial">
                Grid View
              </TabsTrigger>
              <TabsTrigger value="map" className="flex-1 md:flex-initial">
                Map View
              </TabsTrigger>
            </TabsList>
            <div className="flex w-full flex-col items-start gap-4 md:w-auto md:flex-row md:items-center">
              <div className="flex w-full items-center justify-between md:w-auto">
                <div>
                  <h2 className="text-xl font-bold">48 Spaces Found</h2>
                  <p className="text-sm text-gray-500">Showing 1-12 of 48 results</p>
                </div>
                <Button variant="outline" size="icon" className="md:hidden">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex w-full items-center space-x-2 md:w-auto">
                <Select defaultValue="relevance">
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="relevance">Relevance</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                    <SelectItem value="rating">Rating</SelectItem>
                    <SelectItem value="digital-score">Digital Score</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-4">
            {/* Filters Sidebar */}
            <div className="hidden md:block">
              <div className="sticky top-20 rounded-lg border-2 border-black bg-white p-4 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold">Filters</h2>
                  <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                    Reset
                  </Button>
                </div>
                <Separator className="my-4" />
                <Accordion type="multiple" defaultValue={["price", "amenities", "type"]}>
                  <AccordionItem value="price">
                    <AccordionTrigger>Price Range</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <Slider defaultValue={[250]} max={1000} step={10} />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">$0</span>
                          <span className="text-sm font-medium">$250</span>
                          <span className="text-sm text-gray-500">$1000+</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="amenities">
                    <AccordionTrigger>Amenities</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="wifi" />
                          <label
                            htmlFor="wifi"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            High-Speed WiFi
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="meeting-rooms" />
                          <label
                            htmlFor="meeting-rooms"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Meeting Rooms
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="24-7" />
                          <label
                            htmlFor="24-7"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            24/7 Access
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="coffee" />
                          <label
                            htmlFor="coffee"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Coffee Bar
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="events" />
                          <label
                            htmlFor="events"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Event Space
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="childcare" />
                          <label
                            htmlFor="childcare"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Childcare
                          </label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="type">
                    <AccordionTrigger>Space Type</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="hot-desk" />
                          <label
                            htmlFor="hot-desk"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Hot Desk
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="dedicated-desk" />
                          <label
                            htmlFor="dedicated-desk"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Dedicated Desk
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="private-office" />
                          <label
                            htmlFor="private-office"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Private Office
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="meeting-room" />
                          <label
                            htmlFor="meeting-room"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Meeting Room
                          </label>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="digital-score">
                    <AccordionTrigger>Digital Score</AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-4">
                        <Slider defaultValue={[70]} max={100} step={5} />
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">0</span>
                          <span className="text-sm font-medium">70+</span>
                          <span className="text-sm text-gray-500">100</span>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
                <Separator className="my-4" />
                <Button className="w-full bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
                  Apply Filters
                </Button>
              </div>
            </div>

            {/* Results */}
            <div className="md:col-span-3">
              <TabsContent value="grid" className="mt-0">
                <Suspense fallback={<DirectoryLoading />}>
                  <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {/* Get workspaces from our mock data generator */}
                    {getWorkspaces(12).map((workspace) => (
                      <SpaceCard key={workspace.id} id={workspace.id} workspace={workspace} />
                    ))}
                  </div>
                </Suspense>
              </TabsContent>

              <TabsContent value="map" className="mt-0">
                <div className="rounded-lg border-2 border-black overflow-hidden shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] h-[600px] bg-white">
                  <div className="h-full w-full bg-gray-100 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                      <h3 className="text-lg font-bold">Map View</h3>
                      <p className="text-sm text-gray-500">Interactive map coming soon</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <div className="mt-8 flex justify-center">
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="icon" disabled>
                    &lt;
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8 bg-[#f9cb16] border-black">
                    1
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    2
                  </Button>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    3
                  </Button>
                  <span>...</span>
                  <Button variant="outline" size="sm" className="h-8 w-8">
                    10
                  </Button>
                  <Button variant="outline" size="icon">
                    &gt;
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Tabs>
      </div>

      {/* Admin Action Button (only visible to admins) */}
      <div className="fixed bottom-6 right-6">
        <Link href="/admin/spaces">
          <Button className="bg-black text-white border-2 border-black shadow-[3px_3px_0px_0px_rgba(249,203,22,1)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none">
            Manage Listings
          </Button>
        </Link>
      </div>
    </div>
  )
}
