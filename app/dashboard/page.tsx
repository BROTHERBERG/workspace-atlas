import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Users, 
  MapPin, 
  Star, 
  Award, 
  Calendar,
  TrendingUp,
  Building,
  MessageCircle,
} from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Dashboard - Workscape Atlas',
  description: 'Your personal dashboard',
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    redirect('/auth/signin')
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      havenPassport: {
        include: {
          visits: {
            take: 3,
            orderBy: { visitDate: 'desc' },
          },
          achievements: {
            take: 3,
            orderBy: { unlockedAt: 'desc' },
          },
        },
      },
      reviews: {
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
        },
      },
      bookings: {
        take: 3,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
        },
      },
      workspaces: {
        where: {
          status: 'ACTIVE',
        },
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
      contactForms: {
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
      scoreRequests: {
        take: 3,
        orderBy: { createdAt: 'desc' },
      },
    },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  const isSpaceOwner = user.role === 'SPACE_OWNER' || user.role === 'ADMIN'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Welcome Header */}
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user.name}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your account.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {user.havenPassport && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Haven Points</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.havenPassport.points}</div>
                <p className="text-xs text-muted-foreground">
                  {user.havenPassport.tier} tier
                </p>
              </CardContent>
            </Card>
          )}
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reviews Written</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.reviews.length}</div>
              <p className="text-xs text-muted-foreground">
                Helping the community
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{user.bookings.length}</div>
              <p className="text-xs text-muted-foreground">
                Workspaces visited
              </p>
            </CardContent>
          </Card>

          {isSpaceOwner && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Your Spaces</CardTitle>
                <Building className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{user.workspaces.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active listings
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Recent Activity</span>
              </CardTitle>
              <CardDescription>Your latest interactions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {user.reviews.slice(0, 2).map((review) => (
                  <div key={review.id} className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow/20">
                      <Star className="h-4 w-4 text-yellow-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">Reviewed {review.workspace.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
                
                {user.bookings.slice(0, 2).map((booking) => (
                  <div key={booking.id} className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100">
                      <Calendar className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">Booked {booking.workspace.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(booking.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                {user.havenPassport?.achievements.slice(0, 1).map((achievement) => (
                  <div key={achievement.id} className="flex items-center space-x-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100">
                      <Award className="h-4 w-4 text-green-600" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm">Unlocked "{achievement.title}"</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}

                {user.reviews.length === 0 && user.bookings.length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    No recent activity. Start exploring workspaces!
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-4 border-t">
                <Button variant="outline" size="sm" asChild>
                  <Link href="/directory">Explore Workspaces</Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Haven Passport or Space Management */}
          {isSpaceOwner ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Your Spaces</span>
                </CardTitle>
                <CardDescription>Manage your coworking spaces</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {user.workspaces.map((workspace) => (
                    <div key={workspace.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{workspace.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {workspace.city}, {workspace.country}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={workspace.featured ? 'default' : 'secondary'}>
                          {workspace.featured ? 'Featured' : 'Standard'}
                        </Badge>
                        {workspace.digitalScore && (
                          <Badge variant="outline">
                            Score: {workspace.digitalScore}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {user.workspaces.length === 0 && (
                    <p className="text-center text-sm text-muted-foreground">
                      No spaces listed yet.
                    </p>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t flex space-x-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/spaces/new">Add Space</Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/admin/spaces">Manage Spaces</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            user.havenPassport && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Award className="h-5 w-5" />
                    <span>Haven Passport</span>
                  </CardTitle>
                  <CardDescription>Your travel progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Current Tier</span>
                      <Badge>{user.havenPassport.tier}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Points</span>
                      <span className="font-bold">{user.havenPassport.points}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Spaces Visited</span>
                      <span className="font-bold">{user.havenPassport.totalVisits}</span>
                    </div>

                    {user.havenPassport.achievements.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-sm font-medium">Recent Achievements</span>
                        {user.havenPassport.achievements.slice(0, 2).map((achievement) => (
                          <div key={achievement.id} className="text-sm">
                            <div className="flex items-center space-x-2">
                              <Award className="h-3 w-3 text-yellow-600" />
                              <span>{achievement.title}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-4 border-t">
                    <Button variant="outline" size="sm" asChild>
                      <Link href="/haven-passport">View Full Passport</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Button variant="outline" asChild>
                <Link href="/directory">
                  <MapPin className="mr-2 h-4 w-4" />
                  Find Workspace
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/score-my-space">
                  <TrendingUp className="mr-2 h-4 w-4" />
                  Score My Space
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/profile">
                  <Users className="mr-2 h-4 w-4" />
                  Edit Profile
                </Link>
              </Button>
              
              <Button variant="outline" asChild>
                <Link href="/contact">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contact Support
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}