"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"

export default function HeroAnimation() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions
    const setCanvasDimensions = () => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    setCanvasDimensions()
    window.addEventListener("resize", setCanvasDimensions)

    // Animation variables
    let animationFrameId: number
    const circles: Circle[] = []
    const numCircles = 5

    // Create circles
    for (let i = 0; i < numCircles; i++) {
      circles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: 5 + Math.random() * 20,
        dx: (Math.random() - 0.5) * 2,
        dy: (Math.random() - 0.5) * 2,
        color: "#FACC15",
      })
    }

    // Animation function
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw hand-drawn style circle in the center
      ctx.save()
      ctx.beginPath()
      const centerX = canvas.width / 2 / (window.devicePixelRatio || 1)
      const centerY = canvas.height / 2 / (window.devicePixelRatio || 1)
      const radius = 80

      // Draw slightly wobbly circle
      ctx.beginPath()
      for (let i = 0; i < 360; i++) {
        const angle = (i * Math.PI) / 180
        const wobble = Math.random() * 2 - 1
        const x = centerX + (radius + wobble) * Math.cos(angle)
        const y = centerY + (radius + wobble) * Math.sin(angle)

        if (i === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.closePath()
      ctx.fillStyle = "#FACC15"
      ctx.fill()
      ctx.lineWidth = 3
      ctx.strokeStyle = "#000000"
      ctx.stroke()

      // Draw "W" for Workspace Atlas
      ctx.font = "bold 80px Cal Sans, sans-serif"
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "#000000"
      ctx.fillText("W", centerX, centerY)

      // Draw moving circles
      circles.forEach((circle) => {
        // Update position
        circle.x += circle.dx
        circle.y += circle.dy

        // Bounce off walls
        if (circle.x + circle.radius > canvas.width / (window.devicePixelRatio || 1) || circle.x - circle.radius < 0) {
          circle.dx = -circle.dx
        }
        if (circle.y + circle.radius > canvas.height / (window.devicePixelRatio || 1) || circle.y - circle.radius < 0) {
          circle.dy = -circle.dy
        }

        // Draw circle
        ctx.beginPath()
        ctx.arc(circle.x, circle.y, circle.radius, 0, Math.PI * 2)
        ctx.fillStyle = circle.color
        ctx.fill()
        ctx.lineWidth = 2
        ctx.strokeStyle = "#000000"
        ctx.stroke()
      })

      // Draw hand-drawn elements
      drawHandDrawnElements(ctx, canvas)

      animationFrameId = requestAnimationFrame(animate)
    }

    // Draw hand-drawn decorative elements
    const drawHandDrawnElements = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
      const width = canvas.width / (window.devicePixelRatio || 1)
      const height = canvas.height / (window.devicePixelRatio || 1)

      // Draw squiggly lines
      ctx.beginPath()
      ctx.moveTo(width * 0.1, height * 0.2)

      // Wavy line
      for (let i = 0; i < 10; i++) {
        const x = width * (0.1 + i * 0.08)
        const y = height * (0.2 + (i % 2 === 0 ? 0.05 : -0.05))
        ctx.lineTo(x, y)
      }

      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw another squiggly line
      ctx.beginPath()
      ctx.moveTo(width * 0.7, height * 0.8)

      // Wavy line
      for (let i = 0; i < 10; i++) {
        const x = width * (0.7 - i * 0.06)
        const y = height * (0.8 + (i % 2 === 0 ? 0.04 : -0.04))
        ctx.lineTo(x, y)
      }

      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw stars
      drawStar(ctx, width * 0.15, height * 0.85, 5, 10, 5)
      drawStar(ctx, width * 0.85, height * 0.15, 5, 10, 5)
    }

    // Function to draw a star
    const drawStar = (
      ctx: CanvasRenderingContext2D,
      cx: number,
      cy: number,
      spikes: number,
      outerRadius: number,
      innerRadius: number,
    ) => {
      let rot = (Math.PI / 2) * 3
      let x = cx
      let y = cy
      const step = Math.PI / spikes

      ctx.beginPath()
      ctx.moveTo(cx, cy - outerRadius)

      for (let i = 0; i < spikes; i++) {
        x = cx + Math.cos(rot) * outerRadius
        y = cy + Math.sin(rot) * outerRadius
        ctx.lineTo(x, y)
        rot += step

        x = cx + Math.cos(rot) * innerRadius
        y = cy + Math.sin(rot) * innerRadius
        ctx.lineTo(x, y)
        rot += step
      }

      ctx.lineTo(cx, cy - outerRadius)
      ctx.closePath()
      ctx.fillStyle = "#FACC15"
      ctx.fill()
      ctx.strokeStyle = "#000000"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    // Start animation
    animate()

    // Cleanup
    return () => {
      window.removeEventListener("resize", setCanvasDimensions)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div className="relative w-full h-[400px] max-w-[500px]">
      {/* Decorative elements */}
      <div className="absolute -top-10 -left-10 w-20 h-20 rotate-12">
        <Image src="/images/hand-drawn-circle.png" alt="Decorative circle" width={80} height={80} />
      </div>

      <div className="absolute -bottom-5 -right-5 w-16 h-16 -rotate-12">
        <Image src="/images/hand-drawn-arrow.png" alt="Decorative arrow" width={64} height={64} />
      </div>

      {/* Main canvas for animation */}
      <div className="relative w-full h-full shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] border-2 border-black rounded-lg overflow-hidden">
        <canvas ref={canvasRef} className="w-full h-full bg-white" />
      </div>
    </div>
  )
}

// Types
interface Circle {
  x: number
  y: number
  radius: number
  dx: number
  dy: number
  color: string
}
