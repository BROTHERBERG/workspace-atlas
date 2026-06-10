// WebSocket event type definitions

export interface AdminMetricsUpdate {
  totalWorkspaces: number
  totalUsers: number
  activeConnections: number
  recentActivity: number
  timestamp: Date
}

export interface AdminNewSubmission {
  submissionId: string
  type: 'SCORE_REQUEST' | 'CONTACT' | 'WORKSPACE_SUBMISSION'
  userEmail: string
  workspaceName?: string
  timestamp: Date
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED'
}

export interface UserAchievementUnlocked {
  achievementId: string
  achievementName: string
  achievementDescription: string
  pointsEarned: number
  badgeImageUrl?: string
  unlockedAt: Date
}

export interface UserScoreCompleted {
  scoreRequestId: string
  workspaceId: string
  workspaceName: string
  score: number
  breakdown: {
    websiteScore: number
    socialMediaScore: number
    contentScore: number
    engagementScore: number
  }
  completedAt: Date
}

export interface UserWorkspaceApproved {
  workspaceId: string
  workspaceName: string
  approvedBy: string
  approvedAt: Date
  digitalScore?: number
  message?: string
}

export interface ActivityUpdate {
  id: string
  type: 'workspace_created' | 'user_registered' | 'score_completed' | 'admin_action'
  description: string
  userId?: string
  userName?: string
  workspaceId?: string
  workspaceName?: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface NotificationData {
  id: number
  type: 'achievement' | 'score' | 'approval' | 'info' | 'warning'
  title: string
  message: string
  timestamp: Date
  data: UserAchievementUnlocked | UserScoreCompleted | UserWorkspaceApproved | Record<string, unknown>
}

// WebSocket connection auth
export interface WebSocketAuth {
  userId?: string
  userRole?: 'USER' | 'ADMIN'
}

// Room join data
export interface WebSocketJoinData extends WebSocketAuth {
  roomId?: string
}