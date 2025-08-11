import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import POSSystem from '@/components/POS/POSSystem'

export default async function POSPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/pos')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <POSSystem session={session} />
    </div>
  )
}