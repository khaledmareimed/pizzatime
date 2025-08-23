'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus,
  Search,
  Filter,
  Download,
  Edit,
  Trash2,
  Calendar,
  DollarSign,
  TrendingUp,
  TrendingDown,
  FileText,
  Eye,
  RefreshCw,
  ArrowLeft
} from 'lucide-react'
import { cn } from '@/funcs/utils'
import { formatJordanCurrency, formatJordanDateTime } from '@/funcs/jordanLocale'
import Button from '@/components/Button'
import Link from 'next/link'
import ExpenseModal from './ExpenseModal'
import ExpenseFilters from './ExpenseFilters'
import ExpenseStats from './ExpenseStats'

interface ExpenseManagementProps {
  session: Session
}

interface Expense {
  _id: string
  category: string
  amount: number
  description: string
  paymentMethod: string
  notes?: string
  invoiceNumber?: string
  invoiceImage?: string
  dueDate?: string
  isRecurring: boolean
  recurringPeriod?: string
  tags: string[]
  transactionDate: string
  metadata: {
    createdBy: string
    createdByName: string
    expenseType: string
  }
}

interface ExpenseFilters {
  category: string
  startDate: string
  endDate: string
  paymentMethod: string
  isRecurring: string
  search: string
}

export default function ExpenseManagement({ session }: ExpenseManagementProps) {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [summary, setSummary] = useState<any>({})
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0
  })

  const [filters, setFilters] = useState<ExpenseFilters>({
    category: '',
    startDate: '',
    endDate: '',
    paymentMethod: '',
    isRecurring: '',
    search: ''
  })

  useEffect(() => {
    fetchExpenses()
  }, [pagination.page, filters])

  const fetchExpenses = async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/expenses?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch expenses')
      }

      const data = await response.json()
      setExpenses(data.expenses || [])
      setPagination(prev => ({
        ...prev,
        totalCount: data.pagination.totalCount,
        totalPages: data.pagination.totalPages
      }))
      setSummary(data.summary || {})

    } catch (err) {
      console.error('Error fetching expenses:', err)
      setError('فشل في تحميل المصروفات')
    } finally {
      setLoading(false)
    }
  }

  const handleAddExpense = () => {
    setSelectedExpense(null)
    setShowExpenseModal(true)
  }

  const handleEditExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowExpenseModal(true)
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا المصروف؟')) return

    try {
      const response = await fetch(`/api/expenses?id=${expenseId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete expense')
      }

      // Refresh expenses list
      fetchExpenses()
    } catch (error) {
      console.error('Error deleting expense:', error)
      alert('فشل في حذف المصروف')
    }
  }

  const handleExpenseSaved = () => {
    setShowExpenseModal(false)
    setSelectedExpense(null)
    fetchExpenses()
  }

  const handleFilterChange = (newFilters: Partial<ExpenseFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }

  const getExpenseCategoryName = (categoryId: string) => {
    const categoryNames: { [key: string]: string } = {
      'rent': 'إيجار',
      'utilities': 'المرافق',
      'salaries': 'الرواتب',
      'marketing': 'التسويق والإعلان',
      'maintenance': 'الصيانة والإصلاح',
      'equipment': 'المعدات والأجهزة',
      'insurance': 'التأمين',
      'licenses': 'التراخيص والرسوم',
      'transportation': 'النقل والمواصلات',
      'packaging': 'التعبئة والتغليف',
      'cleaning': 'النظافة والتعقيم',
      'professional_services': 'الخدمات المهنية',
      'training': 'التدريب والتطوير',
      'software': 'البرمجيات والتطبيقات',
      'bank_fees': 'رسوم بنكية',
      'office_supplies': 'مستلزمات المكتب',
      'security': 'الأمن والحراسة',
      'waste_management': 'إدارة النفايات',
      'other': 'أخرى'
    }
    return categoryNames[categoryId] || categoryId
  }

  const getPaymentMethodName = (method: string) => {
    const methodNames: { [key: string]: string } = {
      'cash': 'نقداً',
      'card': 'بطاقة',
      'bank_transfer': 'تحويل بنكي',
      'check': 'شيك'
    }
    return methodNames[method] || method
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 rtl:space-x-reverse">
          <Link
            href="/dash"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              إدارة المصروفات
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              إدارة المصروفات التشغيلية والإدارية
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Filter className="w-4 h-4" />
            <span>فلاتر</span>
          </Button>
          
          <Button
            onClick={handleAddExpense}
            className="flex items-center space-x-2 rtl:space-x-reverse"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة مصروف</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <ExpenseStats summary={summary} />

      {/* Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <ExpenseFilters
              filters={filters}
              onFiltersChange={handleFilterChange}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expenses List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              قائمة المصروفات
            </h2>
            
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchExpenses}
                disabled={loading}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                <span>تحديث</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Download className="w-4 h-4" />
                <span>تصدير</span>
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  التاريخ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الفئة
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الوصف
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  المبلغ
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  طريقة الدفع
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  الإجراءات
                </th>
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center">
                    <div className="flex items-center justify-center">
                      <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                      <span className="mr-2 text-gray-600 dark:text-gray-400">
                        جاري التحميل...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : expenses.length > 0 ? (
                expenses.map((expense) => (
                  <tr 
                    key={expense._id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {formatJordanDateTime(new Date(expense.transactionDate))}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center">
                        <span>{getExpenseCategoryName(expense.category)}</span>
                        {expense.isRecurring && (
                          <span className="mr-2 px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 rounded-full">
                            متكرر
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        {expense.notes && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {expense.notes}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      {formatJordanCurrency(expense.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {getPaymentMethodName(expense.paymentMethod)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <button
                          onClick={() => handleEditExpense(expense)}
                          className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExpense(expense._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    لا توجد مصروفات
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                عرض {((pagination.page - 1) * pagination.limit) + 1} إلى {Math.min(pagination.page * pagination.limit, pagination.totalCount)} من {pagination.totalCount} نتيجة
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page === 1}
                >
                  السابق
                </Button>
                
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  صفحة {pagination.page} من {pagination.totalPages}
                </span>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page === pagination.totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Expense Modal */}
      <ExpenseModal
        isOpen={showExpenseModal}
        onClose={() => setShowExpenseModal(false)}
        onSave={handleExpenseSaved}
        expense={selectedExpense}
      />
    </div>
  )
}