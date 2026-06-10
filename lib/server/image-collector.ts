/**
 * Server-side image collection and processing service
 * Node.js-specific functionality that cannot run in the browser
 */

import { logger } from '@/lib/logger'
import { createHash } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'
import type { ImageMetadata, ImageCollectionResult } from '@/lib/image-utils'

export interface ImageProcessingOptions {
  quality?: number
  maxWidth?: number
  maxHeight?: number
  format?: 'webp' | 'jpeg' | 'png'
  outputDir?: string
}

/**
 * Server-side image collection and processing service
 */
export class ImageCollector {
  private options: Required<ImageProcessingOptions>

  constructor(options?: ImageProcessingOptions) {
    this.options = {
      quality: 85,
      maxWidth: 1200,
      maxHeight: 800,
      format: 'webp',
      outputDir: path.join(process.cwd(), 'public', 'images', 'workspaces'),
      ...options
    }
  }

  /**
   * Collect images from URLs for a workspace
   */
  async collectWorkspaceImages(
    workspaceId: string,
    imageUrls: string[]
  ): Promise<ImageCollectionResult> {
    const result: ImageCollectionResult = {
      success: true,
      images: [],
      errors: [],
      stats: {
        downloaded: 0,
        skipped: 0,
        errors: 0,
        totalSize: 0
      }
    }

    logger.info('Starting image collection', {
      workspaceId,
      imageCount: imageUrls.length,
      outputDir: this.options.outputDir
    })

    try {
      // Ensure output directory exists
      await this.ensureDirectoryExists(this.options.outputDir)
      
      // Create workspace-specific directory
      const workspaceDir = path.join(this.options.outputDir, workspaceId)
      await this.ensureDirectoryExists(workspaceDir)

      // Process images sequentially to avoid overwhelming the server
      for (let i = 0; i < imageUrls.length; i++) {
        const url = imageUrls[i]
        try {
          const imageResult = await this.downloadAndProcessImage(url, workspaceId, i)
          
          if (imageResult) {
            result.images.push(imageResult)
            result.stats.downloaded++
            result.stats.totalSize += imageResult.size || 0
          } else {
            result.stats.skipped++
          }
        } catch (error) {
          const errorMsg = `Failed to process image ${url}: ${error instanceof Error ? error.message : String(error)}`
          result.errors.push(errorMsg)
          result.stats.errors++
          logger.warn('Image processing failed', { url, error: errorMsg })
        }

        // Rate limiting between images
        if (i < imageUrls.length - 1) {
          await this.sleep(500)
        }
      }

      result.success = result.stats.errors < imageUrls.length / 2

      logger.info('Image collection completed', {
        workspaceId,
        stats: result.stats,
        success: result.success
      })

      return result

    } catch (error) {
      result.success = false
      const errorMsg = `Image collection failed: ${error instanceof Error ? error.message : String(error)}`
      result.errors.push(errorMsg)
      logger.error('Image collection failed', error instanceof Error ? error : new Error(String(error)), { workspaceId })
      return result
    }
  }

  /**
   * Download and process a single image
   */
  private async downloadAndProcessImage(
    url: string,
    workspaceId: string,
    index: number
  ): Promise<ImageMetadata | null> {
    try {
      // Generate consistent filename
      const urlHash = this.generateUrlHash(url)
      const filename = `${workspaceId}-${index}-${urlHash}.jpg`
      const filepath = path.join(this.options.outputDir, workspaceId, filename)

      // Check if file already exists
      if (await this.fileExists(filepath)) {
        logger.debug('Image already exists, skipping', { url, filepath })
        const stats = await fs.stat(filepath)
        return {
          url,
          filename: `/images/workspaces/${workspaceId}/${filename}`,
          size: stats.size,
          hash: urlHash
        }
      }

      // Download image with retry logic
      const imageBuffer = await this.downloadImageWithRetry(url)
      if (!imageBuffer) {
        return null
      }

      // Get image metadata
      const metadata = await this.getImageMetadata(imageBuffer)
      
      // Save to filesystem (keep original format for now)
      await fs.writeFile(filepath, imageBuffer)

      const stats = await fs.stat(filepath)
      
      logger.debug('Image processed successfully', {
        url,
        filename,
        originalSize: imageBuffer.length,
        processedSize: stats.size,
        dimensions: `${metadata.width}x${metadata.height}`
      })

      return {
        url,
        filename: `/images/workspaces/${workspaceId}/${filename}`,
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: stats.size,
        hash: urlHash
      }

    } catch (error) {
      logger.warn('Failed to download/process image', { url, error: error instanceof Error ? error.message : String(error) })
      throw error
    }
  }

