'use client'

import { useUserInit } from '@/funcs/hooks/useUserInit'

/**
 * Component that handles user initialization in database after authentication
 * This runs on the client side to avoid Edge Runtime issues with Mongoose
 */
export default function UserInitializer() {
  const { isInitializing, error } = useUserInit()

  // This component doesn't render anything visible
  // It just handles the user initialization logic
  if (error) {
    console.error('User initialization error:', error)
  }

  return null
}