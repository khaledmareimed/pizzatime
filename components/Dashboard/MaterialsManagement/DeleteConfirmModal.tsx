'use client'

import { useState } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import Button from '../../Button'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import { UNIT_LABELS } from './index'

interface RawMaterial {
  _id: string
  name: string
  unit: string
  currentStock: number
  purchases: any[]
  usages: any[]
}

interface DeleteConfirmModalProps {
  material: RawMaterial
  onClose: () => void
  onSuccess: () => void
}

export default function DeleteConfirmModal({ material, onClose, onSuccess }: DeleteConfirmModalProps) {
  const { success, error } = useToastContext()
  const [loading, setLoading] = useState(false)
  const [confirmText, setConfirmText] = useState('')

  const hasHistory = material.purchases.length > 0 || material.usages.length > 0
  const confirmationText = material.name

  const handleDelete = async () => {
    if (confirmText !== confirmationText) {
      error('خطأ', 'يرجى كتابة اسم المادة بشكل صحيح للتأكيد')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/materials/${material._id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        success('تم الحذف بنجاح', `تم حذف المادة ${material.name} بنجاح`)
        onSuccess()
      } else {
        error('خطأ', data.error || 'فشل في حذف المادة')
      }
    } catch (err) {
      console.error('Error deleting material:', err)
      error('خطأ', 'فشل في حذف المادة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md',
        'transform transition-all duration-200 scale-100'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3 space-x-reverse">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <h2 className={cn('text-lg font-semibold text-red-600')}>
              تأكيد الحذف
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {hasHistory ? (
            // Cannot delete - has history
            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className={cn('font-medium', theme.text.primary)}>
                    لا يمكن حذف هذه المادة
                  </h3>
                  <p className={cn('text-sm mt-1', theme.text.secondary)}>
                    هذه المادة لديها سجل مشتريات أو استخدام ولا يمكن حذفها للحفاظ على سلامة البيانات.
                  </p>
                </div>
              </div>

              <div className={cn(
                'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4'
              )}>
                <h4 className={cn('font-medium text-orange-800 dark:text-orange-200 mb-2')}>
                  تفاصيل السجل:
                </h4>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-1">
                  {material.purchases.length > 0 && (
                    <li>• {material.purchases.length} عملية شراء</li>
                  )}
                  {material.usages.length > 0 && (
                    <li>• {material.usages.length} عملية استخدام</li>
                  )}
                  {material.currentStock > 0 && (
                    <li>• مخزون حالي: {material.currentStock} {UNIT_LABELS[material.unit]}</li>
                  )}
                </ul>
              </div>

              <div className={cn(
                'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4'
              )}>
                <h4 className={cn('font-medium text-blue-800 dark:text-blue-200 mb-2')}>
                  البدائل المتاحة:
                </h4>
                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li>• تغيير حالة المادة إلى "غير نشط" أو "متوقف"</li>
                  <li>• تعديل معلومات المادة حسب الحاجة</li>
                </ul>
              </div>
            </div>
          ) : (
            // Can delete - no history
            <div className="space-y-4">
              <div className="flex items-start space-x-3 space-x-reverse">
                <Trash2 className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className={cn('font-medium', theme.text.primary)}>
                    هل أنت متأكد من حذف هذه المادة؟
                  </h3>
                  <p className={cn('text-sm mt-1', theme.text.secondary)}>
                    سيتم حذف المادة "{material.name}" نهائياً ولن يمكن استرجاعها.
                  </p>
                </div>
              </div>

              <div className={cn(
                'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4'
              )}>
                <h4 className={cn('font-medium mb-2', theme.text.primary)}>
                  معلومات المادة:
                </h4>
                <ul className={cn('text-sm space-y-1', theme.text.secondary)}>
                  <li>• الاسم: {material.name}</li>
                  <li>• المخزون الحالي: {material.currentStock} {UNIT_LABELS[material.unit]}</li>
                  <li>• لا يوجد سجل مشتريات أو استخدام</li>
                </ul>
              </div>

              <div>
                <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                  للتأكيد، اكتب اسم المادة: <span className="font-bold">{confirmationText}</span>
                </label>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary,
                    'focus:ring-2 focus:ring-red-500 focus:border-transparent'
                  )}
                  placeholder={confirmationText}
                />
              </div>

              <div className={cn(
                'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4'
              )}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    تحذير: هذا الإجراء لا يمكن التراجع عنه
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-4 space-x-reverse p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={loading}
          >
            إلغاء
          </Button>
          
          {!hasHistory && (
            <Button
              onClick={handleDelete}
              variant="primary"
              disabled={loading || confirmText !== confirmationText}
              className="bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {loading ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري الحذف...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <Trash2 className="h-4 w-4" />
                  <span>حذف نهائياً</span>
                </div>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}