import { NextRequest, NextResponse } from 'next/server'
import { createCollection } from '@/funcs/collections'
import { SettingsSchema, SettingsIndexes } from '@/funcs/collections/settings'
import type { Settings } from '@/funcs/collections/settings'

/**
 * GET /api/get-delivery-price?cityId=xxx&locationId=xxx
 * Get delivery price using real cityId and locationId
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const cityId = searchParams.get('cityId')
    const locationId = searchParams.get('locationId')

    console.log(`🔍 Getting delivery price for cityId: ${cityId}, locationId: ${locationId}`)

    if (!cityId || !locationId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'cityId and locationId are required' 
        },
        { status: 400 }
      )
    }

    // Validate that IDs are proper MongoDB ObjectIDs (24 hex characters)
    const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id)
    
    if (!isValidObjectId(cityId) || !isValidObjectId(locationId)) {
      console.log(`❌ Invalid ObjectID format: cityId=${cityId}, locationId=${locationId}`)
      return NextResponse.json(
        { 
          success: false,
          error: 'Invalid cityId or locationId format' 
        },
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
      console.log(`❌ No settings found`)
      return NextResponse.json({
        success: false,
        error: 'No delivery settings found'
      }, { status: 404 })
    }

    console.log(`📋 Found ${settings.deliveryAreas.length} delivery areas`)

    // Find delivery area by cityId
    const deliveryArea = settings.deliveryAreas.find(area => 
      area.isActive && area._id?.toString() === cityId
    )

    if (!deliveryArea) {
      console.log(`❌ City not found with ID: ${cityId}`)
      return NextResponse.json({
        success: false,
        error: `City not available for delivery (ID: ${cityId})`
      }, { status: 404 })
    }

    console.log(`✅ Found city: ${deliveryArea.cityName}`)

    // Find location by locationId
    const deliveryLocation = deliveryArea.locations.find(loc => 
      loc.isActive && loc._id?.toString() === locationId
    )

    if (!deliveryLocation) {
      console.log(`❌ Location not found with ID: ${locationId}`)
      return NextResponse.json({
        success: false,
        error: `Location not available (ID: ${locationId})`
      }, { status: 404 })
    }

    console.log(`✅ Found location: ${deliveryLocation.locationName}`)
    console.log(`💰 Delivery price: ${deliveryLocation.customerCost} JOD`)

    return NextResponse.json({
      success: true,
      data: {
        cityId: deliveryArea._id,
        cityName: deliveryArea.cityName,
        locationId: deliveryLocation._id,
        locationName: deliveryLocation.locationName,
        deliveryPrice: deliveryLocation.customerCost,
        customerCost: deliveryLocation.customerCost,
        restaurantCost: deliveryLocation.restaurantCost
      },
      deliveryPrice: deliveryLocation.customerCost
    })

  } catch (error) {
    console.error('❌ Get delivery price API error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}