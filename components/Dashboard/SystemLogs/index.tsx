'use client'

import { useState, useEffect } from 'react'
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
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import { cn } from '@/funcs/utils'
import { theme, animations } from '@/funcs/responsive'
import { formatJordanTimeAgo } from '@/funcs/jordanLocale'
import Button from '@/components/Button'
import Link from 'next/link'

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

interface SystemLogsProps {
  limit?: number
  showViewAll?: boolean
  title?: string
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

export default function SystemLogs({ limit = 20, showViewAll = true, title = "سجل النظام" }: SystemLogsProps) {
  const [logs, setLogs] = useState<SystemLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/systemlogs?limit=${limit}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch system logs')
      }

      const data = await response.json()
      setLogs(data.logs)
      setError(null)
    } catch (err) {
      console.error('Error fetching system logs:', err)
      setError('فشل في تحميل سجل النظام')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [limit])

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

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
            {title}
          </h2>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
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
    )
  }

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
            {title}
          </h2>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
          >
            <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2" />
            إعادة المحاولة
          </Button>
        </div>
        <div className="text-center py-8">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      {...animations.slideIn}
      className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
          {title}
        </h2>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
          >
            <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2" />
            تحديث
          </Button>
          {showViewAll && (
            <Link href="/dash/logs">
              <Button variant="outline" size="sm">
                عرض الكل
                <ChevronRight className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {logs.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
              لا توجد سجلات نظام
            </p>
          </div>
        ) : (
          logs.map((log, index) => {
            const IconComponent = getActionIcon(log.action)
            const iconColor = getActionColor(log.action)
            
            return (
              <motion.div
                key={log._id}
                {...animations.scaleIn}
                transition={{ delay: index * 0.05 }}
                className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconColor)}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                      {getActionText(log.action)}
                    </p>
                    <div className="flex items-center space-x-2 rtl:space-x-reverse text-xs">
                      <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        {formatTimeAgo(log.createdAt)}
                      </span>
                      {log.orderId && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                            طلب #{log.orderId.slice(-6)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-left">
                  <p className={cn('text-xs text-gray-500 dark:text-gray-400', theme.text.secondary)}>
                    {log.userId.slice(-6)}
                  </p>
                </div>
              </motion.div>
            )
          })
        )}
      </div>
    </motion.div>
  )
}