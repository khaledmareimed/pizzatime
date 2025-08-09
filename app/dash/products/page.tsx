import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ProductsManagement from '@/components/Dashboard/ProductsManagement'

export default async function ProductsManagementPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/products')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <ProductsManagement />
    </div>
  )
}
