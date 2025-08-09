import { BaseDocument } from '../collections'

/**
 * Category Collection Schema and Interface
 * 
 * Handles product categories for menu organization.
 * Maintains a products array containing product IDs for each category.
 * Includes display ordering, images, and color theming for categories.
 */

export const CategorySchema = {
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: [2, 'Category name must be at least 2 characters'],
    maxlength: [50, 'Category name cannot exceed 50 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [200, 'Category description cannot exceed 200 characters']
  },
  products: [{
    type: String,
    ref: 'Product'
  }],
  displayOrder: {
    type: Number,
    default: 0,
    min: [0, 'Display order cannot be negative']
  },
  imageUrl: {
    type: String,
    validate: {
      validator: function(url: string) {
        // Basic URL validation to prevent XSS
        return !url || /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif|svg)$/i.test(url)
      },
      message: 'Invalid image URL format. Must be a valid HTTP/HTTPS URL ending with jpg, jpeg, png, webp, gif, or svg'
    }
  },
  color: {
    type: String,
    match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Color must be a valid hex color code']
  }
}

export interface Category extends BaseDocument {
  name: string
  description?: string
  products: string[]
  displayOrder: number
  imageUrl?: string
  color?: string
}

// Default indexes for Category collection
export const CategoryIndexes = [
  { fields: { name: 1 }, options: { unique: true } },
  { fields: { displayOrder: 1 } },
  { fields: { products: 1 } } // Index for product IDs array
]
