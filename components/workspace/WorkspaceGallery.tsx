'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronLeft, ChevronRight, Grid3X3, X } from 'lucide-react'
import { getWorkspaceImageSrc, RESPONSIVE_SIZES, IMAGE_QUALITY } from '@/lib/image-utils'

interface WorkspaceImage {
  id: string
  url: string
  alt: string | null
  isMain: boolean
  order: number
}

interface WorkspaceGalleryProps {
  images: WorkspaceImage[]
}

export function WorkspaceGallery({ images }: WorkspaceGalleryProps) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [showAllPhotos, setShowAllPhotos] = useState(false)

  if (images.length === 0) {
    return (
      <div className="aspect-[4/3] bg-gray-200 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">No images available</p>
      </div>
    )
  }

  const mainImage = images.find(img => img.isMain) || images[0]
  const otherImages = images.filter(img => img.id !== mainImage.id).slice(0, 4)

  const handlePrevious = () => {
    if (selectedImage === null) return
    setSelectedImage(selectedImage === 0 ? images.length - 1 : selectedImage - 1)
  }

  const handleNext = () => {
    if (selectedImage === null) return
    setSelectedImage(selectedImage === images.length - 1 ? 0 : selectedImage + 1)
  }

  const openGallery = (index: number) => {
    setSelectedImage(index)
  }

  const closeGallery = () => {
    setSelectedImage(null)
  }

  return (
    <>
      <div className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-2 rounded-lg overflow-hidden">
          {/* Main Image */}
          <div className="lg:col-span-3">
            <div 
              className="relative aspect-[4/3] lg:aspect-[3/2] cursor-pointer group"
              onClick={() => openGallery(0)}
            >
              <Image
                src={getWorkspaceImageSrc(mainImage.url)}
                alt={mainImage.alt || 'Workspace main image'}
                fill
                quality={IMAGE_QUALITY.high}
                sizes={RESPONSIVE_SIZES.workspace_gallery}
                className="object-cover transition-transform group-hover:scale-105"
                priority
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>

          {/* Thumbnail Grid */}
          <div className="hidden lg:block">
            <div className="grid grid-cols-2 gap-2 h-full">
              {otherImages.slice(0, 3).map((image, index) => (
                <div 
                  key={image.id}
                  className="relative aspect-square cursor-pointer group overflow-hidden rounded"
                  onClick={() => openGallery(index + 1)}
                >
                  <Image
                    src={getWorkspaceImageSrc(image.url)}
                    alt={image.alt || `Workspace image ${index + 2}`}
                    fill
                    quality={IMAGE_QUALITY.medium}
                    sizes={RESPONSIVE_SIZES.quarter}
                    className="object-cover transition-transform group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              
              {/* Show more photos button */}
              {images.length > 4 && (
                <div 
                  className="relative aspect-square cursor-pointer group overflow-hidden rounded bg-gray-900 flex items-center justify-center"
                  onClick={() => setShowAllPhotos(true)}
                >
                  <div className="text-white text-center">
                    <Grid3X3 className="h-6 w-6 mx-auto mb-1" />
                    <span className="text-sm font-medium">+{images.length - 4}</span>
                  </div>
                  <div className="absolute inset-0 bg-black/60 group-hover:bg-black/40 transition-colors" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile: Show all photos button */}
        <div className="lg:hidden mt-4">
          <Button
            variant="outline"
            onClick={() => setShowAllPhotos(true)}
            className="w-full"
          >
            <Grid3X3 className="mr-2 h-4 w-4" />
            View all {images.length} photos
          </Button>
        </div>
      </div>

      {/* Image Viewer Dialog */}
      <Dialog open={selectedImage !== null} onOpenChange={(open) => !open && closeGallery()}>
        <DialogContent className="max-w-4xl w-full h-[80vh] p-0">
          <DialogHeader className="absolute top-4 left-4 z-10">
            <DialogTitle className="text-white bg-black/50 px-3 py-1 rounded">
              {selectedImage !== null && `${selectedImage + 1} / ${images.length}`}
            </DialogTitle>
          </DialogHeader>
          
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 z-10 text-white bg-black/50 hover:bg-black/70"
            onClick={closeGallery}
          >
            <X className="h-4 w-4" />
          </Button>

          {selectedImage !== null && (
            <div className="relative w-full h-full">
              <Image
                src={getWorkspaceImageSrc(images[selectedImage].url)}
                alt={images[selectedImage].alt || `Workspace image ${selectedImage + 1}`}
                fill
                quality={IMAGE_QUALITY.high}
                sizes={RESPONSIVE_SIZES.full}
                className="object-contain"
                priority
              />
              
              {images.length > 1 && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                    onClick={handlePrevious}
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/50 hover:bg-black/70"
                    onClick={handleNext}
                  >
                    <ChevronRight className="h-6 w-6" />
                  </Button>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* All Photos Grid Dialog */}
      <Dialog open={showAllPhotos} onOpenChange={setShowAllPhotos}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>All Photos ({images.length})</DialogTitle>
          </DialogHeader>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div 
                key={image.id}
                className="relative aspect-square cursor-pointer group overflow-hidden rounded"
                onClick={() => {
                  setShowAllPhotos(false)
                  openGallery(index)
                }}
              >
                <Image
                  src={getWorkspaceImageSrc(image.url)}
                  alt={image.alt || `Workspace image ${index + 1}`}
                  fill
                  quality={IMAGE_QUALITY.medium}
                  sizes={RESPONSIVE_SIZES.quarter}
                  className="object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}