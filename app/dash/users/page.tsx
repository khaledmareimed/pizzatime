import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminUsersManagement from '@/components/Dashboard/UsersManagement'

export default async function AdminUsersPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/users')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminUsersManagement session={session} />
    </div>
  )
}