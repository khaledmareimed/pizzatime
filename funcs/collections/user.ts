import { BaseDocument } from '../collections'

/**
 * User Collection Schema and Interface
 * 
 * Handles user account information, authentication, preferences, and addresses.
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
  preferences: {
    dietary: [{
      type: String,
      enum: ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'halal', 'kosher']
    }],
    spiceLevel: {
      type: String,
      enum: ['mild', 'medium', 'hot', 'extra-hot'],
      default: 'medium'
    }
  },
  addresses: [{
    street: { type: String, required: true },
    city: { type: String, required: true },
    zipCode: { type: String, required: true },
    isDefault: { type: Boolean, default: false }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}

export interface User extends BaseDocument {
  email: string
  name: string
  role: 'user' | 'admin'
  preferences: {
    dietary: string[]
    spiceLevel: 'mild' | 'medium' | 'hot' | 'extra-hot'
  }
  addresses: Array<{
    street: string
    city: string
    zipCode: string
    isDefault: boolean
  }>
  isActive: boolean
}

// Default indexes for User collection
export const UserIndexes = [
  { fields: { email: 1 }, options: { unique: true } },
  { fields: { role: 1 } },
  { fields: { isActive: 1 } }
]

