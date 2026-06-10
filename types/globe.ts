import { type WorkspaceLocation } from "@/lib/mock-data"

// Globe interaction event types
export interface GlobePointerEvent {
  clientX: number
  clientY: number
}

export interface GlobeMouseEvent extends MouseEvent {
  clientX: number
  clientY: number
}

export interface GlobeTouchEvent extends TouchEvent {
  touches: TouchList
}

// COBE Globe types
export interface COBEGlobeState {
  phi: number
  theta: number
  width: number
  height: number
  devicePixelRatio: number
  dark: number
  diffuse: number
  mapSamples: number
  mapBrightness: number
  baseColor: [number, number, number]
  markerColor: [number, number, number]
  glowColor: [number, number, number]
  markers: GlobeMarker[]
}

export interface COBEGlobeInstance {
  destroy: () => void
  [key: string]: unknown
}

// Globe state and configuration types  
export interface GlobeState {
  phi: number
  width: number
  height: number
}

export interface GlobeMarker {
  location: [number, number]
  size: number
}

// Location card props
export interface LocationCardProps {
  location: WorkspaceLocation
  onClose: () => void
}

// Globe interaction hooks
export interface UseGlobeInteractionReturn {
  pointerInteracting: React.MutableRefObject<number | null>
  pointerInteractionMovement: React.MutableRefObject<number>
  r: number
  isHovering: boolean
  updatePointerInteraction: (value: number | null) => void
  updateMovement: (clientX: number) => void
  setIsHovering: (hovering: boolean) => void
}