import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'
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
    
    // Validate the request body
    const validatedData = contactSchema.parse(body)
    requestLogger.info('Contact form validation successful', { email: validatedData.email, subject: validatedData.subject })
    
    // Save to database
    const contactForm = await prisma.contactForm.create({
      data: {
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject || 'General Inquiry',
        message: validatedData.message,
        status: 'pending',
      },
    })
    
    // Send email notification
    try {
      await emailService.sendContactFormNotification({
        name: validatedData.name,
        email: validatedData.email,
        subject: validatedData.subject || 'General Inquiry',
        message: validatedData.message,
        submittedAt: new Date()
      })
    } catch (emailError) {
      requestLogger.error('Failed to send contact form email', emailError instanceof Error ? emailError : new Error(String(emailError)))
      // Don't fail the request if email fails - just log it
    }
    
    requestLogger.info('Contact form submitted successfully', { contactFormId: contactForm.id, email: validatedData.email })
    
    return NextResponse.json(
      { message: 'Contact form submitted successfully', id: contactForm.id },
      { status: 201 }
    )
  } catch (error) {
    requestLogger.error('Contact form error', error instanceof Error ? error : new Error(String(error)))
    
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