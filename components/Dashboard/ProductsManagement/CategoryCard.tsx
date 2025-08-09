'use client'

import { motion } from 'framer-motion'
import { Edit, Trash2, Package } from 'lucide-react'
import Button from '@/components/Button'
import { Category } from './types'

interface CategoryCardProps {
  category: Category
  index: number
  onEdit: (category: Category) => void
  onDelete: (id: string, name: string) => void
}

export default function CategoryCard({ 
  category, 
  index, 
  onEdit, 
  onDelete 
}: CategoryCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-all duration-200"
    >
      {category.imageUrl && (
        <div className="h-32 sm:h-40 bg-gray-200 dark:bg-gray-700 relative">
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-full h-full object-cover"
            onLoad={(e) => {
              console.log('✅ Category image loaded:', category.imageUrl)
            }}
            onError={(e) => {
              console.error('❌ Failed to load category image:', category.imageUrl)
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
              <div className="mt-1 text-xs opacity-70">{category.imageUrl.substring(0, 25)}...</div>
            </div>
          </div>
        </div>
      )}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
            {category.name}
          </h3>
          {category.color && (
            <div
              className="w-5 h-5 rounded-full border border-gray-300 dark:border-gray-600 flex-shrink-0"
              style={{ backgroundColor: category.color }}
            />
          )}
        </div>
        
        {category.description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2">
            {category.description}
          </p>
        )}
        
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-6">
          <div className="flex items-center gap-1">
            <Package className="w-4 h-4" />
            <span>{category.products.length} منتج</span>
          </div>
          <span>ترتيب: {category.displayOrder}</span>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit(category)}
            className="flex-1 text-xs sm:text-sm"
          >
            <Edit className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">تعديل</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(category._id, category.name)}
            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 text-xs sm:text-sm"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">حذف</span>
          </Button>
        </div>
      </div>
    </motion.div>
  )
}
