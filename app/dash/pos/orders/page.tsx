'use client'

import React, { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { redirect } from 'next/navigation'
import Button from '@/components/Button'

interface POSOrder {
  _id: string
  orderId: string
  posOrderId?: string
  deliveryAddress: {
    name: string
    recipientName: string
    city: string
    phone: string
    addressDetails: string
  }
  items: Array<{
    productName: string
    quantity: number
    price: number
    addons: Array<{ name: string; price: number }>
    options: Array<{ optionTitle: string; choiceName: string; choicePrice: number }>
  }>
  orderSummary: {
    total: number
    deliveryFee: number
    couponDiscount: number
    manualDiscount: number
  }
  status: string
  paymentStatus: string
  deliveryMethod: string
  estimatedDeliveryTime: string
  createdAt: string
  notes?: string
  isInternalOrder?: boolean
}

export default function POSOrdersPage() {
  const { data: session, status } = useSession()
  const [orders, setOrders] = useState<POSOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  // Redirect if not authenticated or not admin
  useEffect(() => {
    if (status === 'loading') return
    if (!session?.user || session.user.role !== 'admin') {
      redirect('/auth/signin')
    }
  }, [session, status])

  // Load POS orders
  useEffect(() => {
    loadOrders()
  }, [selectedStatus, currentPage])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      })
      
      if (selectedStatus !== 'all') {
        params.append('status', selectedStatus)
      }

      const response = await fetch(`/api/orders/internal?${params}`)
      const data = await response.json()

      if (data.success) {
        setOrders(data.data)
        setTotalPages(data.pagination?.totalPages || 1)
      }
    } catch (error) {
      console.error('Error loading POS orders:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      // Determine payment status based on order status
      const paymentStatus = newStatus === 'delivered' ? 'paid' : 'pending'
      
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          status: newStatus,
          paymentStatus: paymentStatus
        })
      })

      if (response.ok) {
        loadOrders() // Reload orders
      }
    } catch (error) {
      console.error('Error updating order status:', error)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300'
      case 'preparing': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300'
      case 'ready': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
      case 'delivered': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'في الانتظار'
      case 'confirmed': return 'مؤكد'
      case 'preparing': return 'قيد التحضير'
      case 'ready': return 'جاهز'
      case 'out-for-delivery': return 'في الطريق'
      case 'delivered': return 'تم التسليم'
      case 'cancelled': return 'ملغي'
      default: return status
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <Button
                onClick={() => window.history.back()}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>العودة</span>
              </Button>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                إدارة طلبات نقاط البيع
              </h1>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {orders.length} طلب
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 lg:px-6 py-3">
        <div className="flex items-center space-x-4 space-x-reverse">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            فلترة حسب الحالة:
          </label>
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value)
              setCurrentPage(1)
            }}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">جميع الطلبات</option>
            <option value="pending">في الانتظار</option>
            <option value="confirmed">مؤكد</option>
            <option value="preparing">قيد التحضير</option>
            <option value="ready">جاهز</option>
            <option value="out-for-delivery">في الطريق</option>
            <option value="delivered">تم التسليم</option>
            <option value="cancelled">ملغي</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      <div className="p-4 lg:p-6">
        {orders.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-gray-500 dark:text-gray-400">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      طلب #{order.posOrderId || order.orderId}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(order.createdAt).toLocaleString('ar-SA')}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 space-x-reverse">
                    <Button
                      onClick={() => window.open(`/dash/user/internal/order/${order.orderId}`, '_blank')}
                      variant="outline"
                      size="sm"
                      className="flex items-center space-x-1 space-x-reverse text-xs"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                      <span>عرض</span>
                    </Button>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      order.paymentStatus === 'paid' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300' 
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
                    }`}>
                      {order.paymentStatus === 'paid' ? 'مدفوع' : 'غير مدفوع'}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    >
                      <option value="pending">في الانتظار</option>
                      <option value="confirmed">مؤكد</option>
                      <option value="preparing">قيد التحضير</option>
                      <option value="ready">جاهز</option>
                      <option value="out-for-delivery">في الطريق</option>
                      <option value="delivered">تم التسليم</option>
                      <option value="cancelled">ملغي</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {/* Customer Info */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">معلومات العميل</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>الاسم: {order.deliveryAddress.recipientName}</p>
                      <p>الهاتف: {order.deliveryAddress.phone}</p>
                      <p>المدينة: {order.deliveryAddress.city}</p>
                      {(order.deliveryAddress as any)?.location && (
                        <p>المنطقة: {(order.deliveryAddress as any).location}</p>
                      )}
                      <p>العنوان: {order.deliveryAddress.addressDetails}</p>
                      <p>طريقة التسليم: {order.deliveryMethod === 'pickup' ? 'استلام' : 'توصيل'}</p>
                    </div>
                  </div>

                  {/* Order Summary */}
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">ملخص الطلب</h4>
                    <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>عدد الأصناف: {order.items?.length || 0}</p>
                      <p>الإجمالي: {order.orderSummary.total.toFixed(2)} ر.س</p>
                      {order.orderSummary.deliveryFee > 0 && (
                        <p>رسوم التوصيل: {order.orderSummary.deliveryFee.toFixed(2)} ر.س</p>
                      )}
                      {order.orderSummary.couponDiscount > 0 && (
                        <p>خصم القسيمة: -{order.orderSummary.couponDiscount.toFixed(2)} ر.س</p>
                      )}
                      {order.orderSummary.manualDiscount > 0 && (
                        <p>الخصم الإداري: -{order.orderSummary.manualDiscount.toFixed(2)} ر.س</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Order Items */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">الأصناف</h4>
                  <div className="space-y-2">
                    {order.items?.map((item, index) => (
                      <div key={index} className="flex justify-between items-center text-sm">
                        <div>
                          <span className="text-gray-900 dark:text-white">{item.productName}</span>
                          <span className="text-gray-500 dark:text-gray-400 mr-2">x{item.quantity}</span>
                          {item.addons.length > 0 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              إضافات: {item.addons.map(addon => addon.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {(item.price * item.quantity).toFixed(2)} ر.س
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-2">ملاحظات</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{order.notes}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex items-center space-x-2 space-x-reverse">
              <Button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
              >
                السابق
              </Button>
              <span className="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                صفحة {currentPage} من {totalPages}
              </span>
              <Button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
              >
                التالي
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}