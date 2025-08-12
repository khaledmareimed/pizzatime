import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminUserOrders from '@/components/Dashboard/UserOrders'

interface AdminUserOrdersPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function AdminUserOrdersPage({ params }: AdminUserOrdersPageProps) {
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
      <AdminUserOrders 
        session={session} 
        userId={id}
      />
    </div>
  )
}