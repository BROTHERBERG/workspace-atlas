"use client"

import type React from "react"

import { useCallback, useEffect, useRef, useState } from "react"
import createGlobe, { type COBEOptions } from "cobe"

import { cn } from "@/lib/utils"

// Workspace data with city information
export interface WorkspaceLocation {
  id: string
  name: string
  location: [number, number] // latitude, longitude
  size: number
  spaces: number
  description: string
}

export const WORKSPACE_LOCATIONS: WorkspaceLocation[] = [
  {
    id: "nyc",
    name: "New York",
    location: [40.7128, -74.006],
    size: 0.1,
    spaces: 247,
    description: "The largest hub for tech startups and creative agencies in the US.",
  },
  {
    id: "la",
    name: "Los Angeles",
    location: [34.0522, -118.2437],
    size: 0.1,
    spaces: 183,
    description: "Home to entertainment industry professionals and digital creators.",
  },
  {
    id: "london",
    name: "London",
    location: [51.5074, -0.1278],
    size: 0.1,
    spaces: 312,
    description: "Europe's financial center with a thriving tech ecosystem.",
  },
  {
    id: "paris",
    name: "Paris",
    location: [48.8566, 2.3522],
    size: 0.1,
    spaces: 156,
    description: "A blend of historic charm and modern innovation spaces.",
  },
  {
    id: "berlin",
    name: "Berlin",
    location: [52.52, 13.405],
    size: 0.08,
    spaces: 128,
    description: "Known for affordable spaces and a vibrant startup culture.",
  },
  {
    id: "tokyo",
    name: "Tokyo",
    location: [35.6762, 139.6503],
    size: 0.09,
    spaces: 201,
    description: "High-tech facilities catering to both local and international businesses.",
  },
  {
    id: "singapore",
    name: "Singapore",
    location: [1.3521, 103.8198],
    size: 0.07,
    spaces: 94,
    description: "A gateway to Asian markets with world-class infrastructure.",
  },
  {
    id: "sydney",
    name: "Sydney",
    location: [-33.8688, 151.2093],
    size: 0.08,
    spaces: 87,
    description: "Beachside workspaces with strong connections to Asian markets.",
  },
  {
    id: "mexico-city",
    name: "Mexico City",
    location: [19.4326, -99.1332],
    size: 0.08,
    spaces: 76,
    description: "Emerging as a major hub for Latin American entrepreneurs.",
  },
  {
    id: "sao-paulo",
    name: "São Paulo",
    location: [-23.5505, -46.6333],
    size: 0.09,
    spaces: 112,
    description: "Brazil's economic center with a growing tech presence.",
  },
  {
    id: "moscow",
    name: "Moscow",
    location: [55.7558, 37.6173],
    size: 0.08,
    spaces: 68,
    description: "Modern facilities in one of the world's largest urban economies.",
  },
  {
    id: "dubai",
    name: "Dubai",
    location: [25.2048, 55.2708],
    size: 0.07,
    spaces: 103,
    description: "Luxury workspaces in a global business and travel hub.",
  },
]

// Convert workspace locations to cobe markers
const workspaceMarkers = WORKSPACE_LOCATIONS.map((location) => ({
  location: location.location,
  size: location.size,
}))

const GLOBE_CONFIG: COBEOptions = {
  width: 800,
  height: 800,
  onRender: () => {},
  devicePixelRatio: 2,
  phi: 0,
  theta: 0.3,
  dark: 1,
  diffuse: 0.3,
  mapSamples: 16000,
  mapBrightness: 6,
  baseColor: [0.122, 0.122, 0.122], // #1f1f1f - Universal black tone
  markerColor: [249 / 255, 203 / 255, 22 / 255], // #f9cb16
  glowColor: [0.8, 0.8, 0.8],
  markers: workspaceMarkers,
}

export function Globe({
  className,
  config = GLOBE_CONFIG,
  onLocationSelect,
}: {
  className?: string
  config?: COBEOptions
  onLocationSelect?: (location: WorkspaceLocation | null) => void
}) {
  let phi = 0
  let width = 0
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pointerInteracting = useRef(null)
  const pointerInteractionMovement = useRef(0)
  const [r, setR] = useState(0)
  const globeRef = useRef<any>(null)

  const updatePointerInteraction = (value: any) => {
    pointerInteracting.current = value
    if (canvasRef.current) {
      canvasRef.current.style.cursor = value ? "grabbing" : "grab"
    }
  }

  const updateMovement = (clientX: any) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      setR(delta / 200)
    }
  }

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) phi += 0.003
      state.phi = phi + r
      state.width = width * 2
      state.height = width * 2
    },
    [r],
  )

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth
    }
  }

  // Function to find the closest marker to a click
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || pointerInteracting.current !== null) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to normalized coordinates (-1 to 1)
    const normX = (x / rect.width) * 2 - 1
    const normY = -((y / rect.height) * 2 - 1)

    // Current rotation of the globe
    const currentPhi = phi + r

    // Find the closest marker
    let closestLocation: WorkspaceLocation | null = null
    let closestDistance = Number.POSITIVE_INFINITY

    WORKSPACE_LOCATIONS.forEach((location) => {
      // Convert lat/long to 3D coordinates
      const lat = location.location[0] * (Math.PI / 180)
      const lon = location.location[1] * (Math.PI / 180)

      // Adjust for current rotation
      const adjustedLon = lon + currentPhi

      // Convert to Cartesian coordinates
      const x = Math.cos(lat) * Math.sin(adjustedLon)
      const y = Math.sin(lat)
      const z = Math.cos(lat) * Math.cos(adjustedLon)

      // If point is on the visible hemisphere (z > 0)
      if (z > 0) {
        // Project 3D point to 2D screen
        const projX = x / (z + 1)
        const projY = y / (z + 1)

        // Calculate distance to click
        const distance = Math.sqrt(Math.pow(projX - normX, 2) + Math.pow(projY - normY, 2))

        // Check if this is the closest marker and within a reasonable distance
        if (distance < closestDistance && distance < 0.2) {
          closestDistance = distance
          closestLocation = location
        }
      }
    })

    // Call the callback with the selected location
    if (onLocationSelect) {
      onLocationSelect(closestLocation)
    }
  }

  useEffect(() => {
    window.addEventListener("resize", onResize)
    onResize()

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      width: width * 2,
      height: width * 2,
      onRender,
    })

    globeRef.current = globe

    setTimeout(() => {
      if (canvasRef.current) {
        canvasRef.current.style.opacity = "1"
      }
    }, 100)

    return () => {
      window.removeEventListener("resize", onResize)
      globe.destroy()
    }
  }, [config, onRender])

  return (
    <div className={cn("absolute inset-0 mx-auto aspect-[1/1] w-full max-w-[800px]", className)}>
      <canvas
        className={cn("size-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]")}
        ref={canvasRef}
        onClick={handleCanvasClick}
        onPointerDown={(e) => updatePointerInteraction(e.clientX - pointerInteractionMovement.current)}
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) => e.touches[0] && updateMovement(e.touches[0].clientX)}
      />
    </div>
  )
}