  /**
   * Download image with retry logic
   */
  private async downloadImageWithRetry(
    url: string,
    maxRetries: number = 3
  ): Promise<Buffer | null> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          headers: {
            'User-Agent': process.env.SCRAPER_USER_AGENT || 'WorkspaceAtlas/1.0'
          },
          signal: AbortSignal.timeout(30000)
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }

        const contentType = response.headers.get('content-type')
        if (!contentType?.startsWith('image/')) {
          throw new Error(`Invalid content type: ${contentType}`)
        }

        const arrayBuffer = await response.arrayBuffer()
        return Buffer.from(arrayBuffer)

      } catch (error) {
        logger.warn(`Image download attempt ${attempt} failed`, {
          url,
          attempt,
          error: error instanceof Error ? error.message : String(error)
        })

        if (attempt === maxRetries) {
          logger.error('All image download attempts failed', error instanceof Error ? error : new Error(String(error)), { url })
          return null
        }

        await this.sleep(1000 * Math.pow(2, attempt - 1))
      }
    }

    return null
  }

  /**
   * Get basic image metadata
   */
  private async getImageMetadata(buffer: Buffer): Promise<{ width?: number; height?: number; format?: string }> {
    try {
      let format: string | undefined

      if (buffer.subarray(0, 3).toString('hex') === 'ffd8ff') {
        format = 'jpeg'
      } else if (buffer.subarray(0, 8).toString('hex') === '89504e470d0a1a0a') {
        format = 'png'
      } else if (buffer.subarray(0, 6).toString() === 'GIF87a' || buffer.subarray(0, 6).toString() === 'GIF89a') {
        format = 'gif'
      } else if (buffer.subarray(0, 4).toString() === 'RIFF' && buffer.subarray(8, 12).toString() === 'WEBP') {
        format = 'webp'
      }

      let width: number | undefined
      let height: number | undefined

      if (format === 'jpeg') {
        const dimensions = this.extractJPEGDimensions(buffer)
        width = dimensions.width
        height = dimensions.height
      } else if (format === 'png') {
        const dimensions = this.extractPNGDimensions(buffer)
        width = dimensions.width
        height = dimensions.height
      }

      return { width, height, format }
    } catch (error) {
      logger.warn('Failed to extract image metadata', { error: error instanceof Error ? error.message : String(error) })
      return {}
    }
  }

  /**
   * Extract JPEG dimensions from buffer
   */
  private extractJPEGDimensions(buffer: Buffer): { width?: number; height?: number } {
    try {
      let offset = 2
      
      while (offset < buffer.length) {
        const marker = buffer.readUInt16BE(offset)
        offset += 2
        
        if (marker >= 0xFFC0 && marker <= 0xFFC3) {
          offset += 3
          const height = buffer.readUInt16BE(offset)
          const width = buffer.readUInt16BE(offset + 2)
          return { width, height }
        }
        
        if (marker === 0xFFD9) break
        
        const length = buffer.readUInt16BE(offset)
        offset += length
      }
    } catch (error) {
      // Ignore errors
    }
    
    return {}
  }

  /**
   * Extract PNG dimensions from buffer
   */
  private extractPNGDimensions(buffer: Buffer): { width?: number; height?: number } {
    try {
      if (buffer.length >= 24) {
        const width = buffer.readUInt32BE(16)
        const height = buffer.readUInt32BE(20)
        return { width, height }
      }
    } catch (error) {
      // Ignore errors
    }
    
    return {}
  }

  /**
   * Generate hash for URL
   */
  private generateUrlHash(url: string): string {
    return createHash('md5').update(url).digest('hex').slice(0, 8)
  }

  /**
   * Check if file exists
   */
  private async fileExists(filepath: string): Promise<boolean> {
    try {
      await fs.access(filepath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Ensure directory exists
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.mkdir(dirPath, { recursive: true })
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}

/**
 * Global image collector instance
 */
export const imageCollector = new ImageCollector()