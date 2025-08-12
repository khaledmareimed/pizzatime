'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  User,
  Phone,
  MapPin,
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  CreditCard,
  FileText,
  Edit,
  Save,
  X
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanDateTime, formatJordanCurrency } from '@/funcs/jordanLocale'
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
    manualDiscount: number
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

interface AdminOrderDetailsProps {
  session: Session
  userId: string
  orderId: string
}

const statusOptions = [
  { value: 'pending', label: 'في الانتظار', color: 'bg-yellow-500' },
  { value: 'confirmed', label: 'مؤكد', color: 'bg-blue-500' },
  { value: 'preparing', label: 'قيد التحضير', color: 'bg-orange-500' },
  { value: 'ready', label: 'جاهز', color: 'bg-purple-500' },
  { value: 'out-for-delivery', label: 'في الطريق', color: 'bg-indigo-500' },
  { value: 'delivered', label: 'تم التوصيل', color: 'bg-green-500' },
  { value: 'cancelled', label: 'ملغي', color: 'bg-red-500' }
]

const paymentStatusOptions = [
  { value: 'pending', label: 'في الانتظار', color: 'bg-yellow-500' },
  { value: 'paid', label: 'مدفوع', color: 'bg-green-500' },
  { value: 'failed', label: 'فشل', color: 'bg-red-500' },
  { value: 'refunded', label: 'مسترد', color: 'bg-gray-500' }
]

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

