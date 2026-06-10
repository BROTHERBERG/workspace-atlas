/**
 * Email service utilities for Workspace Atlas
 * Provides email sending capabilities for contact forms, notifications, and score requests
 */

import { logger, logEmailOperation } from '@/lib/logger'

export interface EmailConfig {
  from: string
  to: string | string[]
  subject: string
  html: string
  text?: string
}

export interface ContactFormEmailData {
  name: string
  email: string
  subject: string
  message: string
  submittedAt: Date
}

export interface ScoreRequestEmailData {
  email: string
  spaceName: string
  websiteUrl?: string
  description?: string
  submittedAt: Date
  requestId: string
}

export interface ScoreCompletedEmailData {
  email: string
  spaceName: string
  score: number
  breakdown: {
    websiteScore: number
    socialMediaScore: number
    contentScore: number
    engagementScore: number
  }
  requestId: string
  completedAt: Date
}

export interface WorkspaceApprovalEmailData {
  email: string
  workspaceName: string
  workspaceId: string
  digitalScore?: number
  approvedAt: Date
  message?: string
}

export interface WelcomeEmailData {
  name: string
  email: string
  userId: string
  registeredAt: Date
}

/**
 * Email service interface
 * Can be implemented with different providers (SendGrid, Nodemailer, etc.)
 */
export interface EmailService {
  sendEmail(config: EmailConfig): Promise<boolean>
  sendContactFormNotification(data: ContactFormEmailData): Promise<boolean>
  sendScoreRequestConfirmation(data: ScoreRequestEmailData): Promise<boolean>
  sendScoreRequestAdminNotification(data: ScoreRequestEmailData): Promise<boolean>
  sendScoreCompletedEmail(data: ScoreCompletedEmailData): Promise<boolean>
  sendWorkspaceApprovalEmail(data: WorkspaceApprovalEmailData): Promise<boolean>
  sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean>
}

/**
 * Mock email service for development
 * Replace with actual email service implementation
 */
export class MockEmailService implements EmailService {
  async sendEmail(config: EmailConfig): Promise<boolean> {
    logEmailOperation('send', config.to, {
      from: config.from,
      subject: config.subject,
      preview: config.text?.substring(0, 100) || config.html.substring(0, 100)
    })
    
    // Simulate email sending delay
    await new Promise(resolve => setTimeout(resolve, 100))
    
    logger.info('Mock email sent successfully', {
      to: Array.isArray(config.to) ? config.to : [config.to],
      subject: config.subject
    })
    
    return true
  }

