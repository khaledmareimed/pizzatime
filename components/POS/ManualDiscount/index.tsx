'use client'

import React, { useState } from 'react'
import Button from '@/components/Button'

interface ManualDiscountProps {
  appliedDiscount?: {
    type: 'percentage' | 'flat'
    value: number
    amount: number
  } | null
  onApplyDiscount: (type: 'percentage' | 'flat', value: number) => void
  onRemoveDiscount: () => void
  orderSubtotal: number
  disabled?: boolean
}

export default function ManualDiscount({
  appliedDiscount,
  onApplyDiscount,
  onRemoveDiscount,
  orderSubtotal,
  disabled = false
}: ManualDiscountProps) {
  const [discountType, setDiscountType] = useState<'percentage' | 'flat'>('percentage')
  const [discountValue, setDiscountValue] = useState('')
  const [isApplying, setIsApplying] = useState(false)

  const handleApply = () => {
    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) return

    // Validate percentage (0-100)
    if (discountType === 'percentage' && value > 100) return
    
    // Validate flat amount (not more than order total)
    if (discountType === 'flat' && value > orderSubtotal) return

    setIsApplying(true)
    try {
      onApplyDiscount(discountType, value)
      setDiscountValue('')
    } finally {
      setIsApplying(false)
    }
  }

  const calculatePreviewAmount = () => {
    const value = parseFloat(discountValue)
    if (isNaN(value) || value <= 0) return 0

    if (discountType === 'percentage') {
      return Math.min((orderSubtotal * value) / 100, orderSubtotal)
    } else {
      return Math.min(value, orderSubtotal)
    }
  }

  if (appliedDiscount) {
    return (
      <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-2 space-x-reverse">
              <svg className="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              <span className="text-sm font-medium text-orange-800 dark:text-orange-200">
                تم تطبيق خصم إداري
              </span>
            </div>
            <div className="mt-1">
              <p className="text-sm text-orange-700 dark:text-orange-300">
                {appliedDiscount.type === 'percentage' 
                  ? `${appliedDiscount.value}% خصم`
                  : `${appliedDiscount.value} JOD خصم ثابت`
                }
              </p>
              <p className="text-sm font-bold text-orange-800 dark:text-orange-200">
                خصم: -{appliedDiscount.amount.toFixed(2)} JOD
              </p>
            </div>
          </div>
          <button
            onClick={onRemoveDiscount}
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
        خصم إداري (اختياري)
      </label>
      
      {/* Discount Type Selection */}
      <div className="flex space-x-2 space-x-reverse">
        <button
          onClick={() => setDiscountType('percentage')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            discountType === 'percentage'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          disabled={disabled}
        >
          نسبة مئوية %
        </button>
        <button
          onClick={() => setDiscountType('flat')}
          className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
            discountType === 'flat'
              ? 'bg-orange-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
          }`}
          disabled={disabled}
        >
          مبلغ ثابت JOD
        </button>
      </div>

      {/* Discount Value Input */}
      <div className="flex space-x-2 space-x-reverse">
        <div className="flex-1 relative">
          <input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            placeholder={discountType === 'percentage' ? 'أدخل النسبة (0-100)' : 'أدخل المبلغ'}
            min="0"
            max={discountType === 'percentage' ? '100' : orderSubtotal.toString()}
            step={discountType === 'percentage' ? '1' : '0.01'}
            className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={disabled}
          />
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 text-sm">
            {discountType === 'percentage' ? '%' : 'JOD'}
          </div>
        </div>
        <Button
          onClick={handleApply}
          disabled={!discountValue || isApplying || disabled}
          variant="primary"
          size="md"
          className="bg-orange-500 hover:bg-orange-600 px-6"
        >
          {isApplying ? 'تطبيق...' : 'تطبيق'}
        </Button>
      </div>

      {/* Preview */}
      {discountValue && calculatePreviewAmount() > 0 && (
        <div className="text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2">
          معاينة الخصم: -{calculatePreviewAmount().toFixed(2)} JOD
        </div>
      )}
    </div>
  )
}