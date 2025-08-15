/**
 * Settings Utilities
 * 
 * Helper functions for working with restaurant settings
 */

import { DeliverySchedule, DeliveryArea, Banner, Settings } from '@/funcs/collections/settings'
import { getJordanTime, formatJordanTime } from '@/funcs/jordanLocale'

/**
 * Check if restaurant is currently open based on delivery schedule
 */
export function isRestaurantOpen(schedule: DeliverySchedule): boolean {
  const now = getJordanTime()
  const currentDay = now.toLocaleDateString('en-US', { 
    weekday: 'long',
    timeZone: 'Asia/Amman'
  }).toLowerCase() as keyof DeliverySchedule

  const daySchedule = schedule[currentDay]
  
  if (!daySchedule.isOpen) {
    return false
  }

  const currentTime = formatJordanTime(now).slice(0, 5) // Get HH:MM format
  const [currentHour, currentMin] = currentTime.split(':').map(Number)
  const currentMinutes = currentHour * 60 + currentMin

  const [openHour, openMin] = daySchedule.openTime.split(':').map(Number)
  const [closeHour, closeMin] = daySchedule.closeTime.split(':').map(Number)
  
  const openMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin

  // Handle overnight hours (e.g., 22:00 - 02:00)
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes
  }
  
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

/**
 * Get next opening time for the restaurant
 */
export function getNextOpeningTime(schedule: DeliverySchedule): { day: string, time: string } | null {
  const now = getJordanTime()
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const
  const dayNames = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت'
  }

  const currentDayIndex = now.getDay() // 0 = Sunday
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7
    const dayKey = days[dayIndex]
    const daySchedule = schedule[dayKey]
    
    if (daySchedule.isOpen) {
      return {
        day: dayNames[dayKey],
        time: daySchedule.openTime
      }
    }
  }
  
  return null
}

/**
 * Get delivery cost for a specific city and location
 */
export function getDeliveryCost(
  areas: DeliveryArea[], 
  cityName: string, 
  locationName: string
): { restaurantCost: number, customerCost: number } | null {
  const city = areas.find(area => 
    area.isActive && 
    area.cityName.toLowerCase() === cityName.toLowerCase()
  )
  
  if (!city) return null
  
  const location = city.locations.find(loc => 
    loc.isActive && 
    loc.locationName.toLowerCase() === locationName.toLowerCase()
  )
  
  if (!location) return null
  
  return {
    restaurantCost: location.restaurantCost,
    customerCost: location.customerCost
  }
}

/**
 * Get all active delivery areas
 */
export function getActiveDeliveryAreas(areas: DeliveryArea[]): DeliveryArea[] {
  return areas
    .filter(area => area.isActive)
    .map(area => ({
      ...area,
      locations: area.locations.filter(loc => loc.isActive)
    }))
    .filter(area => area.locations.length > 0)
}

/**
 * Get active banners sorted by order
 */
export function getActiveBanners(banners: Banner[]): Banner[] {
  return banners
    .filter(banner => banner.isActive && banner.imageUrl)
    .sort((a, b) => a.order - b.order)
}

/**
 * Validate delivery schedule
 */
export function validateDeliverySchedule(schedule: DeliverySchedule): string[] {
  const errors: string[] = []
  const days = Object.keys(schedule) as (keyof DeliverySchedule)[]
  
  days.forEach(day => {
    const daySchedule = schedule[day]
    
    if (daySchedule.isOpen) {
      if (!daySchedule.openTime || !daySchedule.closeTime) {
        errors.push(`أوقات العمل مطلوبة لـ ${day}`)
        return
      }
      
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
      if (!timeRegex.test(daySchedule.openTime)) {
        errors.push(`صيغة وقت الفتح غير صحيحة لـ ${day}`)
      }
      if (!timeRegex.test(daySchedule.closeTime)) {
        errors.push(`صيغة وقت الإغلاق غير صحيحة لـ ${day}`)
      }
    }
  })
  
  return errors
}

