/**
 * Security audit logging
 * Tracks security-related events and potential threats
 */

import { logger, PerformanceTimer } from '@/lib/logger'
import { getClientIP } from './rate-limiter'
import { NextRequest } from 'next/server'

export interface SecurityEvent {
  type: 'AUTH_FAILURE' | 'RATE_LIMIT_EXCEEDED' | 'CSRF_VIOLATION' | 'ADMIN_ACCESS' | 
        'SUSPICIOUS_REQUEST' | 'SQL_INJECTION_ATTEMPT' | 'XSS_ATTEMPT' | 'FILE_UPLOAD_VIOLATION' |
        'BRUTE_FORCE_ATTEMPT' | 'PRIVILEGE_ESCALATION' | 'ACCESS_DENIED' | 'ADMIN_ACTION' | 'DATA_ACCESS'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  description: string
  metadata: Record<string, any>
  timestamp: number
  ip: string
  userAgent?: string
  userId?: string
  sessionId?: string
}

export interface ThreatDetectionResult {
  isThreat: boolean
  confidence: number // 0-1 scale
  reasons: string[]
  severity: SecurityEvent['severity']
}

/**
 * Security audit logger
 */
export class SecurityAuditLogger {
  private events: SecurityEvent[] = []
  private suspiciousIPs = new Map<string, { count: number, lastSeen: number }>()
  private maxEventsInMemory = 1000

  /**
   * Log a security event
   */
  logSecurityEvent(
    type: SecurityEvent['type'],
    severity: SecurityEvent['severity'],
    description: string,
    metadata: Record<string, any> = {},
    ipAddress?: string,
    userAgent?: string,
    userId?: string
  ): void {
    const event: SecurityEvent = {
      type,
      severity,
      description,
      metadata: {
        ...metadata,
        userId: userId || metadata.userId
      },
      timestamp: Date.now(),
      ip: ipAddress || metadata.ip || 'unknown',
      userAgent: userAgent || metadata.userAgent,
      userId: userId || metadata.userId,
      sessionId: metadata.sessionId
    }

    // Add to in-memory storage
    this.events.push(event)
    
    // Keep only recent events in memory
    if (this.events.length > this.maxEventsInMemory) {
      this.events.shift()
    }

    // Track suspicious IPs
    if (severity === 'HIGH' || severity === 'CRITICAL') {
      this.trackSuspiciousIP(event.ip)
    }

    // Log to structured logger
    logger.warn('Security Event', {
      securityEvent: event,
      correlationId: metadata.correlationId || `${event.ip}-${Date.now()}`
    })

    // In production, send to SIEM/security monitoring system
    if (process.env.NODE_ENV === 'production' && severity === 'CRITICAL') {
      this.alertSecurityTeam(event)
    }
  }

  /**
   * Detect potential threats from request patterns
   */
  detectThreat(req: NextRequest): ThreatDetectionResult {
    const ip = getClientIP(req)
    const userAgent = req.headers.get('user-agent')
    const path = req.nextUrl.pathname
    const method = req.method
    const reasons: string[] = []
    let confidence = 0

    // Check for suspicious IP
    const suspiciousIP = this.suspiciousIPs.get(ip)
    if (suspiciousIP && suspiciousIP.count > 10) {
      reasons.push('IP has exceeded suspicious activity threshold')
      confidence += 0.4
    }

    // Check for SQL injection patterns in URL
    const sqlPatterns = [
      /union\s+select/gi,
      /select\s+\*\s+from/gi,
      /drop\s+table/gi,
      /1=1/g,
      /'\s*or\s*'1'/gi,
      /;--/g
    ]

    const pathAndQuery = `${path}${req.nextUrl.search}`
    if (sqlPatterns.some(pattern => pattern.test(pathAndQuery))) {
      reasons.push('SQL injection patterns detected in URL')
      confidence += 0.6
    }

    // Check for XSS patterns
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe/gi
    ]

    if (xssPatterns.some(pattern => pattern.test(pathAndQuery))) {
      reasons.push('XSS patterns detected in request')
      confidence += 0.5
    }

    // Check for suspicious user agents
    if (!userAgent || userAgent.length < 10) {
      reasons.push('Missing or suspicious user agent')
      confidence += 0.2
    }

