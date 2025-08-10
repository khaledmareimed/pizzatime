/**
 * Cart and Order Type Definitions
 * 
 * Defines the structure for cart items, orders, and related data
 * that will be stored in localStorage and managed throughout the app.
 */

import { Product } from '../collections/product'

export interface CartAddon {
  id: string
  name: string
  price: number
}

export interface CartItem {
  id: string // Product ID
  productId: string // Same as id, for clarity
  name: string
  description?: string
  price: number // Current price (may include discount)
  originalPrice: number // Original product price
  quantity: number
  image: string // Primary product image
  addons: CartAddon[]
  comments?: string
  addedAt: string // ISO timestamp
  categoryId: string
  available: boolean
}

export interface CartSummary {
  totalItems: number
  totalQuantity: number
  subtotal: number
  addonsTotal: number
  total: number
}

export interface OrderCustomer {
  name: string
  phone: string
  email?: string
  address: {
    street: string
    city: string
    zipCode: string
    notes?: string
  }
}

export interface Order {
  id: string
  items: CartItem[]
  customer: OrderCustomer
  summary: CartSummary
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  paymentMethod: 'cash' | 'card' | 'online'
  deliveryMethod: 'pickup' | 'delivery'
  orderDate: string // ISO timestamp
  estimatedDelivery?: string // ISO timestamp
  notes?: string
}

export interface CartState {
  items: CartItem[]
  summary: CartSummary
  lastUpdated: string
}

// Helper function to create CartItem from Product
export function createCartItemFromProduct(
  product: Product,
  quantity: number = 1,
  addons: CartAddon[] = [],
  comments?: string
): CartItem {
  const displayPrice = product.productDiscountPrice || product.productPrice
  const primaryImage = product.imagesUrl && product.imagesUrl.length > 0 
    ? product.imagesUrl[0] 
    : 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop'

  return {
    id: product._id.toString(),
    productId: product._id.toString(),
    name: product.productName,
    description: product.description,
    price: displayPrice,
    originalPrice: product.productPrice,
    quantity,
    image: primaryImage,
    addons,
    comments,
    addedAt: new Date().toISOString(),
    categoryId: product.categoryId,
    available: product.available
  }
}

// Helper function to calculate cart summary
export function calculateCartSummary(items: CartItem[]): CartSummary {
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const addonsTotal = items.reduce((sum, item) => {
    const itemAddonsTotal = item.addons.reduce((addonSum, addon) => addonSum + addon.price, 0)
    return sum + (itemAddonsTotal * item.quantity)
  }, 0)
  const total = subtotal + addonsTotal

  return {
    totalItems: items.length,
    totalQuantity,
    subtotal,
    addonsTotal,
    total
  }
}

// Helper function to generate unique order ID
export function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substr(2, 5)
  return `ORD-${timestamp}-${randomStr}`.toUpperCase()
}
