'use client';

import { useState, useEffect } from 'react';
import { ShoppingBag, Tag } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import { useToastContext } from '../../funcs/contexts/ToastContext';
import Card from '../Card';
import FoodItem, { type OrderItem } from '../FoodItem';

// Re-export OrderItem type for convenience
export type { OrderItem };

interface OrderDetailsProps {
  items: OrderItem[];
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  deliveryFee?: number; // Allow custom delivery fee
  onCouponChange?: (coupon: {
    code: string;
    name: string;
    discountAmount: number;
    couponId: string;
  } | null, totals: {
    subtotal: number;
    couponDiscount: number;
    deliveryFee: number;
    total: number;
  }) => void;
}

export default function OrderDetails({ items, onUpdateQuantity, onRemoveItem, deliveryFee = 3.0, onCouponChange }: OrderDetailsProps) {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ 
    code: string; 
    name: string;
    discountAmount: number;
    discountType: string;
    discountValue: number;
    couponId: string;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [isRevalidatingCoupon, setIsRevalidatingCoupon] = useState(false);
  const toast = useToastContext();

  const calculateItemTotal = (item: OrderItem) => {
    const basePrice = item.price;
    const addonsPrice = item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
    const optionsPrice = item.options?.reduce((sum, option) => sum + option.choicePrice, 0) || 0;
    return (basePrice + addonsPrice + optionsPrice) * item.quantity;
  };

  const subtotal = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  const couponDiscount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  // deliveryFee is now passed as prop with default value of 3.0 JOD
  const total = subtotal - couponDiscount + deliveryFee;

  // Notify parent component about coupon and totals changes
  useEffect(() => {
    if (onCouponChange) {
      const couponData = appliedCoupon ? {
        code: appliedCoupon.code,
        name: appliedCoupon.name,
        discountAmount: appliedCoupon.discountAmount,
        couponId: appliedCoupon.couponId
      } : null;

      const totalsData = {
        subtotal,
        couponDiscount,
        deliveryFee,
        total
      };

      onCouponChange(couponData, totalsData);
    }
  }, [appliedCoupon, subtotal, couponDiscount, deliveryFee, total, onCouponChange]);

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
          discountValue: data.data.discountValue,
          couponId: data.data.couponId || data.data._id
        });
        setCouponError('');
      } else {
        // Coupon is no longer valid, remove it
        setAppliedCoupon(null);
        const errorMessage = `تم إلغاء القسيمة: ${data.error}`;
        setCouponError(errorMessage);
        toast.warning('تم إلغاء القسيمة', data.error);
      }
    } catch (error) {
      console.error('Error revalidating coupon:', error);
      // Keep the coupon but show a warning
      const warningMessage = 'تعذر التحقق من صحة القسيمة';
      setCouponError(warningMessage);
      toast.warning('تحذير', warningMessage);
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
          discountValue: data.data.discountValue,
          couponId: data.data.couponId || data.data._id
        });
        setCouponCode('');
        setCouponError('');
        toast.success('تم تطبيق القسيمة!', `وفرت ${data.data.discountAmount.toFixed(2)} دينار أردني`);
      } else {
        const errorMessage = data.error || 'رمز قسيمة غير فعال أو خاطئ';
        setCouponError(errorMessage);
        toast.error('خطأ في القسيمة', errorMessage);
      }
    } catch (error) {
      console.error('Error validating coupon:', error);
      const errorMessage = 'حدث خطأ في التحقق من القسيمة';
      setCouponError(errorMessage);
      toast.error('خطأ في الشبكة', errorMessage);
    } finally {
      setIsValidatingCoupon(false);
    }
  };

  const removeCoupon = () => {
    const removedCoupon = appliedCoupon;
    setAppliedCoupon(null);
    if (removedCoupon) {
      toast.info('تم إزالة القسيمة', `تم إزالة قسيمة ${removedCoupon.code}`);
    }
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
              'flex items-center justify-between p-3 rounded-xl',
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
                className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {appliedCoupon && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">
              خصم القسيمة ({appliedCoupon.code})
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              -{couponDiscount.toFixed(2)} دينار أردني
            </span>
          </div>
        )}
        
        <div className="flex justify-between text-sm">
          <span className={theme.text.secondary}>التوصيل:</span>
          <span className={theme.text.primary}>{deliveryFee.toFixed(2)} دينار أردني</span>
        </div>
        
        <div className={cn(
          'flex justify-between pt-2 border-t font-medium',
          responsive.fontSize.base,
          theme.border.primary,
          theme.text.primary
        )}>
          <span>المجموع:</span>
          <span className="text-orange-600 dark:text-orange-400">
            {total.toFixed(2)} دينار أردني
          </span>
        </div>

        {/* Savings Display */}
        {couponDiscount > 0 && (
          <div className="text-center mt-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              وفرت {couponDiscount.toFixed(2)} دينار أردني
            </span>
          </div>
        )}
        </div>
      </Card>
    </div>
  );
}