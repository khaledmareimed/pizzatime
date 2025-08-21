'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Minus, Check, MessageSquare } from 'lucide-react'
import Image from 'next/image'
import { cn } from '../../../../funcs/utils'
import { theme } from '../../../../funcs/responsive'
import { formatJordanCurrency } from '../../../../funcs/jordanLocale'
import Button from '../../../Button'
import { Product, OrderItem } from '../types'

interface SelectedAddon {
  id: string
  name: string
  price: number
}

interface SelectedOption {
  optionTitle: string
  choiceName: string
  choicePrice: number
}

interface ProductConfigurationModalProps {
  isOpen: boolean
  onClose: () => void
  product: Product | null
  onAddToOrder: (item: OrderItem) => void
}

export default function ProductConfigurationModal({
  isOpen,
  onClose,
  product,
  onAddToOrder
}: ProductConfigurationModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([])
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([])
  const [comments, setComments] = useState('')

  if (!product) return null

  // Reset state when modal opens with new product
  const resetState = () => {
    setQuantity(1)
    setSelectedAddons([])
    setSelectedOptions([])
    setComments('')
  }

  const handleClose = () => {
    resetState()
    onClose()
  }

  // Handle option selection
  const selectOption = (optionTitle: string, choiceName: string, choicePrice: number) => {
    setSelectedOptions(prev => {
      const filtered = prev.filter(opt => opt.optionTitle !== optionTitle)
      return [...filtered, { optionTitle, choiceName, choicePrice }]
    })
  }

  // Handle addon toggle
  const toggleAddon = (addon: SelectedAddon) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id)
      if (exists) {
        return prev.filter(a => a.id !== addon.id)
      } else {
        return [...prev, addon]
      }
    })
  }

  // Calculate total price
  const calculateTotal = () => {
    const basePrice = product.productDiscountPrice || product.productPrice
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
    const optionsTotal = selectedOptions.reduce((sum, option) => sum + option.choicePrice, 0)
    return (basePrice + addonsTotal + optionsTotal) * quantity
  }

  // Check if required options are selected
  const areRequiredOptionsSelected = () => {
    if (!product.productOptions) return true
    
    return product.productOptions.every(option => {
      if (option.isRequired) {
        return selectedOptions.some(selected => selected.optionTitle === option.optionTitle)
      }
      return true
    })
  }

  // Handle add to order
  const handleAddToOrder = () => {
    if (!areRequiredOptionsSelected()) {
      alert('يرجى اختيار جميع الخيارات المطلوبة')
      return
    }

    const currentPrice = product.productDiscountPrice || product.productPrice
    const orderItem: OrderItem = {
      productId: product._id,
      productName: product.productName,
      quantity,
      price: currentPrice,
      originalPrice: product.productPrice,
      image: product.imagesUrl?.[0],
      categoryId: product.categoryId,
      addons: selectedAddons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      })),
      options: selectedOptions.map(option => ({
        optionTitle: option.optionTitle,
        choiceName: option.choiceName,
        choicePrice: option.choicePrice
      })),
      comments: comments.trim() || undefined
    }

    onAddToOrder(orderItem)
    handleClose()
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className={cn(
            'w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl flex flex-col',
            theme.background.card
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex-shrink-0 p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex gap-4 flex-1">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {product.imagesUrl && product.imagesUrl.length > 0 ? (
                    <Image
                      src={product.imagesUrl[0]}
                      alt={product.productName}
                      width={80}
                      height={80}
                      className="rounded-lg object-cover"
                    />
                  ) : (
                    <div className={cn(
                      'w-20 h-20 rounded-lg flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800'
                    )}>
                      <span className="text-2xl">🍽️</span>
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1">
                  <h3 className={cn('text-xl font-bold mb-2', theme.text.primary)}>
                    {product.productName}
                  </h3>
                  {product.description && (
                    <p className={cn('text-sm mb-2', theme.text.secondary)}>
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <span className={cn('text-lg font-semibold', theme.text.primary)}>
                      {formatJordanCurrency(product.productDiscountPrice || product.productPrice)}
                    </span>
                    {product.productDiscountPrice && product.productDiscountPrice !== product.productPrice && (
                      <span className="text-sm text-gray-400 line-through">
                        {formatJordanCurrency(product.productPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {/* Product Options */}
              {product.productOptions && product.productOptions.length > 0 && (
                <div>
                  <h4 className={cn('font-semibold mb-4', theme.text.primary)}>
                    خيارات المنتج
                  </h4>
                  
                  <div className="space-y-4">
                    {product.productOptions.map((option, optionIndex) => {
                      const selectedChoice = selectedOptions.find(sel => sel.optionTitle === option.optionTitle)
                      
                      return (
                        <div key={optionIndex} className={cn(
                          'p-4 rounded-xl border',
                          theme.border.primary,
                          theme.background.card
                        )}>
                          <div className="flex items-center gap-2 mb-3">
                            <h5 className={cn('font-medium', theme.text.primary)}>
                              {option.optionTitle}
                            </h5>
                            {option.isRequired && (
                              <span className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                                مطلوب
                              </span>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {option.choices.map((choice, choiceIndex) => {
                              const isSelected = selectedChoice?.choiceName === choice.choiceName
                              
                              return (
                                <motion.button
                                  key={choiceIndex}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => selectOption(option.optionTitle, choice.choiceName, choice.choicePrice)}
                                  className={cn(
                                    'w-full p-3 rounded-lg border transition-all text-right flex items-center justify-between',
                                    isSelected
                                      ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                      : cn(theme.border.primary, theme.background.card, 'hover:border-orange-300')
                                  )}
                                >
                                  <div className="flex items-center gap-2">
                                    <div className={cn(
                                      'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                      isSelected 
                                        ? 'border-orange-500 bg-orange-500' 
                                        : 'border-gray-300 dark:border-gray-600'
                                    )}>
                                      {isSelected && (
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                      )}
                                    </div>
                                    <span className={cn('font-medium', theme.text.primary)}>
                                      {choice.choiceName}
                                    </span>
                                  </div>
                                  
                                  <span className={cn(
                                    'font-medium text-sm',
                                    isSelected ? 'text-orange-600' : theme.text.primary
                                  )}>
                                    {choice.choicePrice > 0 ? `+${formatJordanCurrency(choice.choicePrice)}` : 'مجاني'}
                                  </span>
                                </motion.button>
                              )
                            })}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Addons */}
              {product.addonsAndToppings && product.addonsAndToppings.length > 0 && (
                <div>
                  <h4 className={cn('font-semibold mb-4', theme.text.primary)}>
                    إضافات وتوابل
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {product.addonsAndToppings.map((addon, index) => {
                      const addonId = `${addon.toppingName}-${index}`
                      const isSelected = selectedAddons.some(a => a.id === addonId)
                      
                      return (
                        <motion.button
                          key={addonId}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => toggleAddon({
                            id: addonId,
                            name: addon.toppingName,
                            price: addon.toppingPrice
                          })}
                          className={cn(
                            'w-full p-3 rounded-xl border transition-all text-right',
                            isSelected
                              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                              : cn(theme.border.primary, theme.background.card, 'hover:border-orange-300')
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                'w-4 h-4 rounded border flex items-center justify-center',
                                isSelected 
                                  ? 'border-orange-500 bg-orange-500' 
                                  : 'border-gray-300 dark:border-gray-600'
                              )}>
                                {isSelected && (
                                  <Check className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <span className={cn('font-medium', theme.text.primary)}>
                                {addon.toppingName}
                              </span>
                            </div>
                            
                            <span className={cn(
                              'font-medium text-sm',
                              isSelected ? 'text-orange-600' : theme.text.primary
                            )}>
                              {addon.toppingPrice > 0 ? `+${formatJordanCurrency(addon.toppingPrice)}` : 'مجاني'}
                            </span>
                          </div>
                        </motion.button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Comments */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare className="w-5 h-5 text-gray-400" />
                  <h4 className={cn('font-medium', theme.text.primary)}>
                    ملاحظات خاصة (اختياري)
                  </h4>
                </div>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="أضف أي ملاحظات خاصة للطبخ..."
                  rows={3}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border resize-none',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary,
                    'focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex-shrink-0 p-6 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              {/* Quantity Controls */}
              <div className="flex items-center gap-3">
                <span className={cn('font-medium', theme.text.secondary)}>الكمية:</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                      'transition-colors'
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className={cn('min-w-[2rem] text-center font-medium', theme.text.primary)}>
                    {quantity}
                  </span>
                  
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className={cn(
                      'w-8 h-8 rounded-lg flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                      'transition-colors'
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Total Price */}
              <div className="text-right">
                <span className={cn('text-sm', theme.text.secondary)}>المجموع:</span>
                <div className="text-xl font-bold text-orange-600">
                  {formatJordanCurrency(calculateTotal())}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleClose}
                variant="secondary"
                className="flex-1"
              >
                إلغاء
              </Button>
              <Button
                onClick={handleAddToOrder}
                disabled={!areRequiredOptionsSelected()}
                className="flex-1"
              >
                إضافة إلى الطلب
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}