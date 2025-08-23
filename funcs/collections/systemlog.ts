import { BaseDocument } from '../collections'

/**
 * System Log Collection Schema and Interface
 * 
 * Tracks all system actions and events for auditing and monitoring purposes.
 * Records user actions, order events, and system operations.
 */

export const SystemLogSchema = {
  userId: {
    type: String,
    required: true,
    ref: 'User'
  },
  orderId: {
    type: String,
    ref: 'Order'
  },
  action: {
    type: String,
    required: true,
    enum: [
      'user_order_created',
      'user_order_cancelled',
      'user_order_updated',
      'admin_order_pending',
      'admin_order_confirmed',
      'admin_order_preparing',
      'admin_order_ready',
      'admin_order_out-for-delivery',
      'admin_order_delivered',
      'admin_order_cancelled',
      'user_login',
      'user_logout',
      'user_registered',
      'product_added_to_cart',
      'product_removed_from_cart',
      'cart_cleared',
      'address_added',
      'address_updated',
      'address_deleted',
      'favorite_added',
      'favorite_removed'
    ]
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  metadata: {
    type: Object,
    default: {}
  },
  ipAddress: {
    type: String
  },
  userAgent: {
    type: String
  }
}

export interface SystemLog extends BaseDocument {
  userId: string
  orderId?: string
  action: 'user_order_created' | 'user_order_cancelled' | 'user_order_updated' | 
          'admin_order_pending' | 'admin_order_confirmed' | 'admin_order_preparing' | 'admin_order_ready' | 
          'admin_order_out-for-delivery' | 'admin_order_delivered' | 'admin_order_cancelled' | 
          'user_login' | 'user_logout' | 'user_registered' | 'product_added_to_cart' | 
          'product_removed_from_cart' | 'cart_cleared' | 'address_added' | 
          'address_updated' | 'address_deleted' | 'favorite_added' | 'favorite_removed'
  description: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

// Default indexes for SystemLog collection
export const SystemLogIndexes = [
  { fields: { userId: 1 } },
  { fields: { orderId: 1 } },
  { fields: { action: 1 } },
  { fields: { createdAt: -1 } },
  { fields: { userId: 1, action: 1 } },
  { fields: { orderId: 1, action: 1 } }
]