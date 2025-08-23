/**
 * Jordan-specific locale utilities for time, currency, and date formatting
 */

// Jordan timezone
export const JORDAN_TIMEZONE = 'Asia/Amman'

// Jordan locale for formatting
export const JORDAN_LOCALE = 'ar-JO'

/**
 * Format date and time for Jordan timezone with Gregorian calendar and Western Arabic numerals
 */
export function formatJordanDateTime(dateString: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  // Handle null, undefined, or invalid dates
  if (!dateString) {
    return 'غير محدد' // "Not specified" in Arabic
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'تاريخ غير صحيح' // "Invalid date" in Arabic
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: JORDAN_TIMEZONE,
    calendar: 'gregory', // Explicitly use Gregorian calendar
    numberingSystem: 'latn', // Use Western Arabic numerals (0123456789)
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  }
  
  return date.toLocaleString('ar-JO', defaultOptions)
}

/**
 * Format date only for Jordan timezone (Gregorian calendar with Western Arabic numerals)
 */
export function formatJordanDate(dateString: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  // Handle null, undefined, or invalid dates
  if (!dateString) {
    return 'غير محدد' // "Not specified" in Arabic
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'تاريخ غير صحيح' // "Invalid date" in Arabic
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: JORDAN_TIMEZONE,
    calendar: 'gregory', // Explicitly use Gregorian calendar
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    numberingSystem: 'latn', // Use Western Arabic numerals (0123456789)
    ...options
  }
  
  return date.toLocaleDateString('ar-JO', defaultOptions)
}

/**
 * Format time only for Jordan timezone with Western Arabic numerals
 */
export function formatJordanTime(dateString: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  // Handle null, undefined, or invalid dates
  if (!dateString) {
    return 'غير محدد' // "Not specified" in Arabic
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'وقت غير صحيح' // "Invalid time" in Arabic
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: JORDAN_TIMEZONE,
    numberingSystem: 'latn', // Use Western Arabic numerals (0123456789)
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
    ...options
  }
  
  return date.toLocaleTimeString('ar-JO', defaultOptions)
}

/**
 * Format currency in Jordanian Dinar with Western Arabic numerals and JOD symbol
 */
export function formatJordanCurrency(amount: number | undefined | null, options?: Intl.NumberFormatOptions): string {
  // Handle undefined, null, or invalid values
  if (amount === undefined || amount === null || isNaN(amount)) {
    amount = 0
  }
  
  // Format the number with Western Arabic numerals (0123456789)
  const formattedNumber = amount.toLocaleString('ar-JO', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
    useGrouping: true,
    numberingSystem: 'latn', // Use Western Arabic numerals
    ...options
  })
  
  // Add the JOD currency symbol
  return `${formattedNumber} JOD`
}

/**
 * Format relative time (time ago) in Arabic for Jordan
 */
export function formatJordanTimeAgo(dateString: string | Date | null | undefined): string {
  // Handle null, undefined, or invalid dates
  if (!dateString) {
    return 'غير محدد' // "Not specified" in Arabic
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'تاريخ غير صحيح' // "Invalid date" in Arabic
  }
  
  const now = new Date()
  
  // Convert both dates to Jordan timezone for accurate comparison
  const jordanDate = new Date(date.toLocaleString('en-US', { timeZone: JORDAN_TIMEZONE }))
  const jordanNow = new Date(now.toLocaleString('en-US', { timeZone: JORDAN_TIMEZONE }))
  
  const diffInMinutes = Math.floor((jordanNow.getTime() - jordanDate.getTime()) / (1000 * 60))
  
  if (diffInMinutes < 1) return 'الآن'
  if (diffInMinutes === 1) return 'منذ دقيقة واحدة'
  if (diffInMinutes < 60) return `منذ ${diffInMinutes} دقيقة`
  
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours === 1) return 'منذ ساعة واحدة'
  if (diffInHours < 24) return `منذ ${diffInHours} ساعة`
  
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays === 1) return 'منذ يوم واحد'
  if (diffInDays < 7) return `منذ ${diffInDays} أيام`
  
  const diffInWeeks = Math.floor(diffInDays / 7)
  if (diffInWeeks === 1) return 'منذ أسبوع واحد'
  if (diffInWeeks < 4) return `منذ ${diffInWeeks} أسابيع`
  
  const diffInMonths = Math.floor(diffInDays / 30)
  if (diffInMonths === 1) return 'منذ شهر واحد'
  if (diffInMonths < 12) return `منذ ${diffInMonths} أشهر`
  
  const diffInYears = Math.floor(diffInDays / 365)
  if (diffInYears === 1) return 'منذ سنة واحدة'
  return `منذ ${diffInYears} سنوات`
}

/**
 * Get current Jordan time
 */
export function getJordanTime(): Date {
  // Create a new Date object that represents the current time in Jordan timezone
  const now = new Date()
  
  // Get the time string in Jordan timezone and create a new Date from it
  const jordanTimeString = now.toLocaleString('en-CA', { 
    timeZone: JORDAN_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  // Parse the Jordan time string to create a proper Date object
  return new Date(jordanTimeString)
}

/**
 * Format short date for Jordan (DD/MM/YYYY) with Western Arabic numerals
 */
export function formatJordanShortDate(dateString: string | Date | null | undefined): string {
  // Handle null, undefined, or invalid dates
  if (!dateString) {
    return 'غير محدد' // "Not specified" in Arabic
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'تاريخ غير صحيح' // "Invalid date" in Arabic
  }
  
  return date.toLocaleDateString('ar-JO', {
    timeZone: JORDAN_TIMEZONE,
    calendar: 'gregory',
    numberingSystem: 'latn', // Use Western Arabic numerals (0123456789)
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format business hours time (for restaurant) with Western Arabic numerals
 */
export function formatBusinessTime(dateString: string | Date | null | undefined): string {
  // Handle null, undefined, or invalid dates
  if (!dateString) {
    return 'غير محدد' // "Not specified" in Arabic
  }
  
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  // Check if the date is valid
  if (isNaN(date.getTime())) {
    return 'وقت غير صحيح' // "Invalid time" in Arabic
  }
  
  return date.toLocaleTimeString('ar-JO', {
    timeZone: JORDAN_TIMEZONE,
    numberingSystem: 'latn', // Use Western Arabic numerals (0123456789)
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}