    // Check for path traversal attempts
    if (path.includes('../') || path.includes('..\\')) {
      reasons.push('Path traversal attempt detected')
      confidence += 0.7
    }

    // Check for admin access from unusual locations
    if (path.includes('/admin') && !this.isKnownAdminIP(ip)) {
      reasons.push('Admin access from unrecognized IP')
      confidence += 0.3
    }

    // Determine severity based on confidence
    let severity: SecurityEvent['severity'] = 'LOW'
    if (confidence >= 0.8) severity = 'CRITICAL'
    else if (confidence >= 0.6) severity = 'HIGH'
    else if (confidence >= 0.3) severity = 'MEDIUM'

    return {
      isThreat: confidence > 0.3,
      confidence,
      reasons,
      severity
    }
  }

  /**
   * Get security events for analysis
   */
  getSecurityEvents(filter?: {
    type?: SecurityEvent['type']
    severity?: SecurityEvent['severity']
    ip?: string
    since?: number
  }): SecurityEvent[] {
    let events = this.events

    if (filter) {
      if (filter.type) {
        events = events.filter(e => e.type === filter.type)
      }
      if (filter.severity) {
        events = events.filter(e => e.severity === filter.severity)
      }
      if (filter.ip) {
        events = events.filter(e => e.ip === filter.ip)
      }
      if (filter.since) {
        events = events.filter(e => e.timestamp >= filter.since!)
      }
    }

    return events.sort((a, b) => b.timestamp - a.timestamp)
  }

  /**
   * Get security statistics
   */
  getSecurityStats(timeWindowMs: number = 24 * 60 * 60 * 1000): {
    totalEvents: number
    eventsByType: Record<string, number>
    eventsBySeverity: Record<string, number>
    topIPs: Array<{ ip: string; count: number }>
    avgEventsPerHour: number
  } {
    const since = Date.now() - timeWindowMs
    const recentEvents = this.getSecurityEvents({ since })

    const eventsByType: Record<string, number> = {}
    const eventsBySeverity: Record<string, number> = {}
    const ipCounts: Record<string, number> = {}

    recentEvents.forEach(event => {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1
      eventsBySeverity[event.severity] = (eventsBySeverity[event.severity] || 0) + 1
      ipCounts[event.ip] = (ipCounts[event.ip] || 0) + 1
    })

    const topIPs = Object.entries(ipCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([ip, count]) => ({ ip, count }))

    return {
      totalEvents: recentEvents.length,
      eventsByType,
      eventsBySeverity,
      topIPs,
      avgEventsPerHour: recentEvents.length / (timeWindowMs / (60 * 60 * 1000))
    }
  }

  /**
   * Check if an IP is blocked
   */
  isIPBlocked(ip: string): boolean {
    const suspicious = this.suspiciousIPs.get(ip)
    return suspicious ? suspicious.count > 50 : false
  }

  private trackSuspiciousIP(ip: string): void {
    const existing = this.suspiciousIPs.get(ip) || { count: 0, lastSeen: 0 }
    existing.count++
    existing.lastSeen = Date.now()
    this.suspiciousIPs.set(ip, existing)

    // Log when IP becomes highly suspicious
    if (existing.count === 25) {
      logger.warn('IP marked as highly suspicious', { ip, count: existing.count })
    }
  }

  private isKnownAdminIP(ip: string): boolean {
    // In production, maintain a whitelist of admin IPs
    const adminIPs = (process.env.ADMIN_IPS || '').split(',')
    return adminIPs.includes(ip) || ip === '127.0.0.1' || ip === '::1'
  }

  private async alertSecurityTeam(event: SecurityEvent): Promise<void> {
    try {
      // In production, integrate with:
      // - Slack/Discord webhooks
      // - Email alerts
      // - SIEM systems
      // - Security incident management platforms

      logger.error('CRITICAL SECURITY EVENT - Alerting security team', new Error('Critical security event'), {
        event,
        requiresImmedateAttention: true
      })

      // Example webhook notification (commented out for demo)
      /*
      if (process.env.SECURITY_WEBHOOK_URL) {
        await fetch(process.env.SECURITY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 CRITICAL Security Event: ${event.type}`,
            attachments: [{
              color: 'danger',
              title: event.description,
              fields: [
                { title: 'IP Address', value: event.ip, short: true },
                { title: 'User Agent', value: event.userAgent || 'N/A', short: true },
                { title: 'Timestamp', value: new Date(event.timestamp).toISOString(), short: true }
              ]
            }]
          })
        })
      }
      */
    } catch (error) {
      logger.error('Failed to alert security team', error instanceof Error ? error : new Error(String(error)))
    }
  }

  /**
   * Generate security report
   */
  generateSecurityReport(timeWindowMs: number = 7 * 24 * 60 * 60 * 1000): string {
    const stats = this.getSecurityStats(timeWindowMs)
    const criticalEvents = this.getSecurityEvents({ severity: 'CRITICAL', since: Date.now() - timeWindowMs })
    
    let report = `# Security Report\n\n`
    report += `**Period:** Last ${Math.round(timeWindowMs / (24 * 60 * 60 * 1000))} days\n`
    report += `**Generated:** ${new Date().toISOString()}\n\n`
    
    report += `## Summary\n`
    report += `- Total Security Events: ${stats.totalEvents}\n`
    report += `- Critical Events: ${stats.eventsBySeverity.CRITICAL || 0}\n`
    report += `- High Severity Events: ${stats.eventsBySeverity.HIGH || 0}\n`
    report += `- Average Events/Hour: ${stats.avgEventsPerHour.toFixed(2)}\n\n`
    
    report += `## Events by Type\n`
    Object.entries(stats.eventsByType).forEach(([type, count]) => {
      report += `- ${type}: ${count}\n`
    })
    
    report += `\n## Top Source IPs\n`
    stats.topIPs.forEach(({ ip, count }, index) => {
      report += `${index + 1}. ${ip}: ${count} events\n`
    })
    
    if (criticalEvents.length > 0) {
      report += `\n## Recent Critical Events\n`
      criticalEvents.slice(0, 5).forEach(event => {
        report += `- **${event.type}** (${new Date(event.timestamp).toLocaleString()}): ${event.description}\n`
      })
    }
    
    return report
  }
}

