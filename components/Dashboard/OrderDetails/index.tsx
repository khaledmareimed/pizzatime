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
import { useToastContext } from '@/funcs/contexts/ToastContext'
import Button from '@/components/Button'
import PrintButton from '@/components/PrintButton'
import OrderEditor from '../OrderEditor'

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
  userId?: string
  orderId?: string
  items?: OrderItem[]
  deliveryAddress?: {
    name: string
    recipientName: string
    city: string
    phone: string
    addressDetails: string
  }
  orderSummary?: {
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
  orderDate?: string
  createdAt?: string
  updatedAt?: string
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
  const [isEditMode, setIsEditMode] = useState(false)
  const { success, error: showError } = useToastContext()

  const fetchOrder = async () => {
    try {
      setLoading(true)
      
      // Check if orderId looks like a MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(orderId)
      
      if (isMongoId) {
        // Try to get the order by MongoDB _id directly
        const directResponse = await fetch(`/api/admin/orders/${orderId}`)
        
        if (directResponse.ok) {
          const orderData = await directResponse.json()
          setOrder(orderData)
          setNewStatus(orderData.status)
          setNewPaymentStatus(orderData.paymentStatus)
          setNotes(orderData.notes || '')
          setError(null)
          return
        }
      }
      
      // Search by custom orderId using the search endpoint
      const searchResponse = await fetch(`/api/admin/orders?search=${encodeURIComponent(orderId)}&limit=1&dateRange=all`)
      
      if (!searchResponse.ok) {
        throw new Error('Failed to fetch order')
      }

      const searchData = await searchResponse.json()
      console.log('Search response:', searchData) // Debug log
      
      if (searchData.orders && searchData.orders.length > 0) {
        const orderData = searchData.orders[0]
        setOrder(orderData)
        setNewStatus(orderData.status)
        setNewPaymentStatus(orderData.paymentStatus)
        setNotes(orderData.notes || '')
        setError(null)
      } else {
        // Log the search data to understand why no orders were found
        console.log('No orders found in search. Search data:', searchData)
        console.log('Searching for orderId:', orderId)
        console.log('Total orders in response:', searchData.stats?.total || 0)
        throw new Error('Order not found')
      }
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

  // Handle order update from editor
  const handleOrderUpdate = async (updatedOrder: any): Promise<boolean> => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/edit`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedOrder),
      })

      const data = await response.json()

      if (data.success) {
        // Update local order state
        setOrder(prev => prev ? { ...prev, ...updatedOrder } : null)
        setIsEditMode(false)
        success('تم الحفظ', 'تم تحديث الطلب بنجاح')
        return true
      } else {
        showError('خطأ', data.error || 'فشل في تحديث الطلب')
        return false
      }
    } catch (error) {
      console.error('Error updating order:', error)
      showError('خطأ', 'حدث خطأ أثناء تحديث الطلب')
      return false
    }
  }

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
      
      // Update the order state with the response data
      if (updatedOrder.order) {
        setOrder(updatedOrder.order)
      } else {
        setOrder(prev => prev ? { 
          ...prev, 
          status: newStatus as 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled', 
          paymentStatus: newPaymentStatus as 'pending' | 'paid' | 'failed' | 'refunded', 
          notes 
        } : null)
      }
      
      setEditingStatus(false)
      setEditingPaymentStatus(false)
      
      // Show success message with material transaction info if available
      let successMessage = 'تم تحديث حالة الطلب بنجاح'
      if (updatedOrder.materialTransaction) {
        const { action, materialsProcessed } = updatedOrder.materialTransaction
        if (action === 'DEDUCT') {
          successMessage += ` وتم خصم ${materialsProcessed} مادة من المخزون`
        } else if (action === 'RESTORE') {
          successMessage += ` وتم إرجاع ${materialsProcessed} مادة للمخزون`
        }
      }
      
      success('تم التحديث', successMessage)
    } catch (err) {
      console.error('Error updating order:', err)
      showError('خطأ في التحديث', 'فشل في تحديث حالة الطلب. يرجى المحاولة مرة أخرى.')
    } finally {
      setUpdating(false)
    }
  }

  const formatDateTime = (dateString: string | undefined) => {
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

  // Show OrderEditor if in edit mode
  if (isEditMode && order) {
    return (
      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        <OrderEditor
          order={order}
          onSave={handleOrderUpdate}
          onCancel={() => setIsEditMode(false)}
        />
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
                  طلب #{order.posOrderId ? order.posOrderId.slice(-6) : (order.orderId || order._id || 'غير محدد').toString().slice(-6)}
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
            <PrintButton order={order} />
            <Button
              onClick={() => setIsEditMode(true)}
              size="sm"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              تعديل الطلب
            </Button>
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
              منتجات الطلب ({order.items?.length || 0})
            </h2>
            <div className="space-y-4">
              {order.items?.length ? order.items.map((item, index) => (
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
              )) : (
                <div className="text-center py-8">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className={cn('text-gray-500 dark:text-gray-400', theme.text.secondary)}>
                    لا توجد منتجات في هذا الطلب
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Delivery Address - Only show for delivery orders */}
          {order.deliveryMethod === 'delivery' && order.deliveryAddress ? (
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
                      {order.deliveryAddress?.recipientName || 'غير محدد'}
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
                      {order.deliveryAddress?.phone || 'غير محدد'}
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
                      {order.deliveryAddress?.city || 'غير محدد'}
                    </p>
                    {/* Show city as location */}
                    {order.deliveryAddress?.city ? (
                      <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        المدينة: {order.deliveryAddress.city}
                      </p>
                    ) : (
                      <p className={cn('text-sm text-orange-600 dark:text-orange-400', theme.text.secondary)}>
                        المدينة: غير محدد (يمكن تحديثها من خلال تعديل الطلب)
                      </p>
                    )}
                    <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      {order.deliveryAddress?.addressDetails || 'غير محدد'}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : order.deliveryMethod === 'pickup' ? (
            /* Pickup Information Card */
            <motion.div
              {...animations.slideIn}
              transition={{ delay: 0.1 }}
              className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-3xl shadow-lg p-6"
            >
              <h2 className={cn('text-xl font-bold mb-6 text-green-800 dark:text-green-200', theme.text.primary)}>
                استلام من المحل
              </h2>
              
              {/* Customer Information for Pickup */}
              <div className="space-y-4 mb-6">
                {/* Customer Name - For pickup orders, use available name fields */}
                {(() => {
                  const customerName = order.deliveryAddress?.recipientName || order.deliveryAddress?.name
                  
                  return customerName && (
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <User className="w-5 h-5 text-green-600" />
                      <div>
                        <p className={cn('font-medium text-green-800 dark:text-green-200', theme.text.primary)}>
                          {customerName}
                        </p>
                        <p className={cn('text-sm text-green-600 dark:text-green-400', theme.text.secondary)}>
                          اسم العميل
                        </p>
                      </div>
                    </div>
                  )
                })()}
                
                {/* Customer Phone - For pickup orders, use available phone fields */}
                {(() => {
                  const customerPhone = order.deliveryAddress?.phone
                  
                  return customerPhone && (
                    <div className="flex items-center space-x-3 rtl:space-x-reverse">
                      <Phone className="w-5 h-5 text-green-600" />
                      <div>
                        <p className={cn('font-medium text-green-800 dark:text-green-200', theme.text.primary)} dir="ltr">
                          {customerPhone}
                        </p>
                        <p className={cn('text-sm text-green-600 dark:text-green-400', theme.text.secondary)}>
                          رقم الهاتف
                        </p>
                      </div>
                    </div>
                  )
                })()}
              </div>

              {/* Pickup Message */}
              <div className="flex items-center justify-center space-x-3 rtl:space-x-reverse p-4 bg-green-100 dark:bg-green-800/30 rounded-xl">
                <Package className="w-8 h-8 text-green-600" />
                <div className="text-center">
                  <p className={cn('font-medium text-green-800 dark:text-green-200', theme.text.primary)}>
                    سيتم استلام الطلب من المحل
                  </p>
                  <p className={cn('text-sm text-green-600 dark:text-green-400', theme.text.secondary)}>
                    لا توجد رسوم توصيل
                  </p>
                </div>
              </div>
            </motion.div>
          ) : null}
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
                  {formatJordanCurrency(order.orderSummary?.subtotal || 0)}
                </span>
              </div>
              
              {(order.orderSummary?.addonsTotal || 0) > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>الإضافات</span>
                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary?.addonsTotal || 0)}
                  </span>
                </div>
              )}
              
              {(order.orderSummary?.optionsTotal || 0) > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>الخيارات</span>
                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary?.optionsTotal || 0)}
                  </span>
                </div>
              )}
              
              {(order.orderSummary?.deliveryFee || 0) > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>رسوم التوصيل</span>
                  <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary?.deliveryFee || 0)}
                  </span>
                </div>
              )}
              
              {(order.orderSummary?.couponDiscount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>خصم الكوبون</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{formatJordanCurrency(order.orderSummary?.couponDiscount || 0)}
                  </span>
                </div>
              )}
              
              {(order.orderSummary?.manualDiscount || 0) > 0 && (
                <div className="flex justify-between">
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>خصم يدوي</span>
                  <span className="font-medium text-green-600 dark:text-green-400">
                    -{formatJordanCurrency(order.orderSummary?.manualDiscount || 0)}
                  </span>
                </div>
              )}
              
              <div className="border-t border-gray-100 dark:border-gray-700 pt-3">
                <div className="flex justify-between">
                  <span className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>المجموع الكلي</span>
                  <span className={cn('font-bold text-xl text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanCurrency(order.orderSummary?.total || 0)}
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
                        {updating ? (
                          <>
                            <div className="w-4 h-4 mr-2 rtl:ml-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            جاري التحديث...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2 rtl:ml-2" />
                            حفظ
                          </>
                        )}
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
                        {updating ? (
                          <>
                            <div className="w-4 h-4 mr-2 rtl:ml-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            جاري التحديث...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2 rtl:ml-2" />
                            حفظ
                          </>
                        )}
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
                  {updating ? (
                    <>
                      <div className="w-4 h-4 mr-2 rtl:ml-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      جاري التحديث...
                    </>
                  ) : (
                    'حفظ الملاحظات'
                  )}
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
                    {order.userId ? order.userId.slice(-6) : 'غير محدد'}
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