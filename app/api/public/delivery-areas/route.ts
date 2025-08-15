import { NextResponse } from 'next/server'
import { createCollection } from '@/funcs/collections'
import { SettingsSchema, SettingsIndexes } from '@/funcs/collections/settings'
import type { Settings } from '@/funcs/collections/settings'

/**
 * GET /api/public/delivery-areas
 * Get active delivery areas and costs for public use (no auth required)
 */
export async function GET() {
  try {
    // Create/get settings collection
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })
    
    // Get settings
    const settings = await settingsCollection.model.findOne({})
    
    if (!settings) {
      return NextResponse.json({
        success: true,
        data: {
          areas: [],
          message: 'لا توجد مناطق توصيل متاحة حالياً'
        }
      })
    }

    // Filter only active areas and locations
    const activeAreas = settings.deliveryAreas
      .filter(area => area.isActive)
      .map(area => ({
        _id: area._id,
        cityName: area.cityName,
        locations: area.locations
          .filter(location => location.isActive)
          .map(location => ({
            _id: location._id,
            locationName: location.locationName,
            customerCost: location.customerCost
          }))
      }))
      .filter(area => area.locations.length > 0)

    return NextResponse.json({
      success: true,
      data: {
        areas: activeAreas,
        restaurantInfo: settings.restaurantInfo
      }
    })

  } catch (error) {
    console.error('Delivery areas GET error:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}