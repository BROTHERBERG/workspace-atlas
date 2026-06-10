"use client"

import { useCallback, useEffect, useRef } from "react"
import createGlobe, { type COBEOptions } from "cobe"
import { WORKSPACE_LOCATIONS, type WorkspaceLocation } from "@/lib/mock-data"
import { useGlobeInteraction } from "@/hooks/useGlobeInteraction"
import { logger } from "@/lib/logger"
import type { GlobeMarker, COBEGlobeState, COBEGlobeInstance } from "@/types/globe"

interface GlobeCanvasProps {
  onLocationClick: (location: WorkspaceLocation | null) => void
}

// Convert workspace locations to cobe markers
const workspaceMarkers: GlobeMarker[] = WORKSPACE_LOCATIONS.map((location) => ({
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
  diffuse: 3,
  mapSamples: 16000,
  mapBrightness: 8,
  baseColor: [0.15, 0.15, 0.15], // Slightly lighter base
  markerColor: [249 / 255, 203 / 255, 22 / 255], // Universal yellow #f9cb16
  glowColor: [0.4, 0.4, 0.4], // Softer glow
  markers: workspaceMarkers,
}

export function GlobeCanvas({ onLocationClick }: GlobeCanvasProps) {
  const phiRef = useRef(0)
  const widthRef = useRef(0)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const globeRef = useRef<COBEGlobeInstance | null>(null)

  const {
    pointerInteracting,
    pointerInteractionMovement,
    r,
    isHovering,
    updatePointerInteraction,
    updateMovement,
    setIsHovering,
  } = useGlobeInteraction()

  const onRender = useCallback(
    (state: any) => {
      // Only rotate when not interacting with the globe
      if (!pointerInteracting.current && !isHovering) phiRef.current += 0.003
      state.phi = phiRef.current + r
      state.width = widthRef.current * 2
      state.height = widthRef.current * 2
    },
    [r, isHovering, pointerInteracting],
  )

  const onResize = useCallback(() => {
    if (canvasRef.current) {
      widthRef.current = canvasRef.current.offsetWidth
    }
  }, [])

  // Function to find the closest marker to a click
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || pointerInteracting.current !== null) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Convert to normalized coordinates (-1 to 1)
    const normX = (x / rect.width) * 2 - 1
    const normY = -((y / rect.height) * 2 - 1)

    // Current rotation of the globe
    const currentPhi = phiRef.current + r

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
        if (distance < closestDistance && distance < 0.15) {
          closestDistance = distance
          closestLocation = location
        }
      }
    })

    // Set the selected location for popup
    onLocationClick(closestLocation)
  }, [r, onLocationClick, pointerInteracting])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointerInteraction(e.clientX - pointerInteractionMovement.current)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grabbing"
    }
  }, [updatePointerInteraction, pointerInteractionMovement])

  const handlePointerUp = useCallback(() => {
    updatePointerInteraction(null)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab"
    }
  }, [updatePointerInteraction])

  const handlePointerOut = useCallback(() => {
    updatePointerInteraction(null)
    setIsHovering(false)
    if (canvasRef.current) {
      canvasRef.current.style.cursor = "grab"
    }
  }, [updatePointerInteraction, setIsHovering])

  const handlePointerOver = useCallback(() => {
    setIsHovering(true)
  }, [setIsHovering])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    updateMovement(e.clientX)
  }, [updateMovement])

  const handleTouchMove = useCallback((e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches[0]) {
      updateMovement(e.touches[0].clientX)
    }
  }, [updateMovement])

  useEffect(() => {
    if (!canvasRef.current) return

    let globe: any = null
    
    try {
      window.addEventListener("resize", onResize)
      onResize()

      globe = createGlobe(canvasRef.current, {
        ...GLOBE_CONFIG,
        width: widthRef.current * 2,
        height: widthRef.current * 2,
        onRender,
      })

      globeRef.current = globe

      setTimeout(() => {
        if (canvasRef.current) {
          canvasRef.current.style.opacity = "1"
        }
      }, 100)
    } catch (error) {
      logger.error("Failed to create globe", error instanceof Error ? error : new Error(String(error)))
      // Could emit an error event or show error state here
    }

    return () => {
      window.removeEventListener("resize", onResize)
      if (globe) {
        try {
          globe.destroy()
        } catch (error) {
          logger.error("Failed to destroy globe", error instanceof Error ? error : new Error(String(error)))
        }
      }
    }
  }, [onRender, onResize])

  return (
    <canvas
      className="opacity-0 transition-opacity duration-500"
      ref={canvasRef}
      onClick={handleCanvasClick}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerOut={handlePointerOut}
      onPointerOver={handlePointerOver}
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
      style={{
        width: "100%",
        height: "100%",
        maxWidth: "500px",
        minHeight: "400px",
        aspectRatio: "1/1",
        background: "transparent",
        cursor: "grab",
      }}
    />
  )
}