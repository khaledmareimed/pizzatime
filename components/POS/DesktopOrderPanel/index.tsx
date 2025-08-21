'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { CartItem, CartSummary } from '@/funcs/types/cart'
import OrderCart from '../OrderCart'
import EnhancedOrderSummary from '../EnhancedOrderSummary'
import CouponInput from '../CouponInput'
import ManualDiscount from '../ManualDiscount'
import DeliveryInfoSection, { CustomerInfo, DeliveryInfo } from '../DeliveryInfoSection'
import Button from '@/components/Button'

interface DesktopOrderPanelProps {
  items: CartItem[]
  summary: CartSummary
  step: 'cart' | 'summary' | 'payment'
  onStepChange: (step: 'cart' | 'summary' | 'payment') => void
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
  onOrderComplete: (customerData: any) => void
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
  onApplyCoupon: (code: string) => Promise<void>
  onRemoveCoupon: () => void
  appliedDiscount?: {
    type: 'percentage' | 'flat'
    value: number
    amount: number
  } | null
  onApplyDiscount: (type: 'percentage' | 'flat', value: number) => void
  onRemoveDiscount: () => void
  deliveryMethod: 'pickup' | 'delivery'
  onDeliveryMethodChange: (method: 'pickup' | 'delivery') => void
  deliveryPrice: number
  customerInfo: CustomerInfo
  deliveryInfo?: DeliveryInfo
  onCustomerInfoUpdate: (customerInfo: CustomerInfo) => void
  onDeliveryInfoUpdate: (deliveryInfo: DeliveryInfo) => void
  isProcessingOrder?: boolean
}

