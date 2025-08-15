import { BaseDocument } from '../collections'
import { Types, Schema } from 'mongoose'

/**
 * User Collection Schema and Interface
 * 
 * Handles user account information, authentication, orders, favorites, and addresses.
 * Supports role-based access control (user/admin).
 */

export const UserSchema = {
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters']
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  // Array of order data - using Mixed type to handle both ObjectIds and order objects
  orders: {
    type: [Schema.Types.Mixed],
    default: []
  },
  // Array of favorite product IDs
  favorites: [{
    type: Types.ObjectId,
    ref: 'Product'
  }],
  // User addresses with detailed information
  addresses: [{
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Address name cannot exceed 50 characters']
    },
    recipientName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'Recipient name cannot exceed 50 characters']
    },
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    cityId: {
      type: String,
      required: true,
      trim: true
    },
    location: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Location name cannot exceed 100 characters']
    },
    locationId: {
      type: String,
      required: true,
      trim: true
    },
    deliveryCost: {
      type: Number,
      required: true,
      min: [0, 'Delivery cost cannot be negative']
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^[\+]?[0-9\s\-\(\)]{10,15}$/, 'Please enter a valid phone number']
    },
    addressDetails: {
      type: String,
      required: true,
      trim: true,
      maxlength: [200, 'Address details cannot exceed 200 characters']
    },
    isDefault: {
      type: Boolean,
      default: false
    }
  }],
  // Authentication and profile information
  googleId: {
    type: String,
    sparse: true // Allows multiple null values but unique non-null values
  },
  profileImage: {
    type: String,
    default: null
  },
  dateJoined: {
    type: Date,
    default: Date.now
  },
  lastLogin: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  }
}

export interface UserAddress {
  _id?: string
  name: string
  recipientName: string
  city: string
  cityId: string
  location: string
  locationId: string
  deliveryCost: number
  phone: string
  addressDetails: string
  isDefault: boolean
}

export interface UserOrder {
  orderId: string
  items: Array<{
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
  }>
  deliveryAddress: {
    name: string
    recipientName: string
    city: string
    cityId: string
    location: string
    locationId: string
    deliveryCost: number
    phone: string
    addressDetails: string
  }
  orderSummary: {
    subtotal: number
    addonsTotal: number
    optionsTotal: number
    deliveryFee: number
    discount: number
    total: number
  }
  paymentMethod: 'cash' | 'card' | 'online'
  deliveryMethod: 'pickup' | 'delivery'
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out-for-delivery' | 'delivered' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded'
  notes?: string
  orderDate: Date
}

export interface User extends BaseDocument {
  email: string
  name: string
  role: 'user' | 'admin'
  orders: any[] // Mixed type to handle both ObjectIds and UserOrder objects
  favorites: Types.ObjectId[]
  addresses: UserAddress[]
  googleId?: string
  profileImage?: string
  dateJoined: Date
  lastLogin: Date
  isActive: boolean
}

// Default indexes for User collection
export const UserIndexes = [
  { fields: { email: 1 }, options: { unique: true } },
  { fields: { googleId: 1 }, options: { unique: true, sparse: true } },
  { fields: { role: 1 } },
  { fields: { isActive: 1 } },
  { fields: { dateJoined: -1 } },
  { fields: { lastLogin: -1 } }
]

