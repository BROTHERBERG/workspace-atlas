"use client"

import { X } from "lucide-react"
import type { WorkspaceLocation } from "./globe"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

interface LocationCardProps {
  location: WorkspaceLocation
  onClose: () => void
}

export function LocationCard({ location, onClose }: LocationCardProps) {
  return (
    <Card className="w-full max-w-md bg-black/80 backdrop-blur-md border-[#f9cb16]/20 text-white animate-in fade-in slide-in-from-bottom-5 duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-2xl text-[#f9cb16]">{location.name}</CardTitle>
            <CardDescription className="text-gray-300">{location.spaces} coworking spaces available</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-gray-300">{location.description}</p>
      </CardContent>
      <CardFooter>
        <Button className="w-full bg-[#f9cb16] hover:bg-[#f9cb16] text-black">View Spaces in {location.name}</Button>
      </CardFooter>
    </Card>
  )
}
