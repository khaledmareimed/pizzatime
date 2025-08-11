'use client'

import React, { useState } from 'react'
import Button from '@/components/Button'

interface CouponInputProps {
  onApplyCoupon: (code: string) => Promise<void>
  appliedCoupon?: {
    code: string
    name: string
    discountAmount: number
  } | null
  onRemoveCoupon: () => void
  isLoading?: boolean
  disabled?: boolean
}

export default function CouponInput({
  onApplyCoupon,
  appliedCoupon,
  onRemoveCoupon,
  isLoading = false,
  disabled = false
}: CouponInputProps) {
  const [couponCode, setCouponCode] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = async () => {
    if (!couponCode.trim() || isApplying || disabled) return

    setIsApplying(true)
    try {
      await onApplyCoupon(couponCode.trim())
      setCouponCode('')
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsApplying(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleApply()
    }
  }

  if (appliedCoupon) {
    return (
      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-medium text-green-800 dark:text-green-200">
                تم تطبيق القسيمة
              </span>
            </div>
            <div className="mt-1">
              <p className="text-sm text-green-700 dark:text-green-300">
                {appliedCoupon.name} ({appliedCoupon.code})
              </p>
              <p className="text-sm font-bold text-green-800 dark:text-green-200">
                خصم: -{appliedCoupon.discountAmount.toFixed(2)} ر.س
              </p>
            </div>
          </div>
          <button
            onClick={onRemoveCoupon}
            className="text-red-500 hover:text-red-700 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            disabled={disabled}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        رمز القسيمة (اختياري)
      </label>
      <div className="flex space-x-2 space-x-reverse">
        <input
          type="text"
          value={couponCode}
          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
          onKeyPress={handleKeyPress}
          placeholder="أدخل رمز القسيمة"
          className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          disabled={isApplying || disabled}
        />
        <Button
          onClick={handleApply}
          disabled={!couponCode.trim() || isApplying || disabled}
          variant="primary"
          size="md"
          className="bg-blue-500 hover:bg-blue-600 px-6"
        >
          {isApplying ? (
            <div className="flex items-center space-x-2 space-x-reverse">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>تطبيق</span>
            </div>
          ) : (
            'تطبيق'
          )}
        </Button>
      </div>
    </div>
  )
}