'use client'

import React from 'react'
import { CartSummary } from '@/funcs/types/cart'
import Button from '@/components/Button'

interface EnhancedOrderSummaryProps {
  summary: CartSummary
  appliedCoupon?: {
    code: string
    name: string
    discountAmount: number
    usageInfo?: {
      userUsageCount: number
      userUsageLimit: number
      remainingUserUses: number
      totalUsageCount: number
      totalUsageLimit: number | null
      remainingTotalUses: number | null
      validUntil: string
    }
  } | null
  appliedDiscount?: {
    type: 'percentage' | 'flat'
    value: number
    amount: number
  } | null
  deliveryMethod: 'pickup' | 'delivery'
  deliveryPrice: number
  onCheckout: () => void
  isProcessing?: boolean
}

export default function EnhancedOrderSummary({
  summary,
  appliedCoupon,
  appliedDiscount,
  deliveryMethod,
  deliveryPrice,
  onCheckout,
  isProcessing = false
}: EnhancedOrderSummaryProps) {
  const subtotal = summary.total
  const couponDiscount = appliedCoupon?.discountAmount || 0
  const manualDiscount = appliedDiscount?.amount || 0
  const totalDiscount = couponDiscount + manualDiscount
  const delivery = deliveryMethod === 'delivery' ? deliveryPrice : 0
  const finalTotal = subtotal - totalDiscount + delivery

  return (
    <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <div className="p-4 space-y-3">
        {/* Subtotal */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">المجموع الفرعي</span>
          <span className="text-gray-900 dark:text-white font-medium">
            {subtotal.toFixed(2)} ر.س
          </span>
        </div>

        {/* Coupon Discount */}
        {appliedCoupon && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-green-600 dark:text-green-400">
              خصم القسيمة ({appliedCoupon.code})
            </span>
            <span className="text-green-600 dark:text-green-400 font-medium">
              -{couponDiscount.toFixed(2)} ر.س
            </span>
          </div>
        )}

        {/* Manual Discount */}
        {appliedDiscount && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-orange-600 dark:text-orange-400">
              خصم إداري ({appliedDiscount.type === 'percentage' ? `${appliedDiscount.value}%` : `${appliedDiscount.value} ر.س`})
            </span>
            <span className="text-orange-600 dark:text-orange-400 font-medium">
              -{manualDiscount.toFixed(2)} ر.س
            </span>
          </div>
        )}

        {/* Delivery Fee */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">
            {deliveryMethod === 'delivery' ? 'رسوم التوصيل' : 'الاستلام من المطعم'}
          </span>
          <span className="text-gray-900 dark:text-white font-medium">
            {delivery > 0 ? `${delivery.toFixed(2)} ر.س` : 'مجاناً'}
          </span>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900 dark:text-white">
              الإجمالي النهائي
            </span>
            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {finalTotal.toFixed(2)} ر.س
            </span>
          </div>
        </div>

        {/* Items Count */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          {summary.totalItems} منتج • {summary.totalQuantity} قطعة
        </div>

        {/* Checkout Button */}
        <Button
          onClick={onCheckout}
          disabled={summary.totalItems === 0 || isProcessing}
          variant="primary"
          size="lg"
          fullWidth
          className="bg-blue-500 hover:bg-blue-600 mt-4"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center space-x-2 space-x-reverse">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>جاري المعالجة...</span>
            </div>
          ) : (
            `إتمام الطلب (${finalTotal.toFixed(2)} ر.س)`
          )}
        </Button>

        {/* Savings Display */}
        {totalDiscount > 0 && (
          <div className="text-center">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              وفرت {totalDiscount.toFixed(2)} ر.س
            </span>
          </div>
        )}
      </div>
    </div>
  )
}