export default function AdminOrderDetails({ session, userId, orderId }: AdminOrderDetailsProps) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)
  const [editingStatus, setEditingStatus] = useState(false)
  const [editingPaymentStatus, setEditingPaymentStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newPaymentStatus, setNewPaymentStatus] = useState('')
  const [notes, setNotes] = useState('')

  const fetchOrder = async () => {
    try {
      setLoading(true)
      // First try to get the order by orderId from the admin orders endpoint
      const response = await fetch(`/api/admin/orders?search=${orderId}&limit=1`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch order')
      }

      const data = await response.json()
      if (data.orders && data.orders.length > 0) {
        const orderData = data.orders[0]
        setOrder(orderData)
        setNewStatus(orderData.status)
        setNewPaymentStatus(orderData.paymentStatus)
        setNotes(orderData.notes || '')
      } else {
        throw new Error('Order not found')
      }
      setError(null)
    } catch (err) {
      console.error('Error fetching order:', err)
      setError('فشل في تحميل تفاصيل الطلب')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrder()
  }, [orderId])

  const updateOrderStatus = async () => {
    if (!order) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/orders/${order._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          paymentStatus: newPaymentStatus,
          notes: notes
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update order')
      }

      const updatedOrder = await response.json()
      setOrder(updatedOrder)
      setEditingStatus(false)
      setEditingPaymentStatus(false)
    } catch (err) {
      console.error('Error updating order:', err)
      setError('فشل في تحديث الطلب')
    } finally {
      setUpdating(false)
    }
  }

  const formatDateTime = (dateString: string) => {
    return formatJordanDateTime(dateString)
  }

  const getStatusColor = (status: string) => {
    const statusOption = statusOptions.find(s => s.value === status)
    return statusOption?.color || 'bg-gray-500'
  }

  const getPaymentStatusColor = (status: string) => {
    const statusOption = paymentStatusOptions.find(s => s.value === status)
    return statusOption?.color || 'bg-gray-500'
  }

  if (loading) {
    return (
      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 text-center">
          <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error || 'الطلب غير موجود'}</p>
          <Link href="/dash/orders" className="mt-4 inline-block">
            <Button variant="outline">العودة للطلبات</Button>
          </Link>
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
            <Link href="/dash/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                العودة للطلبات
              </Button>
            </Link>
            <div>
              <div className="flex items-center space-x-3 rtl:space-x-reverse mb-2">
                <h1 className={cn('text-2xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  طلب #{order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)}
                </h1>
                {order.isInternalOrder && order.userId === 'internal' && (
                  <span className="px-3 py-1 rounded-lg text-sm font-medium bg-purple-500 text-white">
                    POS
                  </span>
                )}
              </div>
              <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                تفاصيل الطلب وإدارة الحالة
                {order.isInternalOrder && order.userId === 'internal' && (
                  <span className="text-purple-600 dark:text-purple-400 font-medium"> • طلب من نقاط البيع</span>
                )}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <span className={cn('px-3 py-1 rounded-lg text-sm font-medium text-white', getStatusColor(order.status))}>
              {statusTranslations[order.status]}
            </span>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Order Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Order Items */}
          <motion.div
            {...animations.slideIn}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              منتجات الطلب ({order.items.length})
            </h2>
            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center space-x-4 rtl:space-x-reverse p-4 border border-gray-100 dark:border-gray-700 rounded-2xl">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.productName}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                      {item.productName}
                    </h3>
                    <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      الكمية: {item.quantity} × {formatJordanCurrency(item.price)}
                    </p>
                    {item.addons.length > 0 && (
                      <p className={cn('text-xs text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                        إضافات: {item.addons.map(addon => addon.name).join(', ')}
                      </p>
                    )}
                    {item.options.length > 0 && (
                      <p className={cn('text-xs text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                        خيارات: {item.options.map(option => `${option.optionTitle}: ${option.choiceName}`).join(', ')}
                      </p>
                    )}
                    {item.comments && (
                      <p className={cn('text-xs text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                        ملاحظات: {item.comments}
                      </p>
                    )}
                  </div>
                  <div className="text-left">
                    <p className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                      {formatJordanCurrency(item.price * item.quantity)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Delivery Address */}
          <motion.div
            {...animations.slideIn}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              عنوان التوصيل
            </h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {order.deliveryAddress.recipientName}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    المستلم
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Phone className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {order.deliveryAddress.phone}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    رقم الهاتف
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 rtl:space-x-reverse">
                <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {order.deliveryAddress.city}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    {order.deliveryAddress.addressDetails}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Order Management */}
        <div className="space-y-8">
          {/* Order Summary */}
          <motion.div
            {...animations.slideIn}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              ملخص الطلب
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>المجموع الفرعي</span>
                <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                  {formatJordanCurrency(order.orderSummary.subtotal)}
                </span>
              </div>
              
              {order.orderSummary.addonsTotal > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>الإضافات</span>
                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary.addonsTotal)}
                  </span>
                </div>
              )}
              
              {order.orderSummary.optionsTotal > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>الخيارات</span>
                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary.optionsTotal)}
                  </span>
                </div>
              )}
              
              {order.orderSummary.deliveryFee > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>رسوم التوصيل</span>
                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary.deliveryFee)}
                  </span>
                </div>
              )}
              
              {order.orderSummary.couponDiscount > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>خصم الكوبون</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{formatJordanCurrency(order.orderSummary.couponDiscount)}
                  </span>
                </div>
              )}
              
              {order.orderSummary.manualDiscount > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>الخصم الإداري</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{formatJordanCurrency(order.orderSummary.manualDiscount)}
                  </span>
                </div>
              )}
              
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>المجموع الكلي</span>
                  <span className={cn('font-bold text-xl text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary.total)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Order Status Management */}
          <motion.div
            {...animations.slideIn}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              إدارة الطلب
            </h2>
            
            <div className="space-y-6">
              {/* Order Status */}
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  حالة الطلب
                </label>
                {editingStatus ? (
                  <div className="space-y-2">
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {statusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button size="sm" onClick={updateOrderStatus} disabled={updating}>
                        <Save className="w-4 h-4 mr-2 rtl:ml-2" />
                        حفظ
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingStatus(false)}>
                        <X className="w-4 h-4 mr-2 rtl:ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className={cn('px-3 py-1 rounded-lg text-sm font-medium text-white', getStatusColor(order.status))}>
                      {statusTranslations[order.status]}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setEditingStatus(true)}>
                      <Edit className="w-4 h-4 mr-2 rtl:ml-2" />
                      تعديل
                    </Button>
                  </div>
                )}
              </div>

              {/* Payment Status */}
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  حالة الدفع
                </label>
                {editingPaymentStatus ? (
                  <div className="space-y-2">
                    <select
                      value={newPaymentStatus}
                      onChange={(e) => setNewPaymentStatus(e.target.value)}
                      className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      {paymentStatusOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                    <div className="flex space-x-2 rtl:space-x-reverse">
                      <Button size="sm" onClick={updateOrderStatus} disabled={updating}>
                        <Save className="w-4 h-4 mr-2 rtl:ml-2" />
                        حفظ
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setEditingPaymentStatus(false)}>
                        <X className="w-4 h-4 mr-2 rtl:ml-2" />
                        إلغاء
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className={cn('px-3 py-1 rounded-lg text-sm font-medium text-white', getPaymentStatusColor(order.paymentStatus))}>
                      {paymentStatusOptions.find(s => s.value === order.paymentStatus)?.label}
                    </span>
                    <Button variant="outline" size="sm" onClick={() => setEditingPaymentStatus(true)}>
                      <Edit className="w-4 h-4 mr-2 rtl:ml-2" />
                      تعديل
                    </Button>
                  </div>
                )}
              </div>

              {/* Order Notes */}
              <div>
                <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                  ملاحظات الطلب
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="إضافة ملاحظات للطلب..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                  rows={3}
                />
                <Button 
                  size="sm" 
                  className="mt-2" 
                  onClick={updateOrderStatus} 
                  disabled={updating}
                >
                  حفظ الملاحظات
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Order Info */}
          <motion.div
            {...animations.slideIn}
            transition={{ delay: 0.4 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              معلومات الطلب
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatDateTime(order.createdAt)}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    تاريخ الطلب
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <CreditCard className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {paymentMethodTranslations[order.paymentMethod]}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    طريقة الدفع
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Truck className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {deliveryMethodTranslations[order.deliveryMethod]}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    طريقة التوصيل
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <User className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {order.userId.slice(-6)}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    معرف العميل
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}