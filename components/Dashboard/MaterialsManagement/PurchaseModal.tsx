'use client'

import { useState } from 'react'
import { X, Upload, Image as ImageIcon } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import Button from '../../Button'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import { UNIT_LABELS } from './index'
import { createProfessionalNumberInputProps, createCurrencyInputProps } from '../../../funcs/number-utils'

interface RawMaterial {
  _id: string
  name: string
  unit: string
  currentStock: number
  averageCost: number
  lastPurchasePrice?: number
}

interface PurchaseModalProps {
  material: RawMaterial
  onClose: () => void
  onSuccess: () => void
}

export default function PurchaseModal({ material, onClose, onSuccess }: PurchaseModalProps) {
  const { success, error } = useToastContext()
  const [loading, setLoading] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    supplierName: '',
    supplierId: '',
    quantity: '',
    unitPrice: material.lastPurchasePrice?.toString() || '',
    purchaseDate: new Date().toISOString().split('T')[0],
    invoiceNumber: '',
    notes: ''
  })

  const [invoiceImage, setInvoiceImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        error('خطأ', 'يرجى اختيار ملف صورة صالح')
        return
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        error('خطأ', 'حجم الصورة يجب أن يكون أقل من 5 ميجابايت')
        return
      }

      setInvoiceImage(file)
      
      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setInvoiceImage(null)
    setImagePreview('')
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.supplierName.trim()) {
      newErrors.supplierName = 'اسم المورد مطلوب'
    }

    if (!formData.quantity || Number(formData.quantity) <= 0) {
      newErrors.quantity = 'الكمية يجب أن تكون أكبر من صفر'
    }

    if (!formData.unitPrice || Number(formData.unitPrice) <= 0) {
      newErrors.unitPrice = 'سعر الوحدة يجب أن يكون أكبر من صفر'
    }

    if (!formData.purchaseDate) {
      newErrors.purchaseDate = 'تاريخ الشراء مطلوب'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const calculateTotal = () => {
    const quantity = Number(formData.quantity) || 0
    const unitPrice = Number(formData.unitPrice) || 0
    return quantity * unitPrice
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)

    try {
      // Create FormData for file upload
      const submitData = new FormData()
      
      // Add form fields
      submitData.append('supplierName', formData.supplierName.trim())
      if (formData.supplierId.trim()) {
        submitData.append('supplierId', formData.supplierId.trim())
      }
      submitData.append('quantity', formData.quantity)
      submitData.append('unitPrice', formData.unitPrice)
      submitData.append('purchaseDate', formData.purchaseDate)
      if (formData.invoiceNumber.trim()) {
        submitData.append('invoiceNumber', formData.invoiceNumber.trim())
      }
      if (formData.notes.trim()) {
        submitData.append('notes', formData.notes.trim())
      }
      
      // Add invoice image if selected
      if (invoiceImage) {
        submitData.append('invoiceImage', invoiceImage)
      }

      const response = await fetch(`/api/materials/${material._id}/purchase`, {
        method: 'POST',
        body: submitData
      })

      const data = await response.json()

      if (data.success) {
        success(
          'تم إضافة المشتريات بنجاح',
          `تم إضافة ${formData.quantity} ${UNIT_LABELS[material.unit]} إلى مخزون ${material.name}`
        )
        onSuccess()
      } else {
        error('خطأ', data.error || 'فشل في إضافة المشتريات')
      }
    } catch (err) {
      console.error('Error adding purchase:', err)
      error('خطأ', 'فشل في إضافة المشتريات')
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
          <div>
            <h2 className={cn('text-xl font-semibold', theme.text.primary)}>
              إضافة مشتريات
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
              <span className={cn('font-medium', theme.text.secondary)}>متوسط التكلفة:</span>
              <span className={cn('mr-2 font-bold', theme.text.primary)}>
                {formatJordanCurrency(material.averageCost)}
              </span>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Supplier Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Supplier Name */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                اسم المورد *
              </label>
              <input
                type="text"
                value={formData.supplierName}
                onChange={(e) => handleInputChange('supplierName', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.supplierName && 'border-red-500'
                )}
                placeholder="اسم المورد"
              />
              {errors.supplierName && (
                <p className="mt-1 text-sm text-red-600">{errors.supplierName}</p>
              )}
            </div>

            {/* Supplier ID */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                رقم المورد (اختياري)
              </label>
              <input
                type="text"
                value={formData.supplierId}
                onChange={(e) => handleInputChange('supplierId', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                )}
                placeholder="رقم أو كود المورد"
              />
            </div>
          </div>

          {/* Purchase Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Quantity */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                الكمية ({UNIT_LABELS[material.unit]}) *
              </label>
              <input
                {...createProfessionalNumberInputProps(
                  formData.quantity,
                  (value) => handleInputChange('quantity', value),
                  "0"
                )}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border professional-number-input',
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
            </div>

            {/* Unit Price */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                سعر الوحدة (ر.س) *
              </label>
              <input
                {...createCurrencyInputProps(
                  formData.unitPrice,
                  (value) => handleInputChange('unitPrice', value),
                  "0.00"
                )}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border professional-number-input',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.unitPrice && 'border-red-500'
                )}
                placeholder="0.00"
              />
              {errors.unitPrice && (
                <p className="mt-1 text-sm text-red-600">{errors.unitPrice}</p>
              )}
            </div>

            {/* Total Cost */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                إجمالي التكلفة
              </label>
              <div className={cn(
                'w-full px-4 py-3 rounded-xl border bg-gray-50 dark:bg-gray-900',
                theme.border.primary,
                theme.text.primary,
                'font-bold text-lg'
              )}>
                {formatJordanCurrency(calculateTotal())}
              </div>
            </div>
          </div>

          {/* Purchase Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                تاريخ الشراء *
              </label>
              <input
                type="date"
                value={formData.purchaseDate}
                onChange={(e) => handleInputChange('purchaseDate', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent',
                  errors.purchaseDate && 'border-red-500'
                )}
              />
              {errors.purchaseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.purchaseDate}</p>
              )}
            </div>

            {/* Invoice Number */}
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                رقم الفاتورة (اختياري)
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                )}
                placeholder="رقم الفاتورة"
              />
            </div>
          </div>

          {/* Invoice Image Upload */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              صورة الفاتورة (اختياري)
            </label>
            
            {!imagePreview ? (
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6">
                <div className="text-center">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                        اختر صورة الفاتورة
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        PNG, JPG, GIF حتى 5MB
                      </span>
                      <input
                        type="file"
                        className="sr-only"
                        accept="image/*"
                        onChange={handleImageChange}
                      />
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Invoice Preview"
                  className="w-full h-48 object-cover rounded-xl border border-gray-300 dark:border-gray-600"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
                  <ImageIcon className="h-3 w-3 inline mr-1" />
                  {invoiceImage?.name}
                </div>
              </div>
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
              placeholder="أي ملاحظات إضافية حول هذه المشتريات..."
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
                'إضافة المشتريات'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}