'use client'

import { motion } from 'framer-motion'
import { Package, Plus, Search, Filter, SortDesc } from 'lucide-react'
import Button from '@/components/Button'
import ProductCard from './ProductCard'
import { Product, Category } from './types'

interface ProductsGridProps {
  products: Product[]
  categories: Category[]
  selectedCategory: string | 'all'
  searchTerm: string
  onSearchChange: (term: string) => void
  onAddProduct: () => void
  onEditProduct: (product: Product) => void
  onDeleteProduct: (id: string, name: string) => void
}

export default function ProductsGrid({
  products,
  categories,
  selectedCategory,
  searchTerm,
  onSearchChange,
  onAddProduct,
  onEditProduct,
  onDeleteProduct
}: ProductsGridProps) {
  const getCategoryName = (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId)
    return category?.name || 'فئة غير معروفة'
  }

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find(c => c._id === categoryId)
    return category?.color || '#3B82F6'
  }

  const selectedCategoryName = selectedCategory === 'all' 
    ? 'جميع المنتجات' 
    : categories.find(c => c._id === selectedCategory)?.name || 'فئة غير معروفة'

  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'all' 
    ? products 
    : products.filter(product => product.categoryId === selectedCategory)

  // Further filter by search term
  const searchFilteredProducts = filteredProducts.filter(product =>
    product.productName.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div className="flex items-center space-x-3 rtl:space-x-reverse">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg md:text-xl font-semibold text-gray-900 dark:text-white">
                {selectedCategoryName}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {searchFilteredProducts.length} من {filteredProducts.length} منتج
              </p>
            </div>
          </div>

          <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 rtl:sm:space-x-reverse">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="البحث في المنتجات..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="w-full sm:w-64 pl-4 pr-10 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
              />
            </div>

            {/* Add Product Button */}
            <Button
              onClick={onAddProduct}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">إضافة منتج</span>
              <span className="sm:hidden">إضافة</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="p-4 md:p-6">
        {searchFilteredProducts.length > 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6"
          >
            {searchFilteredProducts.map((product, index) => (
              <ProductCard
                key={product._id}
                product={product}
                index={index}
                getCategoryName={getCategoryName}
                getCategoryColor={getCategoryColor}
                onEdit={onEditProduct}
                onDelete={onDeleteProduct}
              />
            ))}
          </motion.div>
        ) : (
          <EmptyState 
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            hasProducts={products.length > 0}
            onAddProduct={onAddProduct}
            onClearSearch={() => onSearchChange('')}
          />
        )}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  selectedCategory: string | 'all'
  searchTerm: string
  hasProducts: boolean
  onAddProduct: () => void
  onClearSearch: () => void
}

function EmptyState({ 
  selectedCategory, 
  searchTerm, 
  hasProducts, 
  onAddProduct, 
  onClearSearch 
}: EmptyStateProps) {
  if (searchTerm) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Search className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          لا توجد نتائج للبحث
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          لم نجد أي منتجات تطابق "{searchTerm}"
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button variant="outline" onClick={onClearSearch}>
            مسح البحث
          </Button>
          <Button onClick={onAddProduct} className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            إضافة منتج جديد
          </Button>
        </div>
      </div>
    )
  }

  if (selectedCategory !== 'all') {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center mx-auto mb-4">
          <Package className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          لا توجد منتجات في هذه الفئة
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          ابدأ بإضافة منتجات جديدة لهذه الفئة
        </p>
        <Button onClick={onAddProduct} className="bg-blue-600 hover:bg-blue-700 text-white">
          <Plus className="w-4 h-4 mr-2" />
          إضافة منتج جديد
        </Button>
      </div>
    )
  }

  return (
    <div className="text-center py-20">
      <div className="w-32 h-32 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-xl">
        <Package className="w-16 h-16 text-emerald-600 dark:text-emerald-400" />
      </div>
      <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-slate-200 bg-clip-text text-transparent mb-4">
        مرحباً بك في متجرك!
      </h3>
      <p className="text-slate-600 dark:text-slate-300 mb-10 max-w-lg mx-auto leading-relaxed text-lg">
        ابدأ رحلتك بإضافة أول منتج لمتجرك الإلكتروني 
        <br />وشاهد مبيعاتك تنمو يوماً بعد يوم
      </p>
      <Button 
        onClick={onAddProduct} 
        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl shadow-xl shadow-emerald-500/25 hover:shadow-2xl hover:shadow-emerald-500/40 transform hover:scale-110 transition-all duration-500 font-bold px-12 py-4 text-lg"
      >
        <Plus className="w-6 h-6 mr-3" />
        إضافة أول منتج
      </Button>
    </div>
  )
}
