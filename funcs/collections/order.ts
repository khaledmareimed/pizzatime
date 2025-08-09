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
  items: [{
    productId: { type: String, required: true, ref: 'Product' },
    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0.01 },
    customizations: {
      size: { type: String, enum: ['small', 'medium', 'large'] },
      extras: [{ type: String }],
      notes: { type: String, maxlength: 200 }
    }
  }],
  deliveryAddress: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    instructions: { type: String, maxlength: 200 }
  },
  totalAmount: {
    type: Number,
    required: true,
    min: [0.01, 'Total amount must be greater than 0']
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
  estimatedDeliveryTime: {
    type: Date
  },
  actualDeliveryTime: {
    type: Date
  }
}

export interface Order extends BaseDocument {
  userId: string
  items: Array<{
    productId: string
    quantity: number
    unitPrice: number
    customizations?: {
      size?: 'small' | 'medium' | 'large'
      extras?: string[]
      notes?: string
    }
  }>
  deliveryAddress: {
    street: string
    city: string
    zipCode: string
    instructions?: string
  }
  totalAmount: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  estimatedDeliveryTime?: Date
  actualDeliveryTime?: Date
}

// Default indexes for Order collection
export const OrderIndexes = [
  { fields: { userId: 1 } },
  { fields: { status: 1 } },
  { fields: { createdAt: -1 } },
  { fields: { paymentStatus: 1 } },
  { fields: { estimatedDeliveryTime: 1 } }
]

