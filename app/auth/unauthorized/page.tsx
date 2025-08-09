import Link from 'next/link'
import Button from '@/components/Button'
import { ShieldX } from 'lucide-react'
import { theme } from '@/funcs/responsive'

export default function UnauthorizedPage() {
  return (
    <div className={`min-h-screen flex items-center justify-center ${theme.background.secondary}`}>
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 text-red-500 dark:text-red-400 mb-6">
            <ShieldX size={64} />
          </div>
          <h2 className={`text-3xl font-bold ${theme.text.primary} mb-4`}>
            غير مخول للوصول
          </h2>
          <p className={`${theme.text.secondary} mb-8`}>
            عذراً، لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة. هذه المنطقة مخصصة للإدارة فقط.
          </p>
          
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>ملاحظة:</strong> إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة.
            </p>
          </div>

          <div className="space-y-4">
            <Link href="/">
              <Button className="w-full">
                العودة للرئيسية
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="w-full">
                تسجيل دخول بحساب آخر
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
