import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import {
  Award,
  MapPin,
  Star,
  Trophy,
  Globe,
  MessageSquare,
  Calendar
} from 'lucide-react'

export default async function HavenPassportPage() {
  const session = await getServerSession(authOptions)

  if (!session) {
    redirect('/auth/login?callbackUrl=/haven-passport')
  }

  // Get or create user's passport
  let passport = await prisma.havenPassport.findUnique({
    where: { userId: session.user.id },
    include: {
      achievements: {
        orderBy: { unlockedAt: 'desc' }
      },
      visits: {
        orderBy: { visitDate: 'desc' }
      }
    }
  })

  if (!passport) {
    passport = await prisma.havenPassport.create({
      data: {
        userId: session.user.id,
        tier: 'NOMAD',
        points: 0,
        totalVisits: 0
      },
      include: {
        achievements: {
          orderBy: { unlockedAt: 'desc' }
        },
        visits: {
          orderBy: { visitDate: 'desc' }
        }
      }
    })
  }

  // Mock achievements data for now (would normally come from an Achievement model)
  const allAchievements = [
    { id: '1', title: 'First Visit', description: 'Visit your first coworking space', category: 'milestone', pointsRequired: 0, icon: 'trophy' },
    { id: '2', title: 'City Explorer', description: 'Visit spaces in 3 different cities', category: 'exploration', pointsRequired: 100, icon: 'map-pin' },
    { id: '3', title: 'Social Butterfly', description: 'Leave 10 reviews', category: 'community', pointsRequired: 200, icon: 'users' }
  ]

  // Calculate tier progress (using points instead of experience)
  const tierThresholds = { NOMAD: 0, EXPLORER: 250, PIONEER: 1000 }
  let nextTier: keyof typeof tierThresholds = 'PIONEER'
  
  if (passport.tier === 'NOMAD') nextTier = 'EXPLORER'
  else if (passport.tier === 'EXPLORER') nextTier = 'PIONEER'
  
  const pointsToNextTier = tierThresholds[nextTier]
  const progressToNextTier = Math.min((passport.points / pointsToNextTier) * 100, 100)

  // Get recent activity
  const recentReviews = await prisma.review.findMany({
    where: { userId: session.user.id },
    take: 5,
    orderBy: { createdAt: 'desc' },
    select: { id: true, rating: true, title: true, createdAt: true }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-cal mb-2">Haven Passport</h1>
        <p className="text-gray-400">Your global coworking journey and achievements</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile & Stats */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <Card className="bg-black border-2 border-yellow-500 shadow-lg shadow-yellow-500/20">
            <CardHeader className="text-center">
              <div className="w-20 h-20 bg-yellow-500 text-black rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-4">
                {session.user.name?.charAt(0) || 'U'}
              </div>
              <CardTitle>{session.user.name}</CardTitle>
              <CardDescription>
{passport.tier} Digital Nomad
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Progress to {nextTier}</span>
                  <span>{passport.points}/{pointsToNextTier} Points</span>
                </div>
                <Progress value={progressToNextTier} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-yellow-500">{passport.totalVisits}</div>
                  <div className="text-xs text-gray-400">Visits</div>
                </div>
                <div className="space-y-1">
                  <div className="text-2xl font-bold text-yellow-500">{recentReviews.length}</div>
                  <div className="text-xs text-gray-400">Reviews</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card className="bg-black border-2 border-gray-800">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-yellow-500" />
                  Cities Visited
                </span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-yellow-500" />
                  Countries Visited
                </span>
                <span>0</span>
              </div>
              <div className="flex justify-between">
                <span className="flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  Achievements
                </span>
                <span>{passport.achievements.length}/{allAchievements.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="achievements" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 bg-gray-900 border-2 border-gray-800">
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
              <TabsTrigger value="visits">Visits</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            </TabsList>

            <TabsContent value="achievements" className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {allAchievements.map((achievement) => {
                  const earned = passport.achievements.find(a => a.type === achievement.id)
                  return (
                    <Card 
                      key={achievement.id} 
                      className={`bg-black border-2 transition-colors ${
                        earned ? 'border-yellow-500' : 'border-gray-800'
                      }`}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <div className={`text-2xl ${earned ? '' : 'grayscale opacity-50'}`}>
                              {achievement.icon}
                            </div>
                            <div>
                              <CardTitle className="text-lg">{achievement.title}</CardTitle>
                              <Badge variant="outline" className="mt-1">
                                {achievement.category}
                              </Badge>
                            </div>
                          </div>
                          {earned && (
                            <Trophy className="h-5 w-5 text-yellow-500" />
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-400 mb-2">{achievement.description}</p>
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-yellow-500">+{achievement.pointsRequired} Points</span>
                          {earned && (
                            <span className="text-xs text-gray-400">
                              Earned {new Date(earned.unlockedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </TabsContent>

            <TabsContent value="visits" className="space-y-4">
              {passport.visits.length > 0 ? (
                <div className="space-y-4">
                  {passport.visits.map((visit) => (
                    <Card key={visit.id} className="bg-black border-2 border-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>Workspace Visit</CardTitle>
                            <CardDescription>
                              Visited on {visit.visitDate.toLocaleDateString()}
                            </CardDescription>
                          </div>
                          <Badge variant="outline">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(visit.visitDate).toLocaleDateString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-400">Earned {visit.pointsEarned} points</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-black border-2 border-gray-800">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MapPin className="h-12 w-12 text-gray-600 mb-4" />
                    <h3 className="text-xl font-cal mb-2">No Visits Yet</h3>
                    <p className="text-gray-400 mb-4">Start exploring workspaces to build your passport</p>
                    <Link href="/directory">
                      <Button className="bg-yellow-500 text-black hover:bg-yellow-400">
                        Explore Workspaces
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {recentReviews.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-cal">Recent Reviews</h3>
                  {recentReviews.map((review) => (
                    <Card key={review.id} className="bg-black border-2 border-gray-800">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">Workspace Review</CardTitle>
                            <div className="flex items-center gap-1 mt-1">
                              {[...Array(5)].map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-600'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          <Badge variant="outline">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-gray-400">{review.title || 'No comment'}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-black border-2 border-gray-800">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <MessageSquare className="h-12 w-12 text-gray-600 mb-4" />
                    <h3 className="text-xl font-cal mb-2">No Activity Yet</h3>
                    <p className="text-gray-400">Your recent reviews and visits will appear here</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="leaderboard" className="space-y-4">
              <Card className="bg-black border-2 border-gray-800">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Trophy className="h-12 w-12 text-gray-600 mb-4" />
                  <h3 className="text-xl font-cal mb-2">Leaderboard Coming Soon</h3>
                  <p className="text-gray-400">Compete with other digital nomads worldwide</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
