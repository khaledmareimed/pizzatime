import { BaseDocument } from '../collections'
import { Schema } from 'mongoose'

/**
 * Settings Collection Schema and Interface
 * 
 * Handles restaurant settings including delivery times, cities/locations, and banner management.
 * All settings are stored in a single document for easy management.
 */

export const SettingsSchema = {
  // Delivery time management - daily schedule
  deliverySchedule: {
    sunday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' }, // 24-hour format
      closeTime: { type: String, default: '23:00' }
    },
    monday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    },
    tuesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    },
    wednesday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    },
    thursday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    },
    friday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    },
    saturday: {
      isOpen: { type: Boolean, default: true },
      openTime: { type: String, default: '09:00' },
      closeTime: { type: String, default: '23:00' }
    }
  },

  // Cities and delivery locations management
  deliveryAreas: [{
    cityName: {
      type: String,
      required: true,
      trim: true,
      maxlength: [50, 'City name cannot exceed 50 characters']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    locations: [{
      locationName: {
        type: String,
        required: true,
        trim: true,
        maxlength: [100, 'Location name cannot exceed 100 characters']
      },
      isActive: {
        type: Boolean,
        default: true
      },
      restaurantCost: {
        type: Number,
        required: true,
        min: [0, 'Restaurant cost cannot be negative'],
        max: [100, 'Restaurant cost cannot exceed 100 JOD']
      },
      customerCost: {
        type: Number,
        required: true,
        min: [0, 'Customer cost cannot be negative'],
        max: [100, 'Customer cost cannot exceed 100 JOD']
      }
    }]
  }],

  // Banner images management
  banners: [{
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: [100, 'Banner title cannot exceed 100 characters']
    },
    imageUrl: {
      type: String,
      required: true,
      validate: {
        validator: function(v: string) {
          return /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v)
        },
        message: 'Please provide a valid image URL'
      }
    },
    isActive: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      default: 0,
      min: [0, 'Order cannot be negative']
    },
    linkUrl: {
      type: String,
      default: null,
      validate: {
        validator: function(v: string | null) {
          if (!v) return true // Allow null/empty
          return /^https?:\/\/.+/.test(v)
        },
        message: 'Please provide a valid URL'
      }
    },
    description: {
      type: String,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: ''
    }
  }],

  // General restaurant settings
  restaurantInfo: {
    name: {
      type: String,
      default: 'مطعمنا',
      maxlength: [100, 'Restaurant name cannot exceed 100 characters']
    },
    phone: {
      type: String,
      default: '+962-7-9999-9999',
      match: [/^[\+]?[0-9\s\-\(\)]{10,20}$/, 'Please enter a valid phone number']
    },
    address: {
      type: String,
      default: 'عمان، الأردن',
      maxlength: [200, 'Address cannot exceed 200 characters']
    },
    minimumOrderAmount: {
      type: Number,
      default: 10,
      min: [0, 'Minimum order amount cannot be negative']
    }
  },

  // System settings
  systemSettings: {
    timezone: {
      type: String,
      default: 'Asia/Amman'
    },
    currency: {
      type: String,
      default: 'JOD'
    },
    language: {
      type: String,
      default: 'ar'
    },
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'نحن نعمل على تحسين الخدمة. سنعود قريباً!'
    }
  },

  // Metadata
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  updatedBy: {
    type: String,
    required: true
  }
}

// TypeScript interfaces
export interface DaySchedule {
  isOpen: boolean
  openTime: string
  closeTime: string
}

export interface DeliverySchedule {
  sunday: DaySchedule
  monday: DaySchedule
  tuesday: DaySchedule
  wednesday: DaySchedule
  thursday: DaySchedule
  friday: DaySchedule
  saturday: DaySchedule
}

export interface DeliveryLocation {
  _id?: string
  locationName: string
  isActive: boolean
  restaurantCost: number
  customerCost: number
}

export interface DeliveryArea {
  _id?: string
  cityName: string
  isActive: boolean
  locations: DeliveryLocation[]
}

export interface Banner {
  _id?: string
  title: string
  imageUrl: string
  isActive: boolean
  order: number
  linkUrl?: string | null
  description?: string
}

export interface RestaurantInfo {
  name: string
  phone: string
  address: string
  minimumOrderAmount: number
}

export interface SystemSettings {
  timezone: string
  currency: string
  language: string
  maintenanceMode: boolean
  maintenanceMessage: string
}

export interface Settings extends BaseDocument {
  deliverySchedule: DeliverySchedule
  deliveryAreas: DeliveryArea[]
  banners: Banner[]
  restaurantInfo: RestaurantInfo
  systemSettings: SystemSettings
  lastUpdated: Date
  updatedBy: string
}

// Default indexes for Settings collection
export const SettingsIndexes = [
  { fields: { lastUpdated: -1 } },
  { fields: { updatedBy: 1 } },
  { fields: { 'deliveryAreas.cityName': 1 } },
  { fields: { 'banners.isActive': 1, 'banners.order': 1 } }
]

// Helper function to get default settings
export function getDefaultSettings(updatedBy: string): Omit<Settings, keyof BaseDocument> {
  return {
    deliverySchedule: {
      sunday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      monday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      tuesday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      wednesday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      thursday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      friday: { isOpen: true, openTime: '09:00', closeTime: '23:00' },
      saturday: { isOpen: true, openTime: '09:00', closeTime: '23:00' }
    },
    deliveryAreas: [
      {
        cityName: 'عمان',
        isActive: true,
        locations: [
          {
            locationName: 'وسط البلد',
            isActive: true,
            restaurantCost: 2.0,
            customerCost: 3.0
          },
          {
            locationName: 'عبدون',
            isActive: true,
            restaurantCost: 2.5,
            customerCost: 3.5
          }
        ]
      }
    ],
    banners: [],
    restaurantInfo: {
      name: 'مطعمنا',
      phone: '+962-7-9999-9999',
      address: 'عمان، الأردن',
      minimumOrderAmount: 10
    },
    systemSettings: {
      timezone: 'Asia/Amman',
      currency: 'JOD',
      language: 'ar',
      maintenanceMode: false,
      maintenanceMessage: 'نحن نعمل على تحسين الخدمة. سنعود قريباً!'
    },
    lastUpdated: new Date(),
    updatedBy
  }
}