'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  CreditCard,
  Wallet,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Plus,
  X,
  Edit,
  ShoppingBag,
  Clock,
  Package,
  Truck
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanCurrency, formatJordanDateTime } from '@/funcs/jordanLocale'
import DateRangeFilter from '@/components/Dashboard/DateRangeFilter'
import Button from '@/components/Button'

interface FinancialSummary {
  revenue: number
  expenses: number
  profit: number
  taxes: number
  refunds: number
  discounts: number
  netProfit: number
  profitMargin: number
  transactionCount: number
}

interface GrowthMetrics {
  revenue: number
  expenses: number
  profit: number
}

interface CategoryBreakdown {
  revenueByCategory: Record<string, number>
  expensesByCategory: Record<string, number>
  topCategories: Array<{ category: string; amount: number }>
  paymentMethodStats: Array<{ _id: string; total: number; count: number }>
}

interface ChartData {
  dailyRevenue: Array<{
    _id: { year: number; month: number; day: number }
    totalRevenue: number
    transactionCount: number
  }>
  monthlyTrends: Array<{
    _id: { year: number; month: number; type: string }
    total: number
    count: number
  }>
}

interface FinancialTransaction {
  _id: string
  transactionId: string
  type: string
  category: string
  amount: number
  description: string
  transactionDate: string
  paymentMethod?: string
  paymentStatus: string
}

interface FinancialData {
  summary: FinancialSummary
  growth: GrowthMetrics
  breakdown: CategoryBreakdown
  charts: ChartData
  transactions: FinancialTransaction[]
}

interface FinancialReportsProps {
  session: Session
}

const categoryTranslations: Record<string, string> = {
  food_sales: 'مبيعات الطعام',
  delivery: 'خدمات التوصيل',
  marketing: 'التسويق',
  operations: 'العمليات التشغيلية',
  supplies: 'المستلزمات',
  utilities: 'المرافق والإيجار',
  staff: 'رواتب الموظفين',
  taxes: 'الضرائب',
  refunds: 'المبالغ المستردة',
  discounts: 'الخصومات الترويجية',
  fees: 'رسوم المعالجة',
  other: 'أخرى'
}

const typeTranslations: Record<string, string> = {
  revenue: 'إيرادات',
  expense: 'مصروفات',
  refund: 'استرداد',
  discount: 'خصم',
  delivery_fee: 'رسوم توصيل',
  tax: 'ضريبة',
  commission: 'عمولة',
  adjustment: 'تعديل'
}

const paymentMethodTranslations: Record<string, string> = {
  cash: 'نقداً',
  card: 'بطاقة',
  online: 'أونلاين',
  bank_transfer: 'تحويل بنكي',
  other: 'أخرى'
}

