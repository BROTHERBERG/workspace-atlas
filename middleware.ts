import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { rateLimiters, createRateLimitResponse } from '@/lib/security/rate-limiter'
import { doubleSubmitCSRF } from '@/lib/security/csrf-middleware'

/**
 * Next.js middleware for security, rate limiting, and request processing
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Apply rate limiting based on route
  let rateLimitResult
  
  try {
    // Authentication endpoints
    if (pathname.startsWith('/api/auth/')) {
      rateLimitResult = await rateLimiters.auth(req)
    }
    // Admin endpoints
    else if (pathname.startsWith('/api/admin/')) {
      rateLimitResult = await rateLimiters.admin(req)
    }
    // Search endpoints
    else if (pathname.startsWith('/api/search')) {
      rateLimitResult = await rateLimiters.search(req)
    }
    // Contact/form endpoints
    else if (pathname.match(/\/(contact|score-request|workspace-submission)/)) {
      rateLimitResult = await rateLimiters.forms(req)
    }
    // Upload endpoints
    else if (pathname.startsWith('/api/upload')) {
      rateLimitResult = await rateLimiters.upload(req)
    }
    // General API rate limiting
    else if (pathname.startsWith('/api/')) {
      rateLimitResult = await rateLimiters.general(req)
    }

    // Check rate limit result
    if (rateLimitResult && !rateLimitResult.success) {
      return createRateLimitResponse(rateLimitResult)
    }
  } catch (error) {
    console.error('Rate limiting error:', error)
    // Continue without rate limiting on error
  }

  // CSRF Protection for state-changing requests
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/') && !pathname.startsWith('/api/csrf-token')) {
    try {
      // Use double-submit cookie pattern for better compatibility
      const csrfValid = doubleSubmitCSRF.validateRequest(req)
      
      if (!csrfValid) {
        console.warn('CSRF validation failed', { 
          path: pathname, 
          method: req.method 
        })
        return NextResponse.json(
          {
            error: 'CSRF token validation failed',
            message: 'Invalid or missing CSRF token. Please refresh the page and try again.',
            code: 'CSRF_TOKEN_INVALID'
          },
          { status: 403 }
        )
      }
    } catch (error) {
      console.error('CSRF validation error:', error)
      // Continue without CSRF on error for non-critical endpoints
      if (pathname.includes('admin') || pathname.includes('delete') || pathname.includes('create')) {
        return NextResponse.json(
          { error: 'CSRF validation error' },
          { status: 403 }
        )
      }
    }
  }

  // Demo access: a signed-in demo cookie matching ADMIN_DEMO_KEY bypasses
  // NextAuth for /admin while the database-backed auth isn't provisioned.
  const demoKey = process.env.ADMIN_DEMO_KEY
  const hasDemoAccess = !!demoKey && req.cookies.get('atlas_admin')?.value === demoKey

  // Admin route protection
  if (pathname.startsWith('/admin') && !hasDemoAccess) {
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      })

      if (!token) {
        return NextResponse.redirect(new URL('/auth/signin?callbackUrl=' + encodeURIComponent(pathname), req.url))
      }

      if (token.role !== 'ADMIN') {
        return NextResponse.redirect(new URL('/?error=unauthorized', req.url))
      }
    } catch (error) {
      console.error('Auth middleware error:', error)
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
  }

  // API admin route protection
  if (pathname.startsWith('/api/admin/') && !hasDemoAccess) {
    try {
      const token = await getToken({ 
        req, 
        secret: process.env.NEXTAUTH_SECRET 
      })

      if (!token || token.role !== 'ADMIN') {
        return NextResponse.json(
          { error: 'Unauthorized - Admin access required' },
          { status: 403 }
        )
      }
    } catch (error) {
      console.error('API auth middleware error:', error)
      return NextResponse.json(
        { error: 'Authentication error' },
        { status: 401 }
      )
    }
  }

  // Add security headers
  const response = NextResponse.next()
  
  // Rate limit headers
  if (rateLimitResult) {
    response.headers.set('X-RateLimit-Remaining', rateLimitResult.remaining.toString())
    response.headers.set('X-RateLimit-Reset', Math.ceil(rateLimitResult.resetTime / 1000).toString())
  }

  // Comprehensive security headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), payment=()')
  
  // Strict Transport Security (HSTS) for HTTPS
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
  }

  // Content Security Policy based on route type
  if (pathname.startsWith('/api/')) {
    // Strict CSP for API routes
    response.headers.set('Content-Security-Policy', "default-src 'none'; frame-ancestors 'none';")
  } else if (pathname.startsWith('/admin')) {
    // Strict CSP for admin routes
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Allow inline scripts for React
      "style-src 'self' 'unsafe-inline'", // Allow inline styles
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '))
  } else {
    // Standard CSP for public routes
    response.headers.set('Content-Security-Policy', [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net", // Allow external CDNs
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: http:", // Allow external images
      "font-src 'self' https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '))
  }

  // Prevent clickjacking with additional header
  response.headers.set('X-Frame-Options', 'DENY')
  
  // Server information hiding
  response.headers.delete('Server')
  response.headers.delete('X-Powered-By')

  return response
}

export const config = {
  matcher: [
    // Match all API routes
    '/api/:path*',
    // Match admin routes
    '/admin/:path*',
    // Match auth pages
    '/auth/:path*'
  ]
}