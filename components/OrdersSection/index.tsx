'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Card from '../Card';

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  image?: string;
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
}

interface Order {
  _id?: string;
  orderId: string;
  items: OrderItem[];
  orderSummary: {
    subtotal: number;
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
  coupon?: {
    code: string;
    name: string;
    discountAmount: number;
  };
}

export default function OrdersSection() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/users/orders?limit=10');
      const result = await response.json();

      if (response.ok && result.success) {
        setOrders(result.data);
      } else {
        throw new Error(result.error || 'فشل في جلب الطلبات');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setError(error instanceof Error ? error.message : 'خطأ في جلب الطلبات');
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

  const handleOrderClick = (orderId: string) => {
    router.push(`/user/order/${orderId}`);
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className={cn(
          'font-bold mb-6',
          responsive.fontSize.xl,
          theme.text.primary
        )}>
          طلباتي
        </h2>
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-6">
        <h2 className={cn(
          'font-bold mb-6',
          responsive.fontSize.xl,
          theme.text.primary
        )}>
          طلباتي
        </h2>
        <div className={cn(
          'text-center py-8 text-red-600 dark:text-red-400'
        )}>
          {error}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className={cn(
          'font-bold',
          responsive.fontSize.xl,
          theme.text.primary
        )}>
          طلباتي
        </h2>
        <span className={cn(
          'px-3 py-1 rounded-full text-sm',
          theme.background.accent,
          theme.text.accent
        )}>
          {orders.length} طلب
        </span>
      </div>

      {orders.length === 0 ? (
        <div className={cn(
          'text-center py-8',
          theme.text.secondary
        )}>
          لا توجد طلبات
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.orderId}
              onClick={() => handleOrderClick(order.orderId)}
              className={cn(
                'p-4 rounded-xl border transition-all cursor-pointer',
                theme.background.card,
                theme.border.primary,
                'hover:shadow-md hover:border-orange-300 dark:hover:border-orange-600'
              )}
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className={cn(
                    'font-medium',
                    theme.text.primary
                  )}>
                    طلب #{order.orderId}
                  </h3>
                  <p className={cn(
                    'text-sm',
                    theme.text.secondary
                  )}>
                    {new Date(order.orderDate).toLocaleDateString('ar-SA', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  getStatusColor(order.status)
                )}>
                  {getStatusText(order.status)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className={cn(
                    'text-sm',
                    theme.text.secondary
                  )}>
                    {order.items.length} عنصر
                  </p>
                  {order.coupon && (
                    <p className="text-xs text-green-600 dark:text-green-400">
                      قسيمة: {order.coupon.code} (-{order.coupon.discountAmount.toFixed(2)} ر.س)
                    </p>
                  )}
                </div>
                <div className="text-left">
                  <p className={cn(
                    'font-bold text-lg text-green-600 dark:text-green-400'
                  )}>
                    {order.orderSummary.total.toFixed(2)} ر.س
                  </p>
                  <p className={cn(
                    'text-xs',
                    theme.text.secondary
                  )}>
                    {order.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}