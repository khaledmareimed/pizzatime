'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import Button from '@/components/Button'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'Server Configuration Error',
          description: 'There is a problem with the server configuration. Please check your environment variables.',
          suggestions: [
            'Verify GOOGLE_CLIENT_ID is set',
            'Verify GOOGLE_CLIENT_SECRET is set', 
            'Verify AUTH_SECRET is set',
            'Check Google OAuth callback URL is correct'
          ]
        }
      case 'AccessDenied':
        return {
          title: 'Access Denied',
          description: 'You do not have permission to sign in.',
          suggestions: ['Try signing in with a different account']
        }
      case 'Verification':
        return {
          title: 'Unable to sign in',
          description: 'The sign in link was invalid. It may have been used already or it may have expired.',
          suggestions: ['Try signing in again']
        }
      default:
        return {
          title: 'Authentication Error',
          description: 'Sorry, there was a problem signing you in.',
          suggestions: [
            'Try signing in again',
            'Check your internet connection',
            'Contact support if the problem persists'
          ]
        }
    }
  }

  const errorInfo = getErrorMessage(error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-red-500 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.96-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {errorInfo.title}
          </h2>
          <p className="text-gray-600 mb-6">
            {errorInfo.description}
          </p>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800">
                <strong>Error Code:</strong> {error}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-blue-900 mb-2">Troubleshooting:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="mr-2">•</span>
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-4">
            <Link href="/auth/signin">
              <Button className="w-full">
                Try Again
              </Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">
                Go Home
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">جاري التحميل...</p>
        </div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}