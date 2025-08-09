'use client';

import { useState } from 'react';
import { ShoppingBag, Tag } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Card from '../Card';
import FoodItem, { type OrderItem } from '../FoodItem';

// Re-export OrderItem type for convenience
export type { OrderItem };

interface OrderDetailsProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function OrderDetails({ items, onUpdateQuantity, onRemoveItem }: OrderDetailsProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const calculateItemTotal = (item: OrderItem) => {
    const basePrice = item.price;
    const addonsPrice = item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
    return (basePrice + addonsPrice) * item.quantity;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const couponDiscount = appliedCoupon ? (subtotal * appliedCoupon.discount) : 0;
  const total = subtotal - couponDiscount;

  // كوبونات متاحة - في التطبيق الحقيقي، هذا سيأتي من الخادم
  const validCoupons = {
    'SAVE10': { discount: 0.10, description: 'خصم 10% على طلبك' },
    'WELCOME20': { discount: 0.20, description: 'خصم 20% للعملاء الجدد' },
    'FOOD15': { discount: 0.15, description: 'خصم 15% على المأكولات' }
  };

  const applyCoupon = () => {
    setCouponError('');
    
    if (!couponCode.trim()) {
      setCouponError('الرجاء ادخال رمز القسيمة');
      return;
    }

    const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons];
    
    if (coupon) {
      setAppliedCoupon({
        code: couponCode.toUpperCase(),
        discount: coupon.discount
      });
      setCouponCode('');
      setCouponError('');
    } else {
      setCouponError('رمز قسيمة غير فعال أو خاطئ');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  };

  return (
    <div dir="rtl">
      <Card className="mb-6">
        <h3 className={cn(
          'font-bold mb-4',
          responsive.fontSize.lg,
          theme.text.primary
        )}>
          <ShoppingBag className="w-5 h-5 inline ml-2" />
          تفاصيل الطلب
        </h3>
      
      <div className="space-y-4">
        {items.map((item) => (
          <FoodItem 
            key={item.id}
            item={item}
            onUpdateQuantity={onUpdateQuantity}
            onRemoveItem={onRemoveItem}
          />
        ))}
      </div>
      
      {/* Order Summary */}
      <div className={cn(
        'mt-6 pt-4 border-t space-y-2',
        theme.border.primary
      )}>
        <div className="flex justify-between text-sm">
          <span className={theme.text.secondary}>المجموع الفرعي:</span>
          <span className={theme.text.primary}>{subtotal.toFixed(2)} دينار أردني</span>
        </div>
        
        {/* Coupon Section */}
        <div className="space-y-2">
          {!appliedCoupon ? (
            <div>
              <div className="flex items-center gap-2">
                <div className="flex-1 relative">
                  <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="أدخل رمز القسيمة"
                    className={cn(
                      'w-full pl-10 pr-3 py-2 text-sm rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors',
                      theme.background.card,
                      theme.border.primary,
                      theme.text.primary,
                      'placeholder-gray-400 dark:placeholder-gray-500',
                      couponError && 'border-red-500 focus:ring-red-500'
                    )}
                    onKeyPress={(e) => e.key === 'Enter' && applyCoupon()}
                  />
                </div>
                <button
                  onClick={applyCoupon}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
                    'bg-orange-500 hover:bg-orange-600 text-white'
                  )}
                >
                  تطبيق
                </button>
              </div>
              {couponError && (
                <p className="text-red-500 text-xs mt-1">{couponError}</p>
              )}
            </div>
          ) : (
            <div className={cn(
              'flex items-center justify-between p-2 rounded-xl',
              'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
            )}>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {appliedCoupon.code}
                </span>
                <span className="text-xs text-green-600 dark:text-green-400">
                  (-{(appliedCoupon.discount * 100).toFixed(0)}%)
                </span>
              </div>
              <button
                onClick={removeCoupon}
                className="text-xs text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className={theme.text.secondary}>Coupon Discount:</span>
            <span className="text-green-600 dark:text-green-400">-دينار أردني{couponDiscount.toFixed(2)}</span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className={theme.text.secondary}>التوصيل:</span>
          <span className="text-green-600 dark:text-green-400">FREE</span>
        </div>
        
        <div className={cn(
          'flex justify-between pt-2 border-t font-medium',
          responsive.fontSize.base,
          theme.border.primary,
          theme.text.primary
        )}>
          <span>المجموع:</span>
          <span className="text-orange-600 dark:text-orange-400">
         {total.toFixed(2)}     دينار أردني
          </span>
        </div>
        </div>
      </Card>
    </div>
  );
}