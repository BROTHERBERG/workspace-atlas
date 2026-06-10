import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { logger } from '@/lib/logger'

const reviewSchema = z.object({
  workspaceId: z.string().min(1, 'Workspace ID is required'),
  rating: z.number().min(1).max(5, 'Rating must be between 1 and 5'),
  title: z.string().optional(),
  content: z.string().min(1, 'Review content is required'),
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    const workspace = await prisma.workspace.findUnique({
      where: { id: validatedData.workspaceId },
    })

    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 })
    }

    const existingReview = await prisma.review.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: validatedData.workspaceId,
          userId: session.user.id,
        },
      },
    })

    if (existingReview) {
      return NextResponse.json({ error: 'You have already reviewed this workspace' }, { status: 400 })
    }

    const review = await prisma.review.create({
      data: {
        workspaceId: validatedData.workspaceId,
        userId: session.user.id,
        rating: validatedData.rating,
        title: validatedData.title || null,
        content: validatedData.content,
        verified: false,
      },
      include: {
        user: {
          select: { id: true, name: true, image: true },
        },
      },
    })

    const aggregates = await prisma.review.aggregate({
      where: { workspaceId: validatedData.workspaceId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await prisma.workspace.update({
      where: { id: validatedData.workspaceId },
      data: {
        rating: aggregates._avg.rating || 0,
        reviewCount: aggregates._count.rating,
      },
    })

    logger.info('Review created', { workspaceId: validatedData.workspaceId, reviewId: review.id })

    return NextResponse.json({ message: 'Review created successfully', review }, { status: 201 })
  } catch (error) {
    logger.error('Review creation error', error instanceof Error ? error : new Error(String(error)))

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
