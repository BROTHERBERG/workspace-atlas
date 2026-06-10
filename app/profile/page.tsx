import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ProfileForm } from '@/components/profile/ProfileForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { MapPin, Calendar, Award, Star } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Profile - Workscape Atlas',
  description: 'Manage your profile and account settings',
}

export default async function ProfilePage() {
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
            take: 5,
            orderBy: { visitDate: 'desc' },
          },
          achievements: {
            orderBy: { unlockedAt: 'desc' },
          },
        },
      },
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
        },
      },
      bookings: {
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          workspace: true,
        },
      },
    },
  })

  if (!user) {
    redirect('/auth/signin')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-8">
        {/* Profile Header */}
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={user.image || ''} alt={user.name || ''} />
                <AvatarFallback className="text-2xl">
                  {user.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <h1 className="text-3xl font-bold">{user.name}</h1>
                  <Badge variant={user.verified ? 'default' : 'secondary'}>
                    {user.verified ? 'Verified' : 'Unverified'}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{user.email}</p>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                  </div>
                  {user.havenPassport && (
                    <div className="flex items-center space-x-1">
                      <Award className="h-4 w-4" />
                      <span>{user.havenPassport.tier} • {user.havenPassport.points} points</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Profile Tabs */}
        <Tabs defaultValue="profile" className="space-y-4">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="passport">Haven Passport</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="bookings">Bookings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>
                  Update your profile information and preferences.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProfileForm user={user} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="passport" className="space-y-4">
            {user.havenPassport ? (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Tier</CardTitle>
                      <Award className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{user.havenPassport.tier}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Points</CardTitle>
                      <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{user.havenPassport.points}</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Visits</CardTitle>
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{user.havenPassport.totalVisits}</div>
                    </CardContent>
                  </Card>
                </div>

                {user.havenPassport.achievements.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Achievements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {user.havenPassport.achievements.map((achievement) => (
                          <div key={achievement.id} className="flex items-center space-x-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-yellow/20">
                              <Award className="h-5 w-5 text-yellow-600" />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-semibold">{achievement.title}</h4>
                              <p className="text-sm text-muted-foreground">
                                {achievement.description}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()} • +{achievement.pointsAwarded} points
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-muted-foreground">
                    No Haven Passport found. This should not happen - please contact support.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Reviews</CardTitle>
                <CardDescription>
                  Reviews you've written for coworking spaces.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {user.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{review.workspace.name}</h4>
                          <div className="flex items-center space-x-1">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                        {review.title && (
                          <h5 className="mt-1 font-medium">{review.title}</h5>
                        )}
                        {review.content && (
                          <p className="mt-2 text-sm text-muted-foreground">{review.content}</p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    You haven't written any reviews yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="bookings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Bookings</CardTitle>
                <CardDescription>
                  Your workspace bookings and reservations.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {user.bookings.length > 0 ? (
                  <div className="space-y-4">
                    {user.bookings.map((booking) => (
                      <div key={booking.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{booking.workspace.name}</h4>
                          <Badge
                            variant={
                              booking.status === 'CONFIRMED'
                                ? 'default'
                                : booking.status === 'PENDING'
                                ? 'secondary'
                                : booking.status === 'CANCELLED'
                                ? 'destructive'
                                : 'outline'
                            }
                          >
                            {booking.status}
                          </Badge>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          <p>
                            {booking.type} • {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                          </p>
                          <p>${booking.totalPrice} {booking.currency}</p>
                        </div>
                        {booking.notes && (
                          <p className="mt-2 text-sm">{booking.notes}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground">
                    You haven't made any bookings yet.
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}