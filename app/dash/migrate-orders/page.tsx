'use client'

import { useState } from 'react'
import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { Database, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

export default function MigrateOrdersPage() {
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const runMigration = async () => {
    setIsRunning(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/migrate/order-location-fields', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
      } else {
        setError(data.error || 'Migration failed')
      }
    } catch (err) {
      setError('Network error occurred')
      console.error('Migration error:', err)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            ترحيل بيانات الطلبات
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            تحديث الطلبات الموجودة لتشمل حقول المنطقة والموقع
          </p>
        </div>

        <Card className="mb-6">
          <div className="flex items-start gap-4">
            <Database className="w-8 h-8 text-blue-500 mt-1" />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                ترحيل حقول المنطقة والموقع
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                هذه العملية ستقوم بتحديث جميع الطلبات الموجودة لتشمل الحقول الجديدة للمنطقة والموقع.
                هذا ضروري لعرض معلومات المنطقة في تفاصيل الطلبات وتعديلها.
              </p>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-yellow-800 dark:text-yellow-200">
                      تنبيه مهم
                    </h3>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      • هذه العملية آمنة ولن تؤثر على البيانات الموجودة
                      <br />
                      • ستضيف فقط الحقول المفقودة للطلبات القديمة
                      <br />
                      • يمكن تشغيلها عدة مرات بأمان
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={runMigration}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <Database className="w-4 h-4" />
                {isRunning ? 'جاري التشغيل...' : 'تشغيل الترحيل'}
              </Button>
            </div>
          </div>
        </Card>

        {/* Results */}
        {result && (
          <Card className="mb-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-8 h-8 text-green-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  تم الترحيل بنجاح
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {result.stats.totalFound}
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                      طلبات تم العثور عليها
                    </div>
                  </div>
                  <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                      {result.stats.updated}
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-300">
                      طلبات تم تحديثها
                    </div>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {result.stats.errors}
                    </div>
                    <div className="text-sm text-red-700 dark:text-red-300">
                      أخطاء
                    </div>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                  {result.message}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Error */}
        {error && (
          <Card className="mb-6">
            <div className="flex items-start gap-4">
              <XCircle className="w-8 h-8 text-red-500 mt-1" />
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  حدث خطأ
                </h3>
                <p className="text-red-600 dark:text-red-400">
                  {error}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Instructions */}
        <Card>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            التعليمات
          </h3>
          <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">1.</span>
              <span>اضغط على "تشغيل الترحيل" لبدء العملية</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">2.</span>
              <span>انتظر حتى اكتمال العملية</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">3.</span>
              <span>تحقق من النتائج للتأكد من نجاح العملية</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="font-medium text-gray-900 dark:text-white">4.</span>
              <span>بعد الانتهاء، ستظهر معلومات المنطقة في تفاصيل الطلبات</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}