import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const statusSchema = z.object({
  status: z.enum(['DRAFT', 'PENDING', 'ACTIVE', 'INACTIVE', 'SUSPENDED']),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { status } = statusSchema.parse(body)

    const workspace = await prisma.workspace.update({
      where: { id: id },
      data: { status },
    })

    logger.info('Workspace status updated', {
      workspaceId: workspace.id,
      status,
      updatedBy: session.user.id,
    })

    return NextResponse.json({ message: 'Workspace status updated' })
  } catch (error) {
    logger.error('Failed to update workspace status', error instanceof Error ? error : new Error(String(error)))

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
