/**
 * CSRF protection for middleware (Edge Runtime compatible)
 * Simplified version without Node.js crypto for use in middleware
 */

import { NextRequest } from 'next/server'

/**
 * Double submit cookie pattern implementation for middleware
 * Uses Web Crypto API instead of Node.js crypto
 */
export class DoubleSubmitCookieCSRF {
  private cookieName = '__csrf_token'
  private headerName = 'X-CSRF-Token'

  async generateToken(): Promise<string> {
    // Use Web Crypto API for edge runtime compatibility
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  validateRequest(req: NextRequest): boolean {
    // Skip for safe methods
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method || '')) {
      return true
    }

    const cookieToken = req.cookies.get(this.cookieName)?.value
    const headerToken = req.headers.get(this.headerName)

    if (!cookieToken || !headerToken) {
      return false
    }

    return cookieToken === headerToken
  }
}

export const doubleSubmitCSRF = new DoubleSubmitCookieCSRF()