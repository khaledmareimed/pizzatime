'use client'

import React from 'react'
import { CartSummary } from '@/funcs/types/cart'
import Button from '@/components/Button'

interface OrderSummaryProps {
  summary: CartSummary
  onCheckout: () => void
}

export default function OrderSummary({ summary, onCheckout }: OrderSummaryProps) {
  return (
    <div className="p-4 bg-white dark:bg-gray-800">
      {/* Simple Total Display */}
      <div className="flex items-center justify-between mb-4">
        <span className="text-gray-600 dark:text-gray-400">الإجمالي</span>
        <span className="text-xl font-bold text-gray-900 dark:text-white">
          {summary.total.toFixed(2)} ر.س
        </span>
      </div>

      {/* Checkout Button */}
      <Button
        onClick={onCheckout}
        disabled={summary.totalItems === 0}
        variant="primary"
        size="lg"
        fullWidth
        className="bg-blue-500 hover:bg-blue-600"
      >
        إتمام الطلب ({summary.totalItems})
      </Button>
    </div>
  )
}