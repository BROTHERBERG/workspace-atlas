import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const session = await getServerSession(authOptions)
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.workspace.delete({
      where: { id: id },
    })

    logger.info('Workspace deleted', { workspaceId: id, deletedBy: session.user.id })

    return NextResponse.json({ message: 'Workspace deleted' })
  } catch (error) {
    logger.error('Failed to delete workspace', error instanceof Error ? error : new Error(String(error)))
    return NextResponse.json(
      { error: 'Failed to delete workspace' },
      { status: 500 }
    )
  }
}
