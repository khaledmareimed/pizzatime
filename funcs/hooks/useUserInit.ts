'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'

/**
 * Hook to ensure user is initialized in database after authentication
 * This replaces the database operations that were previously in auth callbacks
 */
export function useUserInit() {
  const { data: session, status } = useSession()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isInitializing, setIsInitializing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializeUser = async () => {
      // Only initialize if user is authenticated and not already initialized
      if (status === 'authenticated' && session?.user?.email && !isInitialized && !isInitializing) {
        setIsInitializing(true)
        setError(null)

        try {
          const response = await fetch('/api/users/init', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })

          if (response.ok) {
            setIsInitialized(true)
          } else {
            const errorData = await response.json()
            setError(errorData.error || 'Failed to initialize user')
          }
        } catch (err) {
          console.error('Error initializing user:', err)
          setError('Network error during user initialization')
        } finally {
          setIsInitializing(false)
        }
      }
    }

    initializeUser()
  }, [status, session, isInitialized, isInitializing])

  // Reset state when user logs out
  useEffect(() => {
    if (status === 'unauthenticated') {
      setIsInitialized(false)
      setIsInitializing(false)
      setError(null)
    }
  }, [status])

  return {
    isInitialized,
    isInitializing,
    error,
    needsInitialization: status === 'authenticated' && !isInitialized && !isInitializing
  }
}