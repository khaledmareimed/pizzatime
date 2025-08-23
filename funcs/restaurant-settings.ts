/**
 * Restaurant settings management for print system
 * Loads restaurant info and printer configurations from database
 */

import { type RestaurantInfo, type PrinterConfig } from './print-utils'

// Cache for restaurant settings
let cachedRestaurantInfo: RestaurantInfo | null = null
let cachedPrinterConfig: PrinterConfig | null = null

/**
 * Load restaurant information from settings
 */
export async function getRestaurantInfo(): Promise<RestaurantInfo> {
  if (cachedRestaurantInfo) {
    return cachedRestaurantInfo
  }

  try {
    const response = await fetch('/api/settings')
    if (!response.ok) {
      throw new Error('Failed to fetch restaurant settings')
    }

    const settings = await response.json()
    
    cachedRestaurantInfo = {
      name: settings.restaurantName || 'مطعم الذواقة',
      nameEnglish: settings.restaurantNameEnglish || 'Gourmet Restaurant',
      address: settings.address || 'شارع الملك عبدالله، عمان، الأردن',
      phone: settings.phone || '+962 6 123 4567',
      email: settings.email || 'info@restaurant.jo',
      website: settings.website || 'www.restaurant.jo',
      taxNumber: settings.taxNumber || '',
      crNumber: settings.crNumber || '',
      slogan: settings.slogan || 'طعم أصيل وجودة عالية',
      workingHours: settings.workingHours || 'يومياً من 10:00 ص - 12:00 م',
      socialMedia: {
        instagram: settings.instagram || '',
        whatsapp: settings.whatsapp || '',
        facebook: settings.facebook || ''
      }
    }

    return cachedRestaurantInfo
  } catch (error) {
    console.error('Error loading restaurant settings:', error)
    
    // Return default settings if API fails
    cachedRestaurantInfo = {
      name: 'مطعم الذواقة',
      nameEnglish: 'Gourmet Restaurant',
      address: 'شارع الملك عبدالله، عمان، الأردن',
      phone: '+962 6 123 4567',
      email: 'info@restaurant.jo',
      website: 'www.restaurant.jo',
      taxNumber: '',
      crNumber: '',
      slogan: 'طعم أصيل وجودة عالية',
      workingHours: 'يومياً من 10:00 ص - 12:00 م',
      socialMedia: {
        instagram: '',
        whatsapp: '',
        facebook: ''
      }
    }

    return cachedRestaurantInfo
  }
}

/**
 * Load printer configuration from settings
 */
export async function getPrinterConfig(): Promise<PrinterConfig> {
  if (cachedPrinterConfig) {
    return cachedPrinterConfig
  }

  try {
    const response = await fetch('/api/settings')
    if (!response.ok) {
      throw new Error('Failed to fetch printer settings')
    }

    const settings = await response.json()
    
    cachedPrinterConfig = {
      type: settings.printerType || 'thermal',
      width: settings.printerWidth || 80,
      charactersPerLine: settings.printerCharactersPerLine || 42,
      supportsBold: settings.printerSupportsBold !== false,
      supportsUnderline: settings.printerSupportsUnderline !== false,
      supportsBarcode: settings.printerSupportsBarcode !== false,
      supportsQR: settings.printerSupportsQR || false,
      autocut: settings.printerAutocut !== false
    }

    return cachedPrinterConfig
  } catch (error) {
    console.error('Error loading printer settings:', error)
    
    // Return default printer config if API fails
    cachedPrinterConfig = {
      type: 'thermal',
      width: 80,
      charactersPerLine: 42,
      supportsBold: true,
      supportsUnderline: true,
      supportsBarcode: true,
      supportsQR: false,
      autocut: true
    }

    return cachedPrinterConfig
  }
}

/**
 * Clear cached settings (call when settings are updated)
 */
export function clearSettingsCache(): void {
  cachedRestaurantInfo = null
  cachedPrinterConfig = null
}

/**
 * Update restaurant settings
 */
export async function updateRestaurantSettings(settings: Partial<RestaurantInfo>): Promise<boolean> {
  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        restaurantName: settings.name,
        restaurantNameEnglish: settings.nameEnglish,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        website: settings.website,
        taxNumber: settings.taxNumber,
        crNumber: settings.crNumber,
        slogan: settings.slogan,
        workingHours: settings.workingHours,
        instagram: settings.socialMedia?.instagram,
        whatsapp: settings.socialMedia?.whatsapp,
        facebook: settings.socialMedia?.facebook
      })
    })

    if (response.ok) {
      clearSettingsCache()
      return true
    }

    return false
  } catch (error) {
    console.error('Error updating restaurant settings:', error)
    return false
  }
}

/**
 * Update printer configuration
 */
export async function updatePrinterConfig(config: Partial<PrinterConfig>): Promise<boolean> {
  try {
    const response = await fetch('/api/settings', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        printerType: config.type,
        printerWidth: config.width,
        printerCharactersPerLine: config.charactersPerLine,
        printerSupportsBold: config.supportsBold,
        printerSupportsUnderline: config.supportsUnderline,
        printerSupportsBarcode: config.supportsBarcode,
        printerSupportsQR: config.supportsQR,
        printerAutocut: config.autocut
      })
    })

    if (response.ok) {
      clearSettingsCache()
      return true
    }

    return false
  } catch (error) {
    console.error('Error updating printer settings:', error)
    return false
  }
}