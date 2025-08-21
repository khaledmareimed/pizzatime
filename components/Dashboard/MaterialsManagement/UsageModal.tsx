'use client'

import { useState } from 'react'
import { X, AlertTriangle } from 'lucide-react'
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
  minimumStock: number
}

interface UsageModalProps {
  material: RawMaterial
  onClose: () => void
  onSuccess: () => void
}

const USAGE_PURPOSES = [
  'Production',
  'Waste',
  'Sample',
  'Transfer',
  'Adjustment',
  'Other'
]

const PURPOSE_LABELS: Record<string, string> = {
  'Production': 'إنتاج',
  'Waste': 'فاقد',
  'Sample': 'عينة',
  'Transfer': 'نقل',
  'Adjustment': 'تعديل',
  'Other': 'أخرى'
}

export default function UsageModal({ material, onClose, onSuccess }: UsageModalProps) {
  const { success, error } = useToastContext()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    quantity: '',
    usageDate: new Date().toISOString().split('T')[0],
    purpose: 'Production',
    notes: ''
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }))
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر'
    }

    if (Number(formData.quantity) > material.currentStock) {
      newErrors.quantity = `الكمية المطلوبة أكبر من المخزون المتاح (${material.currentStock} ${UNIT_LABELS[material.unit]})`
    }

    if (!formData.usageDate) {
      newErrors.usageDate = 'تاريخ الاستخدام مطلوب'
    }

    if (!formData.purpose) {
      newErrors.purpose = 'الغرض من الاستخدام مطلوب'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const getRemainingStock = () => {
    const usageQuantity = Number(formData.quantity) || 0
    return material.currentStock - usageQuantity
  }

  const willBeLowStock = () => {
    return getRemainingStock() <= material.minimumStock
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const submitData = {
        quantity: Number(formData.quantity),
        usageDate: formData.usageDate,
        purpose: formData.purpose,
        notes: formData.notes.trim() || undefined
      }

      const response = await fetch(`/api/materials/${material._id}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        success(
          'تم تسجيل الاستخدام بنجاح',
          `تم استخدام ${formData.quantity} ${UNIT_LABELS[material.unit]} من ${material.name}`
        )
        onSuccess()
      } else {
        error('خطأ', data.error || 'فشل في تسجيل الاستخدام')
      }
    } catch (err) {
      console.error('Error recording usage:', err)
      error('خطأ', 'فشل في تسجيل الاستخدام')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto',
        'transform transition-all duration-200 scale-100'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className={cn('text-xl font-semibold', theme.text.primary)}>
              تسجيل استخدام
            </h2>
            <p className={cn('text-sm mt-1', theme.text.secondary)}>
              {material.name}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Current Stock Info */}
        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className={cn('font-medium', theme.text.secondary)}>المخزون الحالي:</span>
              <span className={cn('mr-2 font-bold', theme.text.primary)}>
                {material.currentStock} {UNIT_LABELS[material.unit]}
              </span>
            </div>
            <div>
              <span className={cn('font-medium', theme.text.secondary)}>الحد الأدنى:</span>
              <span className={cn('mr-2 font-bold', theme.text.primary)}>
                {material.minimumStock} {UNIT_LABELS[material.unit]}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Quantity */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              الكمية المستخدمة ({UNIT_LABELS[material.unit]}) *
            </label>
            <input
              type="number"
              min="0"
              max={material.currentStock}
              step="0.01"
              value={formData.quantity}
              onChange={(e) => handleInputChange('quantity', e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.quantity && 'border-red-500'
              )}
              placeholder="0"
            />
            {errors.quantity && (
              <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>
            )}
            
            {/* Remaining Stock Preview */}
            {formData.quantity && Number(formData.quantity) > 0 && (
              <div className={cn(
                'mt-2 p-3 rounded-lg',
                willBeLowStock() 
                  ? 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800'
                  : 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
              )}>
                <div className="flex items-center space-x-2 space-x-reverse">
                  {willBeLowStock() && <AlertTriangle className="h-4 w-4 text-orange-600" />}
                  <span className={cn(
                    'text-sm font-medium',
                    willBeLowStock() ? 'text-orange-800 dark:text-orange-200' : 'text-blue-800 dark:text-blue-200'
                  )}>
                    المخزون بعد الاستخدام: {getRemainingStock()} {UNIT_LABELS[material.unit]}
                  </span>
                </div>
                {willBeLowStock() && (
                  <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                    تحذير: المخزون سيصبح أقل من أو يساوي الحد الأدنى
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Usage Date */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              تاريخ الاستخدام *
            </label>
            <input
              type="date"
              value={formData.usageDate}
              onChange={(e) => handleInputChange('usageDate', e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.usageDate && 'border-red-500'
              )}
            />
            {errors.usageDate && (
              <p className="mt-1 text-sm text-red-600">{errors.usageDate}</p>
            )}
          </div>

          {/* Purpose */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              الغرض من الاستخدام *
            </label>
            <select
              value={formData.purpose}
              onChange={(e) => handleInputChange('purpose', e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                errors.purpose && 'border-red-500'
              )}
            >
              {USAGE_PURPOSES.map(purpose => (
                <option key={purpose} value={purpose}>
                  {PURPOSE_LABELS[purpose]}
                </option>
              ))}
            </select>
            {errors.purpose && (
              <p className="mt-1 text-sm text-red-600">{errors.purpose}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              ملاحظات (اختياري)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl border resize-none',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
              placeholder="أي ملاحظات إضافية حول هذا الاستخدام..."
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-4 space-x-reverse pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              إلغاء
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="min-w-[120px]"
            >
              {loading ? (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري الحفظ...</span>
                </div>
              ) : (
                'تسجيل الاستخدام'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}