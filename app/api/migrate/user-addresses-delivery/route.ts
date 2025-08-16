import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { connectToDatabase } from '../../../../funcs/database'
import { createCollection } from '../../../../funcs/collections'
import { SettingsSchema, SettingsIndexes } from '../../../../funcs/collections/settings'
import type { Settings } from '../../../../funcs/collections/settings'
import mongoose from 'mongoose'

/**
 * POST /api/migrate/user-addresses-delivery - Migrate user addresses to include cityId and locationId
 * This fixes the delivery cost calculation issue by populating missing cityId/locationId fields
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Only allow admins to run migrations
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    console.log(`🔧 Delivery address migration initiated by admin: ${session.user.email}`)

    await connectToDatabase()
    
    // Get delivery areas from settings
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })
    
    const settings = await settingsCollection.model.findOne({})
    if (!settings || !settings.deliveryAreas) {
      return NextResponse.json(
        { error: 'No delivery areas found in settings' },
        { status: 404 }
      )
    }

    // Get users collection directly
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')

    // Find users with addresses missing cityId or locationId
    const usersWithIncompleteAddresses = await usersCollection.find({
      'addresses': { $exists: true, $ne: [] },
      $or: [
        { 'addresses.cityId': { $exists: false } },
        { 'addresses.locationId': { $exists: false } },
        { 'addresses.cityId': '' },
        { 'addresses.locationId': '' }
      ]
    }).toArray()

    console.log(`📋 Found ${usersWithIncompleteAddresses.length} users with incomplete address data`)

    let updatedUsers = 0
    let updatedAddresses = 0
    let unmatchedAddresses = 0

    for (const user of usersWithIncompleteAddresses) {
      let userUpdated = false
      const updatedUserAddresses = user.addresses.map((address: any) => {
        // Skip if already has both IDs
        if (address.cityId && address.locationId && address.cityId !== '' && address.locationId !== '') {
          return address
        }

        // Try to match city and location names to get IDs
        const matchedCity = settings.deliveryAreas.find((area: any) => 
          area.isActive && 
          area.cityName.toLowerCase().trim() === (address.city || '').toLowerCase().trim()
        )

        if (matchedCity) {
          const matchedLocation = matchedCity.locations.find((loc: any) => 
            loc.isActive && 
            loc.locationName.toLowerCase().trim() === (address.location || '').toLowerCase().trim()
          )

          if (matchedLocation) {
            console.log(`✅ Matched: ${address.city} -> ${matchedCity._id}, ${address.location} -> ${matchedLocation._id}`)
            userUpdated = true
            updatedAddresses++
            
            return {
              ...address,
              cityId: matchedCity._id.toString(),
              locationId: matchedLocation._id.toString(),
              deliveryCost: matchedLocation.customerCost || address.deliveryCost || 3.0
            }
          } else {
            console.log(`⚠️ City matched but location not found: ${address.city} - ${address.location}`)
            unmatchedAddresses++
          }
        } else {
          console.log(`⚠️ City not found: ${address.city}`)
          unmatchedAddresses++
        }

        return address // Return unchanged if no match
      })

      if (userUpdated) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { addresses: updatedUserAddresses } }
        )
        updatedUsers++
      }
    }

    const result = {
      success: true,
      message: 'Delivery address migration completed',
      stats: {
        usersProcessed: usersWithIncompleteAddresses.length,
        usersUpdated: updatedUsers,
        addressesUpdated: updatedAddresses,
        unmatchedAddresses: unmatchedAddresses
      }
    }

    console.log('🎉 Migration completed:', result.stats)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Delivery address migration failed:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/migrate/user-addresses-delivery - Check delivery address migration status
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    await connectToDatabase()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')

    // Count addresses with and without delivery IDs
    const usersWithAddresses = await usersCollection.countDocuments({
      'addresses': { $exists: true, $ne: [] }
    })

    const usersWithIncompleteAddresses = await usersCollection.countDocuments({
      'addresses': { $exists: true, $ne: [] },
      $or: [
        { 'addresses.cityId': { $exists: false } },
        { 'addresses.locationId': { $exists: false } },
        { 'addresses.cityId': '' },
        { 'addresses.locationId': '' }
      ]
    })

    const usersWithCompleteAddresses = usersWithAddresses - usersWithIncompleteAddresses

    return NextResponse.json({
      success: true,
      status: {
        usersWithAddresses,
        usersWithCompleteAddresses,
        usersWithIncompleteAddresses,
        migrationNeeded: usersWithIncompleteAddresses > 0
      }
    })

  } catch (error) {
    console.error('❌ Delivery address status check failed:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}