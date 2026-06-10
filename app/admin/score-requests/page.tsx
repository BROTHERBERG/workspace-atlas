import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { RequestStatus } from '@prisma/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ExternalLink, CheckCircle, XCircle, Clock, TrendingUp } from 'lucide-react'
import ScoreRequestActions from '@/components/admin/ScoreRequestActions'
import { LiveScoreTracker } from '@/components/admin/LiveScoreTracker'
import Link from 'next/link'

export default async function AdminScoreRequests() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  const scoreRequests = await prisma.scoreRequest.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      user: true,
      workspace: true
    }
  })

  const stats = {
    total: scoreRequests.length,
    pending: scoreRequests.filter(r => r.status === RequestStatus.PENDING).length,
    processing: scoreRequests.filter(r => r.status === RequestStatus.PROCESSING).length,
    completed: scoreRequests.filter(r => r.status === RequestStatus.COMPLETED).length,
    failed: scoreRequests.filter(r => r.status === RequestStatus.FAILED).length
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-cal mb-2">Score Requests</h1>
        <p className="text-gray-400">Process workspace digital scoring requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Pending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Processing</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.processing}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          </CardContent>
        </Card>
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Failed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Processing & Bulk Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <LiveScoreTracker />
        
        <Card className="bg-black border-2 border-gray-800">
          <CardHeader>
            <CardTitle>Bulk Actions</CardTitle>
            <CardDescription>Process multiple requests at once</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
              <TrendingUp className="h-4 w-4 mr-2" />
              Process All Pending
            </Button>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline">
                <CheckCircle className="h-4 w-4 mr-2" />
                Complete Selected
              </Button>
              <Button variant="outline">
                <XCircle className="h-4 w-4 mr-2" />
                Fail Selected
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Score Requests List */}
      <div className="space-y-4">
        {scoreRequests.map((request) => (
          <Card key={request.id} className="bg-black border-2 border-gray-800 hover:border-yellow-500 transition-colors">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle>
                      {request.workspace ? request.workspace.name : 'Unknown Workspace'}
                    </CardTitle>
                    <Badge
                      variant={
                        request.status === 'COMPLETED' ? 'default' :
                        request.status === 'PROCESSING' ? 'secondary' :
                        request.status === 'FAILED' ? 'destructive' :
                        'outline'
                      }
                      className={
                        request.status === 'PENDING' ? 'border-yellow-500 text-yellow-500' :
                        request.status === 'PROCESSING' ? 'border-blue-500 text-blue-500' :
                        ''
                      }
                    >
                      {request.status === 'PENDING' && <Clock className="h-3 w-3 mr-1" />}
                      {request.status === 'PROCESSING' && <TrendingUp className="h-3 w-3 mr-1" />}
                      {request.status === 'COMPLETED' && <CheckCircle className="h-3 w-3 mr-1" />}
                      {request.status === 'FAILED' && <XCircle className="h-3 w-3 mr-1" />}
                      {request.status}
                    </Badge>
                  </div>
                  <CardDescription>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span>Requested by: {request.user?.name || 'Unknown'} ({request.user?.email})</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span>Website: {request.websiteUrl || 'Not provided'}</span>
                        {request.websiteUrl && (
                          <Link href={request.websiteUrl} target="_blank" rel="noopener noreferrer">
                            <Button size="sm" variant="ghost" className="h-auto p-1">
                              <ExternalLink className="h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                      {request.socialMediaUrls && request.socialMediaUrls.length > 0 && (
                        <div>Social Media: {request.socialMediaUrls.join(', ')}</div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Submitted: {new Date(request.createdAt).toLocaleDateString()}</span>
                        {request.completedAt && (
                          <span>Completed: {new Date(request.completedAt).toLocaleDateString()}</span>
                        )}
                        {request.score && (
                          <span className="text-yellow-500">Score: {request.score}/100</span>
                        )}
                      </div>
                    </div>
                  </CardDescription>
                </div>
                <ScoreRequestActions request={request} />
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>

      {scoreRequests.length === 0 && (
        <Card className="bg-black border-2 border-gray-800">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <TrendingUp className="h-12 w-12 text-gray-600 mb-4" />
            <h3 className="text-xl font-cal mb-2">No Score Requests</h3>
            <p className="text-gray-400">All requests have been processed</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}