export default function FinancialReports({ session }: FinancialReportsProps) {
  const [data, setData] = useState<FinancialData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateRange, setDateRange] = useState('month')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [selectedView, setSelectedView] = useState<'overview' | 'revenue' | 'expenses' | 'trends' | 'orders' | 'transactions'>('overview')
  const [showAddTransactionModal, setShowAddTransactionModal] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [orderStats, setOrderStats] = useState<any>({})
  const [transactions, setTransactions] = useState<any[]>([])
  const [transactionForm, setTransactionForm] = useState({
    type: 'expense' as 'revenue' | 'expense',
    category: '',
    amount: '',
    description: '',
    paymentMethod: 'cash' as 'cash' | 'card' | 'online' | 'bank_transfer',
    notes: '',
    referenceNumber: '',
    invoiceNumber: ''
  })
  const [syncing, setSyncing] = useState(false)

  const fetchFinancialData = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        dateRange: dateRange
      })

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }

      const response = await fetch(`/api/financial?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch financial data')
      }

      const financialData = await response.json()
      setData(financialData)
      setError(null)
    } catch (err) {
      console.error('Error fetching financial data:', err)
      setError('فشل في تحميل البيانات المالية')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFinancialData()
    if (selectedView === 'orders') {
      fetchOrders()
    } else if (selectedView === 'transactions') {
      fetchTransactions()
    }
  }, [dateRange, customStartDate, customEndDate, selectedView])

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams({
        dateRange: dateRange
      })

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }

      const response = await fetch(`/api/financial/orders?${params}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setOrderStats(data.stats)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
    }
  }

  const fetchTransactions = async () => {
    try {
      const params = new URLSearchParams({
        dateRange: dateRange
      })

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }

      const response = await fetch(`/api/financial/transactions?${params}`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data.transactions)
      }
    } catch (err) {
      console.error('Error fetching transactions:', err)
    }
  }

  const handleDateRangeChange = (range: string, startDate?: string, endDate?: string) => {
    setDateRange(range)
    if (range === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate)
      setCustomEndDate(endDate)
    } else {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) return <ArrowUpRight className="w-4 h-4 text-green-500" />
    if (growth < 0) return <ArrowDownRight className="w-4 h-4 text-red-500" />
    return <Minus className="w-4 h-4 text-gray-500" />
  }

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600 dark:text-green-400'
    if (growth < 0) return 'text-red-600 dark:text-red-400'
    return 'text-gray-600 dark:text-gray-400'
  }

  const formatGrowth = (growth: number) => {
    const abs = Math.abs(growth)
    return `${growth > 0 ? '+' : growth < 0 ? '-' : ''}${abs.toFixed(1)}%`
  }

  const handleUpdatePaymentStatus = async (orderId: string, paymentStatus: string, notes?: string) => {
    try {
      const response = await fetch('/api/financial/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          orderId,
          paymentStatus,
          notes
        })
      })

      if (response.ok) {
        fetchOrders()
        fetchFinancialData()
      } else {
        alert('فشل في تحديث حالة الدفع')
      }
    } catch (err) {
      console.error('Error updating payment status:', err)
      alert('حدث خطأ في تحديث حالة الدفع')
    }
  }

  const handleAddTransaction = async () => {
    try {
      const response = await fetch('/api/financial/transactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(transactionForm)
      })

      if (response.ok) {
        setShowAddTransactionModal(false)
        setTransactionForm({
          type: 'expense',
          category: '',
          amount: '',
          description: '',
          paymentMethod: 'cash',
          notes: '',
          referenceNumber: '',
          invoiceNumber: ''
        })
        fetchTransactions()
        fetchFinancialData()
      } else {
        const data = await response.json()
        alert(data.error || 'فشل في إضافة المعاملة')
      }
    } catch (err) {
      console.error('Error adding transaction:', err)
      alert('حدث خطأ في إضافة المعاملة')
    }
  }

  const getCategoryOptions = (type: 'revenue' | 'expense') => {
    if (type === 'revenue') {
      return [
        { value: 'food_sales', label: 'مبيعات الطعام' },
        { value: 'delivery', label: 'خدمات التوصيل' },
        { value: 'other', label: 'أخرى' }
      ]
    } else {
      return [
        { value: 'marketing', label: 'التسويق' },
        { value: 'operations', label: 'العمليات التشغيلية' },
        { value: 'supplies', label: 'المستلزمات' },
        { value: 'utilities', label: 'المرافق والإيجار' },
        { value: 'staff', label: 'رواتب الموظفين' },
        { value: 'taxes', label: 'الضرائب' },
        { value: 'fees', label: 'رسوم المعالجة' },
        { value: 'other', label: 'أخرى' }
      ]
    }
  }

  const handleSyncOrders = async () => {
    try {
      setSyncing(true)
      const response = await fetch('/api/financial/sync-orders', {
        method: 'POST'
      })

      if (response.ok) {
        const result = await response.json()
        alert(result.message)
        fetchFinancialData()
        if (selectedView === 'orders') {
          fetchOrders()
        }
      } else {
        alert('فشل في مزامنة الطلبات')
      }
    } catch (err) {
      console.error('Error syncing orders:', err)
      alert('حدث خطأ في مزامنة الطلبات')
    } finally {
      setSyncing(false)
    }
  }

  if (loading) {
    return (
      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error || 'فشل في تحميل البيانات المالية'}</p>
          <Button onClick={fetchFinancialData} className="mt-4">
            إعادة المحاولة
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(responsive.container.xl, 'px-4 py-8')}>
      {/* Header */}
      <motion.div 
        {...animations.slideIn}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="/dash">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                العودة للوحة التحكم
              </Button>
            </Link>
            <div>
              <h1 className={cn('text-2xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                التقارير المالية
              </h1>
              <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                تحليل شامل للأداء المالي والإيرادات
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button variant="outline" size="sm" onClick={fetchFinancialData}>
              <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2" />
              تحديث
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSyncOrders}
              disabled={syncing}
            >
              <Activity className="w-4 h-4 mr-2 rtl:ml-2" />
              {syncing ? 'جاري المزامنة...' : 'مزامنة الطلبات'}
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2 rtl:ml-2" />
              تصدير
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Date Range Filter */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="max-w-md">
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
            />
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            {['overview', 'revenue', 'expenses', 'trends', 'orders', 'transactions'].map((view) => (
              <Button
                key={view}
                variant={selectedView === view ? 'primary' : 'outline'}
                size="sm"
                onClick={() => setSelectedView(view as any)}
              >
                {view === 'overview' && 'نظرة عامة'}
                {view === 'revenue' && 'الإيرادات'}
                {view === 'expenses' && 'المصروفات'}
                {view === 'trends' && 'الاتجاهات'}
                {view === 'orders' && 'الطلبات'}
                {view === 'transactions' && 'المعاملات'}
              </Button>
            ))}
            {selectedView === 'transactions' && (
              <Button
                onClick={() => setShowAddTransactionModal(true)}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة معاملة
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: 'إجمالي الإيرادات',
            value: data.summary.revenue,
            growth: data.growth.revenue,
            icon: DollarSign,
            color: 'bg-green-500',
            description: 'إجمالي المبيعات والإيرادات'
          },
          {
            title: 'إجمالي المصروفات',
            value: data.summary.expenses,
            growth: data.growth.expenses,
            icon: CreditCard,
            color: 'bg-red-500',
            description: 'إجمالي التكاليف والمصروفات'
          },
          {
            title: 'صافي الربح',
            value: data.summary.profit,
            growth: data.growth.profit,
            icon: TrendingUp,
            color: 'bg-blue-500',
            description: 'الربح قبل الضرائب'
          },
          {
            title: 'هامش الربح',
            value: data.summary.profitMargin,
            growth: 0,
            icon: Target,
            color: 'bg-purple-500',
            description: 'نسبة الربح من الإيرادات',
            isPercentage: true
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            {...animations.scaleIn}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center', metric.color)}>
                <metric.icon className="w-6 h-6 text-white" />
              </div>
              {metric.growth !== 0 && (
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {getGrowthIcon(metric.growth)}
                  <span className={cn('text-sm font-medium', getGrowthColor(metric.growth))}>
                    {formatGrowth(metric.growth)}
                  </span>
                </div>
              )}
            </div>
            
            <div>
              <p className={cn('text-2xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                {metric.isPercentage 
                  ? `${metric.value.toFixed(1)}%`
                  : formatJordanCurrency(metric.value)
                }
              </p>
              <p className={cn('text-sm font-medium text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                {metric.title}
              </p>
              <p className={cn('text-xs text-gray-500 dark:text-gray-400 mt-1', theme.text.secondary)}>
                {metric.description}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[
          {
            title: 'المبالغ المستردة',
            value: data.summary.refunds,
            icon: ArrowDownRight,
            color: 'bg-orange-500'
          },
          {
            title: 'الخصومات المقدمة',
            value: data.summary.discounts,
            icon: Wallet,
            color: 'bg-indigo-500'
          },
          {
            title: 'عدد المعاملات',
            value: data.summary.transactionCount,
            icon: Activity,
            color: 'bg-teal-500',
            isCount: true
          }
        ].map((metric, index) => (
          <motion.div
            key={metric.title}
            {...animations.scaleIn}
            transition={{ delay: 0.2 + index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', metric.color)}>
                <metric.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  {metric.isCount 
                    ? metric.value.toLocaleString()
                    : formatJordanCurrency(metric.value)
                  }
                </p>
                <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                  {metric.title}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Revenue Breakdown */}
      {selectedView === 'overview' || selectedView === 'revenue' ? (
        <motion.div
          {...animations.slideIn}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
              تفصيل الإيرادات حسب الفئة
            </h2>
            <PieChart className="w-5 h-5 text-gray-400" />
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-4">
              {data.breakdown.topCategories.map((category, index) => {
                const percentage = data.summary.revenue > 0 
                  ? (category.amount / data.summary.revenue) * 100 
                  : 0
                
                return (
                  <div key={category.category} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <div className={cn(
                        'w-3 h-3 rounded-full',
                        index === 0 ? 'bg-blue-500' :
                        index === 1 ? 'bg-green-500' :
                        index === 2 ? 'bg-yellow-500' :
                        index === 3 ? 'bg-purple-500' : 'bg-gray-500'
                      )}></div>
                      <span className={cn('text-sm text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                        {categoryTranslations[category.category] || category.category}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className={cn('text-sm font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                        {formatJordanCurrency(category.amount)}
                      </p>
                      <p className={cn('text-xs text-gray-500 dark:text-gray-400', theme.text.secondary)}>
                        {percentage.toFixed(1)}%
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="space-y-4">
              <h3 className={cn('text-lg font-semibold text-gray-900 dark:text-white', theme.text.primary)}>
                طرق الدفع
              </h3>
              {data.breakdown.paymentMethodStats.map((method, index) => {
                const percentage = data.summary.revenue > 0 
                  ? (method.total / data.summary.revenue) * 100 
                  : 0
                
                return (
                  <div key={method._id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <CreditCard className="w-4 h-4 text-gray-400" />
                      <span className={cn('text-sm text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                        {paymentMethodTranslations[method._id] || method._id}
                      </span>
                    </div>
                    <div className="text-left">
                      <p className={cn('text-sm font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                        {formatJordanCurrency(method.total)}
                      </p>
                      <p className={cn('text-xs text-gray-500 dark:text-gray-400', theme.text.secondary)}>
                        {percentage.toFixed(1)}% ({method.count} معاملة)
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      ) : null}

      {/* Recent Transactions */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden"
      >
        <div className="p-6 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
              المعاملات الأخيرة
            </h2>
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2 rtl:ml-2" />
              عرض الكل
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                  رقم المعاملة
                </th>
                <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                  النوع
                </th>
                <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                  الفئة
                </th>
                <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                  المبلغ
                </th>
                <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                  التاريخ
                </th>
                <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                  الحالة
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {data.transactions.slice(0, 10).map((transaction, index) => (
                <motion.tr
                  key={transaction._id}
                  {...animations.scaleIn}
                  transition={{ delay: 0.5 + index * 0.02 }}
                  className="hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('text-sm font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                      {transaction.transactionId.slice(-8)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'px-2 py-1 text-xs font-medium rounded-lg',
                      transaction.type === 'revenue' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      transaction.type === 'expense' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                      'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                    )}>
                      {typeTranslations[transaction.type] || transaction.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      {categoryTranslations[transaction.category] || transaction.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn(
                      'text-sm font-medium',
                      transaction.type === 'revenue' ? 'text-green-600 dark:text-green-400' :
                      transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' :
                      'text-gray-900 dark:text-white'
                    )}>
                      {transaction.type === 'expense' ? '-' : ''}
                      {formatJordanCurrency(transaction.amount)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      {formatJordanDateTime(transaction.transactionDate, { 
                        month: 'short', 
                        day: 'numeric', 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2 rtl:space-x-reverse">
                      {transaction.paymentStatus === 'completed' ? (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        {transaction.paymentStatus === 'completed' ? 'مكتمل' : 'معلق'}
                      </span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Orders Management View */}
      {selectedView === 'orders' && (
        <motion.div
          {...animations.slideIn}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
              إدارة مدفوعات الطلبات
            </h2>
            
            {/* Payment Status Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {[
                { title: 'مدفوع', value: orderStats.paid || 0, amount: orderStats.totalPaid || 0, color: 'bg-green-500' },
                { title: 'معلق', value: orderStats.pending || 0, amount: orderStats.totalPending || 0, color: 'bg-yellow-500' },
                { title: 'فشل', value: orderStats.failed || 0, amount: 0, color: 'bg-red-500' },
                { title: 'مسترد', value: orderStats.refunded || 0, amount: orderStats.totalRefunded || 0, color: 'bg-gray-500' }
              ].map((stat, index) => (
                <div key={stat.title} className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', stat.color)}>
                      <ShoppingBag className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className={cn('text-lg font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                        {stat.value}
                      </p>
                      <p className={cn('text-xs text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        {stat.title}
                      </p>
                      {stat.amount > 0 && (
                        <p className={cn('text-xs font-medium text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                          {formatJordanCurrency(stat.amount)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    رقم الطلب
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    العميل
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    المبلغ
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    حالة الدفع
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    التاريخ
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    الإجراءات
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {orders.map((order, index) => (
                  <tr key={order._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('text-sm font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                        #{order.orderId.slice(-6)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className={cn('text-sm text-gray-900 dark:text-white', theme.text.primary)}>
                          {order.deliveryAddress.recipientName}
                        </p>
                        <p className={cn('text-xs text-gray-500 dark:text-gray-400', theme.text.secondary)}>
                          {order.deliveryAddress.phone}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('text-sm font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                        {formatJordanCurrency(order.orderSummary.total)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select
                        value={order.paymentStatus}
                        onChange={(e) => handleUpdatePaymentStatus(order.orderId, e.target.value)}
                        className={cn(
                          'text-xs font-medium rounded-lg px-2 py-1 border-0',
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                          order.paymentStatus === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                          order.paymentStatus === 'refunded' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                          'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        )}
                      >
                        <option value="pending">معلق</option>
                        <option value="paid">مدفوع</option>
                        <option value="failed">فشل</option>
                        <option value="refunded">مسترد</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        {formatJordanDateTime(order.createdAt, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`/dash/user/${order.userId}/order/${order.orderId}`, '_blank')}
                      >
                        <Eye className="w-4 h-4 mr-2 rtl:ml-2" />
                        عرض
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Transactions Management View */}
      {selectedView === 'transactions' && (
        <motion.div
          {...animations.slideIn}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden mb-8"
        >
          <div className="p-6 border-b border-gray-100 dark:border-gray-700">
            <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
              إدارة المعاملات المالية
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    رقم المعاملة
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    النوع
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    الفئة
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    الوصف
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    المبلغ
                  </th>
                  <th className={cn('px-6 py-3 text-right text-xs font-medium uppercase tracking-wider', theme.text.secondary)}>
                    التاريخ
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {transactions.map((transaction, index) => (
                  <tr key={transaction._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('text-sm font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                        {transaction.transactionId.slice(-8)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'px-2 py-1 text-xs font-medium rounded-lg',
                        transaction.type === 'revenue' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                        transaction.type === 'expense' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                        'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                      )}>
                        {typeTranslations[transaction.type] || transaction.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        {categoryTranslations[transaction.category] || transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('text-sm text-gray-900 dark:text-white', theme.text.primary)}>
                        {transaction.description}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn(
                        'text-sm font-medium',
                        transaction.type === 'revenue' ? 'text-green-600 dark:text-green-400' :
                        transaction.type === 'expense' ? 'text-red-600 dark:text-red-400' :
                        'text-gray-900 dark:text-white'
                      )}>
                        {transaction.type === 'expense' ? '-' : ''}
                        {formatJordanCurrency(transaction.amount)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        {formatJordanDateTime(transaction.transactionDate, { 
                          month: 'short', 
                          day: 'numeric', 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Add Transaction Modal */}
      {showAddTransactionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            {...animations.scaleIn}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl p-6 w-full max-w-md mx-4"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={cn('text-lg font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                إضافة معاملة مالية
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddTransactionModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  نوع المعاملة
                </label>
                <select
                  value={transactionForm.type}
                  onChange={(e) => setTransactionForm({ ...transactionForm, type: e.target.value as 'revenue' | 'expense', category: '' })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="expense">مصروف</option>
                  <option value="revenue">دخل</option>
                </select>
              </div>
              
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  الفئة
                </label>
                <select
                  value={transactionForm.category}
                  onChange={(e) => setTransactionForm({ ...transactionForm, category: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">اختر الفئة</option>
                  {getCategoryOptions(transactionForm.type).map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  المبلغ (د.أ)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={transactionForm.amount}
                  onChange={(e) => setTransactionForm({ ...transactionForm, amount: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="0.00"
                />
              </div>
              
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  الوصف
                </label>
                <input
                  type="text"
                  value={transactionForm.description}
                  onChange={(e) => setTransactionForm({ ...transactionForm, description: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  placeholder="وصف المعاملة"
                />
              </div>
              
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  طريقة الدفع
                </label>
                <select
                  value={transactionForm.paymentMethod}
                  onChange={(e) => setTransactionForm({ ...transactionForm, paymentMethod: e.target.value as any })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="cash">نقداً</option>
                  <option value="card">بطاقة</option>
                  <option value="online">أونلاين</option>
                  <option value="bank_transfer">تحويل بنكي</option>
                </select>
              </div>
              
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  ملاحظات (اختياري)
                </label>
                <textarea
                  value={transactionForm.notes}
                  onChange={(e) => setTransactionForm({ ...transactionForm, notes: e.target.value })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                  placeholder="ملاحظات إضافية..."
                />
              </div>
            </div>
            
            <div className="flex space-x-3 rtl:space-x-reverse mt-6">
              <Button
                onClick={handleAddTransaction}
                disabled={!transactionForm.type || !transactionForm.category || !transactionForm.amount || !transactionForm.description}
                className="flex-1"
              >
                إضافة المعاملة
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowAddTransactionModal(false)}
              >
                إلغاء
              </Button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}