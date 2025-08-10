export interface CouponUsage {
  userId: string
  usageCount: number
  lastUsed: Date
}

export interface Coupon {
  _id: string
  code: string
  name: string
  description?: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minimumOrderAmount: number
  maximumDiscountAmount?: number
  usageLimit?: number
  usageCount: number
  userUsageLimit: number
  startDate: Date
  endDate: Date
  isActive: boolean
  applicableCategories: string[]
  excludedCategories: string[]
  applicableProducts: string[]
  excludedProducts: string[]
  createdBy: string
  usedBy: CouponUsage[]
  createdAt: Date
  updatedAt: Date
}

export interface CouponForm {
  code: string
  name: string
  description: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  minimumOrderAmount: number
  maximumDiscountAmount: number
  usageLimit?: number
  userUsageLimit: number
  startDate: string // ISO date string for form inputs
  endDate: string // ISO date string for form inputs
  isActive: boolean
  applicableCategories: string[]
  excludedCategories: string[]
  applicableProducts: string[]
  excludedProducts: string[]
}

export interface Category {
  _id: string
  name: string
  description?: string
}

export interface Product {
  _id: string
  productName: string
  categoryId: string
}

export interface DeleteConfirmData {
  type: 'coupon'
  id: string
  name: string
}