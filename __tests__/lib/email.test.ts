import { MockEmailService } from '@/lib/email'
import type { ContactFormEmailData, ScoreRequestEmailData } from '@/lib/email'

// Mock logger
jest.mock('@/lib/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
  logEmailOperation: jest.fn(),
}))

describe('MockEmailService', () => {
  let emailService: MockEmailService

  beforeEach(() => {
    emailService = new MockEmailService()
    jest.clearAllMocks()
  })

  describe('sendEmail', () => {
    it('should send basic email successfully', async () => {
      const config = {
        from: 'test@example.com',
        to: 'user@example.com',
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>',
        text: 'Test text content'
      }

      const result = await emailService.sendEmail(config)
      expect(result).toBe(true)
    })

    it('should handle multiple recipients', async () => {
      const config = {
        from: 'test@example.com',
        to: ['user1@example.com', 'user2@example.com'],
        subject: 'Test Subject',
        html: '<p>Test HTML content</p>'
      }

      const result = await emailService.sendEmail(config)
      expect(result).toBe(true)
    })
  })

  describe('sendContactFormNotification', () => {
    it('should send contact form notification', async () => {
      const data: ContactFormEmailData = {
        name: 'John Doe',
        email: 'john@example.com',
        subject: 'General Inquiry',
        message: 'Hello, I have a question...',
        submittedAt: new Date()
      }

      const result = await emailService.sendContactFormNotification(data)
      expect(result).toBe(true)
    })
  })

  describe('sendScoreRequestConfirmation', () => {
    it('should send score request confirmation', async () => {
      const data: ScoreRequestEmailData = {
        email: 'workspace@example.com',
        spaceName: 'Test Workspace',
        websiteUrl: 'https://testworkspace.com',
        description: 'A great coworking space',
        submittedAt: new Date(),
        requestId: 'req_123'
      }

      const result = await emailService.sendScoreRequestConfirmation(data)
      expect(result).toBe(true)
    })

    it('should handle missing optional fields', async () => {
      const data: ScoreRequestEmailData = {
        email: 'workspace@example.com',
        spaceName: 'Test Workspace',
        submittedAt: new Date(),
        requestId: 'req_123'
      }

      const result = await emailService.sendScoreRequestConfirmation(data)
      expect(result).toBe(true)
    })
  })

  describe('sendScoreRequestAdminNotification', () => {
    it('should send admin notification for score request', async () => {
      const data: ScoreRequestEmailData = {
        email: 'workspace@example.com',
        spaceName: 'Test Workspace',
        websiteUrl: 'https://testworkspace.com',
        submittedAt: new Date(),
        requestId: 'req_123'
      }

      const result = await emailService.sendScoreRequestAdminNotification(data)
      expect(result).toBe(true)
    })
  })
})