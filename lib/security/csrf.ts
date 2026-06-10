/**
 * CSRF (Cross-Site Request Forgery) protection
 * Provides token generation and validation for form submissions
 */

import { randomBytes, createHash } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
// Edge runtime compatible - remove next-auth import for middleware
// import { getServerSession } from 'next-auth'
// import { authOptions } from '@/lib/auth'
import { logger } from '@/lib/logger'

// CSRF token configuration
const CSRF_TOKEN_LENGTH = 32
const CSRF_TOKEN_EXPIRY = 60 * 60 * 1000 // 1 hour in milliseconds
const CSRF_SECRET = process.env.CSRF_SECRET || 'fallback-secret-change-in-production'

export interface CSRFTokenData {
  token: string
  hash: string
  timestamp: number
  sessionId?: string
}

/**
 * Generate CSRF token for a session
 */
export function generateCSRFToken(sessionId?: string): CSRFTokenData {
  const token = randomBytes(CSRF_TOKEN_LENGTH).toString('hex')
  const timestamp = Date.now()
  
  // Create hash of token + secret + session + timestamp for verification
  const hash = createHash('sha256')
    .update(token)
    .update(CSRF_SECRET)
    .update(sessionId || '')
    .update(timestamp.toString())
    .digest('hex')

  return {
    token,
    hash,
    timestamp,
    sessionId
  }
}

/**
 * Verify CSRF token
 */
export function verifyCSRFToken(
  token: string, 
  hash: string, 
  timestamp: number, 
  sessionId?: string
): boolean {
  try {
    // Check if token is expired
    if (Date.now() - timestamp > CSRF_TOKEN_EXPIRY) {
      logger.warn('CSRF token expired', { timestamp, age: Date.now() - timestamp })
      return false
    }

    // Recreate hash and compare
    const expectedHash = createHash('sha256')
      .update(token)
      .update(CSRF_SECRET)
      .update(sessionId || '')
      .update(timestamp.toString())
      .digest('hex')

    const isValid = expectedHash === hash
    
    if (!isValid) {
      logger.warn('CSRF token hash mismatch', { 
        provided: hash.substring(0, 8), 
        expected: expectedHash.substring(0, 8) 
      })
    }

    return isValid
  } catch (error) {
    logger.error('CSRF token verification error', error instanceof Error ? error : new Error(String(error)))
    return false
  }
}

/**
 * CSRF middleware for API routes
 */
export async function validateCSRFToken(req: NextRequest): Promise<boolean> {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
    return true
  }

  // Session handling would be done in API routes, not middleware
  let session: any = null

  // Check for CSRF token in headers
  const csrfToken = req.headers.get('X-CSRF-Token')
  const csrfHash = req.headers.get('X-CSRF-Hash')
  const csrfTimestamp = req.headers.get('X-CSRF-Timestamp')

  if (!csrfToken || !csrfHash || !csrfTimestamp) {
    logger.warn('Missing CSRF token in request', {
      hasToken: !!csrfToken,
      hasHash: !!csrfHash,
      hasTimestamp: !!csrfTimestamp,
      method: req.method,
      url: req.url
    })
    return false
  }

  // Verify the token
  const isValid = verifyCSRFToken(
    csrfToken,
    csrfHash,
    parseInt(csrfTimestamp),
    session?.user?.id
  )

  if (!isValid) {
    logger.warn('Invalid CSRF token', {
      userId: session?.user?.id,
      method: req.method,
      url: req.url,
      userAgent: req.headers.get('user-agent') || undefined,
      referer: req.headers.get('referer') || undefined
    })
  }

  return isValid
}

/**
 * Generate CSRF error response
 */
export function createCSRFErrorResponse(): NextResponse {
  return NextResponse.json(
    {
      error: 'CSRF token validation failed',
      message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
      code: 'CSRF_TOKEN_INVALID'
    },
    { status: 403 }
  )
}

/**
 * CSRF token storage (in-memory for now, should use Redis in production)
 */
class CSRFTokenStore {
  private tokens = new Map<string, CSRFTokenData>()
  private cleanupInterval: NodeJS.Timeout

  constructor() {
    // Cleanup expired tokens every 15 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 15 * 60 * 1000)
  }

  store(sessionId: string, tokenData: CSRFTokenData): void {
    this.tokens.set(sessionId, tokenData)
  }

