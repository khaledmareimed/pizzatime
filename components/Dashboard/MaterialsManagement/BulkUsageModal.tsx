'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Minus } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import Button from '../../Button'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import { UNIT_LABELS } from './index'

interface RawMaterial {
  _id: string
  name: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
}

interface BulkUsageItem {
  materialId: string
  materialName: string
  unit: string
  currentStock: number
  quantity: number
}

interface BulkUsageModalProps {
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

export default function BulkUsageModal({ onClose, onSuccess }: BulkUsageModalProps) {
  const { success, error } = useToastContext()
  
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  
  // Form data
  const [usageDate, setUsageDate] = useState(new Date().toISOString().split('T')[0])
  const [purpose, setPurpose] = useState('Production')
  const [notes, setNotes] = useState('')
  
  // Items
  const [items, setItems] = useState<BulkUsageItem[]>([])

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/materials?status=active&limit=1000')
        const data = await response.json()
        
        if (data.success) {
          // Only show materials with stock > 0
          setMaterials(data.data.materials.filter((m: RawMaterial) => m.currentStock > 0))
        } else {
          error('خطأ', 'فشل في تحميل المواد')
        }
      } catch (err) {
        console.error('Error fetching materials:', err)
        error('خطأ', 'فشل في تحميل المواد')
      } finally {
        setLoadingMaterials(false)
      }
    }

    fetchMaterials()
  }, [error])

  const addItem = () => {
    setItems([...items, {
      materialId: '',
      materialName: '',
      unit: '',
      currentStock: 0,
      quantity: 0
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof BulkUsageItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // If material changed, update material info
    if (field === 'materialId') {
      const material = materials.find(m => m._id === value)
      if (material) {
        newItems[index].materialName = material.name
        newItems[index].unit = material.unit
        newItems[index].currentStock = material.currentStock
        // Reset quantity if it exceeds available stock
        if (newItems[index].quantity > material.currentStock) {
          newItems[index].quantity = 0
        }
      }
    }
    
    setItems(newItems)
  }

  const getTotalQuantityUsed = () => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }

  const validateStock = () => {
    for (const item of items) {
      if (item.quantity > item.currentStock) {
        return false
      }
    }
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (items.length === 0) {
      error('خطأ', 'يجب إضافة مادة واحدة على الأقل')
      return
    }
    
    // Validate items
    for (const item of items) {
      if (!item.materialId || item.quantity <= 0) {
        error('خطأ', 'جميع المواد يجب أن تحتوي على كمية صحيحة')
        return
      }
      if (item.quantity > item.currentStock) {
        error('خطأ', `الكمية المطلوبة لـ ${item.materialName} تتجاوز المخزون المتاح`)
        return
      }
    }

    setLoading(true)
    
    try {
      const requestData = {
        usageDate,
        purpose,
        notes: notes.trim(),
        items: items.map(item => ({
          materialId: item.materialId,
          quantity: item.quantity
        }))
      }

      const response = await fetch('/api/materials/bulk-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData)
      })

      const data = await response.json()

      if (data.success) {
        success('نجح', data.message)
        onSuccess()
      } else {
        error('خطأ', data.error || 'فشل في تسجيل الاستخدام')
      }
    } catch (err) {
      console.error('Error adding bulk usage:', err)
      error('خطأ', 'فشل في تسجيل الاستخدام')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className={cn(
        'w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg shadow-xl',
        theme.background.card
      )}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-6 border-b',
          theme.border.primary
        )}>
          <div className="flex items-center space-x-3 space-x-reverse">
            <Minus className="h-6 w-6 text-orange-600" />
            <h2 className={cn('text-xl font-bold', theme.text.primary)}>
              استخدام مجمع للمواد
            </h2>
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-2 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-700',
              theme.text.secondary
            )}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Usage Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                تاريخ الاستخدام *
              </label>
              <input
                type="date"
                value={usageDate}
                onChange={(e) => setUsageDate(e.target.value)}
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
                الغرض *
              </label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary
                )}
                required
              >
                {USAGE_PURPOSES.map(p => (
                  <option key={p} value={p}>
                    {PURPOSE_LABELS[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn('text-lg font-medium', theme.text.primary)}>
                المواد
              </h3>
              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة مادة</span>
              </Button>
            </div>

            {loadingMaterials ? (
              <div className="text-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : materials.length === 0 ? (
              <div className={cn(
                'text-center py-8 border-2 border-dashed rounded-lg',
                theme.border.primary
              )}>
                <p className={cn('text-sm', theme.text.secondary)}>
                  لا توجد مواد متاحة للاستخدام (جميع المواد نفدت من المخزون)
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className={cn(
                    'grid grid-cols-1 md:grid-cols-5 gap-3 p-4 border rounded-lg',
                    theme.border.primary,
                    theme.background.secondary
                  )}>
                    <div className="md:col-span-2">
                      <select
                        value={item.materialId}
                        onChange={(e) => updateItem(index, 'materialId', e.target.value)}
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg text-sm',
                          theme.background.card,
                          theme.border.primary,
                          theme.text.primary
                        )}
                        required
                      >
                        <option value="">اختر المادة</option>
                        {materials.map(material => (
                          <option key={material._id} value={material._id}>
                            {material.name} - متاح: {material.currentStock} {UNIT_LABELS[material.unit]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="الكمية"
                        value={item.quantity || ''}
                        onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg text-sm',
                          theme.background.card,
                          theme.border.primary,
                          theme.text.primary,
                          item.quantity > item.currentStock && 'border-red-500'
                        )}
                        min="0"
                        max={item.currentStock}
                        step="0.01"
                        required
                      />
                      {item.quantity > item.currentStock && (
                        <p className="text-red-500 text-xs mt-1">
                          يتجاوز المخزون المتاح ({item.currentStock})
                        </p>
                      )}
                    </div>

                    <div className="flex items-center">
                      <span className={cn('text-sm', theme.text.secondary)}>
                        متاح: {item.currentStock} {item.unit && UNIT_LABELS[item.unit]}
                      </span>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {items.length === 0 && (
                  <div className={cn(
                    'text-center py-8 border-2 border-dashed rounded-lg',
                    theme.border.primary
                  )}>
                    <p className={cn('text-sm', theme.text.secondary)}>
                      لم يتم إضافة أي مواد بعد
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
              ملاحظات
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className={cn(
                'w-full px-3 py-2 border rounded-lg',
                theme.background.card,
                theme.border.primary,
                theme.text.primary
              )}
            />
          </div>

          {/* Summary */}
          {items.length > 0 && (
            <div className={cn(
              'flex justify-between items-center p-4 border rounded-lg',
              theme.border.primary,
              theme.background.secondary
            )}>
              <span className={cn('text-lg font-medium', theme.text.primary)}>
                إجمالي المواد المستخدمة:
              </span>
              <span className={cn('text-xl font-bold text-orange-600')}>
                {items.length} مادة
              </span>
            </div>
          )}

          {/* Stock Validation Warning */}
          {items.length > 0 && !validateStock() && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-red-600 text-sm">
                ⚠️ بعض المواد تحتوي على كميات تتجاوز المخزون المتاح
              </p>
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
              disabled={loading || items.length === 0 || !validateStock()}
              className="flex items-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <Minus className="h-4 w-4" />
                  <span>تسجيل الاستخدام</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}