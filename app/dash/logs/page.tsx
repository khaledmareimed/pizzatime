import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SystemLogsPage from '@/components/Dashboard/SystemLogs/SystemLogsPage'

export default async function LogsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/logs')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <SystemLogsPage session={session} />
    </div>
  )
}