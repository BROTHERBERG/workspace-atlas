'use client'

import { useEffect, useState } from 'react'
import { useWebSocket } from '@/lib/websocket'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Play, Pause, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import { showSuccessToast, showErrorToast } from '@/hooks/use-toast'

interface ScoreProcessingStatus {
  requestId: string
  progress: number
  status: 'pending' | 'processing' | 'completed' | 'failed'
  timestamp: Date
}

export function LiveScoreTracker() {
  const { subscribe, emit, isConnected } = useWebSocket()
  const [processingRequests, setProcessingRequests] = useState<Map<string, ScoreProcessingStatus>>(new Map())

  useEffect(() => {
    const unsubscribes = [
      subscribe('score:processing_started', (data: any) => {
        setProcessingRequests(prev => new Map(prev.set(data.requestId, {
          requestId: data.requestId,
          progress: 0,
          status: 'processing',
          timestamp: new Date(data.timestamp)
        })))
      }),

      subscribe('score:processing_progress', (data: any) => {
        setProcessingRequests(prev => {
          const current = prev.get(data.requestId)
          if (current) {
            return new Map(prev.set(data.requestId, {
              ...current,
              progress: data.progress,
              timestamp: new Date(data.timestamp)
            }))
          }
          return prev
        })
      }),

      subscribe('score:processing_completed', (data: any) => {
        setProcessingRequests(prev => {
          const current = prev.get(data.requestId)
          if (current) {
            const updated = new Map(prev.set(data.requestId, {
              ...current,
              progress: 100,
              status: 'completed',
              timestamp: new Date(data.timestamp)
            }))
            
            // Remove completed requests after 5 seconds
            setTimeout(() => {
              setProcessingRequests(prev => {
                const newMap = new Map(prev)
                newMap.delete(data.requestId)
                return newMap
              })
            }, 5000)
            
            showSuccessToast(
              'Score Analysis Complete',
              `Request ${data.requestId.slice(-8)} finished processing`
            )
            
            return updated
          }
          return prev
        })
      }),

      subscribe('score:processing_failed', (data: any) => {
        setProcessingRequests(prev => {
          const current = prev.get(data.requestId)
          if (current) {
            const updated = new Map(prev.set(data.requestId, {
              ...current,
              status: 'failed',
              timestamp: new Date(data.timestamp)
            }))
            
            // Remove failed requests after 10 seconds
            setTimeout(() => {
              setProcessingRequests(prev => {
                const newMap = new Map(prev)
                newMap.delete(data.requestId)
                return newMap
              })
            }, 10000)
            
            showErrorToast(
              'Score Analysis Failed',
              `Request ${data.requestId.slice(-8)} encountered an error`
            )
            
            return updated
          }
          return prev
        })
      })
    ]

    return () => {
      unsubscribes.forEach(fn => fn())
    }
  }, [subscribe])

  const startMockProcessing = () => {
    const mockRequestId = `req_${Date.now()}`
    emit('admin:start_score_processing', { requestId: mockRequestId })
  }

  const processingArray = Array.from(processingRequests.values())

  return (
    <Card className="bg-black border-2 border-gray-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-yellow-500" />
            <CardTitle>Live Score Processing</CardTitle>
          </div>
          <Button 
            onClick={startMockProcessing}
            size="sm"
            className="bg-yellow-500 text-black hover:bg-yellow-400"
            disabled={!isConnected}
          >
            <Play className="h-4 w-4 mr-2" />
            Test Processing
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {processingArray.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Clock className="h-8 w-8 mx-auto mb-2" />
            <p>No active score processing</p>
            {isConnected && (
              <p className="text-xs mt-1">Click "Test Processing" to see live updates</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {processingArray.map((request) => (
              <ProcessingItem key={request.requestId} request={request} />
            ))}
          </div>
        )}
        
        {!isConnected && (
          <div className="text-center py-4 text-red-400">
            <AlertCircle className="h-6 w-6 mx-auto mb-2" />
            <p className="text-sm">Not connected to real-time server</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface ProcessingItemProps {
  request: ScoreProcessingStatus
}

function ProcessingItem({ request }: ProcessingItemProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processing':
        return 'border-blue-500 bg-blue-950'
      case 'completed':
        return 'border-green-500 bg-green-950'
      case 'failed':
        return 'border-red-500 bg-red-950'
      default:
        return 'border-gray-500 bg-gray-950'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <TrendingUp className="h-4 w-4 text-blue-500 animate-pulse" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  return (
    <div className={`border-2 rounded-lg p-4 transition-all ${getStatusColor(request.status)}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon(request.status)}
          <span className="font-mono text-sm">
            Request {request.requestId.slice(-8)}
          </span>
        </div>
        <Badge variant="outline" className="capitalize">
          {request.status}
        </Badge>
      </div>
      
      {request.status === 'processing' && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{request.progress}%</span>
          </div>
          <Progress value={request.progress} className="h-2" />
        </div>
      )}
      
      <div className="text-xs text-gray-400 mt-2">
        {request.timestamp.toLocaleTimeString()}
      </div>
    </div>
  )
}