const { createServer } = require('http')
const { Server } = require('socket.io')
const { PrismaClient } = require('../lib/generated/prisma')

const prisma = new PrismaClient()
const httpServer = createServer()

const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003", "http://localhost:3004", "http://localhost:3005", "http://localhost:3006"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
})

// Store connected users
const connectedUsers = new Map()
const adminUsers = new Set()

io.use((socket, next) => {
  const { userId, userRole } = socket.handshake.auth
  
  socket.userId = userId
  socket.userRole = userRole
  
  console.log(`🔌 User connecting: ${userId} (${userRole})`)
  next()
})

io.on('connection', (socket) => {
  console.log(`✅ Client connected: ${socket.id} (User: ${socket.userId}, Role: ${socket.userRole})`)
  
  // Store user connection
  if (socket.userId) {
    connectedUsers.set(socket.userId, {
      socketId: socket.id,
      userRole: socket.userRole,
      connectedAt: new Date()
    })
    
    if (socket.userRole === 'ADMIN') {
      adminUsers.add(socket.id)
    }
  }

  // Join user-specific room
  socket.on('join', ({ userId, userRole }) => {
    socket.join(`user:${userId}`)
    if (userRole === 'ADMIN') {
      socket.join('admins')
    }
    console.log(`👤 User ${userId} joined rooms`)
  })

  // Handle admin requests for real-time metrics
  socket.on('admin:request_metrics', async () => {
    if (socket.userRole !== 'ADMIN') return
    
    try {
      const metrics = await getDashboardMetrics()
      socket.emit('admin:metrics_update', {
        ...metrics,
        timestamp: new Date(),
        connectedUsers: connectedUsers.size
      })
    } catch (error) {
      console.error('Error fetching metrics:', error)
    }
  })

  // Handle score processing updates
  socket.on('admin:start_score_processing', async (data) => {
    if (socket.userRole !== 'ADMIN') return
    
    // Emit processing started to all admins
    io.to('admins').emit('score:processing_started', {
      requestId: data.requestId,
      timestamp: new Date()
    })

    // Simulate progress updates (in real implementation, this would be triggered by actual processing)
    let progress = 0
    const progressInterval = setInterval(() => {
      progress += Math.random() * 20
      if (progress >= 100) {
        progress = 100
        clearInterval(progressInterval)
        
        // Emit completion
        io.to('admins').emit('score:processing_completed', {
          requestId: data.requestId,
          progress: 100,
          timestamp: new Date()
        })
      } else {
        io.to('admins').emit('score:processing_progress', {
          requestId: data.requestId,
          progress: Math.round(progress),
          timestamp: new Date()
        })
      }
    }, 1000)
  })

  // Handle disconnection
  socket.on('disconnect', (reason) => {
    console.log(`❌ Client disconnected: ${socket.id} (${reason})`)
    
    if (socket.userId) {
      connectedUsers.delete(socket.userId)
    }
    
    if (socket.userRole === 'ADMIN') {
      adminUsers.delete(socket.id)
    }
  })

  // Send welcome message
  socket.emit('connection:established', {
    message: 'Connected to Workspace Atlas real-time server',
    timestamp: new Date()
  })
})

// Simulate real-time activities
setInterval(async () => {
  if (connectedUsers.size === 0) return
  
  try {
    // Simulate new activities
    const activities = [
      { type: 'user_joined', message: 'New user joined Workspace Atlas' },
      { type: 'workspace_added', message: 'New workspace added in Tokyo' },
      { type: 'review_posted', message: 'New 5-star review posted' },
      { type: 'score_completed', message: 'Digital score analysis completed' },
      { type: 'achievement_unlocked', message: 'User unlocked "City Explorer" achievement' }
    ]
    
    const randomActivity = activities[Math.floor(Math.random() * activities.length)]
    
    io.emit('activity:new', {
      ...randomActivity,
      id: Date.now(),
      timestamp: new Date()
    })
    
    // Update metrics for admins
    if (adminUsers.size > 0) {
      const metrics = await getDashboardMetrics()
      io.to('admins').emit('admin:metrics_update', {
        ...metrics,
        timestamp: new Date(),
        connectedUsers: connectedUsers.size
      })
    }
  } catch (error) {
    console.error('Error in activity simulation:', error)
  }
}, 30000) // Every 30 seconds

async function getDashboardMetrics() {
  try {
    const [
      totalWorkspaces,
      pendingWorkspaces,
      totalUsers,
      scoreRequests,
      contactSubmissions
    ] = await Promise.all([
      prisma.workspace.count(),
      prisma.workspace.count({ where: { status: 'PENDING' } }),
      prisma.user.count(),
      prisma.scoreRequest.count({ where: { status: 'PENDING' } }),
      prisma.contactSubmission.count({ where: { status: 'UNREAD' } })
    ])

    return {
      totalWorkspaces,
      pendingWorkspaces,
      totalUsers,
      scoreRequests,
      contactSubmissions
    }
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return {
      totalWorkspaces: 0,
      pendingWorkspaces: 0,
      totalUsers: 0,
      scoreRequests: 0,
      contactSubmissions: 0
    }
  }
}

const PORT = process.env.WS_PORT || 3007

httpServer.listen(PORT, () => {
  console.log(`🚀 WebSocket server running on port ${PORT}`)
  console.log(`📡 Accepting connections from:`)
  console.log(`   - http://localhost:3000-3006 (Next.js dev servers)`)
  console.log(`🔗 Connect via: ws://localhost:${PORT}`)
})