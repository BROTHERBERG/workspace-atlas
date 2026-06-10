import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/db'
import { WorkspaceHeader } from '@/components/workspace/WorkspaceHeader'
import { WorkspaceInfo } from '@/components/workspace/WorkspaceInfo'
import { WorkspacePricing } from '@/components/workspace/WorkspacePricing'
import { WorkspaceAmenities } from '@/components/workspace/WorkspaceAmenities'
import { WorkspaceBooking } from '@/components/workspace/WorkspaceBooking'
import { LazyLoad } from '@/components/lazy/LazyComponents'
import { 
  LazyWorkspaceGallery, 
  LazyWorkspaceReviews, 
  LazyWorkspaceLocation 
} from '@/lib/code-splitting'
import { WorkspaceScore } from '@/components/workspace/WorkspaceScore'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SimilarWorkspaces from '@/components/recommendations/SimilarWorkspaces'
import { ErrorBoundary } from '@/components/ErrorBoundary'

interface WorkspacePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: WorkspacePageProps): Promise<Metadata> {
  const { id } = await params
  
  const workspace = await prisma.workspace.findFirst({
    where: { 
      OR: [
        { id },
        { slug: id }
      ]
    },
    select: {
      name: true,
      description: true,
      city: true,
      country: true,
      images: true
    }
  })

  if (!workspace) {
    return {
      title: 'Workspace Not Found - Workscape Atlas',
    }
  }

  return {
    title: `${workspace.name} - ${workspace.city} | Workscape Atlas`,
    description: workspace.description || `Coworking space in ${workspace.city}, ${workspace.country}`,
    openGraph: {
      title: workspace.name,
      description: workspace.description || `Coworking space in ${workspace.city}, ${workspace.country}`,
      images: workspace.images && workspace.images.length > 0 ? [workspace.images[0]] : [],
    },
  }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const workspace = await prisma.workspace.findFirst({
    where: { 
      OR: [
        { id },
        { slug: id }
      ]
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          image: true,
        }
      },
      // Using simplified schema with JSON arrays
      _count: {
        select: {
          reviews: true,
          bookings: true,
        }
      }
    }
  })

  if (!workspace || workspace.status !== 'ACTIVE') {
    notFound()
  }

  // Check if user has already reviewed this workspace
  let userReview = null
  if (session?.user?.id) {
    userReview = await prisma.review.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId: workspace.id,
          userId: session.user.id
        }
      }
    })
  }

  // Get similar workspaces
  const similarWorkspaces = await prisma.workspace.findMany({
    where: {
      AND: [
        { id: { not: workspace.id } },
        { status: 'ACTIVE' },
        {
          OR: [
            { city: workspace.city },
            { country: workspace.country }
          ]
        }
      ]
    },
    include: {
      _count: {
        select: { reviews: true }
      }
    },
    orderBy: [
      { featured: 'desc' },
      { digitalScore: 'desc' }
    ],
    take: 3
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkspaceHeader workspace={workspace} />

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Gallery - Lazy loaded */}
            <LazyLoad fallback={<div className="h-64 bg-gray-200 animate-pulse rounded-lg" />}>
              <LazyWorkspaceGallery 
                images={(workspace.images || []).map((url, index) => ({
                  id: `${workspace.id}-${index}`,
                  url,
                  alt: `${workspace.name} image ${index + 1}`,
                  isMain: index === 0,
                  order: index
                }))} 
              />
            </LazyLoad>

            {/* Basic Info - Load immediately */}
            <WorkspaceInfo 
              workspace={workspace}
              owner={workspace.user}
              totalBookings={workspace._count.bookings}
            />

            {/* Digital Score */}
            {workspace.digitalScore && (
              <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-lg font-semibold mb-2">Digital Score</h3>
                <div className="text-3xl font-bold text-yellow-600">{workspace.digitalScore}/100</div>
                <p className="text-sm text-gray-600 mt-2">Digital presence rating</p>
              </div>
            )}

            {/* Amenities */}
            <WorkspaceAmenities 
              amenities={(workspace.amenities || []).map((amenity, index) => ({
                id: `${workspace.id}-amenity-${index}`,
                amenity
              }))} 
            />

            {/* Pricing */}
            <WorkspacePricing 
              pricing={[
                {
                  id: `${workspace.id}-daily`,
                  type: 'Daily',
                  price: 25,
                  currency: 'USD',
                  description: 'Full day access',
                  capacity: null,
                  active: true
                },
                {
                  id: `${workspace.id}-monthly`,
                  type: 'Monthly',
                  price: 200,
                  currency: 'USD',
                  description: 'Monthly membership',
                  capacity: null,
                  active: true
                }
              ]}
              openingHours={{
                id: `${workspace.id}-hours`,
                monday: '9:00 AM - 6:00 PM',
                tuesday: '9:00 AM - 6:00 PM',
                wednesday: '9:00 AM - 6:00 PM', 
                thursday: '9:00 AM - 6:00 PM',
                friday: '9:00 AM - 6:00 PM',
                saturday: '10:00 AM - 4:00 PM',
                sunday: 'Closed'
              }}
            />

            {/* Location */}
            <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-semibold mb-2">Location</h3>
              <p className="text-gray-600">
                {[workspace.city, workspace.country].filter(Boolean).join(', ')}
              </p>
              {workspace.address && (
                <p className="text-sm text-gray-500 mt-1">{workspace.address}</p>
              )}
            </div>

            {/* Reviews */}
            <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-semibold mb-2">Reviews</h3>
              <p className="text-gray-600">
                {workspace._count.reviews} reviews • Reviews coming soon
              </p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-semibold mb-4">Book This Space</h3>
              <div className="space-y-4">
                <div className="text-2xl font-bold">$25/day</div>
                <p className="text-sm text-gray-600">Book your workspace today</p>
                <button className="w-full bg-yellow text-black font-semibold py-3 px-4 rounded-lg border-2 border-black shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                  {session?.user?.id ? 'Book Now' : 'Sign In to Book'}
                </button>
              </div>
            </div>

            {/* Similar Workspaces */}
            {similarWorkspaces.length > 0 && (
              <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
                <h3 className="text-lg font-semibold mb-4">Similar Spaces</h3>
                <div className="space-y-4">
                  {similarWorkspaces.map((similar) => (
                    <div key={similar.id} className="flex space-x-3">
                      <div className="flex-shrink-0">
                        <Image
                          src={(similar.images && similar.images[0]) || '/placeholder-workspace.jpg'}
                          alt={similar.name}
                          width={64}
                          height={64}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-medium text-gray-900 truncate">
                          {similar.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {similar.city}, {similar.country}
                        </p>
                        <div className="flex items-center mt-1">
                          <span className="text-xs text-gray-500">
                            {similar._count.reviews} reviews
                          </span>
                          {similar.digitalScore && (
                            <>
                              <span className="mx-1 text-gray-300">•</span>
                              <span className="text-xs font-medium text-yellow-600">
                                Score: {similar.digitalScore}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Workspaces Section */}
        <ErrorBoundary>
          <div className="mt-16">
            <SimilarWorkspaces 
              workspaceId={workspace.id}
              workspaceName={workspace.name}
              count={6}
            />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}
