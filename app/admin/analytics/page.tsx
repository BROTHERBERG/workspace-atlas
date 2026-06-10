import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard'

export const metadata: Metadata = {
  title: 'Analytics Dashboard - Admin - Workscape Atlas',
  description: 'Comprehensive analytics and business intelligence for platform growth and optimization.',
}

export default async function AnalyticsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/admin/analytics')
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AnalyticsDashboard />
    </div>
  )
}