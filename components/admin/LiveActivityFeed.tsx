'use client'

import { useRealtimeActivity } from '@/lib/websocket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  UserPlus, 
  Building, 
  Star, 
  TrendingUp, 
  Award,
  Activity,
  Wifi,
  WifiOff 
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const activityIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  user_joined: UserPlus,
  workspace_added: Building,
  review_posted: Star,
  score_completed: TrendingUp,
  achievement_unlocked: Award,
}

export function LiveActivityFeed() {
  const { activities, isConnected } = useRealtimeActivity()

  return (
    <Card className="bg-black border-2 border-gray-800 h-[400px]">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-yellow-500" />
              Live Activity Feed
            </CardTitle>
            <CardDescription>Real-time platform activity</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-500" />
                <Badge className="bg-green-950 text-green-50 border-green-500">
                  Live
                </Badge>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-red-500" />
                <Badge variant="destructive">
                  Offline
                </Badge>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-0">
        <ScrollArea className="h-[300px] px-6">
          {activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-8">
              <Activity className="h-8 w-8 text-gray-600 mb-2" />
              <p className="text-sm text-gray-400">
                {isConnected ? 'Waiting for activity...' : 'Connect to see live activity'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {activities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

interface ActivityItemProps {
  activity: {
    id: string
    type: string
    description: string
    timestamp?: string | Date
    userId?: string
    userName?: string
  }
}

function ActivityItem({ activity }: ActivityItemProps) {
  const IconComponent = activityIcons[activity.type] || Activity
  const timestamp = activity.timestamp ? new Date(activity.timestamp) : new Date()

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'user_joined':
        return 'text-blue-500'
      case 'workspace_added':
        return 'text-green-500'
      case 'review_posted':
        return 'text-yellow-500'
      case 'score_completed':
        return 'text-purple-500'
      case 'achievement_unlocked':
        return 'text-orange-500'
      default:
        return 'text-gray-400'
    }
  }

  const getActivityBg = (type: string) => {
    switch (type) {
      case 'user_joined':
        return 'bg-blue-950 border-blue-500'
      case 'workspace_added':
        return 'bg-green-950 border-green-500'
      case 'review_posted':
        return 'bg-yellow-950 border-yellow-500'
      case 'score_completed':
        return 'bg-purple-950 border-purple-500'
      case 'achievement_unlocked':
        return 'bg-orange-950 border-orange-500'
      default:
        return 'bg-gray-950 border-gray-500'
    }
  }

  return (
    <div className={`
      flex items-start gap-3 p-3 rounded-lg border transition-all
      ${getActivityBg(activity.type)} hover:scale-[1.02]
    `}>
      <div className={`
        flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center
        ${getActivityBg(activity.type)}
      `}>
        <IconComponent className={`h-4 w-4 ${getActivityColor(activity.type)}`} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm text-white truncate">
          {activity.description}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {formatDistanceToNow(timestamp, { addSuffix: true })}
        </p>
      </div>
    </div>
  )
}