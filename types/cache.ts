// Cache data type definitions
export interface WorkspaceData {
  id: string
  name: string
  description: string
  location: {
    address: string
    city: string
    country: string
    coordinates: [number, number]
  }
  amenities: string[]
  pricing: {
    hotDesk: number
    dedicatedDesk: number
    privateOffice: number
  }
  digitalScore: number
  images: string[]
  website?: string
  socialMedia?: {
    twitter?: string
    instagram?: string
    linkedin?: string
  }
  createdAt: Date
  updatedAt: Date
}

export interface UserSessionData {
  id: string
  email: string
  name: string
  role: 'USER' | 'ADMIN'
  lastActivity: Date
  preferences?: {
    theme?: 'light' | 'dark'
    notifications?: boolean
    location?: string
  }
}

export interface SearchResultsData {
  workspaces: WorkspaceData[]
  totalCount: number
  filters: {
    maxPrice?: number
    minScore?: number
    amenities?: string[]
    types?: string[]
    location?: string
  }
  generatedAt: Date
}

export interface DashboardMetricsData {
  totalWorkspaces: number
  totalUsers: number
  totalScoreRequests: number
  averageDigitalScore: number
  recentActivity: ActivityItem[]
  topPerformingSpaces: WorkspaceData[]
  generatedAt: Date
}

export interface ActivityItem {
  id: string
  type: 'workspace_created' | 'score_completed' | 'user_registered' | 'admin_action'
  description: string
  timestamp: Date
  metadata?: Record<string, unknown>
}

// Redis socket configuration interface
export interface RedisSocketOptions {
  connectTimeout: number
  lazyConnect?: boolean
  retryDelayOnFailover?: number
  enableReadyCheck?: boolean
  maxRetriesPerRequest?: number
}