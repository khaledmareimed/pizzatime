'use client'

import { useState, useEffect } from 'react'
import { X, Package, ShoppingCart, Minus, Calendar, User, FileText, Image as ImageIcon } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import Button from '../../Button'
import { CATEGORY_LABELS, UNIT_LABELS } from './index'

interface RawMaterial {
  _id: string
  name: string
  description?: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock?: number
  averageCost: number
  lastPurchasePrice?: number
  lastPurchaseDate?: string
  status: 'active' | 'inactive' | 'discontinued'
  createdAt: string
  updatedAt: string
}

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

interface MaterialDetailsModalProps {
  material: RawMaterial
  onClose: () => void
}

const PURPOSE_LABELS: Record<string, string> = {
  'Production': 'إنتاج',
  'Waste': 'فاقد',
  'Sample': 'عينة',
  'Transfer': 'نقل',
  'Adjustment': 'تعديل',
  'Other': 'أخرى'
}

export default function MaterialDetailsModal({ material, onClose }: MaterialDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'info' | 'purchases' | 'usage'>('info')
  const [bulkTransactions, setBulkTransactions] = useState<BulkTransaction[]>([])
  const [allBulkTransactions, setAllBulkTransactions] = useState<BulkTransaction[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string>('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  // Fetch bulk transactions that include this material
  const fetchBulkTransactions = async () => {
    try {
      setLoading(true)
      // Search for bulk transactions that include this material
      const response = await fetch(`/api/materials/bulk-transactions?search=${encodeURIComponent(material.name)}&limit=100`)
      const data = await response.json()
      
      if (data.success) {
        // Filter transactions that actually contain this material
        const relevantTransactions = data.data.transactions.filter((transaction: BulkTransaction) =>
          transaction.items.some(item => item.materialId === material._id || item.materialName === material.name)
        )
        setAllBulkTransactions(relevantTransactions)
        setBulkTransactions(relevantTransactions)
      }
    } catch (error) {
      console.error('Error fetching bulk transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter transactions by date range
  const filterTransactionsByDate = () => {
    let filtered = [...allBulkTransactions]
    
    if (startDate) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.transactionDate) >= new Date(startDate)
      )
    }
    
    if (endDate) {
      filtered = filtered.filter(transaction => 
        new Date(transaction.transactionDate) <= new Date(endDate)
      )
    }
    
    setBulkTransactions(filtered)
  }

  // Reset date filters
  const resetDateFilters = () => {
    setStartDate('')
    setEndDate('')
    setBulkTransactions(allBulkTransactions)
  }

  // Quick date filter functions
  const setQuickDateFilter = (type: string) => {
    const today = new Date()
    const formatDate = (date: Date) => date.toISOString().split('T')[0]
    
    switch (type) {
      case 'today':
        setStartDate(formatDate(today))
        setEndDate(formatDate(today))
        break
      case 'yesterday':
        const yesterday = new Date(today)
        yesterday.setDate(today.getDate() - 1)
        setStartDate(formatDate(yesterday))
        setEndDate(formatDate(yesterday))
        break
      case 'last7days':
        const last7Days = new Date(today)
        last7Days.setDate(today.getDate() - 7)
        setStartDate(formatDate(last7Days))
        setEndDate(formatDate(today))
        break
      case 'last30days':
        const last30Days = new Date(today)
        last30Days.setDate(today.getDate() - 30)
        setStartDate(formatDate(last30Days))
        setEndDate(formatDate(today))
        break
      case 'thisweek':
        const startOfWeek = new Date(today)
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday as start
        startOfWeek.setDate(diff)
        setStartDate(formatDate(startOfWeek))
        setEndDate(formatDate(today))
        break
      case 'thismonth':
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
        setStartDate(formatDate(startOfMonth))
        setEndDate(formatDate(today))
        break
      case 'lastmonth':
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1)
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0)
        setStartDate(formatDate(startOfLastMonth))
        setEndDate(formatDate(endOfLastMonth))
        break
      default:
        resetDateFilters()
    }
  }

  useEffect(() => {
    if (activeTab === 'purchases' || activeTab === 'usage') {
      fetchBulkTransactions()
    }
  }, [activeTab])

  useEffect(() => {
    filterTransactionsByDate()
  }, [startDate, endDate])

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

  const isLowStock = material.currentStock <= material.minimumStock

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className={cn(
          'bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden',
          'transform transition-all duration-200 scale-100'
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 className={cn('text-xl font-semibold', theme.text.primary)}>
                تفاصيل المادة
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

          {/* Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="flex space-x-8 space-x-reverse px-6">
              {[
                { id: 'info', label: 'المعلومات الأساسية', icon: Package },
                { id: 'purchases', label: 'سجل المشتريات', icon: ShoppingCart },
                { id: 'usage', label: 'سجل الاستخدام', icon: Minus }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={cn(
                    'flex items-center space-x-2 space-x-reverse py-4 px-1 border-b-2 font-medium text-sm',
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </button>
              ))}
            </nav>

            {/* Date Filter - Only show for purchases and usage tabs */}
            {(activeTab === 'purchases' || activeTab === 'usage') && (
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                {/* Quick Filter Buttons */}
                <div className="mb-4">
                  <div className="flex items-center space-x-2 space-x-reverse mb-3">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className={cn('text-sm font-medium', theme.text.secondary)}>
                      فلترة سريعة:
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setQuickDateFilter('today')}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                        'dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      اليوم
                    </button>
                    <button
                      onClick={() => setQuickDateFilter('yesterday')}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                        'dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      أمس
                    </button>
                    <button
                      onClick={() => setQuickDateFilter('thisweek')}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                        'dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      هذا الأسبوع
                    </button>
                    <button
                      onClick={() => setQuickDateFilter('last7days')}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                        'dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      آخر 7 أيام
                    </button>
                    <button
                      onClick={() => setQuickDateFilter('thismonth')}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                        'dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      هذا الشهر
                    </button>
                    <button
                      onClick={() => setQuickDateFilter('lastmonth')}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                        'dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      الشهر الماضي
                    </button>
                    <button
                      onClick={() => setQuickDateFilter('last30days')}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-blue-50 hover:border-blue-300 hover:text-blue-700',
                        'dark:hover:bg-blue-900/20 dark:hover:border-blue-600 dark:hover:text-blue-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      آخر 30 يوم
                    </button>
                    <button
                      onClick={resetDateFilters}
                      className={cn(
                        'px-3 py-1.5 text-xs rounded-md transition-colors border',
                        'hover:bg-red-50 hover:border-red-300 hover:text-red-700',
                        'dark:hover:bg-red-900/20 dark:hover:border-red-600 dark:hover:text-red-400',
                        theme.border.primary,
                        theme.background.secondary,
                        theme.text.secondary
                      )}
                    >
                      الكل
                    </button>
                  </div>
                </div>

                {/* Manual Date Inputs */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 space-x-reverse">
                    <div className="flex items-center space-x-2 space-x-reverse">
                      <span className={cn('text-sm font-medium', theme.text.secondary)}>
                        تخصيص التاريخ:
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3 space-x-reverse">
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <label className={cn('text-sm', theme.text.secondary)}>من:</label>
                        <input
                          type="date"
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          className={cn(
                            'px-3 py-1.5 border rounded-md text-sm',
                            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                            theme.border.primary,
                            theme.background.secondary,
                            theme.text.primary
                          )}
                        />
                      </div>
                      
                      <div className="flex items-center space-x-2 space-x-reverse">
                        <label className={cn('text-sm', theme.text.secondary)}>إلى:</label>
                        <input
                          type="date"
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          className={cn(
                            'px-3 py-1.5 border rounded-md text-sm',
                            'focus:ring-2 focus:ring-blue-500 focus:border-blue-500',
                            theme.border.primary,
                            theme.background.secondary,
                            theme.text.primary
                          )}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 space-x-reverse text-sm text-gray-500">
                    <span>النتائج:</span>
                    <span className="font-medium text-blue-600">
                      {activeTab === 'purchases' 
                        ? bulkTransactions.filter(t => t.type === 'purchase').length
                        : bulkTransactions.filter(t => t.type === 'usage').length
                      }
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'info' && (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                        اسم المادة
                      </label>
                      <p className={cn('mt-1 text-lg font-semibold', theme.text.primary)}>
                        {material.name}
                      </p>
                    </div>

                    <div>
                      <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                        الفئة
                      </label>
                      <p className={cn('mt-1', theme.text.primary)}>
                        {CATEGORY_LABELS[material.category]}
                      </p>
                    </div>

                    <div>
                      <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                        الوحدة
                      </label>
                      <p className={cn('mt-1', theme.text.primary)}>
                        {UNIT_LABELS[material.unit]}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                        المخزون الحالي
                      </label>
                      <p className={cn(
                        'mt-1 text-2xl font-bold',
                        isLowStock ? 'text-orange-600' : 'text-green-600'
                      )}>
                        {material.currentStock} {UNIT_LABELS[material.unit]}
                      </p>
                      {isLowStock && (
                        <p className="text-sm text-orange-600 mt-1">
                          ⚠️ مخزون منخفض
                        </p>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                          الحد الأدنى
                        </label>
                        <p className={cn('mt-1 font-semibold', theme.text.primary)}>
                          {material.minimumStock}
                        </p>
                      </div>
                      
                      {material.maximumStock && (
                        <div>
                          <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                            الحد الأقصى
                          </label>
                          <p className={cn('mt-1 font-semibold', theme.text.primary)}>
                            {material.maximumStock}
                          </p>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                        متوسط التكلفة
                      </label>
                      <p className={cn('mt-1 text-lg font-semibold text-green-600')}>
                        {formatJordanCurrency(material.averageCost)}
                      </p>
                    </div>

                    {material.lastPurchasePrice && (
                      <div>
                        <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                          آخر سعر شراء
                        </label>
                        <p className={cn('mt-1 font-semibold', theme.text.primary)}>
                          {formatJordanCurrency(material.lastPurchasePrice)}
                        </p>
                        {material.lastPurchaseDate && (
                          <p className={cn('text-xs', theme.text.secondary)}>
                            {formatDate(material.lastPurchaseDate)}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Descriptions */}
                {material.description && (
                  <div className="space-y-4">
                    <h3 className={cn('text-lg font-semibold', theme.text.primary)}>
                      الوصف
                    </h3>
                    
                    {material.description && (
                      <div>
                        <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                          الوصف الإنجليزي
                        </label>
                        <p className={cn('mt-1', theme.text.primary)} dir="ltr">
                          {material.description}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Status and Dates */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                      الحالة
                    </label>
                    <span className={cn(
                      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium mt-1',
                      material.status === 'active' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : material.status === 'inactive'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    )}>
                      {material.status === 'active' ? 'نشط' : 
                       material.status === 'inactive' ? 'غير نشط' : 'متوقف'}
                    </span>
                  </div>
                  
                  <div>
                    <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                      تاريخ الإنشاء
                    </label>
                    <p className={cn('mt-1 text-sm', theme.text.primary)}>
                      {formatDate(material.createdAt)}
                    </p>
                  </div>
                  
                  <div>
                    <label className={cn('block text-sm font-medium', theme.text.secondary)}>
                      آخر تحديث
                    </label>
                    <p className={cn('mt-1 text-sm', theme.text.primary)}>
                      {formatDate(material.updatedAt)}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'purchases' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : bulkTransactions.filter(t => t.type === 'purchase').length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className={cn('mt-2 text-sm font-medium', theme.text.primary)}>
                      لا توجد مشتريات مجمعة
                    </h3>
                    <p className={cn('mt-1 text-sm', theme.text.secondary)}>
                      لم يتم تسجيل أي مشتريات مجمعة تتضمن هذه المادة
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bulkTransactions.filter(t => t.type === 'purchase').map((transaction) => {
                      const materialItem = transaction.items.find(item => 
                        item.materialId === material._id || item.materialName === material.name
                      )
                      return (
                        <div
                          key={transaction._id}
                          className={cn(
                            'border rounded-lg p-4',
                            theme.border.primary,
                            theme.background.card
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className={cn('font-semibold', theme.text.primary)}>
                                {transaction.supplierName || 'مورد غير محدد'}
                              </h4>
                              <p className={cn('text-sm', theme.text.secondary)}>
                                {formatDate(transaction.transactionDate)}
                              </p>
                              <p className={cn('text-xs text-purple-600')}>
                                معاملة مجمعة ({transaction.items.length} مواد)
                              </p>
                            </div>
                            <div className="text-left">
                              {materialItem && (
                                <>
                                  <p className={cn('font-bold text-lg', theme.text.primary)}>
                                    {materialItem.totalCost ? formatJordanCurrency(materialItem.totalCost) : '-'}
                                  </p>
                                  <p className={cn('text-sm', theme.text.secondary)}>
                                    {materialItem.quantity} {materialItem.unit}
                                    {materialItem.unitPrice && ` × ${formatJordanCurrency(materialItem.unitPrice)}`}
                                  </p>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {transaction.invoiceNumber && (
                            <div className="flex items-center space-x-2 space-x-reverse mb-2">
                              <FileText className="h-4 w-4 text-gray-400" />
                              <span className={cn('text-sm', theme.text.secondary)}>
                                فاتورة رقم: {transaction.invoiceNumber}
                              </span>
                            </div>
                          )}
                          
                          {transaction.invoiceImage && (
                            <div className="flex items-center space-x-2 space-x-reverse mb-2">
                              <ImageIcon className="h-4 w-4 text-gray-400" />
                              <button
                                onClick={() => setSelectedImage(transaction.invoiceImage!)}
                                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200"
                              >
                                عرض صورة الفاتورة
                              </button>
                            </div>
                          )}
                          
                          {transaction.notes && (
                            <p className={cn('text-sm mt-2', theme.text.secondary)}>
                              {transaction.notes}
                            </p>
                          )}
                          
                          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className={cn('text-xs', theme.text.secondary)}>
                              إجمالي المعاملة: {formatJordanCurrency(transaction.totalAmount)}
                            </p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'usage' && (
              <div className="space-y-4">
                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : bulkTransactions.filter(t => t.type === 'usage').length === 0 ? (
                  <div className="text-center py-8">
                    <Minus className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className={cn('mt-2 text-sm font-medium', theme.text.primary)}>
                      لا توجد استخدامات مجمعة
                    </h3>
                    <p className={cn('mt-1 text-sm', theme.text.secondary)}>
                      لم يتم تسجيل أي استخدامات مجمعة تتضمن هذه المادة
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bulkTransactions.filter(t => t.type === 'usage').map((transaction) => {
                      const materialItem = transaction.items.find(item => 
                        item.materialId === material._id || item.materialName === material.name
                      )
                      return (
                        <div
                          key={transaction._id}
                          className={cn(
                            'border rounded-lg p-4',
                            theme.border.primary,
                            theme.background.card
                          )}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className={cn('font-semibold', theme.text.primary)}>
                                {transaction.purpose ? (PURPOSE_LABELS[transaction.purpose] || transaction.purpose) : 'غرض غير محدد'}
                              </h4>
                              <p className={cn('text-sm', theme.text.secondary)}>
                                {formatDate(transaction.transactionDate)}
                              </p>
                              <p className={cn('text-xs text-purple-600')}>
                                معاملة مجمعة ({transaction.items.length} مواد)
                              </p>
                            </div>
                            <div className="text-left">
                              {materialItem && (
                                <p className={cn('font-bold text-lg text-red-600')}>
                                  -{materialItem.quantity} {materialItem.unit}
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {transaction.notes && (
                            <p className={cn('text-sm', theme.text.secondary)}>
                              {transaction.notes}
                            </p>
                          )}
                          
                          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <span className={cn('text-xs', theme.text.secondary)}>
                              بواسطة: {transaction.createdBy}
                            </span>
                            <div className="text-left">
                              <span className={cn('text-xs', theme.text.secondary)}>
                                إجمالي الكمية المستخدمة: {transaction.totalAmount}
                              </span>
                              <br />
                              <span className={cn('text-xs', theme.text.secondary)}>
                                {formatTime(transaction.createdAt)}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
            <Button onClick={onClose} variant="outline">
              إغلاق
            </Button>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-60">
          <div className="relative max-w-4xl max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setSelectedImage('')}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full p-2 hover:bg-opacity-75 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={selectedImage}
              alt="Invoice"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}
    </>
  )
}