export default function DesktopOrderPanel({
  items,
  summary,
  step,
  onStepChange,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderComplete,
  appliedCoupon,
  onApplyCoupon,
  onRemoveCoupon,
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  deliveryMethod,
  onDeliveryMethodChange,
  deliveryPrice,
  customerInfo,
  deliveryInfo,
  onCustomerInfoUpdate,
  onDeliveryInfoUpdate,
  isProcessingOrder = false
}: DesktopOrderPanelProps) {
  const router = useRouter()
  const [customerData, setCustomerData] = React.useState({
    paymentMethod: 'cash',
    notes: ''
  })
  const [discountType, setDiscountType] = React.useState<'coupon' | 'manual'>('coupon')

  const handleNext = () => {
    if (step === 'cart') {
      onStepChange('summary')
    } else if (step === 'summary') {
      onStepChange('payment')
    } else if (step === 'payment') {
      // Validation is now handled in the parent component (POSSystem)
      const finalCustomerData = {
        ...customerData,
        deliveryMethod
      }
      onOrderComplete(finalCustomerData)
      onStepChange('cart')
    }
  }

  const handleBack = () => {
    if (step === 'payment') {
      onStepChange('summary')
    } else if (step === 'summary') {
      onStepChange('cart')
    }
  }

  const canProceed = () => {
    if (step === 'cart') return items.length > 0
    if (step === 'summary') {
      // Customer info validation is now handled by DeliveryInfoSection
      if (deliveryMethod === 'delivery') {
        return customerInfo.name.trim() && customerInfo.phone.trim() && 
               deliveryInfo?.city && deliveryInfo?.location
      } else {
        // For pickup, customer info is optional
        return true
      }
    }
    if (step === 'payment') return true
    return false
  }

  return (
    <div className="w-80 xl:w-96 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      {/* Header with Steps */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            {step === 'cart' && 'تفاصيل الطلب'}
            {step === 'summary' && 'التوصيل ومعلومات العميل'}
            {step === 'payment' && 'الإجمالي والقسائم والخصومات'}
          </h2>
          {step !== 'cart' && (
            <button
              onClick={handleBack}
              className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              disabled={isProcessingOrder}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
        </div>
        
        {/* Step Indicators */}
        <div className="flex items-center space-x-2 space-x-reverse">
          <div className={`w-2 h-2 rounded-full ${step === 'cart' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <div className={`w-2 h-2 rounded-full ${step === 'summary' ? 'bg-blue-500' : 'bg-gray-300'}`} />
          <div className={`w-2 h-2 rounded-full ${step === 'payment' ? 'bg-blue-500' : 'bg-gray-300'}`} />
        </div>

        {step === 'cart' && items.length > 0 && (
          <div className="mt-2 flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {items.length} عنصر • {summary.totalQuantity} قطعة
            </div>
            <button
              onClick={onClearCart}
              className="text-red-500 hover:text-red-700 text-xs font-medium bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded transition-colors"
              disabled={isProcessingOrder}
            >
              مسح الكل
            </button>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Step 1: Order Details */}
        {step === 'cart' && (
          <>
            {items.length === 0 ? (
              <div className="p-4">
                <div className="text-center py-8">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2-2v6.01" />
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400 mb-4">لا توجد أصناف في الطلب</p>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">اختر المنتجات من القائمة لبدء طلب جديد</p>
                  
                  {/* Quick Actions */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/dash/pos/orders')}
                      variant="outline"
                      size="md"
                      fullWidth
                      className="flex items-center justify-center space-x-2 space-x-reverse"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                      <span>عرض الطلبات السابقة</span>
                    </Button>
                    
                    <Button
                      onClick={() => router.push('/dash')}
                      variant="outline"
                      size="md"
                      fullWidth
                      className="flex items-center justify-center space-x-2 space-x-reverse"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span>لوحة التحكم الرئيسية</span>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <OrderCart
                items={items}
                onUpdateQuantity={onUpdateQuantity}
                onRemoveItem={onRemoveItem}
                onClearCart={onClearCart}
              />
            )}
          </>
        )}

        {/* Step 2: Delivery & User Info */}
        {step === 'summary' && (
          <div className="p-4 space-y-4">
            {/* Delivery Options */}
            <DeliveryInfoSection
              deliveryMethod={deliveryMethod}
              customerInfo={customerInfo}
              deliveryInfo={deliveryInfo}
              onDeliveryMethodChange={onDeliveryMethodChange}
              onCustomerInfoUpdate={onCustomerInfoUpdate}
              onDeliveryInfoUpdate={onDeliveryInfoUpdate}
              isEditable={!isProcessingOrder}
            />


            {/* Order Notes */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ملاحظات الطلب (اختياري)
              </label>
              <textarea
                value={customerData.notes}
                onChange={(e) => setCustomerData({...customerData, notes: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none"
                rows={3}
                placeholder={deliveryMethod === 'pickup' ? 'أي ملاحظات خاصة بالطلب' : 'ملاحظات إضافية للتوصيل'}
                disabled={isProcessingOrder}
              />
            </div>
          </div>
        )}

        {/* Step 3: Total, Coupons & Discounts */}
        {step === 'payment' && (
          <div className="p-4 space-y-4">
            {/* Ultra Compact Order Summary */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 space-x-reverse">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">الطلب:</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {items.length} منتج • {summary.totalQuantity} قطعة
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-900 dark:text-white">
                  {summary.total.toFixed(2)} ر.س
                </span>
              </div>
            </div>

            {/* Discount Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                نوع الخصم
              </label>
              <div className="flex space-x-2 space-x-reverse">
                <button
                  onClick={() => {
                    setDiscountType('coupon')
                    if (appliedDiscount) onRemoveDiscount()
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors border-2 ${
                    discountType === 'coupon'
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                  disabled={isProcessingOrder}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    <span>قسيمة خصم</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    setDiscountType('manual')
                    if (appliedCoupon) onRemoveCoupon()
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl text-sm font-medium transition-colors border-2 ${
                    discountType === 'manual'
                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
                      : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300'
                  }`}
                  disabled={isProcessingOrder}
                >
                  <div className="flex flex-col items-center space-y-1">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                    <span>خصم إداري</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Coupon Section - Only show if coupon type selected */}
            {discountType === 'coupon' && (
              <CouponInput
                onApplyCoupon={onApplyCoupon}
                appliedCoupon={appliedCoupon}
                onRemoveCoupon={onRemoveCoupon}
                disabled={isProcessingOrder}
                isAdmin={true} // POS users are admins
              />
            )}

            {/* Manual Discount Section - Only show if manual type selected */}
            {discountType === 'manual' && (
              <ManualDiscount
                appliedDiscount={appliedDiscount}
                onApplyDiscount={onApplyDiscount}
                onRemoveDiscount={onRemoveDiscount}
                orderSubtotal={summary.total}
                disabled={isProcessingOrder}
              />
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        {/* Step 1: Simple total and next button */}
        {step === 'cart' && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-gray-600 dark:text-gray-400">الإجمالي</span>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                {summary.total.toFixed(2)} ر.س
              </span>
            </div>
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isProcessingOrder}
              variant="primary"
              size="lg"
              fullWidth
              className="bg-blue-500 hover:bg-blue-600"
            >
              التالي ({summary.totalItems})
            </Button>
          </div>
        )}

        {/* Step 2: Summary navigation */}
        {step === 'summary' && (
          <div className="p-4">
            <div className="flex space-x-2 space-x-reverse">
              <Button
                onClick={handleBack}
                variant="outline"
                size="lg"
                className="flex-1"
                disabled={isProcessingOrder}
              >
                السابق
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed() || isProcessingOrder}
                variant="primary"
                size="lg"
                className="flex-1 bg-blue-500 hover:bg-blue-600"
              >
                التالي
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Final order summary and complete order button */}
        {step === 'payment' && (
          <>
            <EnhancedOrderSummary
              summary={summary}
              appliedCoupon={appliedCoupon}
              appliedDiscount={appliedDiscount}
              deliveryMethod={deliveryMethod}
              deliveryPrice={deliveryPrice}
              onCheckout={handleNext}
              isProcessing={isProcessingOrder}
            />
          </>
        )}
      </div>
    </div>
  )
}