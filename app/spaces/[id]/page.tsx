import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getRealWorkspace, getRealWorkspaces } from '@/lib/real-workspace-data'
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
  const workspaceId = parseInt(id) || 1
  const workspace = getRealWorkspace(workspaceId)

  if (!workspace) {
    return {
      title: 'Workspace Not Found - Workspace Atlas',
    }
  }

  return {
    title: `${workspace.name} - ${workspace.location.city} | Workspace Atlas`,
    description: workspace.description || `Coworking space in ${workspace.location.city}, ${workspace.location.country}`,
    openGraph: {
      title: workspace.name,
      description: workspace.description || `Coworking space in ${workspace.location.city}, ${workspace.location.country}`,
      images: workspace.images && workspace.images.length > 0 ? [workspace.images[0]] : [],
    },
  }
}

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { id } = await params
  const session = await getServerSession(authOptions)

  const workspaceId = parseInt(id) || 1
  const workspace = getRealWorkspace(workspaceId)

  if (!workspace) {
    notFound()
  }

  // Transform mock data to match expected format
  const transformedWorkspace = {
    id: String(workspace.id),
    name: workspace.name,
    description: workspace.description,
    city: workspace.location.city,
    country: workspace.location.country,
    address: workspace.location.address,
    website: workspace.contactInfo.website,
    digitalScore: workspace.digitalScore,
    rating: workspace.rating,
    featured: workspace.featured,
    verified: workspace.verified,
    images: workspace.images,
    amenities: workspace.amenities,
    _count: {
      reviews: workspace.reviewCount,
      bookings: 0
    },
    user: {
      id: '1',
      name: 'Space Owner',
      email: workspace.contactInfo.email,
      image: null
    }
  }

  // Get similar workspaces (from same city or country)
  const allWorkspaces = getRealWorkspaces()
  const similarWorkspaces = allWorkspaces
    .filter(ws =>
      ws.id !== workspace.id &&
      (ws.location.city === workspace.location.city || ws.location.country === workspace.location.country)
    )
    .slice(0, 3)
    .map(ws => ({
      id: String(ws.id),
      name: ws.name,
      city: ws.location.city,
      country: ws.location.country,
      images: ws.images,
      digitalScore: ws.digitalScore,
      featured: ws.featured,
      _count: {
        reviews: ws.reviewCount
      }
    }))

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <WorkspaceHeader workspace={transformedWorkspace} />

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
              workspace={transformedWorkspace}
              owner={transformedWorkspace.user}
              totalBookings={0}
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
                  id: `${workspace.id}-hourly`,
                  type: 'Hourly',
                  price: workspace.pricing.hourly || 10,
                  currency: workspace.pricing.currency,
                  description: 'Per hour access',
                  capacity: null,
                  active: !!workspace.pricing.hourly
                },
                {
                  id: `${workspace.id}-daily`,
                  type: 'Daily',
                  price: workspace.pricing.daily || 25,
                  currency: workspace.pricing.currency,
                  description: 'Full day access',
                  capacity: null,
                  active: !!workspace.pricing.daily
                },
                {
                  id: `${workspace.id}-monthly`,
                  type: 'Monthly',
                  price: workspace.pricing.monthly || 200,
                  currency: workspace.pricing.currency,
                  description: 'Monthly membership',
                  capacity: null,
                  active: !!workspace.pricing.monthly
                }
              ].filter(p => p.active)}
              openingHours={{
                id: `${workspace.id}-hours`,
                monday: workspace.openingHours.monday,
                tuesday: workspace.openingHours.tuesday,
                wednesday: workspace.openingHours.wednesday,
                thursday: workspace.openingHours.thursday,
                friday: workspace.openingHours.friday,
                saturday: workspace.openingHours.saturday,
                sunday: workspace.openingHours.sunday
              }}
            />

            {/* Location */}
            <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-semibold mb-2">Location</h3>
              <p className="text-gray-600">
                {[workspace.location.city, workspace.location.country].filter(Boolean).join(', ')}
              </p>
              {workspace.location.address && (
                <p className="text-sm text-gray-500 mt-1">{workspace.location.address}</p>
              )}
            </div>

            {/* Reviews */}
            <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-semibold mb-2">Reviews</h3>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-3xl font-bold">{workspace.rating.toFixed(1)}</span>
                <div>
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`h-5 w-5 ${i < Math.round(workspace.rating) ? 'text-yellow fill-yellow' : 'text-gray-300'}`}
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600">{workspace.reviewCount} reviews</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="rounded-lg border-2 border-black bg-white p-6 shadow-[5px_5px_0px_0px_rgba(0,0,0,1)]">
              <h3 className="text-lg font-semibold mb-4">Book This Space</h3>
              <div className="space-y-4">
                <div className="text-2xl font-bold">
                  {workspace.pricing.currency} ${workspace.pricing.daily || 25}/day
                </div>
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
              workspaceId={String(workspace.id)}
              workspaceName={workspace.name}
              count={6}
            />
          </div>
        </ErrorBoundary>
      </div>
    </div>
  )
}
