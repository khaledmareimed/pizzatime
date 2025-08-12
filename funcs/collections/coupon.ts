import { BaseDocument } from '../collections'

/**
 * Coupon Collection Schema and Interface
 * 
 * Handles discount coupons with various types, usage limits, and expiration dates.
 * Supports percentage and fixed amount discounts with security validations.
 */

export const CouponSchema = {
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true,
    minlength: [3, 'Coupon code must be at least 3 characters'],
    maxlength: [20, 'Coupon code cannot exceed 20 characters'],
    match: [/^[A-Z0-9]+$/, 'Coupon code can only contain uppercase letters and numbers']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Coupon name must be at least 2 characters'],
    maxlength: [100, 'Coupon name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  discountType: {
    type: String,
    required: true,
    enum: ['percentage', 'fixed'],
    default: 'percentage'
  },
  discountValue: {
    type: Number,
    required: true,
    min: [0.01, 'Discount value must be greater than 0'],
    validate: {
      validator: function(this: any, value: number) {
        if (this.discountType === 'percentage') {
          return value <= 100
        }
        return value <= 1000 // Max 1000 currency units for fixed discount
      },
      message: 'Invalid discount value for the selected type'
    }
  },
  minimumOrderAmount: {
    type: Number,
    default: 0,
    min: [0, 'Minimum order amount cannot be negative']
  },
  maximumDiscountAmount: {
    type: Number,
    min: [0, 'Maximum discount amount cannot be negative'],
    validate: {
      validator: function(this: any, value: number) {
        // Only validate if value is provided and discount type is percentage
        return !value || this.discountType !== 'percentage' || value > 0
      },
      message: 'Maximum discount amount must be greater than 0 for percentage discounts'
    }
  },
  usageLimit: {
    type: Number,
    min: [1, 'Usage limit must be at least 1'],
    max: [10000, 'Usage limit cannot exceed 10,000']
  },
  usageCount: {
    type: Number,
    default: 0,
    min: [0, 'Usage count cannot be negative']
  },
  userUsageLimit: {
    type: Number,
    default: 1,
    min: [1, 'User usage limit must be at least 1'],
    max: [100, 'User usage limit cannot exceed 100']
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true,
    validate: {
      validator: function(this: any, endDate: Date) {
        return endDate > this.startDate
      },
      message: 'End date must be after start date'
    }
  },
  isActive: {
    type: Boolean,
    default: true,
    required: true
  },
  applicableCategories: [{
    type: String,
    ref: 'Category'
  }],
  excludedCategories: [{
    type: String,
    ref: 'Category'
  }],
  applicableProducts: [{
    type: String,
    ref: 'Product'
  }],
  excludedProducts: [{
    type: String,
    ref: 'Product'
  }],
  createdBy: {
    type: String,
    required: true,
    ref: 'User'
  },
  usedBy: [{
    userId: {
      type: String,
      ref: 'User',
      required: true
    },
    userEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true
    },
    usageCount: {
      type: Number,
      default: 1,
      min: 1
    },
    lastUsed: {
      type: Date,
      default: Date.now
    }
  }]
}

export interface CouponUsage {
  userId: string
  userEmail: string
  usageCount: number
  lastUsed: Date
}

export interface Coupon extends BaseDocument {
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
}

// Default indexes for Coupon collection
export const CouponIndexes = [
  { fields: { code: 1 }, options: { unique: true } },
  { fields: { isActive: 1 } },
  { fields: { startDate: 1, endDate: 1 } },
  { fields: { createdBy: 1 } },
  { fields: { 'usedBy.userId': 1 } },
  { fields: { usageCount: 1, usageLimit: 1 } },
  { fields: { isActive: 1, startDate: 1, endDate: 1 } } // Compound index for active coupon queries
]

// Helper function to validate coupon for a specific order
export interface CouponValidationResult {
  isValid: boolean
  error?: string
  discountAmount?: number
}

export interface OrderValidationData {
  userId: string
  userEmail: string
  orderTotal: number
  categoryIds: string[]
  productIds: string[]
  isAdminOverride?: boolean // Allow admin to bypass user usage limits
}

export function validateCouponForOrder(
  coupon: Coupon, 
  orderData: OrderValidationData
): CouponValidationResult {
  const now = new Date()
  
  // Check if coupon is active
  if (!coupon.isActive) {
    return { isValid: false, error: 'هذه القسيمة غير نشطة' }
  }
  
  // Check date validity
  if (now < coupon.startDate) {
    return { isValid: false, error: 'هذه القسيمة لم تصبح صالحة بعد' }
  }
  
  if (now > coupon.endDate) {
    return { isValid: false, error: 'انتهت صلاحية هذه القسيمة' }
  }
  
  // Check usage limit
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    return { isValid: false, error: 'تم استنفاد عدد مرات استخدام هذه القسيمة' }
  }
  
  // Check minimum order amount
  if (orderData.orderTotal < coupon.minimumOrderAmount) {
    return { 
      isValid: false, 
      error: `الحد الأدنى للطلب هو ${coupon.minimumOrderAmount} دينار أردني` 
    }
  }
  
  // Check user usage limit (skip if admin override is enabled)
  if (!orderData.isAdminOverride) {
    const userUsage = coupon.usedBy.find(usage => 
      usage.userId === orderData.userId || usage.userEmail === orderData.userEmail
    )
    if (userUsage && userUsage.usageCount >= coupon.userUsageLimit) {
      return { 
        isValid: false, 
        error: `لقد تجاوزت الحد المسموح لاستخدام هذه القسيمة (${coupon.userUsageLimit} مرات كحد أقصى)` 
      }
    }
  }
  
  // Check category restrictions
  if (coupon.applicableCategories.length > 0) {
    const hasApplicableCategory = orderData.categoryIds.some(catId => 
      coupon.applicableCategories.includes(catId)
    )
    if (!hasApplicableCategory) {
      return { isValid: false, error: 'هذه القسيمة غير صالحة للفئات المختارة' }
    }
  }
  
  if (coupon.excludedCategories.length > 0) {
    const hasExcludedCategory = orderData.categoryIds.some(catId => 
      coupon.excludedCategories.includes(catId)
    )
    if (hasExcludedCategory) {
      return { isValid: false, error: 'هذه القسيمة غير صالحة للفئات المختارة' }
    }
  }
  
  // Check product restrictions
  if (coupon.applicableProducts.length > 0) {
    const hasApplicableProduct = orderData.productIds.some(prodId => 
      coupon.applicableProducts.includes(prodId)
    )
    if (!hasApplicableProduct) {
      return { isValid: false, error: 'هذه القسيمة غير صالحة للمنتجات المختارة' }
    }
  }
  
  if (coupon.excludedProducts.length > 0) {
    const hasExcludedProduct = orderData.productIds.some(prodId => 
      coupon.excludedProducts.includes(prodId)
    )
    if (hasExcludedProduct) {
      return { isValid: false, error: 'هذه القسيمة غير صالحة للمنتجات المختارة' }
    }
  }
  
  // Calculate discount amount
  let discountAmount: number
  if (coupon.discountType === 'percentage') {
    discountAmount = (orderData.orderTotal * coupon.discountValue) / 100
    if (coupon.maximumDiscountAmount && discountAmount > coupon.maximumDiscountAmount) {
      discountAmount = coupon.maximumDiscountAmount
    }
  } else {
    discountAmount = Math.min(coupon.discountValue, orderData.orderTotal)
  }
  
  return { 
    isValid: true, 
    discountAmount: Math.round(discountAmount * 100) / 100 // Round to 2 decimal places
  }
}