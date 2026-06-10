/**
 * Logging middleware for Next.js API routes
 * Adds request correlation IDs and structured logging
 */

import { NextRequest, NextResponse } from 'next/server'
import { logApiRequest, logger, type LogContext } from '@/lib/logger'

/**
 * Extract request context for logging
 */
export function extractRequestContext(request: NextRequest): LogContext {
  return {
    userAgent: request.headers.get('user-agent') || 'unknown',
    ip: request.headers.get('x-forwarded-for') || 
        request.headers.get('x-real-ip') || 
        'unknown',
    path: request.nextUrl.pathname,
    method: request.method,
  }
}

/**
 * Wrap API handler with logging middleware
 */
export function withLogging<T extends any[]>(
  handler: (request: NextRequest, ...args: T) => Promise<NextResponse> | NextResponse
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const startTime = performance.now()
    const context = extractRequestContext(request)
    const requestLogger = logApiRequest(request.method, request.nextUrl.pathname, context)
    
    try {
      const response = await handler(request, ...args)
      
      const duration = performance.now() - startTime
      requestLogger.info('Request completed', {
        status: response.status,
        duration: `${duration.toFixed(2)}ms`
      })
      
      return response
    } catch (error) {
      const duration = performance.now() - startTime
      requestLogger.error('Request failed', error instanceof Error ? error : new Error(String(error)), {
        duration: `${duration.toFixed(2)}ms`
      })
      
      // Re-throw to maintain error handling behavior
      throw error
    }
  }
}

/**
 * Log API response helper
 */
export function logApiResponse(
  requestLogger: ReturnType<typeof logApiRequest>,
  status: number,
  message?: string,
  context?: LogContext
) {
  const level = status >= 400 ? 'warn' : 'info'
  requestLogger[level](message || `Response ${status}`, {
    status,
    ...context
  })
}

/**
 * Enhanced error logging for API routes
 */
export function logApiError(
  requestLogger: ReturnType<typeof logApiRequest>,
  error: unknown,
  context?: LogContext
) {
  if (error instanceof Error) {
    requestLogger.error('API Error', error, {
      errorName: error.name,
      errorMessage: error.message,
      ...context
    })
  } else {
    requestLogger.error('Unknown API Error', undefined, {
      error: String(error),
      ...context
    })
  }
}