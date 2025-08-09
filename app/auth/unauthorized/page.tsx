import Link from 'next/link'
import Button from '@/components/Button'
import { ShieldX } from 'lucide-react'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 text-center">
        <div>
          <div className="mx-auto h-16 w-16 text-red-500 mb-6">
            <ShieldX size={64} />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            غير مخول للوصول
          </h2>
          <p className="text-gray-600 mb-8">
            عذراً، لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة. هذه المنطقة مخصصة للإدارة فقط.
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-yellow-800">
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
