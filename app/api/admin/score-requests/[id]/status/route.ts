import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const statusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { status, score, notes } = statusSchema.parse(body)

    const scoreRequest = await prisma.scoreRequest.findUnique({
      where: { id },
    })

    if (!scoreRequest) {
      return NextResponse.json({ error: 'Score request not found' }, { status: 404 })
    }

    const data: Record<string, unknown> = { status }

    if (typeof score === 'number') {
      data.score = score
      data.completedAt = new Date()
    }

    if (notes) {
      data.notes = notes
    }

    await prisma.scoreRequest.update({
      where: { id },
      data,
    })

    logger.info('Score request status updated', {
      requestId: id,
      status,
      updatedBy: session.user.id,
    })

    return NextResponse.json({ message: 'Status updated' })
  } catch (error) {
    logger.error('Failed to update score request status', error instanceof Error ? error : new Error(String(error)))

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
