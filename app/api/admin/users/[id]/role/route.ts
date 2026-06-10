import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const roleSchema = z.object({
  role: z.enum(['USER', 'SPACE_OWNER', 'ADMIN']),
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
    const { role } = roleSchema.parse(body)

    const user = await prisma.user.update({
      where: { id },
      data: { role },
    })

    logger.info('User role updated', { targetUser: user.id, role, updatedBy: session.user.id })

    return NextResponse.json({ message: 'Role updated' })
  } catch (error) {
    logger.error('Failed to update user role', error instanceof Error ? error : new Error(String(error)))

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
