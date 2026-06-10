/**
 * Authentication utilities for Workspace Atlas
 * Provides basic auth helpers and validation functions
 */

import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { logger } from '@/lib/logger'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  createdAt: Date
  lastLoginAt?: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterData {
  name: string
  email: string
  password: string
}

export interface JWTPayload {
  userId: string
  email: string
  role: 'USER' | 'SPACE_OWNER' | 'ADMIN'
  iat?: number
  exp?: number
}

/**
 * Hash password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 12
  return bcrypt.hash(password, saltRounds)
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

/**
 * Generate JWT token
 */
export function generateToken(payload: JWTPayload): string {
  const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d'
  
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions)
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const secret = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    return jwt.verify(token, secret) as JWTPayload
  } catch (error) {
    logger.error('Token verification failed:', error instanceof Error ? error : new Error(String(error)))
    return null
  }
}

/**
 * Extract user from authorization header
 */
export function getUserFromRequest(request: NextRequest): JWTPayload | null {
  const authHeader = request.headers.get('authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null
  }
  
  const token = authHeader.substring(7) // Remove 'Bearer ' prefix
  return verifyToken(token)
}

/**
 * Extract user from session cookie (for NextAuth.js compatibility)
 */
export async function getUserFromSession(request: NextRequest): Promise<AuthUser | null> {
  // This would integrate with your session management system
  // For now, return null - implement based on your auth provider
  return null
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Validate password strength
 */
export interface PasswordValidation {
  isValid: boolean
  errors: string[]
}

export function validatePassword(password: string): PasswordValidation {
  const errors: string[] = []
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long')
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*'
  let password = ''
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  
  return password
}

/**
 * Rate limiting for auth attempts
 */
const authAttempts = new Map<string, { count: number; lastAttempt: Date }>()

export function checkAuthRateLimit(identifier: string, maxAttempts: number = 5, windowMinutes: number = 15): boolean {
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)
  
  const attempts = authAttempts.get(identifier)
  
  if (!attempts) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }
  
  // Reset if window has passed
  if (attempts.lastAttempt < windowStart) {
    authAttempts.set(identifier, { count: 1, lastAttempt: now })
    return true
  }
  
  // Check if limit exceeded
  if (attempts.count >= maxAttempts) {
    return false
  }
  
  // Increment attempt count
  attempts.count++
  attempts.lastAttempt = now
  
  return true
}

/**
 * Clear auth rate limit for user (after successful login)
 */
export function clearAuthRateLimit(identifier: string): void {
  authAttempts.delete(identifier)
}