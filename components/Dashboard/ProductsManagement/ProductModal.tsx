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
import MaterialSelector from './MaterialSelector'
import { ProductForm, Category, ProductOption, MaterialUsed } from './types'

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
      addonsAndToppings: [...productForm.addonsAndToppings, { 
        toppingName: '', 
        toppingPrice: 0,
        materialsUsed: []
      }]
    })
  }

  const removeTopping = (index: number) => {
    const newToppings = productForm.addonsAndToppings.filter((_: any, i: number) => i !== index)
    setProductForm({
      ...productForm,
      addonsAndToppings: newToppings
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

  const updateToppingMaterials = (toppingIndex: number, materials: MaterialUsed[]) => {
    const newToppings = [...productForm.addonsAndToppings]
    newToppings[toppingIndex] = { ...newToppings[toppingIndex], materialsUsed: materials }
    setProductForm({
      ...productForm,
      addonsAndToppings: newToppings
    })
  }

  // Product Options handlers
  const addOption = () => {
    setProductForm({
      ...productForm,
      productOptions: [...productForm.productOptions, { 
        optionTitle: '', 
        isRequired: true, 
        choices: [{ choiceName: '', choicePrice: 0 }] 
      }]
    })
  }

  const removeOption = (index: number) => {
    const newOptions = productForm.productOptions.filter((_: any, i: number) => i !== index)
    setProductForm({
      ...productForm,
      productOptions: newOptions
    })
  }

  const updateOption = (index: number, field: string, value: string | boolean) => {
    const newOptions = [...productForm.productOptions]
    newOptions[index] = { ...newOptions[index], [field]: value }
    setProductForm({
      ...productForm,
      productOptions: newOptions
    })
  }

  const addChoice = (optionIndex: number) => {
    const newOptions = [...productForm.productOptions]
    newOptions[optionIndex].choices.push({ 
      choiceName: '', 
      choicePrice: 0,
      materialsUsed: []
    })
    setProductForm({
      ...productForm,
      productOptions: newOptions
    })
  }

  const removeChoice = (optionIndex: number, choiceIndex: number) => {
    const newOptions = [...productForm.productOptions]
    if (newOptions[optionIndex].choices.length > 1) {
      newOptions[optionIndex].choices = newOptions[optionIndex].choices.filter((_: any, i: number) => i !== choiceIndex)
      setProductForm({
        ...productForm,
        productOptions: newOptions
      })
    }
  }

  const updateChoice = (optionIndex: number, choiceIndex: number, field: string, value: string | number) => {
    const newOptions = [...productForm.productOptions]
    newOptions[optionIndex].choices[choiceIndex] = { 
      ...newOptions[optionIndex].choices[choiceIndex], 
      [field]: value 
    }
    setProductForm({
      ...productForm,
      productOptions: newOptions
    })
  }

  const updateChoiceMaterials = (optionIndex: number, choiceIndex: number, materials: MaterialUsed[]) => {
    const newOptions = [...productForm.productOptions]
    newOptions[optionIndex].choices[choiceIndex] = {
      ...newOptions[optionIndex].choices[choiceIndex],
      materialsUsed: materials
    }
    setProductForm({
      ...productForm,
      productOptions: newOptions
    })
  }

  // Materials handlers
  const updateBaseMaterials = (materials: MaterialUsed[]) => {
    setProductForm({
      ...productForm,
      materialsUsed: materials
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

          {/* Product Options Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Tag className="w-5 h-5 mr-2" />
              خيارات المنتج (مطلوبة)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              خيارات إجبارية يجب على العميل اختيار واحد منها (مثل نوع اللحم: دجاج، لحم، خروف)
            </p>
            
            <div className="space-y-6">
              {productForm.productOptions.map((option: ProductOption, optionIndex: number) => (
                <div key={optionIndex} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={option.optionTitle}
                      onChange={(e) => updateOption(optionIndex, 'optionTitle', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="عنوان الخيار (مثل: نوع اللحم)"
                      disabled={loading}
                    />
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={option.isRequired}
                        onChange={(e) => updateOption(optionIndex, 'isRequired', e.target.checked)}
                        className="sr-only"
                        disabled={loading}
                      />
                      <div className="flex items-center">
                        {option.isRequired ? (
                          <ToggleRight className="w-8 h-8 text-red-500" />
                        ) : (
                          <ToggleLeft className="w-8 h-8 text-gray-400" />
                        )}
                        <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                          مطلوب
                        </span>
                      </div>
                    </label>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeOption(optionIndex)}
                      className="text-red-600 hover:text-red-700 px-3"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300">الخيارات المتاحة:</h5>
                    {option.choices.map((choice: any, choiceIndex: number) => (
                      <div key={choiceIndex} className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800">
                        <div className="flex gap-3 mb-3">
                          <input
                            type="text"
                            value={choice.choiceName}
                            onChange={(e) => updateChoice(optionIndex, choiceIndex, 'choiceName', e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="اسم الخيار (مثل: دجاج)"
                            disabled={loading}
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={choice.choicePrice}
                            onChange={(e) => updateChoice(optionIndex, choiceIndex, 'choicePrice', parseFloat(e.target.value) || 0)}
                            className="w-32 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            placeholder="السعر الإضافي"
                            min="0"
                            disabled={loading}
                          />
                          {option.choices.length > 1 && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeChoice(optionIndex, choiceIndex)}
                              className="text-red-600 hover:text-red-700 px-2"
                              disabled={loading}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                        
                        {/* Materials for this choice */}
                        <MaterialSelector
                          materials={choice.materialsUsed || []}
                          onMaterialsChange={(materials) => updateChoiceMaterials(optionIndex, choiceIndex, materials)}
                          title={`مواد الخيار: ${choice.choiceName || 'خيار جديد'}`}
                          disabled={loading}
                        />
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addChoice(optionIndex)}
                      className="text-green-600 hover:text-green-700"
                      disabled={loading}
                    >
                      <Plus className="w-3 h-3 mr-2" />
                      إضافة خيار
                    </Button>
                  </div>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={addOption}
                className="text-blue-600 hover:text-blue-700"
                disabled={loading}
              >
                <Plus className="w-4 h-4 mr-2" />
                إضافة مجموعة خيارات جديدة
              </Button>
            </div>
          </div>

          {/* Base Product Materials Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Package className="w-5 h-5 mr-2" />
              المواد المستخدمة في المنتج الأساسي
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              المواد الخام المستخدمة في تحضير المنتج الأساسي (بدون إضافات أو خيارات)
            </p>
            
            <MaterialSelector
              materials={productForm.materialsUsed}
              onMaterialsChange={updateBaseMaterials}
              title="مواد المنتج الأساسي"
              disabled={loading}
            />
          </div>

          {/* Toppings Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Plus className="w-5 h-5 mr-2" />
              الإضافات والتوابل (اختيارية)
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              إضافات اختيارية يمكن للعميل إضافتها للمنتج (مثل الجبن الإضافي، الفطر، إلخ)
            </p>
            
            <div className="space-y-6">
              {productForm.addonsAndToppings.map((topping: any, index: number) => (
                <div key={index} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                  <div className="flex gap-3 mb-4">
                    <input
                      type="text"
                      value={topping.toppingName}
                      onChange={(e) => updateTopping(index, 'toppingName', e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="اسم الإضافة"
                      disabled={loading}
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={topping.toppingPrice}
                      onChange={(e) => updateTopping(index, 'toppingPrice', parseFloat(e.target.value) || 0)}
                      className="w-32 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="السعر"
                      min="0"
                      disabled={loading}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeTopping(index)}
                      className="text-red-600 hover:text-red-700 px-3"
                      disabled={loading}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {/* Materials for this topping */}
                  <MaterialSelector
                    materials={topping.materialsUsed || []}
                    onMaterialsChange={(materials) => updateToppingMaterials(index, materials)}
                    title={`مواد الإضافة: ${topping.toppingName || 'إضافة جديدة'}`}
                    disabled={loading}
                  />
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
                إضافة توبينج جديد
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
