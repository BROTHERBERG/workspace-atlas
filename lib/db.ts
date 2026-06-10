import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Prisma Client with optimized connection pooling
 * Connection pool size is managed through DATABASE_URL query params:
 * - connection_limit: Maximum number of connections (default: 10)
 * - pool_timeout: Max wait time for connection (default: 20s)
 */
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      {
        emit: 'event',
        level: 'query',
      },
      {
        emit: 'event',
        level: 'error',
      },
      {
        emit: 'event',
        level: 'warn',
      },
    ],
  })

// Log slow queries in production
if (process.env.NODE_ENV === 'production') {
  prisma.$on('query' as never, (e: { query: string; duration: number }) => {
    if (e.duration > 1000) {
      logger.warn('Slow query detected', {
        query: e.query.substring(0, 200),
        duration: `${e.duration}ms`,
      })
    }
  })
}

// Log Prisma errors
prisma.$on('error' as never, (e: { message: string; target?: string }) => {
  logger.error('Prisma error:', new Error(e.message), { target: e.target })
})

// Log warnings
prisma.$on('warn' as never, (e: { message: string }) => {
  logger.warn('Prisma warning', { message: e.message })
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Graceful shutdown
if (typeof window === 'undefined') {
  process.on('beforeExit', async () => {
    await prisma.$disconnect()
  })
}
