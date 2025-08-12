/**
 * Jordan-specific locale utilities for time, currency, and date formatting
 */

// Jordan timezone
export const JORDAN_TIMEZONE = 'Asia/Amman'

// Jordan locale for formatting
export const JORDAN_LOCALE = 'ar-JO'

/**
 * Format date and time for Jordan timezone
 */
export function formatJordanDateTime(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: JORDAN_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  }
  
  return date.toLocaleString(JORDAN_LOCALE, defaultOptions)
}

/**
 * Format date only for Jordan timezone (Gregorian calendar)
 */
export function formatJordanDate(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: JORDAN_TIMEZONE,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    ...options
  }
  
  return date.toLocaleDateString(JORDAN_LOCALE, defaultOptions)
}

/**
 * Format time only for Jordan timezone
 */
export function formatJordanTime(dateString: string | Date, options?: Intl.DateTimeFormatOptions): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    timeZone: JORDAN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    ...options
  }
  
  return date.toLocaleTimeString(JORDAN_LOCALE, defaultOptions)
}

/**
 * Format currency in Jordanian Dinar
 */
export function formatJordanCurrency(amount: number, options?: Intl.NumberFormatOptions): string {
  const defaultOptions: Intl.NumberFormatOptions = {
    style: 'currency',
    currency: 'JOD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
    ...options
  }
  
  return amount.toLocaleString(JORDAN_LOCALE, defaultOptions)
}

/**
 * Format relative time (time ago) in Arabic for Jordan
 */
export function formatJordanTimeAgo(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
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
  return new Date(new Date().toLocaleString('en-US', { timeZone: JORDAN_TIMEZONE }))
}

/**
 * Format short date for Jordan (DD/MM/YYYY)
 */
export function formatJordanShortDate(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  return date.toLocaleDateString(JORDAN_LOCALE, {
    timeZone: JORDAN_TIMEZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  })
}

/**
 * Format business hours time (for restaurant)
 */
export function formatBusinessTime(dateString: string | Date): string {
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  
  return date.toLocaleTimeString(JORDAN_LOCALE, {
    timeZone: JORDAN_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  })
}