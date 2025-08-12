import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminUserDetails from '@/components/Dashboard/UserDetails'

interface AdminUserPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminUserPage({ params }: AdminUserPageProps) {
  const { id } = await params
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
      <AdminUserDetails 
        session={session} 
        userId={id}
      />
    </div>
  )
}