  get(sessionId: string): CSRFTokenData | null {
    const tokenData = this.tokens.get(sessionId)
    
    // Check if expired
    if (tokenData && Date.now() - tokenData.timestamp > CSRF_TOKEN_EXPIRY) {
      this.tokens.delete(sessionId)
      return null
    }

    return tokenData || null
  }

  remove(sessionId: string): void {
    this.tokens.delete(sessionId)
  }

  private cleanup(): void {
    const now = Date.now()
    let cleaned = 0
    
    for (const [sessionId, tokenData] of this.tokens.entries()) {
      if (now - tokenData.timestamp > CSRF_TOKEN_EXPIRY) {
        this.tokens.delete(sessionId)
        cleaned++
      }
    }

    if (cleaned > 0) {
      logger.debug('CSRF token cleanup completed', { cleaned, remaining: this.tokens.size })
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval)
    this.tokens.clear()
  }
}

// Global CSRF token store
export const csrfTokenStore = new CSRFTokenStore()

/**
 * Double submit cookie pattern implementation
 */
export class DoubleSubmitCookieCSRF {
  private cookieName = '__csrf_token'
  private headerName = 'X-CSRF-Token'

  generateToken(): string {
    return randomBytes(CSRF_TOKEN_LENGTH).toString('base64url')
  }

  setCookie(response: NextResponse, token: string): void {
    response.cookies.set(this.cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: CSRF_TOKEN_EXPIRY / 1000 // Convert to seconds
    })
  }

  validateRequest(req: NextRequest): boolean {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
      return true
    }

    const cookieToken = req.cookies.get(this.cookieName)?.value
    const headerToken = req.headers.get(this.headerName)

    if (!cookieToken || !headerToken) {
      logger.warn('Missing CSRF tokens', {
        hasCookie: !!cookieToken,
        hasHeader: !!headerToken,
        method: req.method
      })
      return false
    }

    const isValid = cookieToken === headerToken

    if (!isValid) {
      logger.warn('CSRF token mismatch', {
        cookieToken: cookieToken.substring(0, 8),
        headerToken: headerToken.substring(0, 8),
        method: req.method
      })
    }

    return isValid
  }
}

export const doubleSubmitCSRF = new DoubleSubmitCookieCSRF()

/**
 * React hook for CSRF protection
 */
export function useCSRFToken() {
  const [csrfToken, setCSRFToken] = React.useState<string | null>(null)

  React.useEffect(() => {
    // Fetch CSRF token from API
    fetch('/api/csrf-token')
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setCSRFToken(data.token)
          // Store in session storage for form submissions
          sessionStorage.setItem('csrf_token', data.token)
          sessionStorage.setItem('csrf_hash', data.hash)
          sessionStorage.setItem('csrf_timestamp', data.timestamp.toString())
        }
      })
      .catch(error => {
        logger.error('Failed to fetch CSRF token:', error instanceof Error ? error : new Error(String(error)))
      })
  }, [])

  const addCSRFHeaders = React.useCallback((headers: Record<string, string> = {}) => {
    const token = sessionStorage.getItem('csrf_token')
    const hash = sessionStorage.getItem('csrf_hash')
    const timestamp = sessionStorage.getItem('csrf_timestamp')

    if (token && hash && timestamp) {
      return {
        ...headers,
        'X-CSRF-Token': token,
        'X-CSRF-Hash': hash,
        'X-CSRF-Timestamp': timestamp
      }
    }

    return headers
  }, [])

  return { csrfToken, addCSRFHeaders }
}

/**
 * Form wrapper with automatic CSRF protection
 */
interface CSRFFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  children: React.ReactNode
}

export function CSRFForm({ children, onSubmit, ...props }: CSRFFormProps) {
  const { addCSRFHeaders } = useCSRFToken()

  const handleSubmit = React.useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    
    if (onSubmit) {
      // Add CSRF headers to form data or fetch requests within the form
      const originalFetch = window.fetch
      window.fetch = (url, init = {}) => {
        return originalFetch(url, {
          ...init,
          headers: addCSRFHeaders(init.headers as Record<string, string>)
        })
      }

      try {
        await onSubmit(e)
      } finally {
        // Restore original fetch
        window.fetch = originalFetch
      }
    }
  }, [onSubmit, addCSRFHeaders])

  return React.createElement('form', { onSubmit: handleSubmit, ...props }, children)
}

// Import React for hooks
import React from 'react'