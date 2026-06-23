import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import * as fs from 'fs'
import * as path from 'path'
import { emailService } from '@/lib/email'
import { logApiRequest } from '@/lib/logger'

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  subject: z.string().optional(),
  message: z.string().min(1, 'Message is required'),
})

export async function POST(request: NextRequest) {
  const requestLogger = logApiRequest('POST', '/api/contact')

  try {
    const body = await request.json()
    const validatedData = contactSchema.parse(body)

    // File-based capture (mirrors score/talent forms) — no DB required.
    const message = {
      id: `contact-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
      name: validatedData.name,
      email: validatedData.email,
      subject: validatedData.subject || 'General Inquiry',
      message: validatedData.message,
      status: 'NEW',
      submittedAt: new Date().toISOString(),
    }

    const leadsDir = path.join(process.cwd(), 'data', 'leads')
    if (!fs.existsSync(leadsDir)) fs.mkdirSync(leadsDir, { recursive: true })
    const file = path.join(leadsDir, 'contact-messages.json')
    let messages: unknown[] = []
    if (fs.existsSync(file)) {
      try {
        messages = JSON.parse(fs.readFileSync(file, 'utf-8') || '[]')
      } catch {
        messages = []
      }
    }
    messages.push(message)
    fs.writeFileSync(file, JSON.stringify(messages, null, 2))

    // Best-effort email notification (no-op without SMTP creds; never fails the request).
    try {
      await emailService.sendContactFormNotification({
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject || 'General Inquiry',
        message: validatedData.message,
        submittedAt: new Date(),
      })
    } catch (emailError) {
      requestLogger.error('Contact email notification skipped', emailError instanceof Error ? emailError : new Error(String(emailError)))
    }

    requestLogger.info('Contact form submitted', { contactId: message.id, email: validatedData.email })
    return NextResponse.json({ message: 'Contact form submitted successfully', id: message.id }, { status: 201 })
  } catch (error) {
    requestLogger.error('Contact form error', error instanceof Error ? error : new Error(String(error)))
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation error', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