  async sendContactFormNotification(data: ContactFormEmailData): Promise<boolean> {
    const html = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${data.name}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      <p><strong>Subject:</strong> ${data.subject}</p>
      <p><strong>Message:</strong></p>
      <blockquote>${data.message}</blockquote>
      <p><small>Submitted: ${data.submittedAt.toLocaleString()}</small></p>
    `

    return this.sendEmail({
      from: process.env.SMTP_FROM || 'noreply@workspaceatlas.com',
      to: process.env.ADMIN_EMAIL || 'admin@workspaceatlas.com',
      subject: `New Contact Form: ${data.subject}`,
      html,
      text: `New contact form submission from ${data.name} (${data.email}): ${data.message}`
    })
  }

  async sendScoreRequestConfirmation(data: ScoreRequestEmailData): Promise<boolean> {
    const html = `
      <h2>Digital Score Request Confirmed</h2>
      <p>Hi there!</p>
      <p>We've received your request to score <strong>${data.spaceName}</strong>.</p>
      ${data.websiteUrl ? `<p><strong>Website:</strong> <a href="${data.websiteUrl}">${data.websiteUrl}</a></p>` : ''}
      ${data.description ? `<p><strong>Description:</strong> ${data.description}</p>` : ''}
      <p>Our team will analyze your workspace's digital presence and provide a comprehensive score within 2-3 business days.</p>
      <p>You'll receive another email when your digital score is ready!</p>
      <p>Best regards,<br>The Workspace Atlas Team</p>
      <hr>
      <p><small>Reference ID: ${data.requestId}</small></p>
    `

    return this.sendEmail({
      from: process.env.SMTP_FROM || 'noreply@workspaceatlas.com',
      to: data.email,
      subject: `Digital Score Request Confirmed - ${data.spaceName}`,
      html,
      text: `Your digital score request for ${data.spaceName} has been confirmed. We'll analyze your workspace and send results within 2-3 business days. Reference ID: ${data.requestId}`
    })
  }

  async sendScoreRequestAdminNotification(data: ScoreRequestEmailData): Promise<boolean> {
    const html = `
      <h2>New Digital Score Request</h2>
      <p><strong>Space Name:</strong> ${data.spaceName}</p>
      <p><strong>Email:</strong> ${data.email}</p>
      ${data.websiteUrl ? `<p><strong>Website:</strong> <a href="${data.websiteUrl}" target="_blank">${data.websiteUrl}</a></p>` : ''}
      ${data.description ? `<p><strong>Description:</strong></p><blockquote>${data.description}</blockquote>` : ''}
      <p><strong>Submitted:</strong> ${data.submittedAt.toLocaleString()}</p>
      <p><strong>Request ID:</strong> ${data.requestId}</p>
      <hr>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/score-requests/${data.requestId}">View in Admin Dashboard</a></p>
    `

    return this.sendEmail({
      from: process.env.SMTP_FROM || 'noreply@workspaceatlas.com',
      to: process.env.ADMIN_EMAIL || 'admin@workspaceatlas.com',
      subject: `New Score Request: ${data.spaceName}`,
      html,
      text: `New digital score request from ${data.email} for ${data.spaceName}. Request ID: ${data.requestId}`
    })
  }

  async sendScoreCompletedEmail(data: ScoreCompletedEmailData): Promise<boolean> {
    const html = `
      <h2>Your Digital Score is Ready! 🎯</h2>
      <p>Great news! We've completed the digital analysis for <strong>${data.spaceName}</strong>.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #f9cb16; margin-top: 0;">Digital Score: ${data.score}/100</h3>
        
        <h4>Score Breakdown:</h4>
        <ul>
          <li><strong>Website Quality:</strong> ${data.breakdown.websiteScore}/25</li>
          <li><strong>Social Media Presence:</strong> ${data.breakdown.socialMediaScore}/25</li>
          <li><strong>Content Quality:</strong> ${data.breakdown.contentScore}/25</li>
          <li><strong>User Engagement:</strong> ${data.breakdown.engagementScore}/25</li>
        </ul>
      </div>
      
      <p>Want to improve your score? <a href="${process.env.NEXT_PUBLIC_APP_URL}/improve-score?request=${data.requestId}">Get personalized recommendations</a></p>
      
      <p>Ready to showcase your space? <a href="${process.env.NEXT_PUBLIC_APP_URL}/submit-workspace">Submit your workspace to our directory</a></p>
      
      <p>Best regards,<br>The Workspace Atlas Team</p>
      <hr>
      <p><small>Reference ID: ${data.requestId} | Completed: ${data.completedAt.toLocaleString()}</small></p>
    `

    return this.sendEmail({
      from: process.env.SMTP_FROM || 'noreply@workspaceatlas.com',
      to: data.email,
      subject: `Your Digital Score is Ready - ${data.spaceName} scored ${data.score}/100`,
      html,
      text: `Your digital score for ${data.spaceName} is ready! Score: ${data.score}/100. View details and get improvement recommendations at ${process.env.NEXT_PUBLIC_APP_URL}`
    })
  }

  async sendWorkspaceApprovalEmail(data: WorkspaceApprovalEmailData): Promise<boolean> {
    const html = `
      <h2>Workspace Approved! ✅</h2>
      <p>Congratulations! Your workspace <strong>${data.workspaceName}</strong> has been approved and is now live on Workspace Atlas.</p>
      
      ${data.digitalScore ? `<p><strong>Digital Score:</strong> ${data.digitalScore}/100</p>` : ''}
      ${data.message ? `<blockquote style="background: #f5f5f5; padding: 15px; border-left: 4px solid #f9cb16; margin: 10px 0;">${data.message}</blockquote>` : ''}
      
      <p><strong>What's next?</strong></p>
      <ul>
        <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/spaces/${data.workspaceId}">View your workspace listing</a></li>
        <li><a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard/workspaces/${data.workspaceId}">Manage your listing</a></li>
        <li>Share your listing on social media</li>
        <li>Update your workspace details anytime</li>
      </ul>
      
      <p>Thank you for joining the Workspace Atlas community!</p>
      
      <p>Best regards,<br>The Workspace Atlas Team</p>
      <hr>
      <p><small>Approved: ${data.approvedAt.toLocaleString()}</small></p>
    `

    return this.sendEmail({
      from: process.env.SMTP_FROM || 'noreply@workspaceatlas.com',
      to: data.email,
      subject: `Workspace Approved - ${data.workspaceName} is now live!`,
      html,
      text: `Great news! Your workspace ${data.workspaceName} has been approved and is now live on Workspace Atlas. View it at ${process.env.NEXT_PUBLIC_APP_URL}/spaces/${data.workspaceId}`
    })
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    const html = `
      <h2>Welcome to Workspace Atlas! 🏢</h2>
      <p>Hi ${data.name},</p>
      <p>Welcome to the world's most comprehensive coworking directory! We're excited to have you join our community of workspace enthusiasts.</p>
      
      <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Get Started:</h3>
        <ul>
          <li>🔍 <a href="${process.env.NEXT_PUBLIC_APP_URL}/directory">Explore thousands of workspaces</a></li>
          <li>🎯 <a href="${process.env.NEXT_PUBLIC_APP_URL}/score-my-space">Get your digital score</a></li>
          <li>📱 <a href="${process.env.NEXT_PUBLIC_APP_URL}/haven-passport">Start your Haven Passport journey</a></li>
          <li>🏆 <a href="${process.env.NEXT_PUBLIC_APP_URL}/leaderboard">Check out the top-rated spaces</a></li>
        </ul>
      </div>
      
      <p><strong>Pro tip:</strong> Complete your profile to get personalized workspace recommendations!</p>
      
      <p>Questions? Just reply to this email or check out our <a href="${process.env.NEXT_PUBLIC_APP_URL}/help">Help Center</a>.</p>
      
      <p>Find your perfect space!<br>The Workspace Atlas Team</p>
      
      <hr>
      <p><small>Account created: ${data.registeredAt.toLocaleString()}</small></p>
    `

    return this.sendEmail({
      from: process.env.SMTP_FROM || 'noreply@workspaceatlas.com',
      to: data.email,
      subject: `Welcome to Workspace Atlas, ${data.name}!`,
      html,
      text: `Welcome to Workspace Atlas, ${data.name}! Explore thousands of workspaces, get your digital score, and find your perfect space. Get started at ${process.env.NEXT_PUBLIC_APP_URL}`
    })
  }
}

// Global email service instance
export const emailService = new MockEmailService()

// Convenience export functions for backward compatibility
export const sendScoreCompletedEmail = (data: ScoreCompletedEmailData) => emailService.sendScoreCompletedEmail(data)
export const sendWorkspaceApprovalEmail = (data: WorkspaceApprovalEmailData) => emailService.sendWorkspaceApprovalEmail(data)
export const sendWelcomeEmail = (data: WelcomeEmailData) => emailService.sendWelcomeEmail(data)