import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { logger } from '@/lib/logger'
import * as fs from 'fs'
import * as path from 'path'

const scoreRequestSchema = z.object({
  email: z.string().email('Valid email is required'),
  spaceName: z.string().min(1, 'Space name is required'),
  website: z.string().url().optional(),
  description: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = scoreRequestSchema.parse(body)

    // Create score request object
    const scoreRequest = {
      id: `score-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      email: validatedData.email,
      spaceName: validatedData.spaceName,
      websiteUrl: validatedData.website,
      description: validatedData.description,
      status: 'PENDING',
      submittedAt: new Date().toISOString(),
    }

    // Save to JSON file
    const leadsDir = path.join(process.cwd(), 'data', 'leads')
    if (!fs.existsSync(leadsDir)) {
      fs.mkdirSync(leadsDir, { recursive: true })
    }

    const leadsFile = path.join(leadsDir, 'score-requests.json')
    let leads: any[] = []

    if (fs.existsSync(leadsFile)) {
      const fileContent = fs.readFileSync(leadsFile, 'utf-8')
      leads = JSON.parse(fileContent)
    }

    leads.push(scoreRequest)
    fs.writeFileSync(leadsFile, JSON.stringify(leads, null, 2))

    logger.info('Score request submitted', { requestId: scoreRequest.id, email: scoreRequest.email })

    return NextResponse.json(
      { message: 'Score request submitted successfully', id: scoreRequest.id },
      { status: 201 }
    )
  } catch (error) {
    logger.error('Score request error', error instanceof Error ? error : new Error(String(error)))

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
