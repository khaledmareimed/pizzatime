'use client';

import { useState, useEffect } from 'react';
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
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string; 
    name: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isRevalidatingCoupon, setIsRevalidatingCoupon] = useState(false);

  const calculateItemTotal = (item: OrderItem) => {
    const basePrice = item.price;
    const addonsPrice = item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
    const optionsPrice = item.options?.reduce((sum, option) => sum + option.choicePrice, 0) || 0;
    return (basePrice + addonsPrice + optionsPrice) * item.quantity;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const total = subtotal - couponDiscount;

  // Re-validate coupon when items change
  useEffect(() => {
    if (appliedCoupon && items.length > 0) {
      revalidateCoupon();
    }
  }, [items, subtotal]); // Re-run when items or subtotal changes

  const revalidateCoupon = async () => {
    if (!appliedCoupon) return;

    setIsRevalidatingCoupon(true);

    try {
      // Prepare order data for validation
      const categoryIds = [...new Set(items.map(item => item.categoryId).filter(Boolean))]
      const productIds = items.map(item => item.id).filter(Boolean)
      
      const orderData = {
        orderTotal: subtotal,
        categoryIds: categoryIds,
        productIds: productIds
      };

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: appliedCoupon.code,
          orderData
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Update coupon with new discount amount
        setAppliedCoupon({
          code: data.data.code,
          name: data.data.name,
          discountAmount: data.data.discountAmount,
          discountType: data.data.discountType,
          discountValue: data.data.discountValue
        });
        setCouponError('');
      } else {
        // Coupon is no longer valid, remove it
        setAppliedCoupon(null);
        setCouponError(`تم إلغاء القسيمة: ${data.error}`);
      }
    } catch (error) {
      console.error('Error revalidating coupon:', error);
      // Keep the coupon but show a warning
      setCouponError('تعذر التحقق من صحة القسيمة');
    } finally {
      setIsRevalidatingCoupon(false);
    }
  };

  const applyCoupon = async () => {
    setCouponError('');
    
    if (!couponCode.trim()) {
      setCouponError('الرجاء ادخال رمز القسيمة');
      return;
    }

    setIsValidatingCoupon(true);

    try {
      // Prepare order data for validation
      const categoryIds = [...new Set(items.map(item => item.categoryId).filter(Boolean))]
      const productIds = items.map(item => item.id).filter(Boolean)
      
      const orderData = {
        orderTotal: subtotal,
        categoryIds: categoryIds,
        productIds: productIds
      };

      // Debug logging
      console.log('Sending coupon validation data:', {
        couponCode: couponCode.trim(),
        orderData,
        itemsCount: items.length
      });

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode: couponCode.trim(),
          orderData
        }),
      });

      const data = await response.json();

      if (data.success) {
        setAppliedCoupon({
          code: data.data.code,
          name: data.data.name,
          discountAmount: data.data.discountAmount,
          discountType: data.data.discountType,
          discountValue: data.data.discountValue
        });
        setCouponCode('');
        setCouponError('');
      } else {
        setCouponError(data.error || 'رمز قسيمة غير فعال أو خاطئ');
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      setCouponError('حدث خطأ في التحقق من القسيمة');
    } finally {
      setIsValidatingCoupon(false);
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
                  disabled={isValidatingCoupon}
                  className={cn(
                    'px-4 py-2 text-sm font-medium rounded-xl transition-colors',
                    'bg-orange-500 hover:bg-orange-600 text-white',
                    'disabled:opacity-50 disabled:cursor-not-allowed'
                  )}
                >
                  {isValidatingCoupon ? 'جاري التحقق...' : 'تطبيق'}
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
                  {appliedCoupon.discountType === 'percentage' 
                    ? `(-${appliedCoupon.discountValue}%)`
                    : `(-${appliedCoupon.discountValue} د.أ)`
                  }
                </span>
                {isRevalidatingCoupon && (
                  <div className="w-3 h-3 border border-green-600 border-t-transparent rounded-full animate-spin" />
                )}
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