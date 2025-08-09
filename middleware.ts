import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { nextUrl } = req
  const isLoggedIn = !!req.auth
  const userRole = req.auth?.user?.role

  // Handle root path redirects
  if (nextUrl.pathname === '/') {
    if (isLoggedIn && userRole === 'admin') {
      // Admin users go to dashboard
      return NextResponse.redirect(new URL('/dash', nextUrl.origin))
    } else {
      // Non-admin users (logged in or not) go to /user
      // If they're logged in as regular user, they'll be handled by /user page
      return NextResponse.redirect(new URL('/user', nextUrl.origin))
    }
  }

  // Admin-only routes
  const adminRoutes = ['/dash']
  const isAdminRoute = adminRoutes.some(route => 
    nextUrl.pathname.startsWith(route)
  )

  // If trying to access admin route without being logged in
  if (isAdminRoute && !isLoggedIn) {
    const signInUrl = new URL('/auth/signin', nextUrl.origin)
    signInUrl.searchParams.set('callbackUrl', nextUrl.pathname)
    return NextResponse.redirect(signInUrl)
  }

  // If trying to access admin route without admin role
  if (isAdminRoute && isLoggedIn && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/auth/unauthorized', nextUrl.origin))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api/auth (auth API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
  ],
}