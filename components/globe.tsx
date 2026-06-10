"use client"

import { useState } from "react"
import { type WorkspaceLocation } from "@/lib/mock-data"
import { GlobeCanvas } from "./globe/GlobeCanvas"
import { LocationCard } from "./globe/LocationCard"
import { ErrorBoundary } from "./ErrorBoundary"

export default function Globe() {
  const [selectedLocation, setSelectedLocation] = useState<WorkspaceLocation | null>(null)

  const handleLocationClick = (location: WorkspaceLocation | null) => {
    setSelectedLocation(location)
  }

  const handleCloseLocationCard = () => {
    setSelectedLocation(null)
  }

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-visible">
      <ErrorBoundary
        fallback={
          <div className="flex items-center justify-center p-8 text-center">
            <div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">Globe Unavailable</h3>
              <p className="text-gray-500 text-sm">Unable to load the interactive globe. Please try refreshing the page.</p>
            </div>
          </div>
        }
      >
        <GlobeCanvas onLocationClick={handleLocationClick} />
      </ErrorBoundary>
      {selectedLocation && (
        <LocationCard location={selectedLocation} onClose={handleCloseLocationCard} />
      )}
    </div>
  )
}