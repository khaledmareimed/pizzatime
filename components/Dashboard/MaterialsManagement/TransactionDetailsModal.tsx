'use client'

import { X, ShoppingCart, Minus, Calendar, User, Package, DollarSign, FileText, Image } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import Button from '../../Button'
import { UNIT_LABELS, CATEGORY_LABELS } from './index'

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

interface TransactionDetailsModalProps {
  transaction: Transaction
  onClose: () => void
  onEdit: () => void
}

const PURPOSE_LABELS: Record<string, string> = {
  'Production': 'إنتاج',
  'Waste': 'فاقد',
  'Sample': 'عينة',
  'Transfer': 'نقل',
  'Adjustment': 'تعديل',
  'Other': 'أخرى'
}

export default function TransactionDetailsModal({ transaction, onClose, onEdit }: TransactionDetailsModalProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ar-JO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'long'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('ar-JO', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
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
                تفاصيل {transaction.type === 'purchase' ? 'الشراء' : 'الاستخدام'}
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

        <div className="p-6 space-y-6">
          {/* Material Information */}
          <div className={cn(
            'p-4 rounded-lg border',
            theme.border.primary,
            theme.background.secondary
          )}>
            <h3 className={cn('text-lg font-semibold mb-3 flex items-center', theme.text.primary)}>
              <Package className="h-5 w-5 ml-2" />
              معلومات المادة
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>اسم المادة</label>
                <p className={cn('text-base', theme.text.primary)}>{transaction.materialInfo.name}</p>
              </div>
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>الفئة</label>
                <p className={cn('text-base', theme.text.primary)}>
                  {CATEGORY_LABELS[transaction.materialInfo.category] || transaction.materialInfo.category}
                </p>
              </div>
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>الوحدة</label>
                <p className={cn('text-base', theme.text.primary)}>
                  {UNIT_LABELS[transaction.materialInfo.unit] || transaction.materialInfo.unit}
                </p>
              </div>
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>الكمية</label>
                <p className={cn('text-base font-semibold', theme.text.primary)}>
                  {transaction.quantity} {UNIT_LABELS[transaction.materialInfo.unit]}
                </p>
              </div>
            </div>
          </div>

          {/* Transaction Details */}
          <div className={cn(
            'p-4 rounded-lg border',
            theme.border.primary,
            theme.background.secondary
          )}>
            <h3 className={cn('text-lg font-semibold mb-3 flex items-center', theme.text.primary)}>
              {transaction.type === 'purchase' ? (
                <>
                  <ShoppingCart className="h-5 w-5 ml-2" />
                  تفاصيل الشراء
                </>
              ) : (
                <>
                  <Minus className="h-5 w-5 ml-2" />
                  تفاصيل الاستخدام
                </>
              )}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>التاريخ</label>
                <p className={cn('text-base', theme.text.primary)}>{formatDate(transaction.date)}</p>
              </div>

              {transaction.type === 'purchase' ? (
                <>
                  {transaction.unitPrice && (
                    <div>
                      <label className={cn('text-sm font-medium', theme.text.secondary)}>سعر الوحدة</label>
                      <p className={cn('text-base font-semibold text-green-600')}>
                        {formatJordanCurrency(transaction.unitPrice)}
                      </p>
                    </div>
                  )}
                  {transaction.totalCost && (
                    <div>
                      <label className={cn('text-sm font-medium', theme.text.secondary)}>إجمالي التكلفة</label>
                      <p className={cn('text-lg font-bold text-green-600')}>
                        {formatJordanCurrency(transaction.totalCost)}
                      </p>
                    </div>
                  )}
                  {transaction.supplierName && (
                    <div>
                      <label className={cn('text-sm font-medium', theme.text.secondary)}>اسم المورد</label>
                      <p className={cn('text-base', theme.text.primary)}>{transaction.supplierName}</p>
                    </div>
                  )}
                  {transaction.supplierId && (
                    <div>
                      <label className={cn('text-sm font-medium', theme.text.secondary)}>معرف المورد</label>
                      <p className={cn('text-base', theme.text.primary)}>{transaction.supplierId}</p>
                    </div>
                  )}
                  {transaction.invoiceNumber && (
                    <div>
                      <label className={cn('text-sm font-medium', theme.text.secondary)}>رقم الفاتورة</label>
                      <p className={cn('text-base', theme.text.primary)}>{transaction.invoiceNumber}</p>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {transaction.purpose && (
                    <div>
                      <label className={cn('text-sm font-medium', theme.text.secondary)}>الغرض</label>
                      <p className={cn('text-base', theme.text.primary)}>
                        {PURPOSE_LABELS[transaction.purpose] || transaction.purpose}
                      </p>
                    </div>
                  )}
                  {transaction.usedBy && (
                    <div>
                      <label className={cn('text-sm font-medium', theme.text.secondary)}>المستخدم</label>
                      <p className={cn('text-base', theme.text.primary)}>{transaction.usedBy}</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Invoice Image */}
            {transaction.type === 'purchase' && transaction.invoiceImage && (
              <div className="mt-4">
                <label className={cn('text-sm font-medium', theme.text.secondary)}>صورة الفاتورة</label>
                <div className="mt-2">
                  <img
                    src={transaction.invoiceImage}
                    alt="صورة الفاتورة"
                    className="max-w-full h-auto rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-90 transition-opacity"
                    style={{ maxHeight: '300px' }}
                    onClick={() => window.open(transaction.invoiceImage, '_blank')}
                    onError={(e) => {
                      console.error('Failed to load invoice image:', transaction.invoiceImage)
                      e.currentTarget.style.display = 'none'
                    }}
                  />
                  <p className={cn('text-xs mt-1', theme.text.secondary)}>
                    اضغط على الصورة لفتحها في نافذة جديدة
                  </p>
                </div>
              </div>
            )}

            {/* Notes */}
            {transaction.notes && (
              <div className="mt-4">
                <label className={cn('text-sm font-medium', theme.text.secondary)}>ملاحظات</label>
                <p className={cn('text-base mt-1 p-3 rounded-lg', theme.background.card, theme.text.primary)}>
                  {transaction.notes}
                </p>
              </div>
            )}
          </div>

          {/* Metadata */}
          <div className={cn(
            'p-4 rounded-lg border',
            theme.border.primary,
            theme.background.secondary
          )}>
            <h3 className={cn('text-lg font-semibold mb-3 flex items-center', theme.text.primary)}>
              <Calendar className="h-5 w-5 ml-2" />
              معلومات إضافية
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>تاريخ الإنشاء</label>
                <p className={cn('text-sm', theme.text.primary)}>
                  {formatDate(transaction.createdAt)} في {formatTime(transaction.createdAt)}
                </p>
              </div>
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>أنشئ بواسطة</label>
                <p className={cn('text-sm', theme.text.primary)}>
                  {transaction.createdBy || transaction.usedBy || 'غير محدد'}
                </p>
              </div>
              <div>
                <label className={cn('text-sm font-medium', theme.text.secondary)}>معرف المعاملة</label>
                <p className={cn('text-xs font-mono', theme.text.secondary)}>{transaction._id}</p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 space-x-reverse">
            <Button
              onClick={onClose}
              variant="outline"
            >
              إغلاق
            </Button>
            <Button
              onClick={onEdit}
              variant="primary"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <FileText className="h-4 w-4" />
              <span>تعديل</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}