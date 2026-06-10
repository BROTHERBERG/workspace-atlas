import { generateRequestId, createChildLogger, PerformanceTimer } from '@/lib/logger'

// Mock console methods before importing logger
const originalConsole = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
}

const consoleMethods = {
  debug: jest.fn(),
  info: jest.fn(), 
  warn: jest.fn(),
  error: jest.fn(),
}

// Replace console methods before importing logger
console.debug = consoleMethods.debug
console.info = consoleMethods.info
console.warn = consoleMethods.warn
console.error = consoleMethods.error

// Now import logger with mocked console
import { logger } from '@/lib/logger'

describe('Logger', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    Object.values(consoleMethods).forEach(mock => mock.mockClear())
  })

  afterAll(() => {
    // Restore console methods
    console.debug = originalConsole.debug
    console.info = originalConsole.info
    console.warn = originalConsole.warn
    console.error = originalConsole.error
  })

  describe('Basic logging', () => {
    it('should log info messages', () => {
      logger.info('Test message')
      expect(consoleMethods.info).toHaveBeenCalled()
      const logCall = consoleMethods.info.mock.calls[0][0]
      const logEntry = JSON.parse(logCall)
      expect(logEntry.message).toBe('Test message')
      expect(logEntry.level).toBe('INFO')
    })

    it('should log error messages with context', () => {
      const error = new Error('Test error')
      const context = { userId: '123', requestId: 'req_123' }
      
      logger.error('Error occurred', error, context)
      expect(consoleMethods.error).toHaveBeenCalled()
      const logCall = consoleMethods.error.mock.calls[0][0]
      const logEntry = JSON.parse(logCall)
      expect(logEntry.message).toBe('Error occurred')
      expect(logEntry.level).toBe('ERROR')
      expect(logEntry.context).toEqual(context)
      expect(logEntry.error.message).toBe('Test error')
    })

    it('should log warnings', () => {
      logger.warn('Warning message')
      expect(consoleMethods.warn).toHaveBeenCalled()
      const logCall = consoleMethods.warn.mock.calls[0][0]
      const logEntry = JSON.parse(logCall)
      expect(logEntry.message).toBe('Warning message')
      expect(logEntry.level).toBe('WARN')
    })

    it('should log debug messages', () => {
      logger.debug('Debug message')
      expect(consoleMethods.debug).toHaveBeenCalled()
      const logCall = consoleMethods.debug.mock.calls[0][0]
      const logEntry = JSON.parse(logCall)
      expect(logEntry.message).toBe('Debug message')
      expect(logEntry.level).toBe('DEBUG')
    })
  })

  describe('Request ID generation', () => {
    it('should generate unique request IDs', () => {
      const id1 = generateRequestId()
      const id2 = generateRequestId()
      
      expect(id1).not.toEqual(id2)
      expect(id1).toMatch(/^req_[a-z0-9_]+$/)
      expect(id2).toMatch(/^req_[a-z0-9_]+$/)
    })
  })

  describe('Child logger', () => {
    it('should create child logger with base context', () => {
      const baseContext = { userId: '123', sessionId: 'session_456' }
      const childLogger = createChildLogger(baseContext)
      
      childLogger.info('Child message', { action: 'test' })
      
      expect(consoleMethods.info).toHaveBeenCalled()
      const logCall = consoleMethods.info.mock.calls[0][0]
      const logEntry = JSON.parse(logCall)
      expect(logEntry.message).toBe('Child message')
      expect(logEntry.context).toEqual({
        ...baseContext,
        action: 'test'
      })
    })
  })

  describe('Performance Timer', () => {
    it('should measure operation duration', async () => {
      const timer = new PerformanceTimer('test operation')
      
      // Simulate some work
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const duration = timer.finish()
      
      expect(duration).toBeGreaterThan(0)
      
      // Check start debug log
      expect(consoleMethods.debug).toHaveBeenCalledTimes(2)
      const startLogCall = consoleMethods.debug.mock.calls[0][0]
      const startLogEntry = JSON.parse(startLogCall)
      expect(startLogEntry.message).toBe('Starting test operation')
      
      // Check completion debug log
      const completionLogCall = consoleMethods.debug.mock.calls[1][0]
      const completionLogEntry = JSON.parse(completionLogCall)
      expect(completionLogEntry.message).toBe('Completed test operation')
    })

    it('should warn on slow operations', () => {
      // Mock performance.now to simulate slow operation BEFORE creating timer
      const originalNow = performance.now
      let callCount = 0
      performance.now = jest.fn(() => {
        callCount++
        return callCount === 1 ? 0 : 2000 // 2 second duration
      })
      
      const timer = new PerformanceTimer('slow operation')
      timer.finish()
      
      expect(consoleMethods.warn).toHaveBeenCalled()
      const warnLogCall = consoleMethods.warn.mock.calls[0][0]
      const warnLogEntry = JSON.parse(warnLogCall)
      expect(warnLogEntry.message).toContain('Slow operation')
      
      // Restore original performance.now
      performance.now = originalNow
    })
  })
})