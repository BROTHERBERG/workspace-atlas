import { NextRequest, NextResponse } from 'next/server'
import { generateCSRFToken } from '@/lib/security/csrf'
import { logger } from '@/lib/logger'

export async function GET(request: NextRequest) {
  try {
    const sessionId =
      request.cookies.get('next-auth.session-token')?.value ||
      request.cookies.get('__Secure-next-auth.session-token')?.value ||
      undefined

    const tokenData = generateCSRFToken(sessionId)

    const response = NextResponse.json({
      token: tokenData.token,
      hash: tokenData.hash,
      timestamp: tokenData.timestamp,
    })

    response.cookies.set({
      name: '__csrf_token',
      value: tokenData.token,
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60, // 1 hour
    })

    return response
  } catch (error) {
    logger.error('Failed to generate CSRF token', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json({ error: 'Failed to generate CSRF token' }, { status: 500 })
  }
}
