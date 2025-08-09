'use client'

import { motion } from 'framer-motion'
import { Tag, Plus, Edit2, Trash2, Package } from 'lucide-react'
import Button from '@/components/Button'
import { Category } from './types'

interface CategoryFilterProps {
  categories: Category[]
  selectedCategory: string | 'all'
  onCategorySelect: (categoryId: string | 'all') => void
  onAddCategory: () => void
  onEditCategory: (category: Category) => void
  onDeleteCategory: (id: string, name: string) => void
}

export default function CategoryFilter({
  categories,
  selectedCategory,
  onCategorySelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory
}: CategoryFilterProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">فئات المنتجات</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} فئة</p>
          </div>
        </div>
        <Button
          onClick={onAddCategory}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">إضافة فئة</span>
          <span className="sm:hidden">إضافة</span>
        </Button>
      </div>

      {/* All Categories Option */}
      <div className="mb-4">
        <motion.button
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => onCategorySelect('all')}
          className={`
            w-full p-4 rounded-lg border transition-colors text-right
            ${selectedCategory === 'all'
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
            }
          `}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`
                w-12 h-12 rounded-xl flex items-center justify-center
                ${selectedCategory === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                }
              `}>
                <Package className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900 dark:text-white">جميع المنتجات</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  عرض جميع المنتجات من كافة الفئات
                </p>
              </div>
            </div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {categories.reduce((total, cat) => total + cat.products.length, 0)} منتج
            </div>
          </div>
        </motion.button>
      </div>

      {/* Categories Grid */}
      <div className="space-y-2">
        {categories.map((category) => (
          <motion.div
            key={category._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
              group relative p-4 rounded-lg border transition-colors cursor-pointer
              ${selectedCategory === category._id
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-800'
              }
            `}
            onClick={() => onCategorySelect(category._id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                {/* Category Image/Color */}
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden"
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                >
                  {category.imageUrl && category.imageUrl.trim() !== '' ? (
                    <>
                      <img
                        src={category.imageUrl}
                        alt={category.name}
                        className="w-full h-full object-cover"
                        onLoad={(e) => {
                          console.log('✅ Category filter image loaded:', category.imageUrl)
                        }}
                        onError={(e) => {
                          console.error('❌ Failed to load category filter image:', category.imageUrl)
                          const target = e.currentTarget
                          target.style.display = 'none'
                          const container = target.parentElement
                          if (container) {
                            const icon = container.querySelector('.fallback-icon') as HTMLElement
                            if (icon) {
                              icon.style.display = 'block'
                            }
                          }
                        }}
                        crossOrigin="anonymous"
                      />
                      <Tag className="fallback-icon w-6 h-6 text-white" style={{ display: 'none' }} />
                    </>
                  ) : (
                    <Tag className="w-6 h-6 text-white" />
                  )}
                </div>

                {/* Category Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 dark:text-white truncate">
                    {category.name}
                  </h3>
                  <div className="flex items-center gap-3 mt-1">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {category.products.length} منتج
                    </p>
                    {category.displayOrder > 0 && (
                      <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                        ترتيب: {category.displayOrder}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditCategory(category)
                  }}
                  className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDeleteCategory(category._id, category.name)
                  }}
                  className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Category Description */}
            {category.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                {category.description}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* Empty State */}
      {categories.length === 0 && (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Tag className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد فئات
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            ابدأ بإنشاء فئة جديدة لتنظيم منتجاتك
          </p>
          <Button onClick={onAddCategory} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            إنشاء فئة جديدة
          </Button>
        </div>
      )}
    </div>
  )
}
