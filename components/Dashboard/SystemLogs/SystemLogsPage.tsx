'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { 
  Activity, 
  User, 
  ShoppingBag, 
  Heart, 
  MapPin, 
  LogIn, 
  LogOut, 
  UserPlus,
  ShoppingCart,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Search,
  Filter,
  Download,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanDateTime, formatJordanTimeAgo } from '@/funcs/jordanLocale'
import DateRangeFilter from '@/components/Dashboard/DateRangeFilter'
import Button from '@/components/Button'

interface SystemLog {
  _id: string
  userId: string
  orderId?: string
  action: string
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
  createdAt: string
  updatedAt: string
}

interface SystemLogsPageProps {
  session: Session
}

const actionIcons: Record<string, any> = {
  user_order_created: ShoppingBag,
  user_order_cancelled: Trash2,
  user_order_updated: ShoppingBag,
  admin_order_confirmed: ShoppingBag,
  admin_order_preparing: Clock,
  admin_order_ready: ShoppingBag,
  admin_order_delivered: ShoppingBag,
  admin_order_cancelled: Trash2,
  user_login: LogIn,
  user_logout: LogOut,
  user_registered: UserPlus,
  product_added_to_cart: ShoppingCart,
  product_removed_from_cart: Trash2,
  cart_cleared: Trash2,
  address_added: MapPin,
  address_updated: MapPin,
  address_deleted: Trash2,
  favorite_added: Heart,
  favorite_removed: Heart
}

const actionTranslations: Record<string, string> = {
  user_order_created: 'تم إنشاء طلب جديد',
  user_order_cancelled: 'تم إلغاء الطلب من قبل العميل',
  user_order_updated: 'تم تحديث الطلب',
  admin_order_confirmed: 'تم تأكيد الطلب من قبل الإدارة',
  admin_order_preparing: 'جاري تحضير الطلب',
  admin_order_ready: 'الطلب جاهز للاستلام',
  admin_order_delivered: 'تم توصيل الطلب',
  admin_order_cancelled: 'تم إلغاء الطلب من قبل الإدارة',
  admin_user_updated: 'تم تحديث بيانات مستخدم',
  admin_user_deleted: 'تم حذف مستخدم',
  admin_payment_updated: 'تم تحديث حالة الدفع',
  admin_income_added: 'تم إضافة دخل جديد',
  admin_expense_added: 'تم إضافة مصروف جديد',
  user_login: 'تسجيل دخول المستخدم',
  user_logout: 'تسجيل خروج المستخدم',
  user_registered: 'تسجيل مستخدم جديد',
  product_added_to_cart: 'إضافة منتج إلى السلة',
  product_removed_from_cart: 'إزالة منتج من السلة',
  cart_cleared: 'تفريغ السلة',
  address_added: 'إضافة عنوان جديد',
  address_updated: 'تحديث العنوان',
  address_deleted: 'حذف العنوان',
  favorite_added: 'إضافة إلى المفضلة',
  favorite_removed: 'إزالة من المفضلة'
}

const actionColors: Record<string, string> = {
  user_order_created: 'bg-blue-500',
  user_order_cancelled: 'bg-red-500',
  user_order_updated: 'bg-yellow-500',
  admin_order_confirmed: 'bg-green-500',
  admin_order_preparing: 'bg-orange-500',
  admin_order_ready: 'bg-purple-500',
  admin_order_delivered: 'bg-green-600',
  admin_order_cancelled: 'bg-red-600',
  user_login: 'bg-blue-600',
  user_logout: 'bg-gray-500',
  user_registered: 'bg-green-500',
  product_added_to_cart: 'bg-indigo-500',
  product_removed_from_cart: 'bg-red-400',
  cart_cleared: 'bg-red-500',
  address_added: 'bg-teal-500',
  address_updated: 'bg-yellow-500',
  address_deleted: 'bg-red-500',
  favorite_added: 'bg-pink-500',
  favorite_removed: 'bg-gray-400'
}

