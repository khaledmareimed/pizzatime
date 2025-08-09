'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Button from '@/components/Button'

export function AuthButton() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <Button disabled className="opacity-50">
        Loading...
      </Button>
    )
  }

  if (session) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {session.user?.image && (
            <img
              src={session.user.image}
              alt={session.user.name || 'User'}
              className="w-8 h-8 rounded-full"
            />
          )}
          <span className="text-sm font-medium text-gray-700">
            {session.user?.name}
          </span>
        </div>
        <Button
          onClick={() => signOut()}
          variant="outline"
          size="sm"
        >
          Sign out
        </Button>
      </div>
    )
  }

  return (
    <Button
      onClick={() => signIn('google')}
      className="bg-blue-600 hover:bg-blue-700 text-white"
    >
      Sign in
    </Button>
  )
}