/**
 * Validate delivery areas
 */
export function validateDeliveryAreas(areas: DeliveryArea[]): string[] {
  const errors: string[] = []
  
  areas.forEach((area, areaIndex) => {
    if (!area.cityName || area.cityName.trim().length === 0) {
      errors.push(`اسم المدينة مطلوب للمدينة #${areaIndex + 1}`)
    }
    
    area.locations.forEach((location, locationIndex) => {
      if (!location.locationName || location.locationName.trim().length === 0) {
        errors.push(`اسم المنطقة مطلوب للمنطقة #${locationIndex + 1} في ${area.cityName}`)
      }
      
      if (typeof location.restaurantCost !== 'number' || location.restaurantCost < 0) {
        errors.push(`تكلفة المطعم يجب أن تكون رقم موجب للمنطقة ${location.locationName}`)
      }
      
      if (typeof location.customerCost !== 'number' || location.customerCost < 0) {
        errors.push(`تكلفة العميل يجب أن تكون رقم موجب للمنطقة ${location.locationName}`)
      }
    })
  })
  
  return errors
}

/**
 * Validate banners
 */
export function validateBanners(banners: Banner[]): string[] {
  const errors: string[] = []
  
  banners.forEach((banner, index) => {
    if (!banner.title || banner.title.trim().length === 0) {
      errors.push(`عنوان البانر مطلوب للبانر #${index + 1}`)
    }
    
    if (!banner.imageUrl || !banner.imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i)) {
      errors.push(`رابط صورة البانر غير صحيح للبانر #${index + 1}`)
    }
    
    if (banner.linkUrl && !banner.linkUrl.match(/^https?:\/\/.+/)) {
      errors.push(`رابط البانر غير صحيح للبانر #${index + 1}`)
    }
  })
  
  return errors
}

/**
 * Get restaurant status summary
 */
export function getRestaurantStatus(settings: Settings): {
  isOpen: boolean
  nextOpening: { day: string, time: string } | null
  totalAreas: number
  activeAreas: number
  totalBanners: number
  activeBanners: number
} {
  const isOpen = isRestaurantOpen(settings.deliverySchedule)
  const nextOpening = isOpen ? null : getNextOpeningTime(settings.deliverySchedule)
  const activeAreas = getActiveDeliveryAreas(settings.deliveryAreas)
  const activeBanners = getActiveBanners(settings.banners)
  
  return {
    isOpen,
    nextOpening,
    totalAreas: settings.deliveryAreas.reduce((total, area) => total + area.locations.length, 0),
    activeAreas: activeAreas.reduce((total, area) => total + area.locations.length, 0),
    totalBanners: settings.banners.length,
    activeBanners: activeBanners.length
  }
}

/**
 * Export settings to JSON for backup
 */
export function exportSettingsToJSON(settings: Settings): string {
  const exportData = {
    deliverySchedule: settings.deliverySchedule,
    deliveryAreas: settings.deliveryAreas,
    banners: settings.banners,
    restaurantInfo: settings.restaurantInfo,
    systemSettings: settings.systemSettings,
    exportedAt: new Date().toISOString(),
    exportedBy: settings.updatedBy
  }
  
  return JSON.stringify(exportData, null, 2)
}

/**
 * Import settings from JSON backup
 */
export function importSettingsFromJSON(jsonString: string): Partial<Settings> | null {
  try {
    const data = JSON.parse(jsonString)
    
    // Validate required fields
    if (!data.deliverySchedule || !data.deliveryAreas || !data.banners) {
      throw new Error('Invalid settings format')
    }
    
    return {
      deliverySchedule: data.deliverySchedule,
      deliveryAreas: data.deliveryAreas,
      banners: data.banners,
      restaurantInfo: data.restaurantInfo,
      systemSettings: data.systemSettings
    }
  } catch (error) {
    console.error('Error importing settings:', error)
    return null
  }
}