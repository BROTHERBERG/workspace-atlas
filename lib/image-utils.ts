/**
 * Image optimization utilities for Workspace Atlas
 * Provides standardized image handling and optimization
 */

export interface ImageConfig {
  width?: number
  height?: number
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
}

/**
 * Default image sizes for different use cases
 */
export const IMAGE_SIZES = {
  // Workspace images
  workspace: {
    card: { width: 500, height: 300 },
    gallery_main: { width: 1200, height: 800 },
    gallery_thumb: { width: 300, height: 200 },
    similar: { width: 64, height: 64 },
  },
  // Profile images
  profile: {
    avatar: { width: 100, height: 100 },
    card: { width: 200, height: 200 },
    header: { width: 400, height: 400 },
  },
  // UI elements
  ui: {
    icon: { width: 32, height: 32 },
    logo: { width: 200, height: 60 },
    hero: { width: 1920, height: 1080 },
  },
} as const

/**
 * Image quality presets
 */
export const IMAGE_QUALITY = {
  low: 50,
  medium: 75,
  high: 90,
  lossless: 100,
} as const

/**
 * Generate optimized image props for Next.js Image component
 */
export function getImageProps(
  src: string,
  alt: string,
  size: keyof typeof IMAGE_SIZES,
  variant: string,
  config: Partial<ImageConfig> = {}
) {
  const sizeConfig = IMAGE_SIZES[size][variant as keyof typeof IMAGE_SIZES[typeof size]]
  
  return {
    src,
    alt,
    width: config.width || (sizeConfig as any).width,
    height: config.height || (sizeConfig as any).height,
    quality: config.quality || IMAGE_QUALITY.high,
    placeholder: config.placeholder || 'blur' as const,
    blurDataURL: config.blurDataURL || generateBlurDataURL(),
  }
}

/**
 * Generate a base64 blur data URL for placeholders
 */
export function generateBlurDataURL(color = '#f3f4f6'): string {
  // Create a simple 10x10 blur placeholder
  const svg = `
    <svg width="10" height="10" xmlns="http://www.w3.org/2000/svg">
      <rect width="10" height="10" fill="${color}"/>
    </svg>
  `
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

/**
 * Get responsive image sizes for different breakpoints
 */
export function getResponsiveSizes(
  mobile = '100vw',
  tablet = '50vw',
  desktop = '33vw'
): string {
  return `(max-width: 768px) ${mobile}, (max-width: 1200px) ${tablet}, ${desktop}`
}

/**
 * Common responsive size presets
 */
export const RESPONSIVE_SIZES = {
  full: '100vw',
  half: '(max-width: 768px) 100vw, 50vw',
  third: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quarter: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw',
  workspace_card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  workspace_gallery: '(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 66vw',
  profile_avatar: '(max-width: 768px) 64px, 100px',
} as const

/**
 * Check if an image URL is external (needs optimization)
 */
export function isExternalImage(src: string): boolean {
  return src.startsWith('http://') || src.startsWith('https://')
}

/**
 * Fallback image URLs for different content types
 */
export const FALLBACK_IMAGES = {
  workspace: '/placeholder-workspace.jpg',
  profile: '/placeholder-user.jpg',
  logo: '/placeholder-logo.svg',
  hero: '/placeholder.svg',
} as const

/**
 * Get workspace image with fallback
 */
export function getWorkspaceImageSrc(imageSrc: string | null | undefined): string {
  return imageSrc || FALLBACK_IMAGES.workspace
}

/**
 * Get user avatar with fallback
 */
export function getUserAvatarSrc(imageSrc: string | null | undefined): string {
  return imageSrc || FALLBACK_IMAGES.profile
}

/**
 * Image loading states for better UX
 */
export const IMAGE_LOADING_STATES = {
  lazy: 'lazy' as const,
  eager: 'eager' as const,
} as const

/**
 * Priority loading for above-the-fold images
 */
export function shouldPrioritizeImage(isAboveFold: boolean): boolean {
  return isAboveFold
}

// Image Collection Pipeline types (for client-server interface)
export interface ImageMetadata {
  url: string
  filename: string
  width?: number
  height?: number
  format?: string
  size?: number
  hash?: string
}

export interface ImageCollectionResult {
  success: boolean
  images: ImageMetadata[]
  errors: string[]
  stats: {
    downloaded: number
    skipped: number
    errors: number
    totalSize: number
  }
}