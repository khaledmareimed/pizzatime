import { BaseDocument } from '../collections'

/**
 * Product Collection Schema and Interface
 * 
 * Handles menu items with pricing, addons/toppings, descriptions, and images.
 * Supports availability and visibility controls for menu management.
 */

export const ProductSchema = {
  productName: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Product name must be at least 2 characters'],
    maxlength: [100, 'Product name cannot exceed 100 characters']
  },
  categoryId: {
    type: String,
    required: true,
    ref: 'Category'
  },
  productPrice: {
    type: Number,
    required: true,
    min: [0.01, 'Product price must be greater than 0']
  },
  productDiscountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(this: any, discountPrice: number) {
        // Discount price should be less than or equal to regular price
        return !discountPrice || discountPrice <= this.productPrice
      },
      message: 'Discount price must be less than or equal to regular price'
    }
  },
  addonsAndToppings: [{
    toppingName: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Topping name is required'],
      maxlength: [50, 'Topping name cannot exceed 50 characters']
    },
    toppingPrice: {
      type: Number,
      required: true,
      min: [0, 'Topping price cannot be negative']
    }
  }],
  productOptions: [{
    optionTitle: {
      type: String,
      required: true,
      trim: true,
      minlength: [1, 'Option title is required'],
      maxlength: [100, 'Option title cannot exceed 100 characters']
    },
    isRequired: {
      type: Boolean,
      default: true
    },
    choices: [{
      choiceName: {
        type: String,
        required: true,
        trim: true,
        minlength: [1, 'Choice name is required'],
        maxlength: [50, 'Choice name cannot exceed 50 characters']
      },
      choicePrice: {
        type: Number,
        default: 0,
        min: [0, 'Choice price cannot be negative']
      }
    }]
  }],
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  available: {
    type: Boolean,
    default: true,
    required: true
  },
  visible: {
    type: Boolean,
    default: true,
    required: true
  },
  imagesUrl: [{
    type: String,
    validate: {
      validator: function(url: string) {
        // Basic URL validation to prevent XSS
        return !url || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)
      },
      message: 'Invalid image URL format. Must be a valid HTTP/HTTPS URL ending with jpg, jpeg, png, webp, or gif'
    }
  }]
}

export interface ProductOption {
  optionTitle: string
  isRequired: boolean
  choices: Array<{
    choiceName: string
    choicePrice: number
  }>
}

export interface Product extends BaseDocument {
  productName: string
  categoryId: string
  productPrice: number
  productDiscountPrice?: number
  addonsAndToppings: Array<{
    toppingName: string
    toppingPrice: number
  }>
  productOptions: ProductOption[]
  description?: string
  available: boolean
  visible: boolean
  imagesUrl: string[]
}

// Default indexes for Product collection
export const ProductIndexes = [
  { fields: { categoryId: 1 } },
  { fields: { available: 1 } },
  { fields: { visible: 1 } },
  { fields: { productName: 'text', description: 'text' } }, // Text search
  { fields: { productPrice: 1 } },
  { fields: { productDiscountPrice: 1 } },
  { fields: { categoryId: 1, available: 1, visible: 1 } } // Compound index for category queries
]
