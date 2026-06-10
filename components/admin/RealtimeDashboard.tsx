'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useRealtimeMetrics } from '@/lib/websocket'
import { Building2, Users, FileText, TrendingUp, Mail, Wifi, WifiOff, RefreshCw } from 'lucide-react'

interface DashboardMetrics {
  totalWorkspaces: number
  pendingWorkspaces: number
  totalUsers: number
  scoreRequests: number
  contactSubmissions: number
  connectedUsers: number
}

export function RealtimeDashboard() {
  const { metrics, lastUpdate, isConnected } = useRealtimeMetrics()
  const [displayMetrics, setDisplayMetrics] = useState<DashboardMetrics>({
    totalWorkspaces: 0,
    pendingWorkspaces: 0,
    totalUsers: 0,
    scoreRequests: 0,
    contactSubmissions: 0,
    connectedUsers: 0
  })

  useEffect(() => {
    if (metrics) {
      setDisplayMetrics({
        totalWorkspaces: metrics.totalWorkspaces,
        pendingWorkspaces: 0, // Would need to be added to AdminMetricsUpdate
        totalUsers: metrics.totalUsers,
        scoreRequests: 0, // Would need to be added to AdminMetricsUpdate
        contactSubmissions: 0, // Would need to be added to AdminMetricsUpdate
        connectedUsers: metrics.activeConnections
      })
    }
  }, [metrics])

  // Format last update time
  const formatLastUpdate = (date: Date | null) => {
    if (!date) return 'Never'
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const seconds = Math.floor(diff / 1000)
    const minutes = Math.floor(seconds / 60)
    
    if (seconds < 60) return `${seconds}s ago`
    if (minutes < 60) return `${minutes}m ago`
    return date.toLocaleTimeString()
  }

  const connectionStatus = isConnected ? 'Connected' : 'Disconnected'
  const connectionColor = isConnected ? 'text-green-500' : 'text-red-500'
  const ConnectionIcon = isConnected ? Wifi : WifiOff

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between bg-black border-2 border-gray-800 rounded-lg p-4">
        <div className="flex items-center gap-2">
          <ConnectionIcon className={`h-4 w-4 ${connectionColor}`} />
          <span className="text-sm font-medium">Real-time Status:</span>
          <Badge variant={isConnected ? "default" : "destructive"}>
            {connectionStatus}
          </Badge>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <RefreshCw className="h-4 w-4" />
          <span>Last update: {formatLastUpdate(lastUpdate)}</span>
          {displayMetrics.connectedUsers > 0 && (
            <Badge variant="outline" className="ml-2">
              {displayMetrics.connectedUsers} users online
            </Badge>
          )}
        </div>
      </div>

      {/* Live Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Workspaces"
          value={displayMetrics.totalWorkspaces}
          subtitle={`${displayMetrics.pendingWorkspaces} pending approval`}
          icon={Building2}
          trend={null}
          isLive={true}
        />

        <MetricCard
          title="Total Users" 
          value={displayMetrics.totalUsers}
          subtitle="Active platform users"
          icon={Users}
          trend={null}
          isLive={true}
        />

        <MetricCard
          title="Score Requests"
          value={displayMetrics.scoreRequests}
          subtitle="Pending processing"
          icon={TrendingUp}
          trend={null}
          isLive={true}
          highlight={displayMetrics.scoreRequests > 0}
        />

        <MetricCard
          title="Contact Submissions"
          value={displayMetrics.contactSubmissions}
          subtitle="Unread messages" 
          icon={Mail}
          trend={null}
          isLive={true}
          highlight={displayMetrics.contactSubmissions > 0}
        />
      </div>
    </div>
  )
}

interface MetricCardProps {
  title: string
  value: number
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  trend: { value: number; isPositive: boolean } | null
  isLive?: boolean
  highlight?: boolean
}

function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  isLive = false,
  highlight = false 
}: MetricCardProps) {
  const [isAnimating, setIsAnimating] = useState(false)
  const [prevValue, setPrevValue] = useState(value)

  useEffect(() => {
    if (value !== prevValue) {
      setIsAnimating(true)
      setPrevValue(value)
      const timeout = setTimeout(() => setIsAnimating(false), 500)
      return () => clearTimeout(timeout)
    }
  }, [value, prevValue])

  const cardClasses = `
    bg-black border-2 transition-all duration-300 
    ${highlight ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' : 'border-gray-800 hover:border-yellow-500'}
    ${isAnimating ? 'scale-105' : ''}
  `

  return (
    <Card className={cardClasses}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${highlight ? 'text-yellow-500' : 'text-gray-400'}`} />
          {isLive && (
            <div className="flex items-center gap-1">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-xs text-green-500">LIVE</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold transition-colors duration-300 ${
          isAnimating ? 'text-yellow-500' : 'text-white'
        }`}>
          {value.toLocaleString()}
        </div>
        <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
        
        {trend && (
          <div className={`flex items-center gap-1 mt-2 text-xs ${
            trend.isPositive ? 'text-green-500' : 'text-red-500'
          }`}>
            <span>{trend.isPositive ? '↗' : '↘'}</span>
            <span>{Math.abs(trend.value)}%</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}