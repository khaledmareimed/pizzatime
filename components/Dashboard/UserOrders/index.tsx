'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  User,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Package,
  Calendar,
  DollarSign,
  Phone,
  MapPin,
  ChevronLeft,
  ChevronRight,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanDateTime, formatJordanTimeAgo, formatJordanCurrency } from '@/funcs/jordanLocale'
import DateRangeFilter from '@/components/Dashboard/DateRangeFilter'
import Button from '@/components/Button'

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  originalPrice: number
  image?: string
  categoryId: string
  addons: Array<{
    id: string
    name: string
    price: number
  }>
  options: Array<{
    optionTitle: string
    choiceName: string
    choicePrice: number
  }>
  comments?: string
}

interface Order {
  _id: string
  userId: string
  orderId: string
  items: OrderItem[]
  deliveryAddress: {
    name: string
    recipientName: string
    city: string
    phone: string
    addressDetails: string
  }
  orderSummary: {
    subtotal: number
    addonsTotal: number
    optionsTotal: number
    deliveryFee: number
    couponDiscount: number
    total: number
  }
  coupon?: {
    couponId: string
    code: string
    name: string
    discountAmount: number
  }
  paymentMethod: 'cash' | 'card' | 'online'
  deliveryMethod: 'pickup' | 'delivery'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  estimatedDeliveryTime?: string
  actualDeliveryTime?: string
  orderDate: string
  createdAt: string
  updatedAt: string
}

interface UserData {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'user'
}

interface AdminUserOrdersProps {
  session: Session
  userId: string
}

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  preparing: Package,
  ready: CheckCircle,
  'out-for-delivery': Truck,
  delivered: CheckCircle,
  cancelled: XCircle
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  confirmed: 'bg-blue-500',
  preparing: 'bg-orange-500',
  ready: 'bg-purple-500',
  'out-for-delivery': 'bg-indigo-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500'
}

const statusTranslations: Record<string, string> = {
  pending: 'في الانتظار',
  confirmed: 'مؤكد',
  preparing: 'قيد التحضير',
  ready: 'جاهز',
  'out-for-delivery': 'في الطريق',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي'
}

const paymentMethodTranslations: Record<string, string> = {
  cash: 'نقداً',
  card: 'بطاقة',
  online: 'أونلاين'
}

const deliveryMethodTranslations: Record<string, string> = {
  pickup: 'استلام',
  delivery: 'توصيل'
}

