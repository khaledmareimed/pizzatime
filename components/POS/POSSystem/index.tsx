'use client'

import React, { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { useRouter } from 'next/navigation'
import CategorySelector from '../CategorySelector'
import ProductGrid from '../ProductGrid'
import OrderCart from '../OrderCart'
import OrderSummary from '../OrderSummary'
import EnhancedOrderSummary from '../EnhancedOrderSummary'
import CustomerForm from '../CustomerForm'
import MobileCheckout from '../MobileCheckout'
import DesktopOrderPanel from '../DesktopOrderPanel'
import CouponInput from '../CouponInput'
import DeliveryOptions from '../DeliveryOptions'
import Button from '@/components/Button'
import { Category, Product } from '@/funcs/collections'
import { CartItem, CartSummary, generateOrderId, calculateCartSummary } from '@/funcs/types/cart'
import { useToastContext } from '@/funcs/contexts/ToastContext'

interface POSSystemProps {
  session: Session
}

export default function POSSystem({ session }: POSSystemProps) {
  const router = useRouter()
  const [categories, setCategories] = useState<Category[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [cartSummary, setCartSummary] = useState<CartSummary>({
    totalItems: 0,
    totalQuantity: 0,
    subtotal: 0,
    addonsTotal: 0,
    optionsTotal: 0,
    total: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'summary' | 'payment'>('cart')
  const [desktopStep, setDesktopStep] = useState<'cart' | 'summary' | 'payment'>('cart')
  const [showMobileCheckout, setShowMobileCheckout] = useState(false)
  
  // New coupon and delivery states
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    name: string
    discountAmount: number
    usageInfo?: {
      userUsageCount: number
      userUsageLimit: number
      remainingUserUses: number
      totalUsageCount: number
      totalUsageLimit: number | null
      remainingTotalUses: number | null
      validUntil: string
    }
  } | null>(null)
  const [appliedDiscount, setAppliedDiscount] = useState<{
    type: 'percentage' | 'flat'
    value: number
    amount: number
  } | null>(null)
  const [deliveryMethod, setDeliveryMethod] = useState<'pickup' | 'delivery'>('pickup')
  const [deliveryPrice] = useState(15) // Fixed delivery price - can be made configurable
  const [isProcessingOrder, setIsProcessingOrder] = useState(false)
  
  // Customer and delivery info states
  const [customerInfo, setCustomerInfo] = useState<{
    name: string
    phone: string
    email?: string
  }>({
    name: '',
    phone: '',
    email: ''
  })
  
  const [deliveryInfo, setDeliveryInfo] = useState<{
    recipientName: string
    city: string
    cityId: string
    location: string
    locationId: string
    deliveryCost: number
    phone: string
    addressDetails: string
    isDefault: boolean
  } | undefined>(undefined)
  
  const { success, error } = useToastContext()

  // Load categories and products on mount
  useEffect(() => {
    loadData()
  }, [])

  // Update cart summary when items change
  useEffect(() => {
    const summary = calculateCartSummary(cartItems)
    setCartSummary(summary)
  }, [cartItems])


  const loadData = async () => {
    try {
      setIsLoading(true)
      
      // Load categories
      const categoriesResponse = await fetch('/api/public/categories')
      const categoriesData = await categoriesResponse.json()
      
      if (categoriesData.categories) {
        setCategories(categoriesData.categories)
        
        // Auto-select first category if available
        if (categoriesData.categories.length > 0) {
          setSelectedCategory(categoriesData.categories[0]._id)
        }
      }

      // Load all products
      const productsResponse = await fetch('/api/public/products')
      const productsData = await productsResponse.json()
      
      if (productsData.products) {
        setProducts(productsData.products)
      }

    } catch (err) {
      console.error('Error loading POS data:', err)
      error('Failed to load menu data')
    } finally {
      setIsLoading(false)
    }
  }


  const handleApplyCoupon = async (couponCode: string) => {
    try {
      if (cartItems.length === 0) {
        throw new Error('أضف منتجات للسلة أولاً')
      }

      // Prepare order data for coupon validation
      const orderData = {
        orderTotal: cartSummary.total,
        categoryIds: [...new Set(cartItems.map(item => item.categoryId))],
        productIds: cartItems.map(item => item.productId)
      }

      const response = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          couponCode,
          orderData
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setAppliedCoupon({
          code: result.data.code,
          name: result.data.name,
          discountAmount: result.data.discountAmount,
          usageInfo: result.data.usageInfo
        })
        
        // Show usage information in success message
        const usageInfo = result.data.usageInfo
        let usageMessage = `تم تطبيق القسيمة ${result.data.code} بنجاح`
        
        // Check if admin override was used (user has exceeded their limit but admin applied it)
        const isAdminOverride = session?.user?.role === 'admin' && usageInfo && usageInfo.remainingUserUses <= 0 && usageInfo.userUsageCount >= usageInfo.userUsageLimit
        
        if (isAdminOverride) {
          usageMessage += ` (تم التطبيق بصلاحيات الإدارة - تجاوز حد الاستخدام)`
        } else if (usageInfo) {
          if (usageInfo.remainingUserUses > 0) {
            usageMessage += ` (يمكنك استخدامها ${usageInfo.remainingUserUses} مرة أخرى)`
          } else {
            usageMessage += ` (هذه آخر مرة يمكنك استخدامها)`
          }
        }
        success(usageMessage)
      } else {
        throw new Error(result.error || 'فشل في تطبيق القسيمة')
      }
    } catch (err) {
      console.error('Error applying coupon:', err)
      error('خطأ في تطبيق القسيمة', (err as Error).message)
      throw err
    }
  }

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null)
    success('تم إزالة القسيمة')
  }

  const handleApplyDiscount = (type: 'percentage' | 'flat', value: number) => {
    const subtotal = cartSummary.total - (appliedCoupon?.discountAmount || 0)
    let discountAmount = 0

    if (type === 'percentage') {
      discountAmount = Math.min((subtotal * value) / 100, subtotal)
    } else {
      discountAmount = Math.min(value, subtotal)
    }

    setAppliedDiscount({
      type,
      value,
      amount: discountAmount
    })
    success(`تم تطبيق خصم ${type === 'percentage' ? value + '%' : value + ' JOD'}`)
  }

  const handleRemoveDiscount = () => {
    setAppliedDiscount(null)
    success('تم إزالة الخصم الإداري')
  }

  const handleCustomerInfoUpdate = (newCustomerInfo: typeof customerInfo) => {
    setCustomerInfo(newCustomerInfo)
    
    // Update delivery info recipient name and phone if delivery method is active
    if (deliveryMethod === 'delivery' && deliveryInfo) {
      setDeliveryInfo({
        ...deliveryInfo,
        recipientName: newCustomerInfo.name,
        phone: newCustomerInfo.phone
      })
    }
  }

  const handleDeliveryInfoUpdate = (newDeliveryInfo: typeof deliveryInfo) => {
    if (newDeliveryInfo) {
      setDeliveryInfo(newDeliveryInfo)
    }
  }

  const handleDeliveryMethodChange = (method: 'pickup' | 'delivery') => {
    console.log('🔄 POS: Changing delivery method to:', method)
    setDeliveryMethod(method)
    
    if (method === 'delivery' && !deliveryInfo) {
      // Create default delivery info when switching to delivery
      setDeliveryInfo({
        recipientName: customerInfo.name,
        city: '',
        cityId: '',
        location: '',
        locationId: '',
        deliveryCost: 0,
        phone: customerInfo.phone,
        addressDetails: '',
        isDefault: false
      })
    } else if (method === 'pickup') {
      // Clear delivery info when switching to pickup
      setDeliveryInfo(undefined)
    }
  }


  const getFilteredProducts = () => {
    if (!selectedCategory) return products
    return products.filter(product => product.categoryId === selectedCategory)
  }

  const addToCart = (product: Product, quantity: number = 1, addons: any[] = [], options: any[] = [], comments?: string) => {
    const existingItemIndex = cartItems.findIndex(item => 
      item.productId === product._id.toString() &&
      JSON.stringify(item.addons) === JSON.stringify(addons) &&
      JSON.stringify(item.options) === JSON.stringify(options) &&
      item.comments === comments
    )

    if (existingItemIndex >= 0) {
      // Update existing item quantity
      const updatedItems = [...cartItems]
      updatedItems[existingItemIndex].quantity += quantity
      setCartItems(updatedItems)
    } else {
      // Add new item - Fix price handling with proper null/undefined checks
      const displayPrice = (product.productDiscountPrice && product.productDiscountPrice > 0) 
        ? product.productDiscountPrice 
        : (product.productPrice || 0)
      const primaryImage = product.imagesUrl && product.imagesUrl.length > 0 
        ? product.imagesUrl[0] 
        : 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop'

      const newItem: CartItem = {
        id: `${product._id}-${Date.now()}`,
        productId: product._id.toString(),
        name: product.productName,
        description: product.description,
        price: displayPrice,
        originalPrice: product.productPrice || 0,
        quantity,
        image: primaryImage,
        addons: addons.map(addon => ({
          id: addon.id || addon.toppingName,
          name: addon.toppingName || addon.name,
          price: addon.toppingPrice || addon.price || 0
        })),
        options: options.map(option => ({
          optionTitle: option.optionTitle,
          choiceName: option.choiceName,
          choicePrice: option.choicePrice || 0
        })),
        comments,
        addedAt: new Date().toISOString(),
        categoryId: product.categoryId,
        available: product.available
      }

      setCartItems([...cartItems, newItem])
    }

    success(`${product.productName} added to order`)
  }

  const updateCartItemQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId)
      return
    }

    const updatedItems = cartItems.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    )
    setCartItems(updatedItems)
  }

  const removeFromCart = (itemId: string) => {
    const updatedItems = cartItems.filter(item => item.id !== itemId)
    setCartItems(updatedItems)
    success('Item removed from order')
  }

  const clearCart = () => {
    setCartItems([])
    success('Order cleared')
  }

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      error('Please add items to the order first')
      return
    }
    
    // Check if mobile
    const isMobile = window.innerWidth < 1024
    if (isMobile) {
      setShowMobileCheckout(true)
      setCheckoutStep('cart')
    } else {
      // For desktop, just move to summary step
      setDesktopStep('summary')
    }
  }

  const handleOrderComplete = async (customerData: any) => {
    try {
      setIsProcessingOrder(true)

      // Validate required fields based on delivery method
      if (deliveryMethod === 'delivery') {
        if (!customerInfo.name || !customerInfo.phone) {
          error('خطأ في البيانات', 'اسم العميل ورقم الهاتف مطلوبان للتوصيل')
          setIsProcessingOrder(false)
          return
        }
        
        if (!deliveryInfo || !deliveryInfo.city || !deliveryInfo.location) {
          error('خطأ في البيانات', 'يجب تحديد المدينة والمنطقة للتوصيل')
          setIsProcessingOrder(false)
          return
        }
      }

      // Calculate final totals
      const subtotal = cartSummary.total
      const couponDiscount = appliedCoupon?.discountAmount || 0
      const manualDiscount = appliedDiscount?.amount || 0
      const totalDiscount = couponDiscount + manualDiscount
      const delivery = deliveryMethod === 'delivery' ? (deliveryInfo?.deliveryCost || 0) : 0
      const finalTotal = subtotal - totalDiscount + delivery

      const orderData = {
        orderId: generateOrderId(),
        items: cartItems,
        customerInfo,
        deliveryInfo: deliveryMethod === 'delivery' ? deliveryInfo : null,
        customer: {
          name: customerInfo.name,
          phone: customerInfo.phone,
          email: customerInfo.email,
          deliveryAddress: deliveryMethod === 'delivery' && deliveryInfo ? {
            recipientName: deliveryInfo.recipientName,
            city: deliveryInfo.city,
            cityId: deliveryInfo.cityId,
            location: deliveryInfo.location,
            locationId: deliveryInfo.locationId,
            phone: deliveryInfo.phone,
            addressDetails: deliveryInfo.addressDetails,
            deliveryCost: deliveryInfo.deliveryCost,
            isPickup: false
          } : deliveryMethod === 'pickup' ? {
            type: 'pickup',
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            recipientName: customerInfo.name,
            name: customerInfo.name,
            phone: customerInfo.phone,
            deliveryCost: 0,
            isPickup: true,
            pickupLocation: 'store',
            addressDetails: 'استلام من المحل - لا توجد رسوم توصيل'
          } : null
        },
        summary: {
          ...cartSummary,
          couponDiscount,
          manualDiscount,
          totalDiscount,
          deliveryFee: delivery,
          finalTotal
        },
        coupon: appliedCoupon,
        discount: appliedDiscount,
        paymentMethod: customerData?.paymentMethod || 'cash',
        deliveryMethod,
        notes: customerData?.notes || '',
        isInternalOrder: true
      }

      // Save order to the internal orders API
      const response = await fetch('/api/orders/internal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        success(`تم إنشاء الطلب #${result.data.posOrderId} بنجاح!`)
        
        // Reset all states
        clearCart()
        setAppliedCoupon(null)
        setAppliedDiscount(null)
        setDeliveryMethod('pickup')
        setCustomerInfo({ name: '', phone: '', email: '' })
        setDeliveryInfo(undefined)
        setShowCustomerForm(false)
        setDesktopStep('cart')
        setShowMobileCheckout(false)
      } else {
        throw new Error(result.error || 'فشل في إنشاء الطلب')
      }
      
    } catch (err) {
      console.error('Error creating order:', err)
      error('خطأ في إنشاء الطلب', (err as Error).message)
    } finally {
      setIsProcessingOrder(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 lg:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 space-x-reverse">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                  نظام نقاط البيع
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-3 space-x-reverse">
              <Button
                onClick={() => router.push('/dash')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700 text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5v4" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 5v4" />
                </svg>
                <span>لوحة التحكم</span>
              </Button>
              <Button
                onClick={() => router.push('/dash/pos/orders')}
                variant="outline"
                size="sm"
                className="flex items-center space-x-2 space-x-reverse bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>إدارة الطلبات</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main POS Interface */}
      <div className="h-[calc(100vh-80px)] flex flex-col lg:flex-row">
        {/* Left Panel - Menu */}
        <div className="flex-1 flex flex-col bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 min-h-0">
          {/* Category Tabs */}
          <div className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <CategorySelector
              categories={categories}
              selectedCategory={selectedCategory}
              onCategorySelect={setSelectedCategory}
            />
          </div>

          {/* Products Grid - Fixed Height with Scroll */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 lg:p-6">
              <ProductGrid
                products={getFilteredProducts()}
                onAddToCart={addToCart}
              />
            </div>
          </div>
        </div>

        {/* Right Panel - Desktop Order Panel with Steps */}
        <div className="hidden lg:flex">
          <DesktopOrderPanel
            items={cartItems}
            summary={cartSummary}
            step={desktopStep}
            onStepChange={setDesktopStep}
            onUpdateQuantity={updateCartItemQuantity}
            onRemoveItem={removeFromCart}
            onClearCart={clearCart}
            onOrderComplete={handleOrderComplete}
            appliedCoupon={appliedCoupon}
            onApplyCoupon={handleApplyCoupon}
            onRemoveCoupon={handleRemoveCoupon}
            appliedDiscount={appliedDiscount}
            onApplyDiscount={handleApplyDiscount}
            onRemoveDiscount={handleRemoveDiscount}
            deliveryMethod={deliveryMethod}
            onDeliveryMethodChange={handleDeliveryMethodChange}
            deliveryPrice={deliveryPrice}
            customerInfo={customerInfo}
            deliveryInfo={deliveryInfo}
            onCustomerInfoUpdate={handleCustomerInfoUpdate}
            onDeliveryInfoUpdate={handleDeliveryInfoUpdate}
            isProcessingOrder={isProcessingOrder}
          />
        </div>
      </div>

      {/* Mobile Checkout Button */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-40">
        {cartSummary.totalItems === 0 ? (
          <div className="flex space-x-2 space-x-reverse">
            <Button
              onClick={() => router.push('/dash/pos/orders')}
              variant="outline"
              size="lg"
              className="flex-1 flex items-center justify-center space-x-2 space-x-reverse"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
              </svg>
              <span>الطلبات</span>
            </Button>
            <Button
              onClick={() => router.push('/dash')}
              variant="outline"
              size="lg"
              className="flex-1 flex items-center justify-center space-x-2 space-x-reverse"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
              <span>الرئيسية</span>
            </Button>
          </div>
        ) : (
          <Button
            onClick={handleCheckout}
            disabled={cartSummary.totalItems === 0}
            variant="primary"
            size="lg"
            fullWidth
            className="bg-blue-500 hover:bg-blue-600"
          >
            <div className="flex items-center justify-between w-full">
              <span>عرض الطلب ({cartSummary.totalItems})</span>
              <span className="font-bold">{cartSummary.total.toFixed(2)} JOD</span>
            </div>
          </Button>
        )}
      </div>

      {/* Mobile Checkout Modal */}
      <MobileCheckout
        isOpen={showMobileCheckout}
        onClose={() => {
          setShowMobileCheckout(false)
          setCheckoutStep('cart')
        }}
        items={cartItems}
        summary={cartSummary}
        step={checkoutStep}
        onStepChange={setCheckoutStep}
        onOrderComplete={handleOrderComplete}
        onUpdateQuantity={updateCartItemQuantity}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
        appliedCoupon={appliedCoupon}
        onApplyCoupon={handleApplyCoupon}
        onRemoveCoupon={handleRemoveCoupon}
        appliedDiscount={appliedDiscount}
        onApplyDiscount={handleApplyDiscount}
        onRemoveDiscount={handleRemoveDiscount}
        deliveryMethod={deliveryMethod}
        onDeliveryMethodChange={setDeliveryMethod}
        deliveryPrice={deliveryPrice}
        isProcessingOrder={isProcessingOrder}
      />

      {/* Desktop Customer Form Modal */}
      {showCustomerForm && (
        <CustomerForm
          onSubmit={handleOrderComplete}
          onCancel={() => setShowCustomerForm(false)}
          cartSummary={cartSummary}
        />
      )}
    </div>
  )
}