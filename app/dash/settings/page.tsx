import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import SettingsManagement from '@/components/Dashboard/SettingsManagement'

export default async function SettingsPage() {
  const session = await auth()
  
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/settings')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            إعدادات المطعم
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
            إدارة أوقات التوصيل، المناطق، والبانرات بواجهة حديثة وسهلة الاستخدام
          </p>
        </div>
        
        <SettingsManagement session={session} />
      </div>
    </div>
  )
}