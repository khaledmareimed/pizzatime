'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, MapPin, Clock, CreditCard, Tag } from 'lucide-react';
import { cn } from '../../../../funcs/utils';
import { theme, responsive } from '../../../../funcs/responsive';
import Card from '../../../../components/Card';
import Button from '../../../../components/Button';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  originalPrice: number;
  image?: string;
  categoryId: string;
  addons: Array<{
    id: string;
    name: string;
    price: number;
  }>;
  options: Array<{
    optionTitle: string;
    choiceName: string;
    choicePrice: number;
  }>;
  comments?: string;
}

interface Order {
  _id?: string;
  orderId: string;
  items: OrderItem[];
  orderSummary: {
    subtotal: number;
    addonsTotal: number;
    optionsTotal: number;
    couponDiscount: number;
    deliveryFee: number;
    total: number;
  };
  deliveryAddress: {
    name: string;
    recipientName: string;
    city: string;
    phone: string;
    addressDetails: string;
  };
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled';
  paymentMethod: string;
  deliveryMethod: string;
  orderDate: string;
  notes?: string;
  coupon?: {
    couponId: string;
    code: string;
    name: string;
    discountAmount: number;
  };
}

export default function OrderDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const orderId = params.orderid as string;

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId, session, status]);

  const fetchOrderDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // First try to get from user orders
      const userOrdersResponse = await fetch('/api/users/orders?limit=100');
      const userOrdersResult = await userOrdersResponse.json();

      if (userOrdersResponse.ok && userOrdersResult.success) {
        const foundOrder = userOrdersResult.data.find((o: Order) => o.orderId === orderId);
        
        if (foundOrder) {
          setOrder(foundOrder);
        } else {
          setError('الطلب غير موجود');
        }
      } else {
        throw new Error(userOrdersResult.error || 'فشل في جلب تفاصيل الطلب');
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
      setError(error instanceof Error ? error.message : 'خطأ في جلب تفاصيل الطلب');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
      case 'preparing':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300';
      case 'ready':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300';
      case 'out-for-delivery':
        return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-300';
      case 'delivered':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-300';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return 'في الانتظار';
      case 'confirmed':
        return 'مؤكد';
      case 'preparing':
        return 'قيد التحضير';
      case 'ready':
        return 'جاهز';
      case 'out-for-delivery':
        return 'في الطريق';
      case 'delivered':
        return 'تم التوصيل';
      case 'cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center">
            <h1 className={cn(
              'text-2xl font-bold mb-4 text-red-600 dark:text-red-400'
            )}>
              خطأ
            </h1>
            <p className={cn('mb-6', theme.text.secondary)}>
              {error}
            </p>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="p-8 text-center">
            <h1 className={cn(
              'text-2xl font-bold mb-4',
              theme.text.primary
            )}>
              الطلب غير موجود
            </h1>
            <Button onClick={() => router.back()} variant="outline">
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
          >
            <ArrowLeft className="w-4 h-4" />
            العودة
          </Button>
          <div>
            <h1 className={cn(
              'text-2xl font-bold',
              theme.text.primary
            )}>
              طلب #{order.orderId}
            </h1>
            <p className={cn('text-sm', theme.text.secondary)}>
              {new Date(order.orderDate).toLocaleDateString('ar-SA', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Status */}
            <Card className="p-6">
              <div className="flex items-center gap-4">
                <Package className={cn('w-8 h-8', theme.text.primary)} />
                <div>
                  <h2 className={cn('font-bold text-lg', theme.text.primary)}>
                    حالة الطلب
                  </h2>
                  <span className={cn(
                    'inline-block px-4 py-2 rounded-full text-sm font-medium mt-2',
                    getStatusColor(order.status)
                  )}>
                    {getStatusText(order.status)}
                  </span>
                </div>
              </div>
            </Card>

            {/* Order Items */}
            <Card className="p-6">
              <h2 className={cn('font-bold text-lg mb-4', theme.text.primary)}>
                عناصر الطلب
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className={cn(
                      'flex gap-4 p-4 rounded-lg border',
                      theme.border.primary,
                      theme.background.card
                    )}
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    )}
                    <div className="flex-1">
                      <h3 className={cn('font-medium', theme.text.primary)}>
                        {item.productName}
                      </h3>
                      <p className={cn('text-sm', theme.text.secondary)}>
                        الكمية: {item.quantity}
                      </p>
                      
                      {/* Addons */}
                      {item.addons.length > 0 && (
                        <div className="mt-2">
                          <p className={cn('text-xs font-medium', theme.text.secondary)}>
                            الإضافات:
                          </p>
                          {item.addons.map((addon, addonIndex) => (
                            <span
                              key={addonIndex}
                              className={cn('text-xs', theme.text.secondary)}
                            >
                              {addon.name} (+{addon.price.toFixed(2)} ر.س)
                              {addonIndex < item.addons.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Options */}
                      {item.options.length > 0 && (
                        <div className="mt-2">
                          <p className={cn('text-xs font-medium', theme.text.secondary)}>
                            الخيارات:
                          </p>
                          {item.options.map((option, optionIndex) => (
                            <span
                              key={optionIndex}
                              className={cn('text-xs', theme.text.secondary)}
                            >
                              {option.optionTitle}: {option.choiceName}
                              {option.choicePrice > 0 && ` (+${option.choicePrice.toFixed(2)} ر.س)`}
                              {optionIndex < item.options.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Comments */}
                      {item.comments && (
                        <div className="mt-2">
                          <p className={cn('text-xs font-medium', theme.text.secondary)}>
                            ملاحظات: {item.comments}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <p className={cn('font-bold text-green-600 dark:text-green-400')}>
                        {((item.price + 
                          item.addons.reduce((sum, addon) => sum + addon.price, 0) +
                          item.options.reduce((sum, option) => sum + option.choicePrice, 0)
                        ) * item.quantity).toFixed(2)} ر.س
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Order Notes */}
            {order.notes && (
              <Card className="p-6">
                <h2 className={cn('font-bold text-lg mb-4', theme.text.primary)}>
                  ملاحظات الطلب
                </h2>
                <p className={cn(theme.text.secondary)}>
                  {order.notes}
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Delivery Address */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <MapPin className={cn('w-5 h-5', theme.text.primary)} />
                <h2 className={cn('font-bold', theme.text.primary)}>
                  عنوان التوصيل
                </h2>
              </div>
              <div className={cn('space-y-2 text-sm', theme.text.secondary)}>
                <p><strong>الاسم:</strong> {order.deliveryAddress.name}</p>
                <p><strong>المستلم:</strong> {order.deliveryAddress.recipientName}</p>
                <p><strong>المدينة:</strong> {order.deliveryAddress.city}</p>
                <p><strong>الهاتف:</strong> {order.deliveryAddress.phone}</p>
                <p><strong>العنوان:</strong> {order.deliveryAddress.addressDetails}</p>
              </div>
            </Card>

            {/* Payment & Delivery Info */}
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <CreditCard className={cn('w-5 h-5', theme.text.primary)} />
                <h2 className={cn('font-bold', theme.text.primary)}>
                  معلومات الدفع والتوصيل
                </h2>
              </div>
              <div className={cn('space-y-2 text-sm', theme.text.secondary)}>
                <p><strong>طريقة الدفع:</strong> {order.paymentMethod === 'cash' ? 'نقداً' : order.paymentMethod}</p>
                <p><strong>طريقة التوصيل:</strong> {order.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام'}</p>
              </div>
            </Card>

            {/* Coupon Info */}
            {order.coupon && (
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <Tag className={cn('w-5 h-5', theme.text.primary)} />
                  <h2 className={cn('font-bold', theme.text.primary)}>
                    قسيمة الخصم
                  </h2>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className={cn('font-medium text-green-800 dark:text-green-300')}>
                    {order.coupon.name}
                  </p>
                  <p className={cn('text-sm text-green-600 dark:text-green-400')}>
                    رمز القسيمة: {order.coupon.code}
                  </p>
                  <p className={cn('text-sm font-bold text-green-800 dark:text-green-300')}>
                    خصم: {order.coupon.discountAmount.toFixed(2)} ر.س
                  </p>
                </div>
              </Card>
            )}

            {/* Order Summary */}
            <Card className="p-6">
              <h2 className={cn('font-bold mb-4', theme.text.primary)}>
                ملخص الطلب
              </h2>
              <div className={cn('space-y-2 text-sm', theme.text.secondary)}>
                <div className="flex justify-between">
                  <span>المجموع الفرعي:</span>
                  <span>{order.orderSummary.subtotal.toFixed(2)} ر.س</span>
                </div>
                {order.orderSummary.addonsTotal > 0 && (
                  <div className="flex justify-between">
                    <span>الإضافات:</span>
                    <span>{order.orderSummary.addonsTotal.toFixed(2)} ر.س</span>
                  </div>
                )}
                {order.orderSummary.optionsTotal > 0 && (
                  <div className="flex justify-between">
                    <span>الخيارات:</span>
                    <span>{order.orderSummary.optionsTotal.toFixed(2)} ر.س</span>
                  </div>
                )}
                {order.orderSummary.couponDiscount > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>خصم القسيمة:</span>
                    <span>-{order.orderSummary.couponDiscount.toFixed(2)} ر.س</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>رسوم التوصيل:</span>
                  <span>{order.orderSummary.deliveryFee.toFixed(2)} ر.س</span>
                </div>
                <hr className={cn('my-2', theme.border.primary)} />
                <div className={cn('flex justify-between font-bold text-lg', theme.text.primary)}>
                  <span>المجموع الكلي:</span>
                  <span className="text-green-600 dark:text-green-400">
                    {order.orderSummary.total.toFixed(2)} ر.س
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}