import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

const accessSchema = z.object({
  key: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const demoKey = process.env.ADMIN_DEMO_KEY
  if (!demoKey) {
    return NextResponse.json({ error: 'Demo access is not configured' }, { status: 404 })
  }

  try {
    const body = await request.json()
    const { key } = accessSchema.parse(body)

    if (key !== demoKey) {
      return NextResponse.json({ error: 'Invalid access key' }, { status: 401 })
    }

    const response = NextResponse.json({ message: 'Access granted' })
    response.cookies.set('atlas_admin', demoKey, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })
    return response
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
