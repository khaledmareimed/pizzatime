import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import FinancialReports from '@/components/Dashboard/FinancialReports'

export default async function FinancialReportsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/reports')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <FinancialReports session={session} />
    </div>
  )
}