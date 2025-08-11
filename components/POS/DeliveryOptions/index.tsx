'use client'

import React from 'react'

export interface DeliveryOption {
  type: 'pickup' | 'delivery'
  label: string
  price: number
  estimatedTime: string
  description: string
}

interface DeliveryOptionsProps {
  selectedOption: 'pickup' | 'delivery'
  onOptionChange: (option: 'pickup' | 'delivery') => void
  deliveryPrice: number
  disabled?: boolean
}

export default function DeliveryOptions({
  selectedOption,
  onOptionChange,
  deliveryPrice,
  disabled = false
}: DeliveryOptionsProps) {
  const deliveryOptions: DeliveryOption[] = [
    {
      type: 'pickup',
      label: 'استلام من المطعم',
      price: 0,
      estimatedTime: '15-20 دقيقة',
      description: 'احضر واستلم طلبك من المطعم'
    },
    {
      type: 'delivery',
      label: 'توصيل للمنزل',
      price: deliveryPrice,
      estimatedTime: '30-45 دقيقة',
      description: 'سيتم توصيل طلبك إلى عنوانك'
    }
  ]

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        طريقة الاستلام
      </label>
      <div className="grid grid-cols-1 gap-3">
        {deliveryOptions.map((option) => (
          <div
            key={option.type}
            className={`relative border rounded-xl p-4 cursor-pointer transition-all ${
              selectedOption === option.type
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !disabled && onOptionChange(option.type)}
          >
            <div className="flex items-start space-x-3 space-x-reverse">
              <div className="flex-shrink-0 mt-1">
                <input
                  type="radio"
                  checked={selectedOption === option.type}
                  onChange={() => !disabled && onOptionChange(option.type)}
                  className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                  disabled={disabled}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                    {option.label}
                  </h3>
                  <span className="text-sm font-bold text-gray-900 dark:text-white">
                    {option.price > 0 ? `${option.price.toFixed(2)} ر.س` : 'مجاناً'}
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">
                  {option.description}
                </p>
                <div className="flex items-center space-x-1 space-x-reverse">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {option.estimatedTime}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}