export default function AdminUserOrders({ session, userId }: AdminUserOrdersProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [dateRange, setDateRange] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    confirmed: 0,
    preparing: 0,
    ready: 0,
    delivered: 0,
    cancelled: 0
  })

  const limit = 10

  const fetchUser = async () => {
    try {
      const response = await fetch(`/api/admin/users/${userId}`)
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      }
    } catch (err) {
      console.error('Error fetching user:', err)
    }
  }

  const fetchOrders = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        dateRange: dateRange,
        search: userId // Use userId to filter orders for this specific user
      })

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }

      const response = await fetch(`/api/admin/orders?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      // Filter orders to only show this user's orders
      const userOrders = data.orders.filter((order: Order) => order.userId === userId)
      
      setOrders(userOrders)
      setCurrentPage(page)
      setTotalCount(userOrders.length)
      setTotalPages(Math.ceil(userOrders.length / limit))
      
      // Calculate stats for this user's orders
      const userStats = {
        total: userOrders.length,
        pending: userOrders.filter((o: Order) => o.status === 'pending').length,
        confirmed: userOrders.filter((o: Order) => o.status === 'confirmed').length,
        preparing: userOrders.filter((o: Order) => o.status === 'preparing').length,
        ready: userOrders.filter((o: Order) => o.status === 'ready').length,
        delivered: userOrders.filter((o: Order) => o.status === 'delivered').length,
        cancelled: userOrders.filter((o: Order) => o.status === 'cancelled').length
      }
      setStats(userStats)
      setError(null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('فشل في تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userId])

  useEffect(() => {
    fetchOrders(currentPage)
  }, [currentPage, dateRange, customStartDate, customEndDate, userId])

  const handleDateRangeChange = (range: string, startDate?: string, endDate?: string) => {
    setDateRange(range)
    if (range === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate)
      setCustomEndDate(endDate)
    } else {
      setCustomStartDate('')
      setCustomEndDate('')
    }
    setCurrentPage(1)
  }

  const handleOrderClick = (order: Order) => {
    router.push(`/dash/user/${order.userId || 'unknown'}/order/${order.orderId || order._id}`)
  }

  const getStatusIcon = (status: string) => {
    return statusIcons[status] || Clock
  }

  const getStatusColor = (status: string) => {
    return statusColors[status] || 'bg-gray-500'
  }

  const getStatusText = (status: string) => {
    return statusTranslations[status] || status
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
            <Link href={`/dash/users/${userId}`}>
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                العودة لبيانات المستخدم
              </Button>
            </Link>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className={cn('text-2xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  طلبات {user?.name || 'المستخدم'}
                </h1>
                <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                  عرض جميع طلبات المستخدم ({totalCount} طلب)
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(currentPage)}
            >
              <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2" />
              تحديث
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-8">
        {[
          { title: 'إجمالي الطلبات', value: stats.total, color: 'bg-gray-500' },
          { title: 'في الانتظار', value: stats.pending, color: 'bg-yellow-500' },
          { title: 'مؤكد', value: stats.confirmed, color: 'bg-blue-500' },
          { title: 'قيد التحضير', value: stats.preparing, color: 'bg-orange-500' },
          { title: 'جاهز', value: stats.ready, color: 'bg-purple-500' },
          { title: 'تم التوصيل', value: stats.delivered, color: 'bg-green-500' },
          { title: 'ملغي', value: stats.cancelled, color: 'bg-red-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            {...animations.scaleIn}
            transition={{ delay: index * 0.05 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                  {stat.title}
                </p>
                <p className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  {stat.value}
                </p>
              </div>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', stat.color)}>
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Date Filter */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
      >
        <div className="max-w-md">
          <DateRangeFilter
            selectedRange={dateRange}
            onRangeChange={handleDateRangeChange}
          />
        </div>
      </motion.div>

      {/* Orders List */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
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
                {orders.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingBag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      لا توجد طلبات لهذا المستخدم
                    </p>
                  </div>
                ) : (
                  orders.map((order, index) => {
                    const StatusIcon = getStatusIcon(order.status)
                    const statusColor = getStatusColor(order.status)
                    
                    return (
                      <motion.div
                        key={order._id}
                        {...animations.scaleIn}
                        transition={{ delay: index * 0.02 }}
                        className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                        onClick={() => handleOrderClick(order)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                            <div className={cn('w-12 h-12 rounded-xl flex items-center justify-center', statusColor)}>
                              <StatusIcon className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1">
                              <div className="flex items-center space-x-4 rtl:space-x-reverse mb-2">
                                <h3 className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                                  طلب #{(order.orderId || order._id || 'غير محدد').toString().slice(-6)}
                                </h3>
                                <span className={cn('px-2 py-1 rounded-lg text-xs font-medium text-white', statusColor)}>
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                    {order.deliveryAddress.phone}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                                    {formatJordanCurrency(order.orderSummary?.total || 0)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Package className="w-4 h-4 text-gray-400" />
                                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                    {order.items?.length || 0} منتج
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                    {formatJordanTimeAgo(order.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-2 text-xs">
                                <span className={cn('text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                                  {paymentMethodTranslations[order.paymentMethod]} • {deliveryMethodTranslations[order.deliveryMethod]}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-left">
                            <ChevronLeft className="w-5 h-5 text-gray-400 rtl:rotate-180" />
                          </div>
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
                    عرض {((currentPage - 1) * limit) + 1} إلى {Math.min(currentPage * limit, totalCount)} من {totalCount} طلب
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