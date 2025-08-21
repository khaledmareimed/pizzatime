'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Plus, 
  Minus, 
  Save,
  Package,
  DollarSign
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import Button from '../../Button'
import Card from '../../Card'

interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  originalPrice: number
  image?: string
  categoryId: string
  addons: Array<{
    id: string
    name: string
    price: number
  }>
  options: Array<{
    optionTitle: string
    choiceName: string
    choicePrice: number
  }>
  comments?: string
}

interface Product {
  _id: string
  productName: string
  productPrice: number
  productDiscountPrice?: number
  imagesUrl?: string[]
  categoryId: string
  available: boolean
  description?: string
  addonsAndToppings?: Array<{
    toppingName: string
    toppingPrice: number
  }>
  productOptions?: Array<{
    optionTitle: string
    isRequired: boolean
    choices: Array<{
      choiceName: string
      choicePrice: number
    }>
  }>
}

interface ItemEditorProps {
  item: OrderItem
  onSave: (updatedItem: OrderItem) => void
  onCancel: () => void
}

export default function ItemEditor({ item, onSave, onCancel }: ItemEditorProps) {
  const [editedItem, setEditedItem] = useState<OrderItem>(item)
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Use separate state for selected addons and options (like item page)
  const [selectedAddons, setSelectedAddons] = useState<Array<{id: string; name: string; price: number}>>(item.addons || [])
  const [selectedOptions, setSelectedOptions] = useState<Array<{optionTitle: string; choiceName: string; choicePrice: number}>>(item.options || [])
  
  const { success, error } = useToastContext()

  // Debug: Log the initial item data
  console.log('🔍 ItemEditor initialized with:', {
    productId: item.productId,
    productName: item.productName,
    existingAddons: item.addons,
    existingOptions: item.options,
    selectedAddons,
    selectedOptions
  })


  // Load product details
  useEffect(() => {
    fetchProductDetails()
  }, [item.productId])

  const fetchProductDetails = async () => {
    setIsLoading(true)
    try {
      console.log('🔍 Fetching product details for productId:', item.productId)
      
      // Try public API first
      let response = await fetch(`/api/public/products/${item.productId}`)
      let data = await response.json()
      
      console.log('🔍 Public API response:', {
        success: data.success,
        hasData: !!data.data,
        productName: data.data?.productName,
        hasAddons: !!data.data?.addons,
        addonsCount: data.data?.addons?.length || 0,
        hasOptions: !!data.data?.options,
        optionsCount: data.data?.options?.length || 0
      })
      
      if (!data.success) {
        console.log('🔍 Public API failed, trying admin API...')
        // Fallback to admin API
        response = await fetch(`/api/products/${item.productId}`)
        data = await response.json()
        
        console.log('🔍 Admin API response:', {
          success: data.success,
          hasData: !!data.data,
          productName: data.data?.productName,
          hasAddons: !!data.data?.addons,
          addonsCount: data.data?.addons?.length || 0,
          hasOptions: !!data.data?.options,
          optionsCount: data.data?.options?.length || 0
        })
      }
      
      if (data.success && data.data) {
        console.log('🔍 Setting product data:', {
          productName: data.data.productName,
          addons: data.data.addons,
          options: data.data.options
        })
        setProduct(data.data)
      } else {
        console.error('❌ Failed to fetch product details:', data)
        error('خطأ', 'فشل في تحميل تفاصيل المنتج')
      }
    } catch (err) {
      console.error('❌ Error fetching product details:', err)
      error('خطأ', 'فشل في تحميل تفاصيل المنتج')
    } finally {
      setIsLoading(false)
    }
  }

  // Update quantity
  const updateQuantity = (newQuantity: number) => {
    if (newQuantity <= 0) return
    setEditedItem({ ...editedItem, quantity: newQuantity })
  }

  // Toggle addon (using same logic as item page)
  const toggleAddon = (addon: {id: string; name: string; price: number}) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id)
      if (exists) {
        return prev.filter(a => a.id !== addon.id)
      } else {
        return [...prev, addon]
      }
    })
  }

  // Update option choice (using same logic as item page)
  const selectOption = (optionTitle: string, choiceName: string, choicePrice: number, multiSelect: boolean) => {
    if (multiSelect) {
      // Handle multi-select options
      setSelectedOptions(prev => {
        const existingChoiceIndex = prev.findIndex(
          o => o.optionTitle === optionTitle && o.choiceName === choiceName
        )
        
        if (existingChoiceIndex >= 0) {
          // Remove choice
          return prev.filter(o => !(o.optionTitle === optionTitle && o.choiceName === choiceName))
        } else {
          // Add choice
          return [...prev, { optionTitle, choiceName, choicePrice }]
        }
      })
    } else {
      // Handle single-select options (remove existing selection for this option group)
      setSelectedOptions(prev => {
        const filtered = prev.filter(opt => opt.optionTitle !== optionTitle)
        return [...filtered, { optionTitle, choiceName, choicePrice }]
      })
    }
  }

  // Update comments
  const updateComments = (comments: string) => {
    setEditedItem({ ...editedItem, comments })
  }

  // Calculate total price (using selected addons/options)
  const calculateTotal = () => {
    const basePrice = editedItem.price
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0)
    const optionsPrice = selectedOptions.reduce((sum, option) => sum + option.choicePrice, 0)
    return (basePrice + addonsPrice + optionsPrice) * editedItem.quantity
  }

  // Save changes (merge selected addons/options back to editedItem)
  const handleSave = () => {
    const updatedItem = {
      ...editedItem,
      addons: selectedAddons,
      options: selectedOptions
    }
    onSave(updatedItem)
    success('تم التحديث', 'تم تحديث المنتج بنجاح')
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className={cn('bg-white dark:bg-gray-800 rounded-2xl p-8', theme.background.card)}>
          <div className="text-center">
            <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className={theme.text.secondary}>جاري تحميل تفاصيل المنتج...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" dir="rtl">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={cn(
          'w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-2xl',
          theme.background.card
        )}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h2 className={cn('text-xl font-bold', theme.text.primary)}>
              تعديل المنتج
            </h2>
            <button
              onClick={onCancel}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Product Info */}
            <div className="lg:col-span-2 space-y-6">
              {/* Basic Info */}
              <Card>
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0">
                    {editedItem.image ? (
                      <Image
                        src={editedItem.image}
                        alt={editedItem.productName}
                        width={64}
                        height={64}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className={cn('text-lg font-semibold', theme.text.primary)}>
                      {editedItem.productName}
                    </h3>
                    <p className={cn('text-sm', theme.text.secondary)}>
                      السعر الأساسي: {formatJordanCurrency(editedItem.price)}
                    </p>
                  </div>
                </div>

                {/* Quantity */}
                <div className="flex items-center gap-3">
                  <span className={cn('font-medium', theme.text.primary)}>الكمية:</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => updateQuantity(editedItem.quantity - 1)}
                      className={cn(
                        'w-8 h-8 rounded-lg flex items-center justify-center',
                        'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                        'transition-colors'
                      )}
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    
                    <span className={cn('w-12 text-center font-medium', theme.text.primary)}>
                      {editedItem.quantity}
                    </span>
                    
                    <button
                      onClick={() => updateQuantity(editedItem.quantity + 1)}
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
              </Card>

              {/* Addons */}
              {/* Debug: Show product loading state */}
              {process.env.NODE_ENV === 'development' && (
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Info</h4>
                  <div className="text-xs space-y-1 text-yellow-700 dark:text-yellow-300">
                    <p><strong>Product ID:</strong> {item.productId}</p>
                    <p><strong>Product Loaded:</strong> {product ? 'Yes' : 'No'}</p>
                    <p><strong>Product Name:</strong> {product?.productName || 'Not loaded'}</p>
                    <p><strong>Has Addons:</strong> {product?.addonsAndToppings ? `Yes (${product.addonsAndToppings.length})` : 'No'}</p>
                    <p><strong>Has Options:</strong> {product?.productOptions ? `Yes (${product.productOptions.length})` : 'No'}</p>
                    <p><strong>Selected Addons:</strong> {selectedAddons.length}</p>
                    <p><strong>Selected Options:</strong> {selectedOptions.length}</p>
                    <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
                  </div>
                </Card>
              )}

              {product?.addonsAndToppings && product.addonsAndToppings.length > 0 && (
                <Card>
                  <h4 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
                    الإضافات
                  </h4>
                  
                  <div className="space-y-3">
                    {product.addonsAndToppings.map((addon, index) => {
                      const addonId = `${addon.toppingName}-${index}`
                      const isSelected = selectedAddons.some(a => a.id === addonId)
                      
                      // Debug each addon
                      console.log(`🔍 Rendering addon "${addon.toppingName}":`, {
                        addonId,
                        isSelected,
                        selectedAddons: selectedAddons.map(a => a.id)
                      })
                      
                      return (
                        <div
                          key={addonId}
                          className={cn(
                            'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                            isSelected
                              ? 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          )}
                          onClick={() => toggleAddon({
                            id: addonId,
                            name: addon.toppingName,
                            price: addon.toppingPrice
                          })}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'w-5 h-5 rounded border-2 flex items-center justify-center',
                              isSelected
                                ? 'border-orange-500 bg-orange-500'
                                : 'border-gray-300 dark:border-gray-600'
                            )}>
                              {isSelected && (
                                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              )}
                            </div>
                            
                            <div>
                              <p className={cn('font-medium', theme.text.primary)}>
                                {addon.toppingName}
                              </p>
                            </div>
                          </div>
                          
                          <span className={cn('font-medium', theme.text.primary)}>
                            +{formatJordanCurrency(addon.toppingPrice)}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Options */}
              {product?.productOptions && product.productOptions.length > 0 && (
                <Card>
                  <h4 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
                    الخيارات
                  </h4>
                  
                  <div className="space-y-6">
                    {product.productOptions.map((option) => {
                      // Debug each option
                      console.log(`🔍 Rendering option "${option.optionTitle}":`, {
                        optionTitle: option.optionTitle,
                        choices: option.choices?.length || 0,
                        selectedForThisOption: selectedOptions.filter(o => o.optionTitle === option.optionTitle)
                      })
                      
                      return (
                      <div key={option.optionTitle}>
                        <h5 className={cn('font-medium mb-3', theme.text.primary)}>
                          {option.optionTitle}
                          {option.isRequired && <span className="text-red-500 mr-1">*</span>}
                        </h5>
                        
                        <div className="space-y-2">
                          {option.choices.map((choice) => {
                            const isSelected = selectedOptions.some(
                              o => o.optionTitle === option.optionTitle && o.choiceName === choice.choiceName
                            )
                            
                            return (
                              <div
                                key={choice.choiceName}
                                className={cn(
                                  'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors',
                                  isSelected
                                    ? 'border-orange-300 bg-orange-50 dark:border-orange-600 dark:bg-orange-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                )}
                                onClick={() => selectOption(option.optionTitle, choice.choiceName, choice.choicePrice, false)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className={cn(
                                    'w-5 h-5 flex items-center justify-center',
                                    'rounded-full border-2',
                                    isSelected
                                      ? 'border-orange-500 bg-orange-500'
                                      : 'border-gray-300 dark:border-gray-600'
                                  )}>
                                    {isSelected && (
                                      <div className="w-2 h-2 rounded-full bg-white"></div>
                                    )}
                                  </div>
                                  
                                  <span className={cn('font-medium', theme.text.primary)}>
                                    {choice.choiceName}
                                  </span>
                                </div>
                                
                                {choice.choicePrice > 0 && (
                                  <span className={cn('font-medium', theme.text.primary)}>
                                    +{formatJordanCurrency(choice.choicePrice)}
                                  </span>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                      )
                    })}
                  </div>
                </Card>
              )}

              {/* Comments */}
              <Card>
                <h4 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
                  ملاحظات خاصة
                </h4>
                
                <textarea
                  value={editedItem.comments || ''}
                  onChange={(e) => updateComments(e.target.value)}
                  placeholder="أي ملاحظات خاصة للمنتج..."
                  rows={3}
                  className={cn(
                    'w-full px-3 py-2 rounded-lg border',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary
                  )}
                />
              </Card>
            </div>

            {/* Summary */}
            <div>
              <Card className="sticky top-4">
                <h4 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
                  <DollarSign className="w-5 h-5 inline ml-2" />
                  ملخص المنتج
                </h4>
                
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className={theme.text.secondary}>السعر الأساسي:</span>
                    <span className={theme.text.primary}>
                      {formatJordanCurrency(editedItem.price)}
                    </span>
                  </div>
                  
                  {selectedAddons.length > 0 && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className={theme.text.secondary}>الإضافات:</span>
                      </div>
                      {selectedAddons.map((addon) => (
                        <div key={addon.id} className="flex justify-between text-sm pl-4">
                          <span className={theme.text.secondary}>• {addon.name}</span>
                          <span className={theme.text.primary}>
                            +{formatJordanCurrency(addon.price)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {selectedOptions.length > 0 && (
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className={theme.text.secondary}>الخيارات:</span>
                      </div>
                      {selectedOptions.map((option, index) => (
                        <div key={index} className="flex justify-between text-sm pl-4">
                          <span className={theme.text.secondary}>• {option.choiceName}</span>
                          <span className={theme.text.primary}>
                            +{formatJordanCurrency(option.choicePrice)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div className="flex justify-between">
                    <span className={theme.text.secondary}>الكمية:</span>
                    <span className={theme.text.primary}>×{editedItem.quantity}</span>
                  </div>
                  
                  <div className={cn('flex justify-between pt-3 border-t font-bold text-lg', theme.border.primary)}>
                    <span className={theme.text.primary}>المجموع:</span>
                    <span className="text-orange-600">
                      {formatJordanCurrency(calculateTotal())}
                    </span>
                  </div>
                </div>
                
                <div className="flex gap-3 mt-6">
                  <Button
                    onClick={onCancel}
                    variant="outline"
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    حفظ
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}