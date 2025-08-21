'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, Minus, Trash2, Edit3, Package } from 'lucide-react'
import Image from 'next/image'
import { cn } from '../../../../funcs/utils'
import { theme } from '../../../../funcs/responsive'
import { formatJordanCurrency } from '../../../../funcs/jordanLocale'
import Card from '../../../Card'
import Button from '../../../Button'
import { OrderItem } from '../types'

interface OrderItemsSectionProps {
  items: OrderItem[]
  onItemUpdate: (index: number, item: OrderItem) => void
  onItemRemove: (index: number) => void
  onItemEdit: (index: number) => void
  onAddProduct: () => void
  isEditable?: boolean
}

export default function OrderItemsSection({
  items,
  onItemUpdate,
  onItemRemove,
  onItemEdit,
  onAddProduct,
  isEditable = true
}: OrderItemsSectionProps) {

  const updateQuantity = (index: number, newQuantity: number) => {
    if (!isEditable || newQuantity < 1) return
    
    const item = items[index]
    onItemUpdate(index, {
      ...item,
      quantity: newQuantity
    })
  }

  const removeItem = (index: number) => {
    if (!isEditable) return
    onItemRemove(index)
  }

  const editItem = (index: number) => {
    if (!isEditable) return
    onItemEdit(index)
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h3 className={cn('text-lg font-semibold', theme.text.primary)}>
          <Package className="w-5 h-5 inline ml-2" />
          عناصر الطلب
        </h3>
        {isEditable && (
          <Button
            onClick={onAddProduct}
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            إضافة منتج
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-8">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            <p className={cn('text-sm', theme.text.secondary)}>
              لا توجد عناصر في الطلب
            </p>
            {isEditable && (
              <p className={cn('text-xs mt-1', theme.text.secondary)}>
                اضغط على "إضافة منتج" لإضافة عناصر جديدة
              </p>
            )}
          </div>
        ) : (
          items.map((item, index) => (
            <motion.div
              key={`${item.productId}-${index}`}
              layout
              className={cn(
                'flex items-center gap-4 p-4 rounded-xl border',
                theme.background.card,
                theme.border.primary
              )}
            >
              {/* Product Image */}
              <div className="flex-shrink-0">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.productName}
                    width={60}
                    height={60}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <div className={cn(
                    'w-15 h-15 rounded-lg flex items-center justify-center',
                    'bg-gray-100 dark:bg-gray-800'
                  )}>
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>

              {/* Product Details */}
              <div className="flex-1 min-w-0">
                <h4 className={cn('font-medium truncate', theme.text.primary)}>
                  {item.productName}
                </h4>
                
                <div className="flex items-center gap-2 mt-1">
                  <span className={cn('text-sm', theme.text.secondary)}>
                    {formatJordanCurrency(item.price)}
                  </span>
                  {item.originalPrice !== item.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatJordanCurrency(item.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Addons and Options */}
                {(item.addons.length > 0 || item.options.length > 0) && (
                  <div className="mt-2 space-y-1">
                    {item.addons.map((addon, addonIndex) => (
                      <div key={addonIndex} className={cn('text-xs', theme.text.secondary)}>
                        + {addon.name} ({formatJordanCurrency(addon.price)})
                      </div>
                    ))}
                    {item.options.map((option, optionIndex) => (
                      <div key={optionIndex} className={cn('text-xs', theme.text.secondary)}>
                        • {option.optionTitle}: {option.choiceName}
                        {option.choicePrice > 0 && ` (+${formatJordanCurrency(option.choicePrice)})`}
                      </div>
                    ))}
                  </div>
                )}

                {/* Comments */}
                {item.comments && (
                  <div className={cn('text-xs mt-2 p-2 rounded bg-gray-50 dark:bg-gray-800', theme.text.secondary)}>
                    💬 {item.comments}
                  </div>
                )}
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center gap-2">
                {isEditable && (
                  <button
                    onClick={() => updateQuantity(index, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                      'disabled:opacity-50 disabled:cursor-not-allowed',
                      'transition-colors'
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
                
                <span className={cn('min-w-[2rem] text-center font-medium', theme.text.primary)}>
                  {item.quantity}
                </span>
                
                {isEditable && (
                  <button
                    onClick={() => updateQuantity(index, item.quantity + 1)}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                      'transition-colors'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Item Total */}
              <div className="text-right min-w-[4rem]">
                <div className={cn('font-semibold', theme.text.primary)}>
                  {formatJordanCurrency(
                    (item.price + 
                     item.addons.reduce((sum, addon) => sum + addon.price, 0) +
                     item.options.reduce((sum, option) => sum + option.choicePrice, 0)
                    ) * item.quantity
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {isEditable && (
                <div className="flex flex-col gap-1">
                  <button
                    onClick={() => editItem(index)}
                    className={cn(
                      'p-2 rounded-lg text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
                      'transition-colors'
                    )}
                    title="تعديل العنصر"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => removeItem(index)}
                    className={cn(
                      'p-2 rounded-lg text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
                      'transition-colors'
                    )}
                    title="حذف العنصر"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </Card>
  )
}