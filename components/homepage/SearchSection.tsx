import { Search, MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

const POPULAR_CITIES = [
  { name: "New York", icon: MapPin },
  { name: "London", icon: MapPin },
  { name: "Berlin", icon: MapPin },
  { name: "Singapore", icon: MapPin },
  { name: "Tokyo", icon: MapPin },
  { name: "Paris", icon: MapPin },
  { name: "San Francisco", icon: MapPin },
  { name: "Amsterdam", icon: MapPin },
  { name: "Dubai", icon: MapPin },
  { name: "Sydney", icon: MapPin },
]

export function SearchSection() {
  return (
    <>
      {/* Wavy Divider */}
      <div className="w-full bg-black">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 120" preserveAspectRatio="none" className="w-full h-24">
          <path fill="#ffffff" d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
        </svg>
      </div>

      {/* Search Section */}
      <section className="w-full py-12 md:py-16 lg:py-20 bg-white">
        <div className="container px-4 md:px-6">
          <div className="mx-auto flex w-full max-w-[800px] flex-col items-center space-y-8">
            <div className="space-y-4 text-center">
              <h2 className="font-cal text-3xl tracking-tighter sm:text-4xl md:text-5xl">Find Your Perfect Space</h2>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl mt-6">
                Search through thousands of verified coworking spaces worldwide.
              </p>
            </div>
            <div className="w-full max-w-sm space-y-4 md:max-w-md lg:max-w-lg mt-8">
              <form className="flex w-full max-w-lg items-center space-x-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                  <Input
                    type="search"
                    placeholder="City, neighborhood, or space name"
                    className="w-full bg-white pl-8 input-animated-border"
                  />
                </div>
                <Button type="submit" className="bg-black text-white hover:bg-black/90 btn-press">
                  Search
                </Button>
              </form>
              <div className="flex flex-wrap justify-center gap-2 pt-2">
                {POPULAR_CITIES.map((city) => (
                  <Badge key={city.name} variant="outline" className="bg-white hover:bg-gray-100 border-black cursor-pointer">
                    <city.icon className="mr-1 h-3 w-3" /> {city.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}