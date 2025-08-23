import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import ExpenseManagement from '@/components/Dashboard/ExpenseManagement'

export default async function ExpenseManagementPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/expenses')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ExpenseManagement session={session} />
      </div>
    </div>
  )
}