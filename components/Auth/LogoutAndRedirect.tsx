'use client'

import { useSession, signOut } from 'next-auth/react'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function LogoutAndRedirect() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    const handleRedirect = async () => {
      if (status === 'loading') return // Wait for session to load

      if (session) {
        // User is logged in but not admin, log them out first
        await signOut({ redirect: false })
      }
      
      // Redirect to /user (both for logged out users and after signing out)
      router.push('/user')
    }

    handleRedirect()
  }, [session, status, router])

  // Show a blank loading screen while processing
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التحويل...</p>
      </div>
    </div>
  )
}
