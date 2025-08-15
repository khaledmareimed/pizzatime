import { NextRequest, NextResponse } from 'next/server'
import { createCollection } from '@/funcs/collections'
import { SettingsSchema, SettingsIndexes } from '@/funcs/collections/settings'
import type { Settings } from '@/funcs/collections/settings'

/**
 * GET /api/delivery-cost?city=cityName&location=locationName
 * Get delivery cost for specific city and location
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const location = searchParams.get('location')

    if (!city || !location) {
      return NextResponse.json(
        { error: 'المدينة والمنطقة مطلوبة' },
        { status: 400 }
      )
    }

    // Get settings collection
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })
    
    // Get settings
    const settings = await settingsCollection.model.findOne({})
    
    if (!settings) {
      return NextResponse.json({
        success: false,
        error: 'لا توجد إعدادات توصيل'
      }, { status: 404 })
    }

    // Find matching delivery area
    const deliveryArea = settings.deliveryAreas.find(area => 
      area.isActive && 
      area.cityName.toLowerCase().trim() === city.toLowerCase().trim()
    )

    if (!deliveryArea) {
      return NextResponse.json({
        success: false,
        error: `المدينة "${city}" غير متاحة للتوصيل`
      }, { status: 404 })
    }

    // Find matching location
    const deliveryLocation = deliveryArea.locations.find(loc => 
      loc.isActive && 
      loc.locationName.toLowerCase().trim() === location.toLowerCase().trim()
    )

    if (!deliveryLocation) {
      return NextResponse.json({
        success: false,
        error: `المنطقة "${location}" غير متاحة في ${city}`
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        city: deliveryArea.cityName,
        location: deliveryLocation.locationName,
        customerCost: deliveryLocation.customerCost,
        restaurantCost: deliveryLocation.restaurantCost
      },
      deliveryCost: deliveryLocation.customerCost
    })

  } catch (error) {
    console.error('Delivery cost API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في الخادم'
      },
      { status: 500 }
    )
  }
}