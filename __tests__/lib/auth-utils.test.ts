import {
  hashPassword,
  verifyPassword,
  generateToken,
  verifyToken,
  validatePassword,
  generateSecurePassword,
  checkAuthRateLimit,
  clearAuthRateLimit
} from '@/lib/auth-utils'

describe('Auth Utils', () => {
  describe('Password hashing', () => {
    it('should hash and verify passwords correctly', async () => {
      const password = 'testPassword123!'
      const hash = await hashPassword(password)
      
      expect(hash).toBeDefined()
      expect(hash).not.toBe(password)
      
      const isValid = await verifyPassword(password, hash)
      expect(isValid).toBe(true)
      
      const isInvalid = await verifyPassword('wrongPassword', hash)
      expect(isInvalid).toBe(false)
    })
  })

  describe('JWT tokens', () => {
    const testPayload = {
      userId: '123',
      email: 'test@example.com',
      role: 'USER' as const
    }

    it('should generate and verify JWT tokens', () => {
      const token = generateToken(testPayload)
      expect(token).toBeDefined()
      expect(typeof token).toBe('string')
      
      const decoded = verifyToken(token)
      expect(decoded).toMatchObject(testPayload)
    })

    it('should reject invalid tokens', () => {
      const invalidToken = 'invalid.token.here'
      const result = verifyToken(invalidToken)
      expect(result).toBe(null)
    })
  })

  describe('Password validation', () => {
    it('should validate strong passwords', () => {
      const strongPassword = 'StrongPass123!'
      const result = validatePassword(strongPassword)
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject weak passwords', () => {
      const weakPassword = 'weak'
      const result = validatePassword(weakPassword)
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors).toContain('Password must be at least 8 characters long')
    })

    it('should require uppercase, lowercase, numbers, and special characters', () => {
      const tests = [
        { password: 'nouppercase123!', missing: 'uppercase' },
        { password: 'NOLOWERCASE123!', missing: 'lowercase' },
        { password: 'NoNumbers!', missing: 'number' },
        { password: 'NoSpecialChars123', missing: 'special character' }
      ]

      tests.forEach(test => {
        const result = validatePassword(test.password)
        expect(result.isValid).toBe(false)
        expect(result.errors.some(error => error.includes(test.missing))).toBe(true)
      })
    })
  })

  describe('Secure password generation', () => {
    it('should generate secure passwords of specified length', () => {
      const password = generateSecurePassword(12)
      expect(password).toHaveLength(12)
      
      const longPassword = generateSecurePassword(32)
      expect(longPassword).toHaveLength(32)
    })

    it('should generate different passwords each time', () => {
      const password1 = generateSecurePassword()
      const password2 = generateSecurePassword()
      
      expect(password1).not.toBe(password2)
    })

    it('should generate passwords that pass validation', () => {
      const password = generateSecurePassword(16)
      const validation = validatePassword(password)
      
      expect(validation.isValid).toBe(true)
    })
  })

  describe('Rate limiting', () => {
    const testIdentifier = 'test@example.com'

    beforeEach(() => {
      // Clear rate limit before each test
      clearAuthRateLimit(testIdentifier)
    })

    it('should allow requests within rate limit', () => {
      const result1 = checkAuthRateLimit(testIdentifier, 5, 15)
      const result2 = checkAuthRateLimit(testIdentifier, 5, 15)
      const result3 = checkAuthRateLimit(testIdentifier, 5, 15)
      
      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(true)
    })

    it('should block requests exceeding rate limit', () => {
      const maxAttempts = 3
      
      // Make exactly maxAttempts requests
      for (let i = 0; i < maxAttempts; i++) {
        const result = checkAuthRateLimit(testIdentifier, maxAttempts, 15)
        expect(result).toBe(true)
      }
      
      // The next request should be blocked
      const blockedResult = checkAuthRateLimit(testIdentifier, maxAttempts, 15)
      expect(blockedResult).toBe(false)
    })

    it('should clear rate limit on successful auth', () => {
      // Exhaust rate limit
      for (let i = 0; i < 5; i++) {
        checkAuthRateLimit(testIdentifier, 5, 15)
      }
      
      // Should be blocked
      let result = checkAuthRateLimit(testIdentifier, 5, 15)
      expect(result).toBe(false)
      
      // Clear and try again
      clearAuthRateLimit(testIdentifier)
      result = checkAuthRateLimit(testIdentifier, 5, 15)
      expect(result).toBe(true)
    })
  })
})