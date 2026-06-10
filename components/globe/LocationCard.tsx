import { X } from "lucide-react"
import type { LocationCardProps } from "@/types/globe"

export function LocationCard({ location, onClose }: LocationCardProps) {
  return (
    <div className="absolute bottom-4 left-0 right-0 mx-auto w-full max-w-md p-4 z-10">
      <div className="w-full bg-black/80 backdrop-blur-md border border-yellow/20 text-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-2xl text-yellow">{location.name}</h3>
              <p className="text-gray-300">{location.spaces} coworking spaces available</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white hover:bg-gray-800 rounded-full p-1"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </button>
          </div>
        </div>
        <div className="px-4 py-2">
          <p className="text-gray-300">{location.description}</p>
        </div>
        <div className="p-4 pt-2">
          <button className="w-full py-2 px-4 bg-yellow hover:bg-yellow text-black rounded-md font-medium">
            View Spaces in {location.name}
          </button>
        </div>
      </div>
    </div>
  )
}