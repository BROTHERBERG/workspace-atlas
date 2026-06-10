import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { logger } from '@/lib/logger'

export function handleApiError(error: unknown): NextResponse {
  logger.error('API Error:', error instanceof Error ? error : new Error(String(error)))
  
  if (error instanceof ZodError) {
    return NextResponse.json(
      { 
        error: 'Validation error', 
        details: error.errors 
      },
      { status: 400 }
    )
  }
  
  if (error instanceof Error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
  
  return NextResponse.json(
    { error: 'Internal server error' },
    { status: 500 }
  )
}

export function successResponse<T = unknown>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(data, { status })
}

export function errorResponse(message: string, status: number = 400): NextResponse {
  return NextResponse.json({ error: message }, { status })
}