// Global security audit logger
export const securityAuditLogger = new SecurityAuditLogger()

/**
 * Legacy wrapper for backward compatibility
 */
export const auditLogger = {
  logSecurityEvent: (event: {
    type: SecurityEvent['type']
    severity: SecurityEvent['severity']
    userId?: string
    ip?: string
    userAgent?: string
    resource?: string
    details?: Record<string, any>
  }) => {
    return securityAuditLogger.logSecurityEvent(
      event.type,
      event.severity || 'LOW',
      event.details?.description || event.resource || 'Security event',
      {
        userId: event.userId,
        resource: event.resource,
        ...event.details
      },
      event.ip || 'unknown',
      event.userAgent,
      event.userId
    )
  },
  logEvent: (event: {
    type: SecurityEvent['type']
    severity?: SecurityEvent['severity']
    userId?: string
    resource?: string
    action?: string
    metadata?: Record<string, any>
    ipAddress?: string
    userAgent?: string
  }) => {
    return securityAuditLogger.logSecurityEvent(
      event.type,
      event.severity || 'LOW',
      `${event.action || event.type}: ${event.resource || 'Unknown resource'}`,
      {
        action: event.action,
        resource: event.resource,
        ...event.metadata
      },
      event.ipAddress || 'unknown',
      event.userAgent,
      event.userId
    )
  }
}

/**
 * Middleware helper for automatic threat detection
 */
export function detectAndLogThreats(req: NextRequest): boolean {
  const threat = securityAuditLogger.detectThreat(req)
  
  if (threat.isThreat) {
    securityAuditLogger.logSecurityEvent(
      'SUSPICIOUS_REQUEST',
      threat.severity,
      `Threat detected: ${threat.reasons.join(', ')}`,
      {
        confidence: threat.confidence,
        reasons: threat.reasons,
        path: req.nextUrl.pathname,
        method: req.method
      },
      getClientIP(req),
      req.headers.get('user-agent') || undefined
    )
    
    // Block if confidence is very high
    return threat.confidence > 0.8
  }
  
  return false
}