import { Suspense } from "react"
import { Filter, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { WorkspaceSearch } from "@/components/workspace/WorkspaceSearch"
import { WorkspaceFilters } from "@/components/workspace/WorkspaceFilters"
import { WorkspaceGrid } from "@/components/workspace/WorkspaceGrid"
import DirectoryLoading from "./loading"

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
            <WorkspaceSearch />
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
              <WorkspaceFilters />
            </div>

            {/* Results */}
            <div className="md:col-span-3">
              <TabsContent value="grid" className="mt-0">
                <Suspense fallback={<DirectoryLoading />}>
                  <WorkspaceGrid />
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

            </div>
          </div>
        </Tabs>
      </div>

    </div>
  )
}
