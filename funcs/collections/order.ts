import { BaseDocument } from '../collections'

/**
 * Order Collection Schema and Interface
 * 
 * Handles customer orders with items, delivery information, and status tracking.
 * Supports order lifecycle management from creation to delivery.
 */

export const OrderSchema = {
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    productId: { type: String, required: true, ref: 'Product' },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    originalPrice: { type: Number, required: true, min: 0 },
    image: { type: String },
    categoryId: { type: String, required: true },
    addons: [{
      id: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true, min: 0 }
    }],
    options: [{
      optionTitle: { type: String, required: true },
      choiceName: { type: String, required: true },
      choicePrice: { type: Number, required: true, min: 0 }
    }],
    comments: { type: String, maxlength: 500 }
  }],
  deliveryAddress: {
    name: { type: String, required: true },
    recipientName: { type: String, required: true },
    city: { type: String, required: true },
    phone: { type: String, required: true },
    addressDetails: { type: String, required: true }
  },
  orderSummary: {
    subtotal: { type: Number, required: true, min: 0 },
    addonsTotal: { type: Number, default: 0, min: 0 },
    optionsTotal: { type: Number, default: 0, min: 0 },
    deliveryFee: { type: Number, default: 0, min: 0 },
    couponDiscount: { type: Number, default: 0, min: 0 },
    manualDiscount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0.01 }
  },
  coupon: {
    couponId: { type: String },
    code: { type: String },
    name: { type: String },
    discountAmount: { type: Number, min: 0 }
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online'],
    default: 'cash'
  },
  deliveryMethod: {
    type: String,
    enum: ['pickup', 'delivery'],
    default: 'delivery'
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'cancelled'],
    default: 'pending'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'failed', 'refunded'],
    default: 'pending'
  },
  notes: {
    type: String,
    maxlength: 1000
  },
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  },
  orderDate: {
    type: Date,
    default: Date.now
  },
  isInternalOrder: {
    type: Boolean,
    default: false
  },
  posOrderId: {
    type: String
  }
}

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  originalPrice: number
  image?: string
  categoryId: string
  addons: Array<{
    id: string
    name: string
    price: number
  }>
  options: Array<{
    optionTitle: string
    choiceName: string
    choicePrice: number
  }>
  comments?: string
}

export interface Order extends BaseDocument {
  userId: string
  orderId: string
  items: OrderItem[]
  deliveryAddress: {
    name: string
    recipientName: string
    city: string
    phone: string
    addressDetails: string
  }
  orderSummary: {
    subtotal: number
    addonsTotal: number
    optionsTotal: number
    deliveryFee: number
    couponDiscount: number
    manualDiscount: number
    total: number
  }
  coupon?: {
    couponId: string
    code: string
    name: string
    discountAmount: number
  }
  paymentMethod: 'cash' | 'card' | 'online'
  deliveryMethod: 'pickup' | 'delivery'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  estimatedDeliveryTime?: Date
  actualDeliveryTime?: Date
  orderDate: Date
  isInternalOrder?: boolean
  posOrderId?: string
}

// Default indexes for Order collection
export const OrderIndexes = [
  { fields: { userId: 1 } },
  { fields: { orderId: 1 }, options: { unique: true } },
  { fields: { status: 1 } },
  { fields: { createdAt: -1 } },
  { fields: { orderDate: -1 } },
  { fields: { paymentStatus: 1 } },
  { fields: { estimatedDeliveryTime: 1 } },
  { fields: { userId: 1, status: 1 } },
  { fields: { userId: 1, orderDate: -1 } },
  { fields: { isInternalOrder: 1 } },
  { fields: { posOrderId: 1 } }
]

