import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import AdvancedReports from '@/components/Dashboard/AdvancedReports'

export default async function AdvancedReportsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/reports')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <AdvancedReports session={session} />
  )
}