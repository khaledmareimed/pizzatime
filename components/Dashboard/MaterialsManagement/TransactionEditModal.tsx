'use client'

import { useState } from 'react'
import { X, ShoppingCart, Minus, Save, Upload } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import Button from '../../Button'
import { useToastContext } from '../../../funcs/contexts/ToastContext'

interface Transaction {
  _id: string
  type: 'purchase' | 'usage'
  date: string
  quantity: number
  unitPrice?: number
  totalCost?: number
  supplierName?: string
  supplierId?: string
  invoiceNumber?: string
  invoiceImage?: string
  purpose?: string
  notes?: string
  createdBy?: string
  usedBy?: string
  createdAt: string
  materialInfo: {
    _id: string
    name: string
    category: string
    unit: string
  }
}

interface TransactionEditModalProps {
  transaction: Transaction
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

export default function TransactionEditModal({ transaction, onClose, onSuccess }: TransactionEditModalProps) {
  const { success, error } = useToastContext()
  const [loading, setLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    date: transaction.date.split('T')[0],
    quantity: transaction.quantity,
    unitPrice: transaction.unitPrice || 0,
    supplierName: transaction.supplierName || '',
    supplierId: transaction.supplierId || '',
    invoiceNumber: transaction.invoiceNumber || '',
    purpose: transaction.purpose || 'Production',
    notes: transaction.notes || ''
  })

  const [newInvoiceImage, setNewInvoiceImage] = useState<File | null>(null)

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (formData.quantity <= 0) {
      error('خطأ', 'الكمية يجب أن تكون أكبر من صفر')
      return
    }

    if (transaction.type === 'purchase' && formData.unitPrice <= 0) {
      error('خطأ', 'سعر الوحدة يجب أن يكون أكبر من صفر')
      return
    }

    setLoading(true)

    try {
      let requestData: any = {
        date: formData.date,
        quantity: formData.quantity,
        notes: formData.notes.trim()
      }

      if (transaction.type === 'purchase') {
        requestData = {
          ...requestData,
          unitPrice: formData.unitPrice,
          supplierName: formData.supplierName.trim(),
          supplierId: formData.supplierId.trim(),
          invoiceNumber: formData.invoiceNumber.trim()
        }

        // Handle image upload if new image is provided
        if (newInvoiceImage) {
          const imageFormData = new FormData()
          imageFormData.append('invoiceImage', newInvoiceImage)
          
          // You would implement image upload logic here
          // For now, we'll just include it in the request
        }
      } else {
        requestData = {
          ...requestData,
          purpose: formData.purpose
        }
      }

      const endpoint = transaction.type === 'purchase' 
        ? `/api/materials/transactions/${transaction._id}/edit-purchase`
        : `/api/materials/transactions/${transaction._id}/edit-usage`

      const response = await fetch(endpoint, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (data.success) {
        success('نجح', 'تم تحديث المعاملة بنجاح')
        onSuccess()
      } else {
        error('خطأ', data.error || 'فشل في تحديث المعاملة')
      }
    } catch (err) {
      console.error('Error updating transaction:', err)
      error('خطأ', 'فشل في تحديث المعاملة')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        'w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl',
        theme.background.card
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-6 border-b',
          theme.border.primary
        )}>
          <div className="flex items-center space-x-3 space-x-reverse">
            {transaction.type === 'purchase' ? (
              <ShoppingCart className="h-6 w-6 text-green-600" />
            ) : (
              <Minus className="h-6 w-6 text-orange-600" />
            )}
            <div>
              <h2 className={cn('text-xl font-bold', theme.text.primary)}>
                تعديل {transaction.type === 'purchase' ? 'الشراء' : 'الاستخدام'}
              </h2>
              <p className={cn('text-sm', theme.text.secondary)}>
                {transaction.materialInfo.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors',
              theme.background.secondary,
              theme.text.secondary
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                التاريخ *
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary
                )}
                required
              />
            </div>

            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                الكمية *
              </label>
              <input
                type="number"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', parseFloat(e.target.value) || 0)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary
                )}
                min="0"
                step="0.01"
                required
              />
            </div>
          </div>

          {/* Purchase-specific fields */}
          {transaction.type === 'purchase' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                    سعر الوحدة *
                  </label>
                  <input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => handleInputChange('unitPrice', parseFloat(e.target.value) || 0)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg',
                      theme.background.card,
                      theme.border.primary,
                      theme.text.primary
                    )}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                    اسم المورد *
                  </label>
                  <input
                    type="text"
                    value={formData.supplierName}
                    onChange={(e) => handleInputChange('supplierName', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg',
                      theme.background.card,
                      theme.border.primary,
                      theme.text.primary
                    )}
                    required
                  />
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                    معرف المورد
                  </label>
                  <input
                    type="text"
                    value={formData.supplierId}
                    onChange={(e) => handleInputChange('supplierId', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg',
                      theme.background.card,
                      theme.border.primary,
                      theme.text.primary
                    )}
                  />
                </div>

                <div>
                  <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                    رقم الفاتورة
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg',
                      theme.background.card,
                      theme.border.primary,
                      theme.text.primary
                    )}
                  />
                </div>
              </div>

              {/* Current Invoice Image */}
              {transaction.invoiceImage && (
                <div>
                  <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                    صورة الفاتورة الحالية
                  </label>
                  <img
                    src={transaction.invoiceImage}
                    alt="صورة الفاتورة"
                    className="max-w-xs h-auto rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                </div>
              )}

              {/* New Invoice Image */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                  تحديث صورة الفاتورة
                </label>
                <div className={cn(
                  'border-2 border-dashed rounded-lg p-4 text-center',
                  theme.border.primary
                )}>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setNewInvoiceImage(e.target.files?.[0] || null)}
                    className="hidden"
                    id="new-invoice-upload"
                  />
                  <label htmlFor="new-invoice-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className={cn('text-sm', theme.text.secondary)}>
                      {newInvoiceImage ? newInvoiceImage.name : 'اضغط لرفع صورة جديدة'}
                    </p>
                  </label>
                </div>
              </div>
            </>
          )}

          {/* Usage-specific fields */}
          {transaction.type === 'usage' && (
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                الغرض *
              </label>
              <select
                value={formData.purpose}
                onChange={(e) => handleInputChange('purpose', e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary
                )}
                required
              >
                {USAGE_PURPOSES.map(purpose => (
                  <option key={purpose} value={purpose}>
                    {PURPOSE_LABELS[purpose]}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
              ملاحظات
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-lg',
                theme.background.card,
                theme.border.primary,
                theme.text.primary
              )}
            />
          </div>

          {/* Total Cost Display for Purchase */}
          {transaction.type === 'purchase' && (
            <div className={cn(
              'p-4 rounded-lg border',
              theme.border.primary,
              theme.background.secondary
            )}>
              <div className="flex justify-between items-center">
                <span className={cn('text-lg font-medium', theme.text.primary)}>
                  إجمالي التكلفة:
                </span>
                <span className={cn('text-xl font-bold text-green-600')}>
                  {(formData.quantity * formData.unitPrice).toLocaleString('ar-JO', {
                    style: 'currency',
                    currency: 'JOD'
                  })}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 space-x-reverse">
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
              className="flex items-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>حفظ التغييرات</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}