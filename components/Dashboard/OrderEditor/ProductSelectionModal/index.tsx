'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Search, Package } from 'lucide-react'
import Image from 'next/image'
import { cn } from '../../../../funcs/utils'
import { theme } from '../../../../funcs/responsive'
import { formatJordanCurrency } from '../../../../funcs/jordanLocale'
import { Product, Category, OrderItem } from '../types'
import ProductConfigurationModal from '../ProductConfigurationModal'

interface ProductSelectionModalProps {
  isOpen: boolean
  onClose: () => void
  products: Product[]
  categories: Category[]
  onProductSelect: (product: Product) => void
  onAddToOrder: (item: OrderItem) => void
  isLoading?: boolean
}

export default function ProductSelectionModal({
  isOpen,
  onClose,
  products,
  categories,
  onProductSelect,
  onAddToOrder,
  isLoading = false
}: ProductSelectionModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)

  // Filter products based on search and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.productName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || product.categoryId === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleClose = () => {
    setSearchTerm('')
    setSelectedCategory('all')
    setShowConfigModal(false)
    setSelectedProduct(null)
    onClose()
  }

  const handleProductSelect = (product: Product) => {
    // Check if product has options or addons that need configuration
    const hasOptions = product.productOptions && product.productOptions.length > 0
    const hasAddons = product.addonsAndToppings && product.addonsAndToppings.length > 0
    
    console.log('🔍 Product selection:', {
      productName: product.productName,
      hasOptions,
      hasAddons,
      optionsCount: product.productOptions?.length || 0,
      addonsCount: product.addonsAndToppings?.length || 0
    })
    
    if (hasOptions || hasAddons) {
      // Show configuration modal
      setSelectedProduct(product)
      setShowConfigModal(true)
    } else {
      // Add directly to order with default values
      const currentPrice = product.productDiscountPrice || product.productPrice
      const orderItem = {
        productId: product._id,
        productName: product.productName,
        quantity: 1,
        price: currentPrice,
        originalPrice: product.productPrice,
        image: product.imagesUrl?.[0],
        categoryId: product.categoryId,
        addons: [],
        options: [],
        comments: undefined
      }
      onAddToOrder(orderItem)
      handleClose()
    }
  }

  const handleAddToOrder = (item: any) => {
    onAddToOrder(item)
    setShowConfigModal(false)
    setSelectedProduct(null)
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
            'w-full max-w-2xl max-h-[80vh] overflow-hidden rounded-2xl',
            theme.background.card
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className={cn('text-xl font-bold', theme.text.primary)}>
                إضافة منتج جديد
              </h3>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                  الفئة
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setSelectedCategory('all')}
                    className={cn(
                      'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                      selectedCategory === 'all'
                        ? 'bg-orange-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    )}
                  >
                    جميع المنتجات
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category._id}
                      onClick={() => setSelectedCategory(category._id)}
                      className={cn(
                        'px-3 py-1 rounded-lg text-sm font-medium transition-colors',
                        selectedCategory === category._id
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                      )}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Input */}
              <div className="relative">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="البحث عن منتج..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={cn(
                    'w-full pr-10 pl-4 py-3 rounded-xl border',
                    theme.background.card,
                    theme.border.primary,
                    theme.text.primary,
                    'focus:ring-2 focus:ring-orange-500 focus:border-transparent'
                  )}
                />
              </div>
            </div>
          </div>

          {/* Products List */}
          <div className="p-6 max-h-96 overflow-y-auto">

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className={theme.text.secondary}>جاري تحميل المنتجات...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-8">
                <Package className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className={theme.text.secondary}>لا توجد منتجات متاحة</p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                <p className={theme.text.secondary}>لا توجد منتجات تطابق البحث</p>
                <p className={cn('text-xs mt-1', theme.text.secondary)}>
                  جرب تغيير كلمات البحث أو الفئة
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredProducts.map((product) => (
                  <motion.div
                    key={product._id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      'p-4 rounded-xl border cursor-pointer transition-all',
                      theme.background.card,
                      theme.border.primary,
                      'hover:border-orange-500 hover:shadow-md'
                    )}
                    onClick={() => handleProductSelect(product)}
                  >
                    <div className="flex gap-3">
                      {/* Product Image */}
                      <div className="flex-shrink-0">
                        {product.imagesUrl && product.imagesUrl.length > 0 ? (
                          <Image
                            src={product.imagesUrl[0]}
                            alt={product.productName}
                            width={50}
                            height={50}
                            className="rounded-lg object-cover"
                          />
                        ) : (
                          <div className={cn(
                            'w-12 h-12 rounded-lg flex items-center justify-center',
                            'bg-gray-100 dark:bg-gray-800'
                          )}>
                            <Package className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Product Details */}
                      <div className="flex-1 min-w-0">
                        <h4 className={cn('font-medium text-sm truncate', theme.text.primary)}>
                          {product.productName}
                        </h4>
                        
                        {product.description && (
                          <p className={cn('text-xs mt-1 line-clamp-2', theme.text.secondary)}>
                            {product.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span className={cn('text-sm font-semibold', theme.text.primary)}>
                            {formatJordanCurrency(product.productDiscountPrice || product.productPrice)}
                          </span>
                          {product.productDiscountPrice && product.productDiscountPrice !== product.productPrice && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatJordanCurrency(product.productPrice)}
                            </span>
                          )}
                        </div>

                        {/* Availability Badge */}
                        <div className="mt-2">
                          <span className={cn(
                            'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium',
                            product.available
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                          )}>
                            {product.available ? 'متاح' : 'غير متاح'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>

      {/* Product Configuration Modal */}
      <ProductConfigurationModal
        isOpen={showConfigModal}
        onClose={() => {
          setShowConfigModal(false)
          setSelectedProduct(null)
        }}
        product={selectedProduct}
        onAddToOrder={handleAddToOrder}
      />
    </AnimatePresence>
  )
}