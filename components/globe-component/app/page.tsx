"use client"

import { useState } from "react"
import { Globe, type WorkspaceLocation } from "@/components/globe"
import { LocationCard } from "@/components/location-card"

export default function Home() {
  const [selectedLocation, setSelectedLocation] = useState<WorkspaceLocation | null>(null)

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-0 relative bg-black overflow-hidden">
      <div className="relative w-full h-screen flex items-center justify-center">
        <div className="absolute inset-0 bg-black z-0"></div>

        {/* Globe with interactive markers */}
        <div className="relative w-full h-full max-w-[1200px] max-h-[1200px]">
          <Globe className="opacity-90" onLocationSelect={setSelectedLocation} />
          <div className="absolute inset-0 bg-gradient-radial from-transparent to-black z-10 pointer-events-none"></div>
        </div>

        {/* Location information card */}
        {selectedLocation && (
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-md px-4">
            <LocationCard location={selectedLocation} onClose={() => setSelectedLocation(null)} />
          </div>
        )}
      </div>
    </main>
  )
}
