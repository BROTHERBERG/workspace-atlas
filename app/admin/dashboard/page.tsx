import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { TrendingUp, Award, Mail, Settings, BarChart3, Bell } from 'lucide-react'
import { RealtimeDashboard } from '@/components/admin/RealtimeDashboard'
import { LiveActivityFeed } from '@/components/admin/LiveActivityFeed'
import DataQualityDashboard from '@/components/admin/DataQualityDashboard'
import { AnalyticsQuickStats, TopPerformingWorkspaces, RevenueBreakdown, AnalyticsInsights } from '@/components/analytics/AnalyticsWidgets'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user?.role !== 'ADMIN') {
    redirect('/auth/login')
  }

  // Fetch dashboard metrics
  const [
    _totalWorkspaces,
    _pendingWorkspaces,
    _totalUsers,
    _totalReviews,
    scoreRequests,
    contactSubmissions
  ] = await Promise.all([
    prisma.workspace.count(),
    prisma.workspace.count({ where: { status: 'PENDING' } }),
    prisma.user.count(),
    prisma.review.count(),
    prisma.scoreRequest.count({ where: { status: 'PENDING' } }),
    prisma.contactSubmission.count({ where: { status: 'UNREAD' } })
  ])

  const recentWorkspaces = await prisma.workspace.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { user: true }
  })

  const recentUsers = await prisma.user.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-cal mb-2">Admin Dashboard</h1>
        <p className="text-gray-400">Manage workspaces, users, and platform operations</p>
      </div>

      {/* Real-time Metrics */}
      <RealtimeDashboard />

      {/* Analytics Quick Stats */}
      <div className="mb-8">
        <AnalyticsQuickStats period="week" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <div className="lg:col-span-2 space-y-6">
          <TopPerformingWorkspaces limit={5} period="week" />
          <RevenueBreakdown period="month" />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <LiveActivityFeed />
          <AnalyticsInsights period="week" />
        </div>
      </div>

      {/* Management Tabs */}
      <Tabs defaultValue="workspaces" className="space-y-4">
        <TabsList className="bg-gray-900 border-2 border-gray-800">
          <TabsTrigger value="workspaces">Workspaces</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="requests">Requests</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="data-quality">Data Quality</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="workspaces" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-cal">Recent Workspaces</h2>
            <Link href="/admin/workspaces">
              <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                Manage All Workspaces
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentWorkspaces.map((workspace) => (
              <Card key={workspace.id} className="bg-black border-2 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{workspace.name}</CardTitle>
                      <CardDescription>
                        {workspace.city}, {workspace.country} • Added by {workspace.user?.name || 'System'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/spaces/${workspace.id}/edit`}>
                        <Button size="sm" variant="outline">Edit</Button>
                      </Link>
                      <Button 
                        size="sm" 
                        variant="outline"
                        className={workspace.status === 'PENDING' ? 'border-yellow-500 text-yellow-500' : ''}
                      >
                        {workspace.status}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-cal">Recent Users</h2>
            <Link href="/admin/users">
              <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                Manage All Users
              </Button>
            </Link>
          </div>
          
          <div className="space-y-4">
            {recentUsers.map((user) => (
              <Card key={user.id} className="bg-black border-2 border-gray-800">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{user.name || 'Unnamed User'}</CardTitle>
                      <CardDescription>
                        {user.email} • Role: {user.role}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`/admin/users/${user.id}`}>
                        <Button size="sm" variant="outline">View</Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-cal">Analytics Overview</h2>
            <Link href="/admin/analytics">
              <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                <BarChart3 className="h-4 w-4 mr-2" />
                Full Analytics Dashboard
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <TopPerformingWorkspaces limit={8} period="month" />
            <RevenueBreakdown period="quarter" />
          </div>
        </TabsContent>

        <TabsContent value="requests" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-black border-2 border-gray-800">
              <CardHeader>
                <CardTitle>Score Requests</CardTitle>
                <CardDescription>{scoreRequests} pending requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/score-requests">
                  <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
                    Process Score Requests
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="bg-black border-2 border-gray-800">
              <CardHeader>
                <CardTitle>Contact Submissions</CardTitle>
                <CardDescription>{contactSubmissions} unread messages</CardDescription>
              </CardHeader>
              <CardContent>
                <Link href="/admin/contact-submissions">
                  <Button className="w-full bg-yellow-500 text-black hover:bg-yellow-400">
                    View Messages
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-cal">System Notifications</h2>
            <Link href="/notifications">
              <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                <Bell className="h-4 w-4 mr-2" />
                View All Notifications
              </Button>
            </Link>
          </div>
          
          <Card className="bg-black border-2 border-gray-800">
            <CardContent className="p-6">
              <NotificationCenter variant="inline" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data-quality" className="space-y-4">
          <DataQualityDashboard />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card className="bg-black border-2 border-gray-800">
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure global platform settings and features</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link href="/admin/settings/scoring">
                <Button variant="outline" className="w-full justify-start">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  Digital Scoring Configuration
                </Button>
              </Link>
              <Link href="/admin/settings/passport">
                <Button variant="outline" className="w-full justify-start">
                  <Award className="h-4 w-4 mr-2" />
                  Haven Passport Settings
                </Button>
              </Link>
              <Link href="/admin/settings/email">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Integration
                </Button>
              </Link>
              <Link href="/admin/settings/general">
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="h-4 w-4 mr-2" />
                  General Settings
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}