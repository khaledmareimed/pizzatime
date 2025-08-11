'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, AlertTriangle, X } from 'lucide-react'
import Button from '@/components/Button'

// Import all components
import CategoryFilter from './CategoryFilter'
import ProductsGrid from './ProductsGrid'
import CategoryModal from './CategoryModal'
import ProductModal from './ProductModal'
import DeleteConfirmModal from './DeleteConfirmModal'

// Import types
import { 
  Category, 
  Product, 
  CategoryForm, 
  ProductForm, 
  DeleteConfirmData 
} from './types'

export default function ProductsManagement() {
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all')
  
  // Modal states
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [showProductModal, setShowProductModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirmData | null>(null)
  const [saving, setSaving] = useState(false)

  // Form states
  const [categoryForm, setCategoryForm] = useState<CategoryForm>({
    name: '',
    description: '',
    displayOrder: 0,
    color: '#3B82F6'
  })

  const [productForm, setProductForm] = useState<ProductForm>({
    productName: '',
    categoryId: '',
    productPrice: 0,
    productDiscountPrice: 0,
    description: '',
    available: true,
    visible: true,
    imagesUrl: [],
    addonsAndToppings: [{ toppingName: '', toppingPrice: 0 }],
    productOptions: []
  })

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [categoriesRes, productsRes] = await Promise.all([
        fetch('/api/categories'),
        fetch('/api/products')
      ])

      if (!categoriesRes.ok || !productsRes.ok) {
        throw new Error('فشل في تحميل البيانات')
      }

      const categoriesData = await categoriesRes.json()
      const productsData = await productsRes.json()

      setCategories(categoriesData.categories || [])
      setProducts(productsData.products || [])
    } catch (err) {
      setError('فشل في تحميل البيانات')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  // Category operations
  const handleCreateCategory = async () => {
    try {
      setSaving(true)
      console.log('Creating category with data:', categoryForm)
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إنشاء الفئة')
      }

      await loadData()
      setShowCategoryModal(false)
      resetCategoryForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء الفئة')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateCategory = async () => {
    if (!editingCategory) return

    try {
      setSaving(true)
      console.log('Updating category with data:', categoryForm)
      const response = await fetch(`/api/categories/${editingCategory._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في تحديث الفئة')
      }

      await loadData()
      setShowCategoryModal(false)
      setEditingCategory(null)
      resetCategoryForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديث الفئة')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteCategory = async (id: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في حذف الفئة')
      }

      await loadData()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف الفئة')
    } finally {
      setSaving(false)
    }
  }

  // Product operations
  const handleCreateProduct = async () => {
    try {
      setSaving(true)
      // Filter out empty toppings and images
      const cleanedProduct = {
        ...productForm,
        addonsAndToppings: productForm.addonsAndToppings.filter(
          topping => topping.toppingName.trim() !== ''
        ),
        imagesUrl: productForm.imagesUrl.filter(url => url && url.trim() !== '')
      }

      console.log('Creating product with data:', cleanedProduct)

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedProduct)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في إنشاء المنتج')
      }

      await loadData()
      setShowProductModal(false)
      resetProductForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في إنشاء المنتج')
    } finally {
      setSaving(false)
    }
  }

  const handleUpdateProduct = async () => {
    if (!editingProduct) return

    try {
      setSaving(true)
      // Filter out empty toppings and images
      const cleanedProduct = {
        ...productForm,
        addonsAndToppings: productForm.addonsAndToppings.filter(
          topping => topping.toppingName.trim() !== ''
        ),
        imagesUrl: productForm.imagesUrl.filter(url => url && url.trim() !== '')
      }

      console.log('Updating product with data:', cleanedProduct)

      const response = await fetch(`/api/products/${editingProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cleanedProduct)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في تحديث المنتج')
      }

      await loadData()
      setShowProductModal(false)
      setEditingProduct(null)
      resetProductForm()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في تحديث المنتج')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/products/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في حذف المنتج')
      }

      await loadData()
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل في حذف المنتج')
    } finally {
      setSaving(false)
    }
  }

  // Form helpers
  const resetCategoryForm = () => {
    setCategoryForm({
      name: '',
      description: '',
      displayOrder: 0,
      color: '#3B82F6'
    })
  }

  const resetProductForm = () => {
    setProductForm({
      productName: '',
      categoryId: '',
      productPrice: 0,
      productDiscountPrice: 0,
      description: '',
      available: true,
      visible: true,
      imagesUrl: [],
      addonsAndToppings: [{ toppingName: '', toppingPrice: 0 }],
      productOptions: []
    })
  }

  const openCategoryModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category)
      setCategoryForm({
        name: category.name,
        description: category.description || '',
        displayOrder: category.displayOrder,
        color: category.color || '#3B82F6'
      })
    } else {
      setEditingCategory(null)
      resetCategoryForm()
    }
    setShowCategoryModal(true)
  }

  const openProductModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product)
      setProductForm({
        productName: product.productName,
        categoryId: product.categoryId,
        productPrice: product.productPrice,
        productDiscountPrice: product.productDiscountPrice || 0,
        description: product.description || '',
        available: product.available,
        visible: product.visible,
        imagesUrl: product.imagesUrl || [],
        addonsAndToppings: product.addonsAndToppings.length > 0 
          ? product.addonsAndToppings 
          : [{ toppingName: '', toppingPrice: 0 }],
        productOptions: product.productOptions || []
      })
    } else {
      setEditingProduct(null)
      resetProductForm()
    }
    setShowProductModal(true)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">جاري تحميل البيانات...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center mb-6">
            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="mr-4 px-3 sm:px-4 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">العودة للوحة التحكم</span>
              <span className="sm:hidden">عودة</span>
            </Button>
          </div>
          
          <div className="text-center sm:text-right">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
              إدارة المنتجات والفئات
            </h1>
            <p className="text-gray-600 dark:text-gray-300 text-sm sm:text-base">
              نظام شامل لإدارة فئات ومنتجات المتجر بواجهة حديثة وسهلة الاستخدام
            </p>
          </div>
        </div>

        {/* Error Alert */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-xl mb-6"
            >
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 mr-3 flex-shrink-0" />
                <span className="flex-1">{error}</span>
                <button
                  onClick={() => setError(null)}
                  className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 ml-3 flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Categories Sidebar */}
          <div className="lg:col-span-1">
            <CategoryFilter
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
              onAddCategory={() => openCategoryModal()}
              onEditCategory={openCategoryModal}
              onDeleteCategory={(id, name) => setDeleteConfirm({type: 'category', id, name})}
            />
          </div>

          {/* Products Main Content */}
          <div className="lg:col-span-3">
            <ProductsGrid
              products={products}
              categories={categories}
              selectedCategory={selectedCategory}
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              onAddProduct={() => openProductModal()}
              onEditProduct={openProductModal}
              onDeleteProduct={(id, name) => setDeleteConfirm({type: 'product', id, name})}
            />
          </div>
        </div>

        {/* Modals */}
        <CategoryModal
          show={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false)
            setEditingCategory(null)
            resetCategoryForm()
          }}
          categoryForm={categoryForm}
          setCategoryForm={setCategoryForm}
          onSave={editingCategory ? handleUpdateCategory : handleCreateCategory}
          isEditing={!!editingCategory}
          loading={saving}
        />

        <ProductModal
          show={showProductModal}
          onClose={() => {
            setShowProductModal(false)
            setEditingProduct(null)
            resetProductForm()
          }}
          productForm={productForm}
          setProductForm={setProductForm}
          categories={categories}
          onSave={editingProduct ? handleUpdateProduct : handleCreateProduct}
          isEditing={!!editingProduct}
          loading={saving}
        />

        <DeleteConfirmModal
          show={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => {
            if (deleteConfirm) {
              if (deleteConfirm.type === 'category') {
                handleDeleteCategory(deleteConfirm.id)
              } else {
                handleDeleteProduct(deleteConfirm.id)
              }
            }
          }}
          deleteData={deleteConfirm}
        />


      </div>
    </div>
  )
}
