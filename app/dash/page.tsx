import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminDashboard from '@/components/Dashboard/AdminDashboard'

export default async function AdminDashboardPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminDashboard session={session} />
    </div>
  )
}
