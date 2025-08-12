'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { 
  ShoppingBag, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Truck, 
  Package,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Phone,
  MapPin,
  User,
  Calendar,
  DollarSign,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanTimeAgo, formatJordanCurrency } from '@/funcs/jordanLocale'
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
  isInternalOrder?: boolean
  posOrderId?: string
}

interface AdminOrdersManagementProps {
  session: Session
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

export default function AdminOrdersManagement({ session }: AdminOrdersManagementProps) {
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [dateRange, setDateRange] = useState('today')
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

  const limit = 20

  const fetchOrders = async (page = 1, status = selectedStatus, search = searchTerm) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        dateRange: dateRange
      })
      
      if (status !== 'all') {
        params.append('status', status)
      }
      
      if (search.trim()) {
        params.append('search', search.trim())
      }

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }

      const response = await fetch(`/api/admin/orders?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      setOrders(data.orders)
      setStats(data.stats)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.totalCount)
      setError(null)
    } catch (err) {
      console.error('Error fetching orders:', err)
      setError('فشل في تحميل الطلبات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders(currentPage, selectedStatus, searchTerm)
  }, [currentPage, selectedStatus, dateRange, customStartDate, customEndDate])

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

  const handleSearch = () => {
    setCurrentPage(1)
    fetchOrders(1, selectedStatus, searchTerm)
  }

  const handleOrderClick = (order: Order) => {
    router.push(`/dash/user/${order.userId}/order/${order.orderId}`)
  }

  const formatTimeAgo = (dateString: string) => {
    return formatJordanTimeAgo(dateString)
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
            <Link href="/dash">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                العودة للوحة التحكم
              </Button>
            </Link>
            <div>
              <h1 className={cn('text-2xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                إدارة الطلبات
              </h1>
              <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                عرض وإدارة جميع طلبات العملاء ({totalCount} طلب)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchOrders(currentPage, selectedStatus, searchTerm)}
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
          { title: 'إجمالي الطلبات', value: stats.total, color: 'bg-gray-500', key: 'all' },
          { title: 'في الانتظار', value: stats.pending, color: 'bg-yellow-500', key: 'pending' },
          { title: 'مؤكد', value: stats.confirmed, color: 'bg-blue-500', key: 'confirmed' },
          { title: 'قيد التحضير', value: stats.preparing, color: 'bg-orange-500', key: 'preparing' },
          { title: 'جاهز', value: stats.ready, color: 'bg-purple-500', key: 'ready' },
          { title: 'تم التوصيل', value: stats.delivered, color: 'bg-green-500', key: 'delivered' },
          { title: 'ملغي', value: stats.cancelled, color: 'bg-red-500', key: 'cancelled' }
        ].map((stat, index) => (
          <motion.div
            key={stat.key}
            {...animations.scaleIn}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg cursor-pointer transition-all duration-200',
              selectedStatus === stat.key ? 'ring-2 ring-blue-500' : 'hover:shadow-xl'
            )}
            onClick={() => setSelectedStatus(stat.key)}
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

      {/* Search and Filters */}
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
            <div className="flex space-x-2 rtl:space-x-reverse">
              <div className="relative flex-1">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="البحث برقم الطلب، اسم العميل، أو رقم الهاتف..."
                  className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <Button onClick={handleSearch}>
                بحث
              </Button>
            </div>
          </div>
          
          <div>
            <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
              حالة الطلب
            </label>
            <div className="relative">
              <Filter className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
              >
                <option value="all">جميع الطلبات</option>
                <option value="pending">في الانتظار</option>
                <option value="confirmed">مؤكد</option>
                <option value="preparing">قيد التحضير</option>
                <option value="ready">جاهز</option>
                <option value="out-for-delivery">في الطريق</option>
                <option value="delivered">تم التوصيل</option>
                <option value="cancelled">ملغي</option>
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
                      لا توجد طلبات تطابق البحث
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
                                  طلب #{order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)}
                                </h3>
                                {/* Show POS badge only for POS orders */}
                                {order.isInternalOrder && order.userId === 'internal' && (
                                  <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500 text-white">
                                    POS
                                  </span>
                                )}
                                <span className={cn('px-2 py-1 rounded-lg text-xs font-medium text-white', statusColor)}>
                                  {getStatusText(order.status)}
                                </span>
                              </div>
                              
                              <div className="grid md:grid-cols-4 gap-4 text-sm">
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <User className="w-4 h-4 text-gray-400" />
                                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                    {order.deliveryAddress.recipientName}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                    {order.deliveryAddress.phone}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <DollarSign className="w-4 h-4 text-gray-400" />
                                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                                    {formatJordanCurrency(order.orderSummary.total)}
                                  </span>
                                </div>
                                
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Calendar className="w-4 h-4 text-gray-400" />
                                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                    {formatTimeAgo(order.createdAt)}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="mt-2 text-xs">
                                <span className={cn('text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                                  {order.items.length} منتج • {paymentMethodTranslations[order.paymentMethod]} • {deliveryMethodTranslations[order.deliveryMethod]}
                                  {order.isInternalOrder && order.userId === 'internal' && (
                                    <span className="text-purple-600 dark:text-purple-400 font-medium"> • طلب من نقاط البيع</span>
                                  )}
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