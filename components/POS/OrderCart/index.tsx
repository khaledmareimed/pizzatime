'use client'

import React from 'react'
import { CartItem } from '@/funcs/types/cart'
import Image from 'next/image'

interface OrderCartProps {
  items: CartItem[]
  onUpdateQuantity: (itemId: string, quantity: number) => void
  onRemoveItem: (itemId: string) => void
  onClearCart: () => void
}

export default function OrderCart({ 
  items, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearCart 
}: OrderCartProps) {
  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M20 13v6a2 2 0 01-2 2H6a2 2 0 01-2-2v-6" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            السلة فارغة
          </h3>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            اختر المنتجات من القائمة لإضافتها
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 p-4">
      {items.map((item) => (
        <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex space-x-3 space-x-reverse">
            {/* Item Image */}
            <div className="flex-shrink-0">
              <Image
                src={item.image}
                alt={item.name}
                width={60}
                height={60}
                className="rounded-xl object-cover"
              />
            </div>

            {/* Item Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium text-gray-900 dark:text-white text-sm leading-tight">
                  {item.name}
                </h3>
                <button
                  onClick={() => onRemoveItem(item.id)}
                  className="text-red-400 hover:text-red-600 p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              
              {/* Price */}
              <div className="text-green-600 dark:text-green-400 font-bold text-sm mb-2">
                {item.price.toFixed(2)} ر.س × {item.quantity}
              </div>

              {/* Addons */}
              {item.addons.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-2">
                  <span className="font-medium text-blue-700 dark:text-blue-300">الإضافات:</span>
                  <div className="mt-1">
                    {item.addons.map((addon, index) => (
                      <span key={index} className="inline-block mr-2">
                        {addon.name} (+{addon.price.toFixed(2)} ر.س)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Options */}
              {item.options.length > 0 && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2">
                  {item.options.map((option, index) => (
                    <div key={index} className="flex justify-between">
                      <span className="font-medium text-purple-700 dark:text-purple-300">{option.optionTitle}:</span>
                      <span>{option.choiceName} {option.choicePrice > 0 && `(+${option.choicePrice.toFixed(2)} ر.س)`}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Comments */}
              {item.comments && (
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-2">
                  <span className="font-medium text-yellow-700 dark:text-yellow-300">ملاحظة:</span> {item.comments}
                </div>
              )}

              {/* Quantity Controls & Total */}
              <div className="flex items-center justify-between">
                <div className="flex items-center bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-r-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                    </svg>
                  </button>
                  <span className="w-10 text-center text-sm font-bold text-gray-900 dark:text-white border-x border-gray-200 dark:border-gray-600">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                    className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 rounded-l-lg transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </button>
                </div>

                <div className="text-left">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {((item.price + 
                      item.addons.reduce((sum, addon) => sum + addon.price, 0) +
                      item.options.reduce((sum, option) => sum + option.choicePrice, 0)
                    ) * item.quantity).toFixed(2)} ر.س
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}