import { NextRequest, NextResponse } from 'next/server'
import { createCollection } from '@/funcs/collections'
import { SettingsSchema, SettingsIndexes } from '@/funcs/collections/settings'
import type { Settings } from '@/funcs/collections/settings'

/**
 * GET /api/delivery-cost-by-id?cityId=xxx&locationId=xxx
 * Get delivery cost by city ID and location ID (more reliable than names)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const locationId = searchParams.get('locationId')

    if (!cityId || !locationId) {
      return NextResponse.json(
        { error: 'معرف المدينة والمنطقة مطلوب' },
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

    // Find delivery area by ID
    const deliveryArea = settings.deliveryAreas.find(area => 
      area.isActive && 
      area._id?.toString() === cityId
    )

    if (!deliveryArea) {
      return NextResponse.json({
        success: false,
        error: `المدينة غير متاحة للتوصيل (ID: ${cityId})`
      }, { status: 404 })
    }

    // Find location by ID
    const deliveryLocation = deliveryArea.locations.find(loc => 
      loc.isActive && 
      loc._id?.toString() === locationId
    )

    if (!deliveryLocation) {
      return NextResponse.json({
        success: false,
        error: `المنطقة غير متاحة (ID: ${locationId})`
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: {
        cityId: deliveryArea._id,
        cityName: deliveryArea.cityName,
        locationId: deliveryLocation._id,
        locationName: deliveryLocation.locationName,
        customerCost: deliveryLocation.customerCost,
        restaurantCost: deliveryLocation.restaurantCost
      },
      deliveryCost: deliveryLocation.customerCost
    })

  } catch (error) {
    console.error('Delivery cost by ID API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'خطأ في الخادم'
      },
      { status: 500 }
    )
  }
}