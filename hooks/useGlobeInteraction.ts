import { useRef, useState } from "react"
import type { UseGlobeInteractionReturn } from "@/types/globe"

export function useGlobeInteraction(): UseGlobeInteractionReturn {
  const pointerInteracting = useRef<number | null>(null)
  const pointerInteractionMovement = useRef(0)
  const [r, setR] = useState(0)
  const [isHovering, setIsHovering] = useState(false)

  const updatePointerInteraction = (value: number | null) => {
    pointerInteracting.current = value
  }

  const updateMovement = (clientX: number) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current
      pointerInteractionMovement.current = delta
      setR(delta / 200)
    }
  }

  return {
    pointerInteracting,
    pointerInteractionMovement,
    r,
    isHovering,
    updatePointerInteraction,
    updateMovement,
    setIsHovering,
  }
}