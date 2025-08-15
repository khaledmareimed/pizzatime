/**
 * Delivery Utilities
 * 
 * Helper functions for delivery cost calculations and address management
 */

import { UserAddress } from './collections/user'
import { formatJordanCurrency } from './jordanLocale'

/**
 * Get delivery cost from address
 */
export function getDeliveryCostFromAddress(address: UserAddress): number {
  return address.deliveryCost || 3.0 // Default fallback cost
}

/**
 * Format delivery cost display
 */
export function formatDeliveryCost(cost: number): string {
  return formatJordanCurrency(cost)
}

/**
 * Calculate order totals with delivery cost
 */
export function calculateOrderTotals(
  subtotal: number,
  deliveryCost: number,
  couponDiscount: number = 0
): {
  subtotal: number
  deliveryFee: number
  couponDiscount: number
  total: number
} {
  return {
    subtotal,
    deliveryFee: deliveryCost,
    couponDiscount,
    total: subtotal + deliveryCost - couponDiscount
  }
}

/**
 * Validate address has required delivery information
 */
export function validateAddressForDelivery(address: UserAddress): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!address.city) {
    errors.push('المدينة مطلوبة')
  }

  if (!address.location) {
    errors.push('المنطقة مطلوبة')
  }

  if (address.deliveryCost === undefined || address.deliveryCost < 0) {
    errors.push('تكلفة التوصيل غير صحيحة')
  }

  if (!address.phone) {
    errors.push('رقم الهاتف مطلوب')
  }

  if (!address.addressDetails) {
    errors.push('تفاصيل العنوان مطلوبة')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Get address display string
 */
export function getAddressDisplayString(address: UserAddress): string {
  const parts = [
    address.city,
    address.location,
    address.addressDetails
  ].filter(Boolean)

  return parts.join(' - ')
}

/**
 * Check if address needs migration (missing new fields)
 */
export function addressNeedsMigration(address: UserAddress): boolean {
  return !address.location || address.deliveryCost === undefined
}