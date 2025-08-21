'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import Button from '../../Button'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import { CATEGORIES, CATEGORY_LABELS, UNITS, UNIT_LABELS } from './index'

interface RawMaterial {
  _id: string
  name: string
  description?: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock?: number
  status: 'active' | 'inactive' | 'discontinued'
}

interface MaterialModalProps {
  material?: RawMaterial | null
  onClose: () => void
  onSuccess: () => void
}

export default function MaterialModal({ material, onClose, onSuccess }: MaterialModalProps) {
  const { success, error } = useToastContext()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'Other',
    unit: 'kg',
    minimumStock: 0,
    maximumStock: '',
    status: 'active' as 'active' | 'inactive' | 'discontinued'
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  // Initialize form data when editing
  useEffect(() => {
    if (material) {
      setFormData({
        name: material.name || '',
        description: material.description || '',
        category: material.category || 'Other',
        unit: material.unit || 'kg',
        minimumStock: material.minimumStock || 0,
        maximumStock: material.maximumStock?.toString() || '',
        status: material.status || 'active'
      })
    }
  }, [material])

  const handleInputChange = (field: string, value: string | number) => {
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

    if (!formData.name.trim()) {
      newErrors.name = 'اسم المادة مطلوب'
    }

    if (!formData.category) {
      newErrors.category = 'الفئة مطلوبة'
    }

    if (!formData.unit) {
      newErrors.unit = 'الوحدة مطلوبة'
    }

    if (formData.minimumStock < 0) {
      newErrors.minimumStock = 'الحد الأدنى يجب أن يكون أكبر من أو يساوي صفر'
    }

    if (formData.maximumStock && Number(formData.maximumStock) < formData.minimumStock) {
      newErrors.maximumStock = 'الحد الأقصى يجب أن يكون أكبر من الحد الأدنى'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      const submitData = {
        ...formData,
        minimumStock: Number(formData.minimumStock),
        maximumStock: formData.maximumStock ? Number(formData.maximumStock) : undefined
      }

      const url = material ? `/api/materials/${material._id}` : '/api/materials'
      const method = material ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData)
      })

      const data = await response.json()

      if (data.success) {
        success(
          material ? 'تم التحديث بنجاح' : 'تم الإنشاء بنجاح',
          data.message
        )
        onSuccess()
      } else {
        error('خطأ', data.error || 'فشل في حفظ المادة')
      }
    } catch (err) {
      console.error('Error saving material:', err)
      error('خطأ', 'فشل في حفظ المادة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className={cn(
        'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto',
        'transform transition-all duration-200 scale-100'
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className={cn('text-xl font-semibold', theme.text.primary)}>
            {material ? 'تعديل المادة' : 'إضافة مادة جديدة'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Material Name */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                اسم المادة *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.name && 'border-red-500'
                )}
                placeholder="اسم المادة"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              الوصف
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl border resize-none',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
              placeholder="وصف المادة"
            />
          </div>

          {/* Category and Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                الفئة *
              </label>
              <select
                value={formData.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.category && 'border-red-500'
                )}
              >
                {CATEGORIES.map(category => (
                  <option key={category} value={category}>
                    {CATEGORY_LABELS[category]}
                  </option>
                ))}
              </select>
              {errors.category && (
                <p className="mt-1 text-sm text-red-600">{errors.category}</p>
              )}
            </div>

            {/* Unit */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                الوحدة *
              </label>
              <select
                value={formData.unit}
                onChange={(e) => handleInputChange('unit', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.unit && 'border-red-500'
                )}
              >
                {UNITS.map(unit => (
                  <option key={unit} value={unit}>
                    {UNIT_LABELS[unit]}
                  </option>
                ))}
              </select>
              {errors.unit && (
                <p className="mt-1 text-sm text-red-600">{errors.unit}</p>
              )}
            </div>
          </div>

          {/* Stock Limits */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Minimum Stock */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                الحد الأدنى للمخزون *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.minimumStock}
                onChange={(e) => handleInputChange('minimumStock', Number(e.target.value))}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.minimumStock && 'border-red-500'
                )}
                placeholder="0"
              />
              {errors.minimumStock && (
                <p className="mt-1 text-sm text-red-600">{errors.minimumStock}</p>
              )}
            </div>

            {/* Maximum Stock */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                الحد الأقصى للمخزون (اختياري)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.maximumStock}
                onChange={(e) => handleInputChange('maximumStock', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.maximumStock && 'border-red-500'
                )}
                placeholder="اتركه فارغاً إذا لم يكن محدد"
              />
              {errors.maximumStock && (
                <p className="mt-1 text-sm text-red-600">{errors.maximumStock}</p>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              الحالة
            </label>
            <select
              value={formData.status}
              onChange={(e) => handleInputChange('status', e.target.value)}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              )}
            >
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="discontinued">متوقف</option>
            </select>
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
                material ? 'تحديث' : 'إضافة'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}