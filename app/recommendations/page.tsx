import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import RecommendationGrid from '@/components/recommendations/RecommendationGrid'
import TrendingWorkspaces from '@/components/recommendations/TrendingWorkspaces'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Sparkles, User, Settings } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Personalized Recommendations - Workscape Atlas',
  description: 'Discover workspaces tailored to your preferences and working style. Get personalized recommendations based on your activity and preferences.',
}

export default async function RecommendationsPage() {
  const session = await getServerSession(authOptions)

  // Mock user profile for demonstration - in production this would come from the database
  const userProfile = session?.user?.id ? {
    id: session.user.id,
    preferences: {
      workspaceTypes: ['Coworking Space', 'Private Office'],
      amenities: ['High-speed WiFi', 'Coffee & Tea', 'Meeting Rooms', 'Printing'],
      cities: ['New York', 'San Francisco', 'London'],
      workingStyle: 'collaborative' as const,
      priceRange: { min: 20, max: 150 }
    },
    behavior: {
      recentSearches: ['coworking manhattan', 'meeting rooms nyc', 'startup office'],
      viewedWorkspaces: [],
      favoriteWorkspaces: [],
      bookingHistory: []
    }
  } : undefined

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">
              <Sparkles className="w-8 h-8 inline mr-3 text-yellow-500" />
              Your Workspace Recommendations
            </h1>
            <p className="mt-4 text-xl text-gray-600">
              Discover spaces perfectly matched to your working style and preferences
            </p>
          </div>

          {/* User Status */}
          {session?.user ? (
            <div className="mt-8 flex items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                Signed in as {session.user.name || session.user.email}
              </div>
              <Link href="/profile/preferences">
                <Button variant="outline" size="sm">
                  <Settings className="w-4 h-4 mr-2" />
                  Update Preferences
                </Button>
              </Link>
            </div>
          ) : (
            <div className="mt-8 text-center">
              <Card className="max-w-md mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Sign In for Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-4">
                    Create an account to get recommendations based on your preferences, search history, and working style.
                  </p>
                  <div className="flex gap-2">
                    <Link href="/auth/signin" className="flex-1">
                      <Button className="w-full">Sign In</Button>
                    </Link>
                    <Link href="/auth/signup" className="flex-1">
                      <Button variant="outline" className="w-full">Sign Up</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-16">
          {/* Personalized Recommendations */}
          <ErrorBoundary>
            <RecommendationGrid 
              userProfile={userProfile}
              count={12}
              showReasons={true}
            />
          </ErrorBoundary>

          {/* Trending Workspaces */}
          <ErrorBoundary>
            <TrendingWorkspaces count={8} />
          </ErrorBoundary>

          {/* Recommendation Tips */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-800 mb-4">
              💡 Get Better Recommendations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Update Your Preferences</h4>
                <p className="text-yellow-700">
                  Tell us about your preferred amenities, working style, and budget to get more accurate recommendations.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Browse and Save</h4>
                <p className="text-yellow-700">
                  Save workspaces you like and view workspace details to help our algorithm learn your preferences.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-yellow-800 mb-2">Use Search Filters</h4>
                <p className="text-yellow-700">
                  The more you search with specific filters, the better we understand what you're looking for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}