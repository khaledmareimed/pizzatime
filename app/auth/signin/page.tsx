import { Suspense } from 'react'
import { SignInForm } from '@/components/Auth/SignInForm'

function LoadingSpinner() {
  return (
    <div className="mt-8 space-y-6">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">جاري التحميل...</p>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Welcome back! Please sign in to continue
          </p>
        </div>
        <Suspense fallback={<LoadingSpinner />}>
          <SignInForm />
        </Suspense>
      </div>
    </div>
  )
}
