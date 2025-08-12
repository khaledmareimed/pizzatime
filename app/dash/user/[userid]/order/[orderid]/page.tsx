import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdminOrderDetails from '@/components/Dashboard/OrderDetails'

interface AdminOrderPageProps {
  params: Promise<{
    userid: string
    orderid: string
  }>
}

export default async function AdminOrderPage({ params }: AdminOrderPageProps) {
  const { userid, orderid } = await params
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
      <AdminOrderDetails 
        session={session} 
        userId={userid}
        orderId={orderid}
      />
    </div>
  )
}