/**
 * Delivery Availability Utilities
 * 
 * Handles checking if orders can be placed based on delivery schedule and admin permissions
 */

import { getJordanTime } from './jordanLocale'
import { createCollection } from './collections'
import { Settings, SettingsSchema, SettingsIndexes, DeliverySchedule } from './collections/settings'

export interface DeliveryAvailabilityResult {
  isAvailable: boolean
  reason?: string
  nextAvailableTime?: {
    day: string
    time: string
  }
  currentTime?: string
  currentDay?: string
}

/**
 * Check if delivery is currently available based on Jordan time and delivery schedule
 * Admins bypass all time restrictions
 */
export async function checkDeliveryAvailability(userRole?: string): Promise<DeliveryAvailabilityResult> {
  try {
    console.log('🔍 Checking delivery availability for user role:', userRole)
    
    // Admins can always place orders - bypass all restrictions
    if (userRole === 'admin') {
      console.log('✅ Admin access granted - bypassing all restrictions')
      return {
        isAvailable: true,
        reason: 'Admin access - no time restrictions'
      }
    }

    // Get current Jordan time
    const now = getJordanTime()
    const currentTime = now.toLocaleTimeString('en-US', { 
      hour12: false, 
      timeZone: 'Asia/Amman',
      hour: '2-digit',
      minute: '2-digit'
    })
    
    const currentDayName = now.toLocaleDateString('en-US', { 
      weekday: 'long',
      timeZone: 'Asia/Amman'
    }).toLowerCase()

    console.log('⏰ Current Jordan time:', currentTime, 'Day:', currentDayName)

    // Get settings from database
    console.log('📊 Fetching settings from database...')
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })
    
    const settings = await settingsCollection.model.findOne({})
    
    if (!settings) {
      console.log('❌ No settings found in database')
      return {
        isAvailable: false,
        reason: 'إعدادات المطعم غير متوفرة',
        currentTime,
        currentDay: currentDayName
      }
    }

    console.log('✅ Settings found, checking maintenance mode...')
    
    // Check if restaurant is in maintenance mode
    if (settings.systemSettings?.maintenanceMode) {
      console.log('🔧 Restaurant is in maintenance mode')
      return {
        isAvailable: false,
        reason: settings.systemSettings.maintenanceMessage || 'المطعم مغلق مؤقتاً للصيانة',
        currentTime,
        currentDay: currentDayName
      }
    }

    const schedule = settings.deliverySchedule
    const dayKey = currentDayName as keyof DeliverySchedule
    const daySchedule = schedule[dayKey]

    console.log('📅 Day schedule for', currentDayName, ':', daySchedule)

    // Check if restaurant is closed for the entire day
    if (!daySchedule || !daySchedule.isOpen) {
      console.log('🚫 Restaurant is closed today')
      const nextOpening = getNextOpeningTime(schedule, now)
      return {
        isAvailable: false,
        reason: 'المطعم مغلق اليوم',
        nextAvailableTime: nextOpening,
        currentTime,
        currentDay: currentDayName
      }
    }

    // Check if current time is within operating hours
    console.log('⏰ Checking if current time', currentTime, 'is within', daySchedule.openTime, '-', daySchedule.closeTime)
    const isWithinHours = isTimeWithinOperatingHours(currentTime, daySchedule.openTime, daySchedule.closeTime)
    console.log('⏰ Is within hours:', isWithinHours)
    
    if (!isWithinHours) {
      console.log('🕐 Restaurant is closed - outside operating hours')
      const nextOpening = getNextOpeningTime(schedule, now)
      return {
        isAvailable: false,
        reason: `المطعم مغلق حالياً. ساعات العمل: ${daySchedule.openTime} - ${daySchedule.closeTime}`,
        nextAvailableTime: nextOpening,
        currentTime,
        currentDay: currentDayName
      }
    }

    // All checks passed - delivery is available
    console.log('✅ All checks passed - restaurant is open!')
    return {
      isAvailable: true,
      reason: 'المطعم مفتوح ومتاح للطلبات',
      currentTime,
      currentDay: currentDayName
    }

  } catch (error) {
    console.error('Error checking delivery availability:', error)
    return {
      isAvailable: false,
      reason: 'خطأ في التحقق من توفر الخدمة'
    }
  }
}

/**
 * Check if current time is within operating hours
 * Handles overnight hours (e.g., 22:00 - 02:00)
 */
function isTimeWithinOperatingHours(currentTime: string, openTime: string, closeTime: string): boolean {
  const [currentHour, currentMin] = currentTime.split(':').map(Number)
  const [openHour, openMin] = openTime.split(':').map(Number)
  const [closeHour, closeMin] = closeTime.split(':').map(Number)
  
  const currentMinutes = currentHour * 60 + currentMin
  const openMinutes = openHour * 60 + openMin
  const closeMinutes = closeHour * 60 + closeMin

  // Handle overnight hours (e.g., 22:00 - 02:00)
  if (closeMinutes < openMinutes) {
    return currentMinutes >= openMinutes || currentMinutes <= closeMinutes
  }
  
  // Normal hours (e.g., 09:00 - 23:00)
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes
}

/**
 * Get next opening time for the restaurant
 */
function getNextOpeningTime(schedule: DeliverySchedule, currentTime: Date): { day: string, time: string } | null {
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

  const currentDayIndex = currentTime.getDay() // 0 = Sunday
  
  // Check next 7 days
  for (let i = 1; i <= 7; i++) {
    const dayIndex = (currentDayIndex + i) % 7
    const dayKey = days[dayIndex]
    const daySchedule = schedule[dayKey]
    
    if (daySchedule && daySchedule.isOpen) {
      return {
        day: dayNames[dayKey],
        time: daySchedule.openTime
      }
    }
  }
  
  return null
}

/**
 * Get user role from session for delivery availability check
 */
export async function getUserRoleFromSession(session: any): Promise<string | undefined> {
  if (!session?.user?.email) {
    console.log('No session or email found')
    return undefined
  }

  try {
    // Import User collection properly
    const collections = await import('./collections')
    
    const userCollection = await collections.createCollection('users', collections.UserSchema, {
      indexes: collections.UserIndexes
    })
    
    const user = await userCollection.model.findOne({ 
      email: session.user.email 
    }).select('role')
    
    console.log('User role found:', user?.role, 'for email:', session.user.email)
    return user?.role
  } catch (error) {
    console.error('Error getting user role:', error)
    return undefined
  }
}

/**
 * Format delivery availability message for API responses
 */
export function formatAvailabilityMessage(result: DeliveryAvailabilityResult): string {
  if (result.isAvailable) {
    return result.reason || 'المطعم متاح للطلبات'
  }

  let message = result.reason || 'المطعم غير متاح حالياً'
  
  if (result.nextAvailableTime) {
    message += `. سيفتح يوم ${result.nextAvailableTime.day} في الساعة ${result.nextAvailableTime.time}`
  }
  
  if (result.currentTime) {
    message += ` (الوقت الحالي: ${result.currentTime})`
  }
  
  return message
}