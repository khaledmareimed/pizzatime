'use client'

import { motion } from 'framer-motion'
import { 
  X, 
  Save, 
  Plus, 
  Trash2, 
  DollarSign, 
  Package, 
  Tag, 
  FileText, 
  Image,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
import Button from '@/components/Button'
import ImageUpload from './ImageUpload'
import { ProductForm, Category } from './types'

interface ProductModalProps {
  show: boolean
  onClose: () => void
  productForm: ProductForm
  setProductForm: (form: ProductForm) => void
  categories: Category[]
  onSave: () => void
  isEditing: boolean
  loading?: boolean
}

export default function ProductModal({ 
  show, 
  onClose, 
  productForm, 
  setProductForm, 
  categories,
  onSave, 
  isEditing,
  loading = false
}: ProductModalProps) {
  if (!show) return null

  const handleImagesChange = (newImages: string[]) => {
    setProductForm({
      ...productForm,
      imagesUrl: newImages
    })
  }

  const addTopping = () => {
    setProductForm({
      ...productForm,
      addonsAndToppings: [...productForm.addonsAndToppings, { toppingName: '', toppingPrice: 0 }]
    })
  }

  const removeTopping = (index: number) => {
    const newToppings = productForm.addonsAndToppings.filter((_: any, i: number) => i !== index)
    setProductForm({
      ...productForm,
      addonsAndToppings: newToppings.length > 0 ? newToppings : [{ toppingName: '', toppingPrice: 0 }]
    })
  }

  const updateTopping = (index: number, field: string, value: string | number) => {
    const newToppings = [...productForm.addonsAndToppings]
    newToppings[index] = { ...newToppings[index], [field]: value }
    setProductForm({
      ...productForm,
      addonsAndToppings: newToppings
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Package className="w-5 h-5 mr-2" />
              المعلومات الأساسية
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 mr-2" />
                  اسم المنتج *
                </label>
                <input
                  type="text"
                  value={productForm.productName}
                  onChange={(e) => setProductForm({ ...productForm, productName: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="أدخل اسم المنتج"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <Tag className="w-4 h-4 mr-2" />
                  الفئة *
                </label>
                <select
                  value={productForm.categoryId}
                  onChange={(e) => setProductForm({ ...productForm, categoryId: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                >
                  <option value="">اختر الفئة</option>
                  {categories.map(category => (
                    <option key={category._id} value={category._id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                الوصف
              </label>
              <textarea
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="أدخل وصف المنتج (اختياري)"
                disabled={loading}
              />
            </div>
          </div>

          {/* Pricing Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <DollarSign className="w-5 h-5 mr-2" />
              الأسعار
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  السعر الأساسي *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.productPrice}
                  onChange={(e) => setProductForm({ ...productForm, productPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  سعر الخصم
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={productForm.productDiscountPrice}
                  onChange={(e) => setProductForm({ ...productForm, productDiscountPrice: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  min="0"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Availability Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              حالة المنتج
            </h4>
            
            <div className="flex flex-col sm:flex-row gap-6">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.available}
                  onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                  className="sr-only"
                  disabled={loading}
                />
                <div className="flex items-center">
                  {productForm.available ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    متوفر للطلب
                  </span>
                </div>
              </label>

              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={productForm.visible}
                  onChange={(e) => setProductForm({ ...productForm, visible: e.target.checked })}
                  className="sr-only"
                  disabled={loading}
                />
                <div className="flex items-center">
                  {productForm.visible ? (
                    <ToggleRight className="w-8 h-8 text-blue-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    مرئي في المتجر
                  </span>
                </div>
              </label>
            </div>
          </div>

          {/* Images Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Image className="w-5 h-5 mr-2" />
              صور المنتج
            </h4>
            
            <ImageUpload
              images={productForm.imagesUrl}
              onImagesChange={handleImagesChange}
              multiple={true}
              maxImages={8}
              label="صور المنتج"
            />
          </div>

          {/* Toppings Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Plus className="w-5 h-5 mr-2" />
              الإضافات والتوابل
            </h4>
            
            <div className="space-y-3">
              {productForm.addonsAndToppings.map((topping: any, index: number) => (
                <div key={index} className="flex gap-3">
                  <input
                    type="text"
                    value={topping.toppingName}
                    onChange={(e) => updateTopping(index, 'toppingName', e.target.value)}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="اسم الإضافة"
                    disabled={loading}
                  />
                  <input
                    type="number"
                    step="0.01"
                    value={topping.toppingPrice}
                    onChange={(e) => updateTopping(index, 'toppingPrice', parseFloat(e.target.value) || 0)}
                    className="w-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="السعر"
                    min="0"
                    disabled={loading}
                  />
                  {productForm.addonsAndToppings.length > 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTopping(index)}
                      className="text-red-600 hover:text-red-700 px-3"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addTopping}
                className="text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة توبينج
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            إلغاء
          </Button>
          <Button 
            onClick={onSave} 
            disabled={!productForm.productName.trim() || !productForm.categoryId || productForm.productPrice <= 0 || loading}
            className="order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'جاري الحفظ...' : (isEditing ? 'حفظ التغييرات' : 'إضافة المنتج')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
