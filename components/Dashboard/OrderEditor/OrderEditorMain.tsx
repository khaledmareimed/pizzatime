'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Save, X } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import Button from '../../Button'
import Card from '../../Card'
import DeliveryInfoSection from './DeliveryInfoSection'
import OrderItemsSection from './OrderItemsSection'
import OrderSummarySection from './OrderSummarySection'
import ProductSelectionModal from './ProductSelectionModal'
import ProductEditModal from './ProductEditModal'
import { 
  OrderEditorProps, 
  EditedOrder, 
  Product, 
  Category, 
  DeliveryArea, 
  OrderItem,
  CustomerInfo,
  DeliveryInfo,
  OrderTotals
} from './types'

export default function OrderEditor({ order, onSave, onCancel }: OrderEditorProps) {
  // Initialize order with proper defaults and existing data
  const [editedOrder, setEditedOrder] = useState<EditedOrder>(() => {
    // Extract customer info from order - check multiple possible locations
    const customerInfo: CustomerInfo = {
      name: order.deliveryAddress?.recipientName || order.customerName || order.customerInfo?.name || '',
      phone: order.deliveryAddress?.phone || order.customerPhone || order.customerInfo?.phone || '',
      email: order.customerEmail || order.customerInfo?.email || ''
    }
    
    // Extract delivery info from order - map from deliveryAddress structure
    const deliveryInfo: DeliveryInfo | undefined = order.deliveryMethod === 'delivery' ? {
      recipientName: order.deliveryAddress?.recipientName || customerInfo.name,
      city: order.deliveryAddress?.city || '',
      cityId: order.deliveryAddress?.cityId || '',
      location: order.deliveryAddress?.location || '',
      locationId: order.deliveryAddress?.locationId || '',
      deliveryCost: order.orderSummary?.deliveryFee || order.deliveryFee || 0,
      phone: order.deliveryAddress?.phone || customerInfo.phone,
      addressDetails: order.deliveryAddress?.addressDetails || '',
      isDefault: order.deliveryAddress?.isDefault || false
    } : undefined
    
    return {
      orderId: order.orderId,
      customerInfo,
      deliveryInfo,
      items: order.items || [],
      deliveryFee: order.orderSummary?.deliveryFee || order.deliveryFee || 0,
      couponDiscount: order.orderSummary?.couponDiscount || order.couponDiscount || 0,
      subtotal: order.orderSummary?.subtotal || order.subtotal || 0,
      total: order.orderSummary?.total || order.total || 0,
      deliveryMethod: order.deliveryMethod || 'delivery',
      paymentMethod: order.paymentMethod || 'cash',
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }
  })

  // Component state
  const [availableProducts, setAvailableProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([])
  const [selectedCity, setSelectedCity] = useState<DeliveryArea | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)
  const [showItemEditor, setShowItemEditor] = useState(false)
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const { success, error } = useToastContext()

  // Load data on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        // Load categories and delivery areas first
        await Promise.all([
          fetchCategories(),
          fetchDeliveryAreas()
        ])
        
        // Then load products (which might use categories)
        await fetchProducts()
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [])

  // Set selected city when delivery areas load
  useEffect(() => {
    if (deliveryAreas.length > 0 && editedOrder.deliveryMethod === 'delivery' && editedOrder.deliveryInfo) {
      console.log('🔍 Setting selected city:', {
        deliveryAreas: deliveryAreas.length,
        cityId: editedOrder.deliveryInfo.cityId,
        city: editedOrder.deliveryInfo.city,
        deliveryInfo: editedOrder.deliveryInfo
      })
      
      if (editedOrder.deliveryInfo.cityId) {
        // Find city by ID
        const city = deliveryAreas.find(area => area._id === editedOrder.deliveryInfo?.cityId)
        if (city) {
          console.log('✅ Found city by ID:', city)
          setSelectedCity(city)
        } else {
          console.log('❌ City not found by ID:', editedOrder.deliveryInfo.cityId)
        }
      } else if (editedOrder.deliveryInfo.city && !editedOrder.deliveryInfo.cityId) {
        // Find city by name (try both cityName and name properties)
        const city = deliveryAreas.find(area => 
          (area.cityName && area.cityName === editedOrder.deliveryInfo?.city)
        )
        if (city) {
          console.log('✅ Found city by name:', city)
          setSelectedCity(city)
          updateDeliveryInfo({
            ...editedOrder.deliveryInfo,
            cityId: city._id,
            city: city.cityName
          })
        } else {
          console.log('❌ City not found by name:', editedOrder.deliveryInfo.city)
          console.log('Available cities:', deliveryAreas.map(a => ({ id: a._id, cityName: a.cityName })))
        }
      }
    }
  }, [deliveryAreas, editedOrder.deliveryInfo?.cityId, editedOrder.deliveryInfo?.city, editedOrder.deliveryMethod])

  // Set selected location when city is selected and we have existing location info
  useEffect(() => {
    if (selectedCity && Array.isArray(selectedCity.locations) && editedOrder.deliveryMethod === 'delivery' && editedOrder.deliveryInfo) {
      console.log('🔍 Setting selected location:', {
        selectedCity: selectedCity.cityName,
        locationId: editedOrder.deliveryInfo.locationId,
        location: editedOrder.deliveryInfo.location,
        availableLocations: selectedCity.locations.length
      })
      
      if (editedOrder.deliveryInfo.locationId) {
        // Find location by ID
        const location = selectedCity.locations.find(loc => loc._id === editedOrder.deliveryInfo?.locationId)
        if (location) {
          console.log('✅ Found location by ID:', location)
          // Ensure the delivery cost is set correctly
          if (editedOrder.deliveryInfo.deliveryCost !== location.customerCost) {
            updateDeliveryInfo({
              ...editedOrder.deliveryInfo,
              deliveryCost: location.customerCost,
              location: location.locationName
            })
          }
        } else {
          console.log('❌ Location not found by ID:', editedOrder.deliveryInfo.locationId)
        }
      } else if (editedOrder.deliveryInfo.location && !editedOrder.deliveryInfo.locationId) {
        // Find location by name (try both locationName and name properties)
        const location = selectedCity.locations.find(loc => 
          (loc.locationName && loc.locationName === editedOrder.deliveryInfo?.location)
        )
        if (location) {
          console.log('✅ Found location by name:', location)
          updateDeliveryInfo({
            ...editedOrder.deliveryInfo,
            locationId: location._id,
            location: location.locationName,
            deliveryCost: location.customerCost
          })
        } else {
          console.log('❌ Location not found by name:', editedOrder.deliveryInfo.location)
          console.log('Available locations:', selectedCity.locations.map(l => ({ id: l._id, locationName: l.locationName })))
        }
      }
    }
  }, [selectedCity, editedOrder.deliveryInfo?.locationId, editedOrder.deliveryInfo?.location, editedOrder.deliveryMethod])

  // API Functions
  const fetchProducts = async () => {
    try {
      console.log('🔍 Fetching products...')
      
      // First try to get all products from public endpoint
      const response = await fetch('/api/public/products')
      const data = await response.json()
      
      console.log('🔍 Products API response:', {
        hasProducts: !!data.products,
        productsIsArray: Array.isArray(data.products),
        productsLength: data.products?.length || 0,
        hasSuccess: !!data.success,
        hasData: !!data.data,
        firstProduct: data.products?.[0] || data.data?.[0] || 'No products',
        fullStructure: data
      })
      
      if (Array.isArray(data.products)) {
        // Primary structure: { products: [...] }
        const products = data.products.filter((p: Product) => p.available !== false)
        setAvailableProducts(products)
        console.log('✅ Products loaded:', products.length)
      } else if (data.success && Array.isArray(data.data)) {
        // Fallback structure: { success: true, data: [...] }
        const products = data.data.filter((p: Product) => p.available !== false)
        setAvailableProducts(products)
        console.log('✅ Products loaded (fallback structure):', products.length)
      } else {
        console.log('❌ Products API failed, trying category-based loading...')
        // Try loading products by categories
        await fetchProductsByCategories()
      }
    } catch (err) {
      console.error('Error fetching products:', err)
      console.log('🔄 Trying category-based loading as fallback...')
      await fetchProductsByCategories()
    }
  }

  const fetchProductsByCategories = async () => {
    try {
      console.log('🔍 Fetching products by categories...')
      const allProducts: Product[] = []
      
      // Get products from each category
      for (const category of categories) {
        try {
          const response = await fetch(`/api/public/categories/${category._id}/products`)
          const data = await response.json()
          
          console.log(`📦 Category ${category.name} products:`, {
            hasProducts: !!data.products,
            productsLength: data.products?.length || 0
          })
          
          if (Array.isArray(data.products)) {
            const categoryProducts = data.products.filter((p: Product) => p.available !== false)
            allProducts.push(...categoryProducts)
          }
        } catch (categoryErr) {
          console.log(`❌ Failed to load products for category ${category.name}:`, categoryErr)
        }
      }
      
      // Remove duplicates based on _id
      const uniqueProducts = allProducts.filter((product, index, self) => 
        index === self.findIndex(p => p._id === product._id)
      )
      
      setAvailableProducts(uniqueProducts)
      console.log('✅ Products loaded from categories:', uniqueProducts.length)
      
      if (uniqueProducts.length === 0) {
        error('خطأ', 'فشل في تحميل المنتجات')
      }
    } catch (err) {
      console.error('Error fetching products by categories:', err)
      error('خطأ', 'فشل في تحميل المنتجات')
    }
  }

  const fetchCategories = async () => {
    try {
      console.log('🔍 Fetching categories...')
      const response = await fetch('/api/public/categories')
      const data = await response.json()
      
      console.log('🔍 Categories API response:', {
        hasCategories: !!data.categories,
        categoriesIsArray: Array.isArray(data.categories),
        categoriesLength: data.categories?.length || 0,
        hasSuccess: !!data.success,
        hasData: !!data.data,
        firstCategory: data.categories?.[0] || 'No categories',
        fullStructure: data
      })
      
      if (Array.isArray(data.categories)) {
        // Primary structure: { categories: [...] }
        const activeCategories = data.categories.filter((c: Category) => c.isActive !== false)
        setCategories(activeCategories)
        console.log('✅ Categories loaded:', activeCategories.length)
      } else if (data.success && Array.isArray(data.data)) {
        // Fallback structure: { success: true, data: [...] }
        const activeCategories = data.data.filter((c: Category) => c.isActive !== false)
        setCategories(activeCategories)
        console.log('✅ Categories loaded (fallback structure):', activeCategories.length)
      } else {
        console.log('❌ Categories API failed, trying fallback...')
        // Try fallback endpoint
        try {
          const fallbackResponse = await fetch('/api/categories')
          const fallbackData = await fallbackResponse.json()
          
          console.log('📡 Fallback categories response:', fallbackData)
          
          if (fallbackData.success && Array.isArray(fallbackData.data)) {
            const activeCategories = fallbackData.data.filter((c: Category) => c.isActive !== false)
            setCategories(activeCategories)
            console.log('✅ Categories loaded from fallback:', activeCategories.length)
          } else if (Array.isArray(fallbackData.categories)) {
            const activeCategories = fallbackData.categories.filter((c: Category) => c.isActive !== false)
            setCategories(activeCategories)
            console.log('✅ Categories loaded from fallback (categories field):', activeCategories.length)
          } else {
            console.error('❌ All category endpoints failed')
            error('خطأ', 'فشل في تحميل الفئات')
          }
        } catch (fallbackErr) {
          console.log('❌ Fallback categories failed:', fallbackErr)
          error('خطأ', 'فشل في تحميل الفئات')
        }
      }
    } catch (err) {
      console.error('Error fetching categories:', err)
      error('خطأ', 'فشل في تحميل الفئات')
    }
  }

  const fetchDeliveryAreas = async () => {
    try {
      console.log('🔍 Fetching delivery areas...')
      const response = await fetch('/api/public/delivery-areas')
      const data = await response.json()
      
      console.log('🔍 Delivery areas API response:', {
        success: data.success,
        hasData: !!data.data,
        dataType: typeof data.data,
        hasAreas: !!data.data?.areas,
        areasIsArray: Array.isArray(data.data?.areas),
        areasLength: data.data?.areas?.length || 0,
        firstArea: data.data?.areas?.[0] || 'No areas',
        fullStructure: data
      })
      
      if (data.success && data.data && Array.isArray(data.data.areas)) {
        setDeliveryAreas(data.data.areas)
        console.log('✅ Delivery areas loaded:', data.data.areas.length)
      } else if (data.success && Array.isArray(data.data)) {
        setDeliveryAreas(data.data)
        console.log('✅ Delivery areas loaded (fallback structure):', data.data.length)
      } else {
        console.log('❌ Delivery areas API failed, trying fallback...')
        // Try alternative endpoints
        const fallbackEndpoints = [
          '/api/delivery-areas',
          '/api/settings', // Settings might contain delivery areas
          '/api/delivery-cost' // Alternative endpoint
        ]
        
        for (const endpoint of fallbackEndpoints) {
          try {
            console.log(`🔄 Trying fallback endpoint: ${endpoint}`)
            const fallbackResponse = await fetch(endpoint)
            const fallbackData = await fallbackResponse.json()
            
            console.log(`📡 ${endpoint} response:`, fallbackData)
            
            // Handle different response structures
            if (fallbackData.success && fallbackData.data && Array.isArray(fallbackData.data.areas)) {
              setDeliveryAreas(fallbackData.data.areas)
              console.log(`✅ Delivery areas loaded from ${endpoint}:`, fallbackData.data.areas.length)
              return
            } else if (fallbackData.success && Array.isArray(fallbackData.data)) {
              setDeliveryAreas(fallbackData.data)
              console.log(`✅ Delivery areas loaded from ${endpoint} (data array):`, fallbackData.data.length)
              return
            } else if (Array.isArray(fallbackData.deliveryAreas)) {
              setDeliveryAreas(fallbackData.deliveryAreas)
              console.log(`✅ Delivery areas loaded from ${endpoint} (deliveryAreas field):`, fallbackData.deliveryAreas.length)
              return
            } else if (Array.isArray(fallbackData)) {
              setDeliveryAreas(fallbackData)
              console.log(`✅ Delivery areas loaded from ${endpoint} (direct array):`, fallbackData.length)
              return
            }
          } catch (fallbackErr) {
            console.log(`❌ ${endpoint} failed:`, fallbackErr)
          }
        }
        
        console.error('❌ All delivery area endpoints failed')
        error('خطأ', 'فشل في تحميل مناطق التوصيل')
      }
    } catch (err) {
      console.error('Error fetching delivery areas:', err)
      error('خطأ', 'فشل في تحميل مناطق التوصيل')
    }
  }

  // Calculation Functions
  const calculateTotalsForOrder = (order: EditedOrder): OrderTotals => {
    const subtotal = order.items.reduce((sum, item) => {
      const itemTotal = (
        item.price + 
        item.addons.reduce((addonSum, addon) => addonSum + addon.price, 0) +
        item.options.reduce((optionSum, option) => optionSum + option.choicePrice, 0)
      ) * item.quantity
      return sum + itemTotal
    }, 0)

    const deliveryFee = order.deliveryMethod === 'pickup' ? 0 : order.deliveryFee
    const total = subtotal + deliveryFee - order.couponDiscount

    return { subtotal, total }
  }

  const calculateTotals = (): OrderTotals => {
    return calculateTotalsForOrder(editedOrder)
  }

  // Update Functions
  const updateCustomerInfo = (customerInfo: CustomerInfo) => {
    setEditedOrder(prev => ({
      ...prev,
      customerInfo
    }))
  }

  const updateDeliveryInfo = (deliveryInfo: DeliveryInfo) => {
    setEditedOrder(prev => {
      const newOrder = {
        ...prev,
        deliveryInfo,
        deliveryFee: deliveryInfo.deliveryCost
      }
      
      // Recalculate totals immediately
      const newTotals = calculateTotalsForOrder(newOrder)
      return {
        ...newOrder,
        subtotal: newTotals.subtotal,
        total: newTotals.total
      }
    })
  }

  const updateDeliveryMethod = (method: 'delivery' | 'pickup') => {
    console.log('🔄 Changing delivery method to:', method, 'from:', editedOrder.deliveryMethod)
    
    if (method === 'pickup') {
      setEditedOrder(prev => {
        const newOrder = {
          ...prev,
          deliveryMethod: method,
          deliveryFee: 0,
          deliveryInfo: undefined
        }
        
        // Recalculate totals immediately
        const newTotals = calculateTotalsForOrder(newOrder)
        console.log('✅ Pickup method set, totals recalculated:', newTotals)
        return {
          ...newOrder,
          subtotal: newTotals.subtotal,
          total: newTotals.total
        }
      })
      setSelectedCity(null)
      console.log('🏪 Switched to pickup - delivery info cleared')
    } else {
      // Create default delivery info for delivery method
      const defaultDeliveryInfo: DeliveryInfo = {
        recipientName: editedOrder.customerInfo.name,
        city: '',
        cityId: '',
        location: '',
        locationId: '',
        deliveryCost: 0,
        phone: editedOrder.customerInfo.phone,
        addressDetails: '',
        isDefault: false
      }
      
      console.log('📦 Creating default delivery info:', defaultDeliveryInfo)
      
      setEditedOrder(prev => {
        const newOrder = {
          ...prev,
          deliveryMethod: method,
          deliveryInfo: defaultDeliveryInfo,
          deliveryFee: 0
        }
        
        // Recalculate totals immediately
        const newTotals = calculateTotalsForOrder(newOrder)
        console.log('✅ Delivery method set, totals recalculated:', newTotals)
        return {
          ...newOrder,
          subtotal: newTotals.subtotal,
          total: newTotals.total
        }
      })
      console.log('🚚 Switched to delivery - default info created')
    }
  }


  // Item Management Functions
  const addProductToOrder = (product: Product) => {
    const newItem: OrderItem = {
      productId: product._id,
      productName: product.productName,
      quantity: 1,
      price: product.productDiscountPrice || product.productPrice,
      originalPrice: product.productPrice,
      image: product.imagesUrl?.[0],
      categoryId: product.categoryId,
      addons: [],
      options: [],
      comments: ''
    }

    setEditedOrder(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))

    success('تم الإضافة', `تم إضافة ${product.productName} إلى الطلب`)
  }

  const updateOrderItem = (index: number, item: OrderItem) => {
    setEditedOrder(prev => {
      const newOrder = {
        ...prev,
        items: prev.items.map((existingItem, i) => i === index ? item : existingItem)
      }
      
      // Recalculate totals immediately
      const newTotals = calculateTotalsForOrder(newOrder)
      return {
        ...newOrder,
        subtotal: newTotals.subtotal,
        total: newTotals.total
      }
    })
  }

  const removeOrderItem = (index: number) => {
    const item = editedOrder.items[index]
    setEditedOrder(prev => {
      const newOrder = {
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }
      
      // Recalculate totals immediately
      const newTotals = calculateTotalsForOrder(newOrder)
      return {
        ...newOrder,
        subtotal: newTotals.subtotal,
        total: newTotals.total
      }
    })
    success('تم الحذف', `تم حذف ${item.productName} من الطلب`)
  }

  const editOrderItem = async (index: number) => {
    const item = editedOrder.items[index]
    setEditingItemIndex(index)
    
    try {
      console.log('🔍 Fetching product for editing:', item.productId)
      
      // Fetch the full product details to get options and addons
      const response = await fetch(`/api/public/products/${item.productId}`)
      const data = await response.json()
      
      console.log('📦 Product for editing response:', {
        success: data.success,
        hasProduct: !!data.product,
        productName: data.product?.productName || 'No name',
        hasOptions: !!(data.product?.productOptions),
        hasAddons: !!(data.product?.addonsAndToppings)
      })
      
      if (data.product) {
        setEditingProduct(data.product)
        setShowItemEditor(true)
        console.log('✅ Product set for editing, opening modal')
      } else if (data.success && data.data) {
        setEditingProduct(data.data)
        setShowItemEditor(true)
        console.log('✅ Product set for editing (fallback structure), opening modal')
      } else {
        console.error('❌ No product data found in response:', data)
        error('خطأ', 'فشل في تحميل بيانات المنتج للتعديل')
      }
    } catch (err) {
      console.error('Error fetching product for editing:', err)
      error('خطأ', 'فشل في تحميل بيانات المنتج للتعديل')
    }
  }

  const updateItemFromEditor = (updatedItem: OrderItem) => {
    if (editingItemIndex !== null) {
      updateOrderItem(editingItemIndex, updatedItem)
      setShowItemEditor(false)
      setEditingItemIndex(null)
      success('تم التحديث', 'تم تحديث العنصر بنجاح')
    }
  }

  // Save Function
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // Validate required fields based on delivery method
      if (editedOrder.deliveryMethod === 'delivery') {
        if (!editedOrder.customerInfo.name || !editedOrder.customerInfo.phone) {
          error('خطأ في البيانات', 'اسم العميل ورقم الهاتف مطلوبان للتوصيل')
          setIsSaving(false)
          return
        }
        
        if (!editedOrder.deliveryInfo || !editedOrder.deliveryInfo.city || !editedOrder.deliveryInfo.location) {
          error('خطأ في البيانات', 'يجب تحديد المدينة والمنطقة للتوصيل')
          setIsSaving(false)
          return
        }
      }

      const totals = calculateTotals()
      
      // Prepare order data with proper structure for backend
      const orderToSave = {
        items: editedOrder.items,
        customerInfo: editedOrder.customerInfo,
        deliveryInfo: editedOrder.deliveryMethod === 'delivery' ? editedOrder.deliveryInfo : null,
        deliveryFee: editedOrder.deliveryMethod === 'pickup' ? 0 : (editedOrder.deliveryInfo?.deliveryCost || 0),
        couponDiscount: editedOrder.couponDiscount || 0,
        deliveryMethod: editedOrder.deliveryMethod,
        paymentMethod: editedOrder.paymentMethod,
        subtotal: totals.subtotal,
        total: totals.total
      }

      console.log('💾 Saving order with data:', {
        orderId: editedOrder.orderId,
        deliveryMethod: orderToSave.deliveryMethod,
        hasDeliveryInfo: !!orderToSave.deliveryInfo,
        deliveryInfo: orderToSave.deliveryInfo,
        customerInfo: orderToSave.customerInfo,
        totals: { subtotal: totals.subtotal, total: totals.total }
      })

      const saveSuccess = await onSave(orderToSave)
      if (saveSuccess) {
        success('تم الحفظ', 'تم حفظ تغييرات الطلب بنجاح')
        
        // Reload the page after successful save
        setTimeout(() => {
          window.location.reload()
        }, 1500) // Wait 1.5 seconds to show the success message
      }
    } catch (err) {
      console.error('Error saving order:', err)
      error('خطأ', 'فشل في حفظ التغييرات')
    } finally {
      setIsSaving(false)
    }
  }

  const totals = calculateTotals()

  return (
    <div className="space-y-6" dir="rtl">
      {/* Debug Panel - Development Only */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2">Debug Information</h4>
          <div className="text-xs space-y-1 text-yellow-700 dark:text-yellow-300">
            <p><strong>Order ID:</strong> {editedOrder.orderId}</p>
            <p><strong>Delivery Method:</strong> {editedOrder.deliveryMethod}</p>
            <p><strong>Items Count:</strong> {editedOrder.items?.length || 0}</p>
            <p><strong>Available Products:</strong> {availableProducts.length}</p>
            <p><strong>Categories:</strong> {categories.length}</p>
            <p><strong>Delivery Areas:</strong> {deliveryAreas.length}</p>
            <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between items-center">
        <h2 className={cn('text-2xl font-bold', theme.text.primary)}>
          تعديل الطلب #{editedOrder.orderId}
        </h2>
        <div className="flex gap-3">
          <Button
            onClick={onCancel}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <X className="w-4 h-4" />
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={isSaving || editedOrder.items.length === 0}
            className="flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </Button>
        </div>
      </div>

      {/* Main Content Grid - Optimized for Large Screens */}
      <div className="grid grid-cols-1 xl:grid-cols-12 lg:grid-cols-8 gap-6">
        {/* Left Column - Delivery Info & Summary */}
        <div className="xl:col-span-3 lg:col-span-3 space-y-6">
          <DeliveryInfoSection
            editedOrder={editedOrder}
            deliveryAreas={deliveryAreas}
            selectedCity={selectedCity}
            onDeliveryInfoUpdate={updateDeliveryInfo}
            onDeliveryMethodChange={updateDeliveryMethod}
            onCitySelect={setSelectedCity}
            onCustomerInfoUpdate={updateCustomerInfo}
          />
          
          {/* Order Summary - Mobile and Desktop */}
          <div className="lg:block">
            <OrderSummarySection
              editedOrder={editedOrder}
              totals={totals}
            />
          </div>
        </div>

        {/* Right Column - Order Items */}
        <div className="xl:col-span-9 lg:col-span-5 space-y-4">
          <OrderItemsSection
            items={editedOrder.items}
            onItemUpdate={updateOrderItem}
            onItemRemove={removeOrderItem}
            onItemEdit={editOrderItem}
            onAddProduct={() => setShowProductModal(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showItemEditor && editingItemIndex !== null && editingProduct && (
          <ProductEditModal
            isOpen={showItemEditor}
            onClose={() => {
              setShowItemEditor(false)
              setEditingItemIndex(null)
              setEditingProduct(null)
            }}
            product={editingProduct}
            existingItem={editedOrder.items[editingItemIndex]}
            onUpdateItem={updateItemFromEditor}
          />
        )}
      </AnimatePresence>

      <ProductSelectionModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        products={availableProducts}
        categories={categories}
        onProductSelect={addProductToOrder}
        onAddToOrder={(item) => {
          setEditedOrder(prev => {
            const newOrder = {
              ...prev,
              items: [...prev.items, item]
            }
            
            // Recalculate totals immediately
            const newTotals = calculateTotalsForOrder(newOrder)
            return {
              ...newOrder,
              subtotal: newTotals.subtotal,
              total: newTotals.total
            }
          })
          success('تم الإضافة', `تم إضافة ${item.productName} إلى الطلب`)
        }}
        isLoading={isLoading}
      />
    </div>
  )
}