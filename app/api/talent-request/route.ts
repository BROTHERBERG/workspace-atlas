import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import * as fs from 'fs'
import * as path from 'path'

const talentRequestSchema = z.object({
  contactName: z.string().min(1, 'Contact name is required'),
  email: z.string().email('Valid email is required'),
  spaceName: z.string().min(1, 'Space or company name is required'),
  location: z.string().optional(),
  role: z.string().min(1, 'Role is required'),
  timeline: z.string().optional(),
  notes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = talentRequestSchema.parse(body)

    const talentRequest = {
      id: `talent-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...validatedData,
      status: 'NEW',
      submittedAt: new Date().toISOString(),
    }

    const leadsDir = path.join(process.cwd(), 'data', 'leads')
    if (!fs.existsSync(leadsDir)) {
      fs.mkdirSync(leadsDir, { recursive: true })
    }

    const leadsFile = path.join(leadsDir, 'talent-requests.json')
    let leads: any[] = []

    if (fs.existsSync(leadsFile)) {
      const fileContent = fs.readFileSync(leadsFile, 'utf-8')
      leads = JSON.parse(fileContent)
    }

    leads.push(talentRequest)
    fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2))

    logger.info('Talent request submitted', { requestId: talentRequest.id, email: talentRequest.email, role: talentRequest.role })

    return NextResponse.json(
      { message: 'Talent request submitted successfully', id: talentRequest.id },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Talent request error', error instanceof Error ? error : new Error(String(error)))

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
