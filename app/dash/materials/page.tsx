import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import MaterialsManagement from '@/components/Dashboard/MaterialsManagement'

export default async function MaterialsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/materials')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            إدارة المواد الخام
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            إدارة المخزون والمشتريات واستخدام المواد الخام
          </p>
        </div>
        
        <MaterialsManagement session={session} />
      </div>
    </div>
  )
}