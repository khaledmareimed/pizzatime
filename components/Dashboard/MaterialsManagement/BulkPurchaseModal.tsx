'use client'

import { useState, useEffect } from 'react'
import { X, Plus, Trash2, Upload, ShoppingCart } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import Button from '../../Button'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import { UNIT_LABELS } from './index'

interface RawMaterial {
  _id: string
  name: string
  category: string
  unit: string
  currentStock: number
}

interface BulkPurchaseItem {
  materialId: string
  materialName: string
  unit: string
  quantity: number
  unitPrice: number
  totalCost: number
}

interface BulkPurchaseModalProps {
  onClose: () => void
  onSuccess: () => void
}

export default function BulkPurchaseModal({ onClose, onSuccess }: BulkPurchaseModalProps) {
  const { success, error } = useToastContext()
  
  const [loading, setLoading] = useState(false)
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loadingMaterials, setLoadingMaterials] = useState(true)
  
  // Form data
  const [supplierName, setSupplierName] = useState('')
  const [supplierId, setSupplierId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [notes, setNotes] = useState('')
  const [invoiceImage, setInvoiceImage] = useState<File | null>(null)
  
  // Items
  const [items, setItems] = useState<BulkPurchaseItem[]>([])

  // Fetch materials
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const response = await fetch('/api/materials?status=active&limit=1000')
        const data = await response.json()
        
        if (data.success) {
          setMaterials(data.data.materials)
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
      quantity: 0,
      unitPrice: 0,
      totalCost: 0
    }])
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
  }

  const updateItem = (index: number, field: keyof BulkPurchaseItem, value: any) => {
    const newItems = [...items]
    newItems[index] = { ...newItems[index], [field]: value }
    
    // If material changed, update material info
    if (field === 'materialId') {
      const material = materials.find(m => m._id === value)
      if (material) {
        newItems[index].materialName = material.name
        newItems[index].unit = material.unit
      }
    }
    
    // Recalculate total cost
    if (field === 'quantity' || field === 'unitPrice') {
      newItems[index].totalCost = newItems[index].quantity * newItems[index].unitPrice
    }
    
    setItems(newItems)
  }

  const getTotalCost = () => {
    return items.reduce((sum, item) => sum + item.totalCost, 0)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!supplierName.trim()) {
      error('خطأ', 'اسم المورد مطلوب')
      return
    }
    
    if (items.length === 0) {
      error('خطأ', 'يجب إضافة مادة واحدة على الأقل')
      return
    }
    
    // Validate items
    for (const item of items) {
      if (!item.materialId || item.quantity <= 0 || item.unitPrice <= 0) {
        error('خطأ', 'جميع المواد يجب أن تحتوي على كمية وسعر صحيح')
        return
      }
    }

    setLoading(true)
    
    try {
      const formData = new FormData()
      formData.append('supplierName', supplierName.trim())
      formData.append('supplierId', supplierId.trim())
      formData.append('purchaseDate', purchaseDate)
      formData.append('invoiceNumber', invoiceNumber.trim())
      formData.append('notes', notes.trim())
      formData.append('items', JSON.stringify(items.map(item => ({
        materialId: item.materialId,
        quantity: item.quantity,
        unitPrice: item.unitPrice
      }))))
      
      if (invoiceImage) {
        formData.append('invoiceImage', invoiceImage)
      }

      const response = await fetch('/api/materials/bulk-purchase', {
        method: 'POST',
        body: formData
      })

      const data = await response.json()

      if (data.success) {
        success('نجح', data.message)
        onSuccess()
      } else {
        error('خطأ', data.error || 'فشل في إضافة المشتريات')
      }
    } catch (err) {
      console.error('Error adding bulk purchase:', err)
      error('خطأ', 'فشل في إضافة المشتريات')
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
            <ShoppingCart className="h-6 w-6 text-blue-600" />
            <h2 className={cn('text-xl font-bold', theme.text.primary)}>
              شراء مجمع للمواد
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
          {/* Supplier Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
                اسم المورد *
              </label>
              <input
                type="text"
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
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
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
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
                تاريخ الشراء *
              </label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
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
                رقم الفاتورة
              </label>
              <input
                type="text"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className={cn(
                  'w-full px-3 py-2 border rounded-lg',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary
                )}
              />
            </div>
          </div>

          {/* Invoice Image */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.primary)}>
              صورة الفاتورة
            </label>
            <div className={cn(
              'border-2 border-dashed rounded-lg p-4 text-center',
              theme.border.primary
            )}>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setInvoiceImage(e.target.files?.[0] || null)}
                className="hidden"
                id="invoice-upload"
              />
              <label htmlFor="invoice-upload" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className={cn('text-sm', theme.text.secondary)}>
                  {invoiceImage ? invoiceImage.name : 'اضغط لرفع صورة الفاتورة'}
                </p>
              </label>
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
            ) : (
              <div className="space-y-3">
                {items.map((item, index) => (
                  <div key={index} className={cn(
                    'grid grid-cols-1 md:grid-cols-6 gap-3 p-4 border rounded-lg',
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
                            {material.name} ({UNIT_LABELS[material.unit]})
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
                          theme.text.primary
                        )}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div>
                      <input
                        type="number"
                        placeholder="سعر الوحدة"
                        value={item.unitPrice || ''}
                        onChange={(e) => updateItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                        className={cn(
                          'w-full px-3 py-2 border rounded-lg text-sm',
                          theme.background.card,
                          theme.border.primary,
                          theme.text.primary
                        )}
                        min="0"
                        step="0.01"
                        required
                      />
                    </div>

                    <div className="flex items-center">
                      <span className={cn('text-sm font-medium', theme.text.primary)}>
                        {formatJordanCurrency(item.totalCost)}
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

          {/* Total */}
          {items.length > 0 && (
            <div className={cn(
              'flex justify-between items-center p-4 border rounded-lg',
              theme.border.primary,
              theme.background.secondary
            )}>
              <span className={cn('text-lg font-medium', theme.text.primary)}>
                إجمالي التكلفة:
              </span>
              <span className={cn('text-xl font-bold text-green-600')}>
                {formatJordanCurrency(getTotalCost())}
              </span>
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
              disabled={loading || items.length === 0}
              className="flex items-center space-x-2 space-x-reverse"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>جاري الحفظ...</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4" />
                  <span>حفظ المشتريات</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}