/**
 * Structured logging utility for Workspace Atlas
 * Provides environment-aware logging with correlation IDs and proper log levels
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogContext {
  userId?: string
  requestId?: string
  workspaceId?: string
  sessionId?: string
  userAgent?: string
  ip?: string
  path?: string
  method?: string
  [key: string]: unknown
}

export interface LogEntry {
  timestamp: string
  level: string
  message: string
  context?: LogContext
  error?: {
    name: string
    message: string
    stack?: string
  }
}

/**
 * Logger interface for different implementations
 */
export interface Logger {
  debug(message: string, context?: LogContext): void
  info(message: string, context?: LogContext): void
  warn(message: string, context?: LogContext): void
  error(message: string, error?: Error, context?: LogContext): void
}

/**
 * Console-based logger implementation
 */
class ConsoleLogger implements Logger {
  private minLevel: LogLevel
  private isDevelopment: boolean

  constructor() {
    this.minLevel = this.getLogLevel()
    this.isDevelopment = process.env.NODE_ENV === 'development'
  }

  private getLogLevel(): LogLevel {
    const level = process.env.LOG_LEVEL?.toUpperCase()
    switch (level) {
      case 'DEBUG': return LogLevel.DEBUG
      case 'INFO': return LogLevel.INFO
      case 'WARN': return LogLevel.WARN
      case 'ERROR': return LogLevel.ERROR
      default: return this.isDevelopment ? LogLevel.DEBUG : LogLevel.INFO
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.minLevel
  }

  private formatMessage(level: string, message: string, context?: LogContext, error?: Error): string {
    const timestamp = new Date().toISOString()
    const emoji = this.getEmoji(level)
    
    if (this.isDevelopment) {
      // Development: Pretty formatted logs
      let formatted = `${emoji} ${timestamp} [${level}] ${message}`
      
      if (context && Object.keys(context).length > 0) {
        formatted += `\n  Context: ${JSON.stringify(context, null, 2)}`
      }
      
      if (error) {
        formatted += `\n  Error: ${error.message}`
        if (error.stack) {
          formatted += `\n  Stack: ${error.stack}`
        }
      }
      
      return formatted
    } else {
      // Production: JSON structured logs
      const logEntry: LogEntry = {
        timestamp,
        level,
        message,
        context,
        error: error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : undefined
      }
      
      return JSON.stringify(logEntry)
    }
  }

  private getEmoji(level: string): string {
    switch (level) {
      case 'DEBUG': return '🐛'
      case 'INFO': return 'ℹ️'
      case 'WARN': return '⚠️'
      case 'ERROR': return '❌'
      default: return '📝'
    }
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.DEBUG)) {
      console.debug(this.formatMessage('DEBUG', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage('INFO', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage('WARN', message, context))
    }
  }

  error(message: string, error?: Error, context?: LogContext): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage('ERROR', message, context, error))
    }
  }
}

/**
 * Global logger instance
 */
export const logger = new ConsoleLogger()

/**
 * Request correlation ID utilities
 */
let requestIdCounter = 0

export function generateRequestId(): string {
  const timestamp = Date.now().toString(36)
  const counter = (++requestIdCounter).toString(36)
  const random = Math.random().toString(36).substr(2, 4)
  return `req_${timestamp}_${counter}_${random}`
}

/**
 * Create child logger with additional context
 */
export function createChildLogger(baseContext: LogContext): Logger {
  return {
    debug: (message: string, context?: LogContext) => 
      logger.debug(message, { ...baseContext, ...context }),
    info: (message: string, context?: LogContext) => 
      logger.info(message, { ...baseContext, ...context }),
    warn: (message: string, context?: LogContext) => 
      logger.warn(message, { ...baseContext, ...context }),
    error: (message: string, error?: Error, context?: LogContext) => 
      logger.error(message, error, { ...baseContext, ...context })
  }
}

/**
 * Performance timing utilities
 */
export class PerformanceTimer {
  private startTime: number
  private context: LogContext

  constructor(private operation: string, context?: LogContext) {
    this.startTime = performance.now()
    this.context = context || {}
    logger.debug(`Starting ${operation}`, this.context)
  }

  finish(additionalContext?: LogContext): number {
    const duration = performance.now() - this.startTime
    const finalContext = { ...this.context, ...additionalContext, duration: `${duration.toFixed(2)}ms` }
    
    if (duration > 1000) {
      logger.warn(`Slow operation: ${this.operation} took ${duration.toFixed(2)}ms`, finalContext)
    } else {
      logger.debug(`Completed ${this.operation}`, finalContext)
    }
    
    return duration
  }
}

/**
 * API endpoint logging helper
 */
export function logApiRequest(method: string, path: string, context?: LogContext) {
  const requestId = generateRequestId()
  const requestContext = {
    requestId,
    method,
    path,
    timestamp: new Date().toISOString(),
    ...context
  }
  
  logger.info(`API ${method} ${path}`, requestContext)
  
  return createChildLogger({ requestId })
}

/**
 * Database operation logging
 */
export function logDbOperation(operation: string, table: string, context?: LogContext) {
  return new PerformanceTimer(`DB ${operation} on ${table}`, context)
}

/**
 * Email operation logging
 */
export function logEmailOperation(operation: string, to: string | string[], context?: LogContext) {
  const recipients = Array.isArray(to) ? to : [to]
  logger.info(`Email ${operation}`, {
    recipients: recipients.length,
    to: recipients.slice(0, 3), // Log first 3 recipients for privacy
    ...context
  })
}

/**
 * Authentication logging
 */
export function logAuthEvent(event: 'login' | 'logout' | 'register' | 'failed_login', context?: LogContext) {
  const level = event === 'failed_login' ? 'warn' : 'info'
  logger[level](`Auth event: ${event}`, context)
}