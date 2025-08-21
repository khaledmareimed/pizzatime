'use client'

import { useState, useEffect } from 'react'
import { X, History, Download, Filter, Search, Calendar, Package, ShoppingCart, Minus, Eye, Edit, MoreVertical } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import Button from '../../Button'
import Card from '../../Card'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import { UNIT_LABELS, CATEGORY_LABELS } from './index'

interface BulkTransactionItem {
  materialId: string
  materialName: string
  quantity: number
  unitPrice?: number
  totalCost?: number
  unit: string
}

interface BulkTransaction {
  _id: string
  type: 'purchase' | 'usage'
  transactionDate: string
  supplierName?: string
  supplierId?: string
  invoiceNumber?: string
  invoiceImage?: string
  purpose?: string
  notes?: string
  items: BulkTransactionItem[]
  totalAmount: number
  createdBy: string
  createdAt: string
}

interface TransactionHistoryProps {
  onClose: () => void
  isSlidePanel?: boolean
}

const PURPOSE_LABELS: Record<string, string> = {
  'Production': 'إنتاج',
  'Waste': 'فاقد',
  'Sample': 'عينة',
  'Transfer': 'نقل',
  'Adjustment': 'تعديل',
  'Other': 'أخرى'
}

export default function TransactionHistory({ onClose, isSlidePanel = false }: TransactionHistoryProps) {
  const { error } = useToastContext()
  
  const [loading, setLoading] = useState(true)
  const [bulkTransactions, setBulkTransactions] = useState<BulkTransaction[]>([])
  const [bulkSummary, setBulkSummary] = useState({
    totalTransactions: 0,
    purchaseCount: 0,
    usageCount: 0,
    totalPurchaseAmount: 0,
    totalUsageQuantity: 0
  })
  
  // Filters
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  
  // Transaction editing states
  const [selectedBulkTransaction, setSelectedBulkTransaction] = useState<BulkTransaction | null>(null)
  const [showBulkTransactionDetails, setShowBulkTransactionDetails] = useState(false)

  const fetchBulkTransactions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '50',
        type: typeFilter,
        search: searchTerm,
        ...(startDate && { startDate }),
        ...(endDate && { endDate })
      })

      const response = await fetch(`/api/materials/bulk-transactions?${params}`)
      const data = await response.json()

      if (data.success) {
        setBulkTransactions(data.data.transactions)
        setBulkSummary(data.data.summary)
        setTotalPages(data.data.pagination.pages)
      } else {
        error('خطأ', data.error || 'فشل في تحميل سجل المعاملات المجمعة')
      }
    } catch (err) {
      console.error('Error fetching bulk transactions:', err)
      error('خطأ', 'فشل في تحميل سجل المعاملات المجمعة')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBulkTransactions()
  }, [typeFilter, searchTerm, startDate, endDate, currentPage])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-GB', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const closeModals = () => {
    setShowBulkTransactionDetails(false)
    setSelectedBulkTransaction(null)
  }

  const containerClasses = isSlidePanel 
    ? "h-full flex flex-col"
    : "w-full"

  const contentClasses = isSlidePanel
    ? cn('h-full flex flex-col', theme.background.card)
    : cn('w-full flex flex-col', theme.background.card)

  const ContentWrapper = isSlidePanel ? 'div' : Card
  
  return (
    <div className={containerClasses}>
      <ContentWrapper className={contentClasses}>
        {/* Header */}
        <div className={cn(
          'flex items-center justify-between p-6 border-b',
          theme.border.primary
        )}>
          <div className="flex items-center space-x-3 space-x-reverse">
            <History className="h-6 w-6 text-purple-600" />
            <h2 className={cn('text-xl font-bold', theme.text.primary)}>
              سجل معاملات المواد
            </h2>
          </div>
          {isSlidePanel && (
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
          )}
        </div>

        <div className={cn(
          "flex flex-col",
          isSlidePanel ? "h-full max-h-[calc(90vh-80px)]" : ""
        )}>

          {/* Summary Cards */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={cn(
                'p-4 rounded-lg border',
                theme.border.primary,
                theme.background.secondary
              )}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Package className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className={cn('text-sm', theme.text.secondary)}>إجمالي المعاملات</p>
                    <p className={cn('text-2xl font-bold', theme.text.primary)}>
                      {bulkSummary.totalTransactions}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn(
                'p-4 rounded-lg border',
                theme.border.primary,
                theme.background.secondary
              )}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <ShoppingCart className="h-8 w-8 text-green-600" />
                  <div>
                    <p className={cn('text-sm', theme.text.secondary)}>المشتريات</p>
                    <p className={cn('text-lg font-bold text-green-600')}>
                      {bulkSummary.purchaseCount}
                    </p>
                    <p className={cn('text-xs', theme.text.secondary)}>
                      {formatJordanCurrency(bulkSummary.totalPurchaseAmount)}
                    </p>
                  </div>
                </div>
              </div>

              <div className={cn(
                'p-4 rounded-lg border',
                theme.border.primary,
                theme.background.secondary
              )}>
                <div className="flex items-center space-x-3 space-x-reverse">
                  <Minus className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className={cn('text-sm', theme.text.secondary)}>الاستخدامات</p>
                    <p className={cn('text-lg font-bold text-orange-600')}>
                      {bulkSummary.usageCount}
                    </p>
                    <p className={cn('text-xs', theme.text.secondary)}>
                      إجمالي الكمية: {bulkSummary.totalUsageQuantity}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={cn('p-6 border-b', theme.border.primary)}>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => setTypeFilter(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary
                  )}
                >
                  <option value="all">جميع المعاملات</option>
                  <option value="purchase">المشتريات</option>
                  <option value="usage">الاستخدامات</option>
                </select>
              </div>

              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                  type="text"
                  placeholder="البحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full pr-10 pl-3 py-2 border rounded-lg text-sm',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary
                  )}
                />
              </div>

              <div>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary
                  )}
                  placeholder="من تاريخ"
                />
              </div>

              <div>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg text-sm',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary
                  )}
                  placeholder="إلى تاريخ"
                />
              </div>

              <div>
                <Button
                  onClick={() => {
                    setTypeFilter('all')
                    setSearchTerm('')
                    setStartDate('')
                    setEndDate('')
                    setCurrentPage(1)
                  }}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  مسح الفلاتر
                </Button>
              </div>
            </div>
          </div>

          {/* Transactions List */}
          <div className={cn(
            "p-6",
            isSlidePanel ? "flex-1 overflow-y-auto" : ""
          )}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : bulkTransactions.length === 0 ? (
              <div className="text-center py-12">
                <History className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className={cn('mt-2 text-sm font-medium', theme.text.primary)}>
                  لا توجد معاملات
                </h3>
                <p className={cn('mt-1 text-sm', theme.text.secondary)}>
                  لم يتم العثور على معاملات تطابق الفلاتر المحددة
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {bulkTransactions.map((bulkTransaction) => (
                  <div
                    key={bulkTransaction._id}
                    className={cn(
                      'p-4 border rounded-lg transition-all duration-200 hover:shadow-md',
                      theme.border.primary,
                      theme.background.secondary,
                      isSlidePanel ? 'text-sm' : ''
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 space-x-reverse flex-1">
                        <div className={cn(
                          'p-2 rounded-lg flex-shrink-0',
                          bulkTransaction.type === 'purchase' 
                            ? 'bg-green-100 dark:bg-green-900/20' 
                            : 'bg-orange-100 dark:bg-orange-900/20'
                        )}>
                          {bulkTransaction.type === 'purchase' ? (
                            <ShoppingCart className={cn(
                              isSlidePanel ? 'h-5 w-5' : 'h-6 w-6',
                              'text-green-600'
                            )} />
                          ) : (
                            <Minus className={cn(
                              isSlidePanel ? 'h-5 w-5' : 'h-6 w-6',
                              'text-orange-600'
                            )} />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className={cn('font-medium', theme.text.primary, isSlidePanel ? 'text-sm' : 'text-base')}>
                              معاملة {bulkTransaction.type === 'purchase' ? 'شراء' : 'استخدام'} مجمعة
                            </h4>
                            <span className={cn(
                              'px-3 py-1 text-xs rounded-full flex-shrink-0 ml-2 font-medium',
                              bulkTransaction.type === 'purchase'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                            )}>
                              {bulkTransaction.items.length} مواد
                            </span>
                          </div>

                          <div className={cn('space-y-2', isSlidePanel ? 'text-xs' : 'text-sm')}>
                            {bulkTransaction.type === 'purchase' && bulkTransaction.supplierName && (
                              <div>
                                <span className={cn('font-medium', theme.text.secondary)}>المورد: </span>
                                <span className={theme.text.primary}>
                                  {bulkTransaction.supplierName}
                                </span>
                              </div>
                            )}

                            {bulkTransaction.type === 'purchase' && bulkTransaction.invoiceNumber && (
                              <div>
                                <span className={cn('font-medium', theme.text.secondary)}>رقم الفاتورة: </span>
                                <span className={theme.text.primary}>
                                  {bulkTransaction.invoiceNumber}
                                </span>
                              </div>
                            )}

                            {bulkTransaction.type === 'usage' && bulkTransaction.purpose && (
                              <div>
                                <span className={cn('font-medium', theme.text.secondary)}>الغرض: </span>
                                <span className={theme.text.primary}>
                                  {PURPOSE_LABELS[bulkTransaction.purpose] || bulkTransaction.purpose}
                                </span>
                              </div>
                            )}

                            <div>
                              <span className={cn('font-medium', theme.text.secondary)}>
                                {bulkTransaction.type === 'purchase' ? 'إجمالي التكلفة: ' : 'إجمالي الكمية: '}
                              </span>
                              <span className={cn('font-bold', theme.text.primary)}>
                                {bulkTransaction.type === 'purchase' 
                                  ? formatJordanCurrency(bulkTransaction.totalAmount)
                                  : bulkTransaction.totalAmount
                                }
                              </span>
                            </div>

                            {/* Items Preview */}
                            <div className="mt-3">
                              <div className={cn('text-xs font-medium mb-1', theme.text.secondary)}>
                                المواد المتضمنة:
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                {bulkTransaction.items.slice(0, 3).map((item, index) => (
                                  <div key={index} className={cn('text-xs', theme.text.primary)}>
                                    • {item.materialName}: {item.quantity} {item.unit}
                                    {bulkTransaction.type === 'purchase' && item.unitPrice && (
                                      <span className={theme.text.secondary}>
                                        {' '}({formatJordanCurrency(item.unitPrice)})
                                      </span>
                                    )}
                                  </div>
                                ))}
                                {bulkTransaction.items.length > 3 && (
                                  <div className={cn('text-xs', theme.text.secondary)}>
                                    و {bulkTransaction.items.length - 3} مواد أخرى...
                                  </div>
                                )}
                              </div>
                            </div>

                            {bulkTransaction.notes && (
                              <div className="mt-2">
                                <span className={cn('font-medium', theme.text.secondary)}>ملاحظات: </span>
                                <span className={theme.text.primary}>
                                  {bulkTransaction.notes}
                                </span>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mt-3">
                            <div className={cn('text-xs', theme.text.secondary)}>
                              {formatDate(bulkTransaction.transactionDate)} • {formatTime(bulkTransaction.createdAt)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1 space-x-reverse">
                          <button
                            onClick={() => {
                              setSelectedBulkTransaction(bulkTransaction)
                              setShowBulkTransactionDetails(true)
                            }}
                            className={cn(
                              'p-1.5 rounded-lg transition-colors',
                              theme.background.secondary,
                              theme.text.secondary
                            )}
                            title="عرض التفاصيل"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className={cn('p-6 border-t', theme.border.primary)}>
              <div className="flex items-center justify-between">
                <div className={cn('text-sm', theme.text.secondary)}>
                  صفحة {currentPage} من {totalPages}
                </div>
                <div className="flex space-x-2 space-x-reverse">
                  <Button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    السابق
                  </Button>
                  <Button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    التالي
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

      </ContentWrapper>
    </div>
  )
}