import NextAuth from "next-auth"
import GoogleProvider from "next-auth/providers/google"

const clientId = process.env.GOOGLE_CLIENT_ID
const clientSecret = process.env.GOOGLE_CLIENT_SECRET
const authSecret = process.env.AUTH_SECRET

// Admin emails - add your admin email(s) here (semicolon separated)
const adminEmails = process.env.ADMIN_EMAILS?.split(';').map(email => email.trim()) || []

function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return adminEmails.includes(email.toLowerCase())
}

if (!clientId || !clientSecret || !authSecret) {
  console.error('Missing required environment variables:')
  if (!clientId) console.error('- GOOGLE_CLIENT_ID is missing')
  if (!clientSecret) console.error('- GOOGLE_CLIENT_SECRET is missing')
  if (!authSecret) console.error('- AUTH_SECRET is missing')
}

// Debug admin emails (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('Admin emails configured:', adminEmails.length > 0 ? adminEmails : 'None configured')
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: authSecret,
  trustHost: true, // Required for deployment
  providers: [
    GoogleProvider({
      clientId: clientId!,
      clientSecret: clientSecret!,
    }),
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error', // Add custom error page
  },
  callbacks: {
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub
        // Add admin role based on email (you can modify this logic)
        session.user.role = isAdminEmail(session.user.email) ? 'admin' : 'user'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.role = isAdminEmail(user.email) ? 'admin' : 'user'
      }
      return token
    },
  },
  debug: process.env.NODE_ENV === 'development', // Enable debug in development
})
