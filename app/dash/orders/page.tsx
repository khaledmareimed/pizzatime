import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminOrdersManagement from '@/components/Dashboard/OrdersManagement'

export default async function AdminOrdersPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/orders')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminOrdersManagement session={session} />
    </div>
  )
}