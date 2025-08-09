'use client'

import { motion } from 'framer-motion'
import { Edit, Trash2, Tag, Plus } from 'lucide-react'
import Button from '@/components/Button'
import { Product } from './types'

interface ProductCardProps {
  product: Product
  index: number
  getCategoryName: (categoryId: string) => string
  getCategoryColor: (categoryId: string) => string
  onEdit: (product: Product) => void
  onDelete: (id: string, name: string) => void
}

export default function ProductCard({ 
  product, 
  index, 
  getCategoryName,
  getCategoryColor,
  onEdit, 
  onDelete 
}: ProductCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
    >
      {product.imagesUrl && product.imagesUrl.length > 0 && product.imagesUrl[0] && (
        <div className="h-40 sm:h-44 bg-gray-100 dark:bg-gray-700 relative">
          <img
            src={product.imagesUrl[0]}
            alt={product.productName}
            className="w-full h-full object-cover"
            onLoad={(e) => {
              console.log('✅ Product image loaded:', product.imagesUrl[0])
            }}
            onError={(e) => {
              console.error('❌ Failed to load product image:', product.imagesUrl[0])
              const target = e.currentTarget
              target.style.display = 'none'
              const container = target.parentElement
              if (container) {
                const errorDiv = container.querySelector('.error-placeholder') as HTMLElement
                if (errorDiv) {
                  errorDiv.style.display = 'flex'
                }
              }
            }}
            crossOrigin="anonymous"
          />
          
          {/* Error placeholder - hidden by default */}
          <div className="error-placeholder absolute inset-0 hidden items-center justify-center bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm">
            <div className="text-center">
              <div>صورة غير متاحة</div>
              <div className="mt-1 text-xs opacity-70">{product.imagesUrl[0].substring(0, 25)}...</div>
            </div>
          </div>
        </div>
      )}
      
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-3">
            {product.productName}
          </h3>
          <div className="flex flex-col gap-1">
            {!product.available && (
              <span className="px-2 py-1 text-xs bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full whitespace-nowrap">
                غير متوفر
              </span>
            )}
            {!product.visible && (
              <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 rounded-full whitespace-nowrap">
                مخفي
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center mb-3">
          <div 
            className="w-3 h-3 rounded-full mr-2"
            style={{ backgroundColor: getCategoryColor(product.categoryId) }}
          />
          <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
            {getCategoryName(product.categoryId)}
          </p>
        </div>
        
        {product.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {product.description}
          </p>
        )}
        
        <div className="flex items-center justify-between mb-4">
          <div>
            {product.productDiscountPrice && product.productDiscountPrice > 0 ? (
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold text-green-600 dark:text-green-400">
                  ${product.productDiscountPrice}
                </span>
                <span className="text-sm text-gray-500 line-through">
                  ${product.productPrice}
                </span>
              </div>
            ) : (
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                ${product.productPrice}
              </span>
            )}
          </div>
          {product.addonsAndToppings.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full">
              <Plus className="w-3 h-3" />
              <span>{product.addonsAndToppings.length}</span>
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(product)}
            className="flex-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 border-blue-200 dark:border-blue-800"
          >
            <Edit className="w-4 h-4 mr-1" />
            تعديل
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(product._id, product.productName)}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 border-red-200 dark:border-red-800"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            حذف
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
