import { Metadata } from 'next'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import NotificationCenter from '@/components/notifications/NotificationCenter'

export const metadata: Metadata = {
  title: 'Notifications - Workscape Atlas',
  description: 'Stay updated with your workspace activity, bookings, recommendations, and system updates.',
}

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin?callbackUrl=/notifications')
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <NotificationCenter variant="inline" />
    </div>
  )
}