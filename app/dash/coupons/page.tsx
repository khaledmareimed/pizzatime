import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import CouponsManagement from '@/components/Dashboard/CouponsManagement'

export default async function CouponsManagementPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/coupons')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <CouponsManagement />
    </div>
  )
}