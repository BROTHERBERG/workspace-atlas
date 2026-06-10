import { NextRequest } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { 
  hashPassword, 
  verifyPassword, 
  generateToken, 
  validatePassword,
  checkAuthRateLimit,
  clearAuthRateLimit
} from '@/lib/auth-utils'
import { handleApiError, successResponse, errorResponse } from '@/lib/api-utils'

const loginSchema = z.object({
  email: z.string().email('Valid email is required'),
  password: z.string().min(1, 'Password is required'),
})

const registerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function GET() {
  return successResponse({ message: 'Auth API endpoint', status: 'ready' })
}

// Login endpoint
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body
    
    if (action === 'login') {
      return handleLogin(body)
    } else if (action === 'register') {
      return handleRegister(body)
    } else {
      return errorResponse('Invalid action. Use "login" or "register"', 400)
    }
  } catch (error) {
    return handleApiError(error)
  }
}

async function handleLogin(body: unknown) {
  const validatedData = loginSchema.parse(body)
  const { email, password } = validatedData
  
  // Check rate limiting
  if (!checkAuthRateLimit(email)) {
    return errorResponse('Too many login attempts. Please try again later.', 429)
  }
  
  // Find user in database
  const user = await prisma.user.findUnique({
    where: { email }
  })
  
  if (!user || !user.password || !await verifyPassword(password, user.password)) {
    return errorResponse('Invalid email or password', 401)
  }
  
  // Clear rate limit on successful login
  clearAuthRateLimit(email)
  
  // Update timestamp (using updatedAt since lastLoginAt doesn't exist in schema)
  await prisma.user.update({
    where: { id: user.id },
    data: { updatedAt: new Date() }
  })
  
  // Generate token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  })
  
  return successResponse({
    message: 'Login successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  })
}

async function handleRegister(body: unknown) {
  const validatedData = registerSchema.parse(body)
  const { name, email, password } = validatedData
  
  // Validate password strength
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.isValid) {
    return errorResponse(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400)
  }
  
  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  })
  
  if (existingUser) {
    return errorResponse('User with this email already exists', 409)
  }
  
  // Hash password and create user
  const hashedPassword = await hashPassword(password)
  
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: 'USER' // Default role
    }
  })
  
  // Generate token for immediate login
  const token = generateToken({
    userId: user.id,
    email: user.email,
    role: user.role
  })
  
  return successResponse({
    message: 'Registration successful',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    },
    token
  }, 201)
}