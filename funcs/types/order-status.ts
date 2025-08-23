/**
 * Centralized Order Status Definitions
 * 
 * This file ensures consistency between:
 * - Material management system
 * - Admin order management components  
 * - API endpoints
 * - System logging
 */

// Order Status Values (English - used internally)
export const ORDER_STATUSES = [
  'pending',
  'confirmed', 
  'preparing',
  'ready',
  'out-for-delivery',
  'delivered',
  'cancelled'
] as const

export type OrderStatus = typeof ORDER_STATUSES[number]

// Payment Status Values
export const PAYMENT_STATUSES = [
  'pending',
  'paid', 
  'failed',
  'refunded'
] as const

export type PaymentStatus = typeof PAYMENT_STATUSES[number]

// Arabic Translations for Order Statuses
export const ORDER_STATUS_TRANSLATIONS: Record<OrderStatus, string> = {
  'pending': 'في الانتظار',
  'confirmed': 'مؤكد',
  'preparing': 'قيد التحضير', 
  'ready': 'جاهز',
  'out-for-delivery': 'في الطريق',
  'delivered': 'تم التوصيل',
  'cancelled': 'ملغي'
}

// Arabic Translations for Payment Statuses  
export const PAYMENT_STATUS_TRANSLATIONS: Record<PaymentStatus, string> = {
  'pending': 'في الانتظار',
  'paid': 'مدفوع',
  'failed': 'فشل', 
  'refunded': 'مسترد'
}

// Status Colors for UI Components
export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  'pending': 'bg-yellow-500',
  'confirmed': 'bg-blue-500',
  'preparing': 'bg-orange-500',
  'ready': 'bg-purple-500', 
  'out-for-delivery': 'bg-indigo-500',
  'delivered': 'bg-green-500',
  'cancelled': 'bg-red-500'
}

export const PAYMENT_STATUS_COLORS: Record<PaymentStatus, string> = {
  'pending': 'bg-yellow-500',
  'paid': 'bg-green-500',
  'failed': 'bg-red-500',
  'refunded': 'bg-gray-500'
}

// Material Management Status Categories
// Group 1: Non-usage statuses (1-3, 7) - pending, confirmed, preparing, cancelled
export const NON_USAGE_STATUSES: readonly OrderStatus[] = ['pending', 'confirmed', 'preparing', 'cancelled']
// Group 2: Usage statuses (4-6) - ready, out-for-delivery, delivered  
export const MATERIAL_USAGE_STATUSES: readonly OrderStatus[] = ['ready', 'out-for-delivery', 'delivered']

// Status Options for UI Components
export const ORDER_STATUS_OPTIONS = ORDER_STATUSES.map(status => ({
  value: status,
  label: ORDER_STATUS_TRANSLATIONS[status],
  color: ORDER_STATUS_COLORS[status]
}))

export const PAYMENT_STATUS_OPTIONS = PAYMENT_STATUSES.map(status => ({
  value: status, 
  label: PAYMENT_STATUS_TRANSLATIONS[status],
  color: PAYMENT_STATUS_COLORS[status]
}))

// System Log Actions for Order Status Changes
export const ORDER_STATUS_LOG_ACTIONS: Record<OrderStatus, string> = {
  'pending': 'admin_order_pending',
  'confirmed': 'admin_order_confirmed',
  'preparing': 'admin_order_preparing', 
  'ready': 'admin_order_ready',
  'out-for-delivery': 'admin_order_out-for-delivery',
  'delivered': 'admin_order_delivered',
  'cancelled': 'admin_order_cancelled'
}

// Helper Functions
export function isValidOrderStatus(status: string): status is OrderStatus {
  return ORDER_STATUSES.includes(status as OrderStatus)
}

export function isValidPaymentStatus(status: string): status is PaymentStatus {
  return PAYMENT_STATUSES.includes(status as PaymentStatus)
}

export function shouldProcessMaterialUsage(status: OrderStatus): boolean {
  return MATERIAL_USAGE_STATUSES.includes(status)
}

export function shouldReverseMaterialUsage(status: OrderStatus): boolean {
  return NON_USAGE_STATUSES.includes(status)
}

export function getOrderStatusTranslation(status: OrderStatus): string {
  return ORDER_STATUS_TRANSLATIONS[status] || status
}

export function getPaymentStatusTranslation(status: PaymentStatus): string {
  return PAYMENT_STATUS_TRANSLATIONS[status] || status
}

export function getOrderStatusColor(status: OrderStatus): string {
  return ORDER_STATUS_COLORS[status] || 'bg-gray-500'
}

export function getPaymentStatusColor(status: PaymentStatus): string {
  return PAYMENT_STATUS_COLORS[status] || 'bg-gray-500'
}

export function getOrderStatusLogAction(status: OrderStatus): string {
  return ORDER_STATUS_LOG_ACTIONS[status]
}