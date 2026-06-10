'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { MoreVertical, Play, CheckCircle, XCircle, TrendingUp, FileText } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface ScoreRequestActionsProps {
  request: {
    id: string
    status: string
    score: number | null
    notes: string | null
    websiteUrl: string | null
  }
}

export default function ScoreRequestActions({ request }: ScoreRequestActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false)
  const [score, setScore] = useState(request.score?.toString() || '')
  const [notes, setNotes] = useState(request.notes || '')

  const updateStatus = async (status: string, scoreData?: { score?: number; notes?: string }) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/score-requests/${request.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, ...scoreData })
      })

      if (!res.ok) throw new Error('Failed to update status')
      
      toast.success(`Request marked as ${status.toLowerCase()}`)
      router.refresh()
      setScoreDialogOpen(false)
    } catch (error) {
      toast.error('Failed to update request status')
    } finally {
      setLoading(false)
    }
  }

  const processScore = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/score-requests/${request.id}/process`, {
        method: 'POST'
      })

      if (!res.ok) throw new Error('Failed to process score')
      
      toast.success('Score processing started')
      router.refresh()
    } catch (error) {
      toast.error('Failed to start score processing')
    } finally {
      setLoading(false)
    }
  }

  const handleScoreSubmit = () => {
    const scoreNumber = parseInt(score)
    if (isNaN(scoreNumber) || scoreNumber < 0 || scoreNumber > 100) {
      toast.error('Score must be a number between 0 and 100')
      return
    }
    
    updateStatus('COMPLETED', { score: scoreNumber, notes })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={loading}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-black border-gray-800">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-gray-800" />
          
          {request.status === 'PENDING' && (
            <>
              <DropdownMenuItem onClick={processScore}>
                <Play className="h-4 w-4 mr-2 text-blue-500" />
                Start Processing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => updateStatus('PROCESSING')}>
                <TrendingUp className="h-4 w-4 mr-2 text-blue-500" />
                Mark Processing
              </DropdownMenuItem>
            </>
          )}
          
          {(request.status === 'PENDING' || request.status === 'PROCESSING') && (
            <>
              <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
                <DialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                    Complete with Score
                  </DropdownMenuItem>
                </DialogTrigger>
              </Dialog>
              
              <DropdownMenuItem onClick={() => updateStatus('FAILED')}>
                <XCircle className="h-4 w-4 mr-2 text-red-500" />
                Mark Failed
              </DropdownMenuItem>
            </>
          )}
          
          <DropdownMenuSeparator className="bg-gray-800" />
          
          <DropdownMenuItem>
            <FileText className="h-4 w-4 mr-2" />
            View Details
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="bg-black border-gray-800">
          <DialogHeader>
            <DialogTitle>Complete Score Request</DialogTitle>
            <DialogDescription>
              Enter the digital score and any notes for this workspace
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="score">Digital Score (0-100)</Label>
              <Input
                id="score"
                type="number"
                min="0"
                max="100"
                value={score}
                onChange={(e) => setScore(e.target.value)}
                placeholder="85"
                className="bg-gray-900 border-gray-800"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Analysis notes, recommendations, or scoring breakdown..."
                rows={4}
                className="bg-gray-900 border-gray-800"
              />
            </div>
            
            <div className="text-sm text-gray-400">
              <p><strong>Website:</strong> {request.websiteUrl}</p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setScoreDialogOpen(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleScoreSubmit}
              disabled={loading}
              className="bg-yellow-500 text-black hover:bg-yellow-400"
            >
              Complete Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}