export default function SystemLogsPage({ session }: SystemLogsPageProps) {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAction, setSelectedAction] = useState('')
  const [dateRange, setDateRange] = useState('today')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const limit = 50

  const fetchLogs = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        dateRange: dateRange
      })

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }

      const response = await fetch(`/api/systemlogs?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch system logs')
      }

      const data = await response.json()
      setLogs(data.logs)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.totalCount)
      setError(null)
    } catch (err) {
      console.error('Error fetching system logs:', err)
      setError('فشل في تحميل سجل النظام')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs(currentPage)
  }, [currentPage, dateRange, customStartDate, customEndDate])

  const handleDateRangeChange = (range: string, startDate?: string, endDate?: string) => {
    setDateRange(range)
    if (range === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate)
      setCustomEndDate(endDate)
    } else {
      setCustomStartDate('')
      setCustomEndDate('')
    }
    setCurrentPage(1) // Reset to first page when changing date range
  }

  const formatDateTime = (dateString: string) => {
    return formatJordanDateTime(dateString)
  }

  const formatTimeAgo = (dateString: string) => {
    return formatJordanTimeAgo(dateString)
  }

  const getActionIcon = (action: string) => {
    return actionIcons[action] || Activity
  }

  const getActionColor = (action: string) => {
    return actionColors[action] || 'bg-gray-500'
  }

  const getActionText = (action: string) => {
    return actionTranslations[action] || action.replace(/_/g, ' ')
  }

  const filteredLogs = logs.filter(log => {
    const matchesSearch = searchTerm === '' || 
      log.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userId.includes(searchTerm) ||
      (log.orderId && log.orderId.includes(searchTerm))
    
    const matchesAction = selectedAction === '' || log.action === selectedAction
    
    return matchesSearch && matchesAction
  })

  const uniqueActions = Array.from(new Set(logs.map(log => log.action)))

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
                سجل النظام الكامل
              </h1>
              <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                عرض جميع أنشطة النظام والمستخدمين ({totalCount} سجل)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchLogs(currentPage)}
            >
              <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2" />
              تحديث
            </Button>
            <Button variant="outline" size="sm">
              <Download className="w-4 h-4 mr-2 rtl:ml-2" />
              تصدير
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filters */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
              البحث
            </label>
            <div className="relative">
              <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="البحث في الوصف، معرف المستخدم، أو رقم الطلب..."
                className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          
          <div>
            <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
              نوع النشاط
            </label>
            <div className="relative">
              <Filter className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value)}
                className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
              >
                <option value="">جميع الأنشطة</option>
                {uniqueActions.map(action => (
                  <option key={action} value={action}>
                    {getActionText(action)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
            />
          </div>
        </div>
      </motion.div>

      {/* Logs Table */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(10)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="space-y-4">
                {filteredLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      لا توجد سجلات تطابق البحث
                    </p>
                  </div>
                ) : (
                  filteredLogs.map((log, index) => {
                    const IconComponent = getActionIcon(log.action)
                    const iconColor = getActionColor(log.action)
                    
                    return (
                      <motion.div
                        key={log._id}
                        {...animations.scaleIn}
                        transition={{ delay: index * 0.02 }}
                        className="flex items-center justify-between py-4 border-b border-gray-100 dark:border-gray-700 last:border-0"
                      >
                        <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColor)}>
                            <IconComponent className="w-5 h-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                              {getActionText(log.action)}
                            </p>
                            <div className="flex items-center space-x-4 rtl:space-x-reverse text-xs mt-1">
                              <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                {formatDateTime(log.createdAt)}
                              </span>
                              <span className={cn('text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                                ({formatTimeAgo(log.createdAt)})
                              </span>
                              {log.orderId && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className={cn('text-blue-600 dark:text-blue-400', theme.text.secondary)}>
                                    طلب #{log.orderId.slice(-6)}
                                  </span>
                                </>
                              )}
                              {log.ipAddress && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className={cn('text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                                    {log.ipAddress}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-left">
                          <p className={cn('text-xs text-gray-500 dark:text-gray-400', theme.text.secondary)}>
                            مستخدم: {log.userId.slice(-6)}
                          </p>
                          <p className={cn('text-xs text-gray-400 dark:text-gray-500', theme.text.secondary)}>
                            {getActionText(log.action)}
                          </p>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    عرض {((currentPage - 1) * limit) + 1} إلى {Math.min(currentPage * limit, totalCount)} من {totalCount} سجل
                  </p>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                      السابق
                    </Button>
                    
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                              page === currentPage
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                      <ChevronRight className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}