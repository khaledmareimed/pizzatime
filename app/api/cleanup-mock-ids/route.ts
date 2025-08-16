import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { connectToDatabase } from '../../../funcs/database'
import mongoose from 'mongoose'

/**
 * POST /api/cleanup-mock-ids - Clean up mock IDs from existing user addresses
 * This removes default-city-id and default-location-id from the database
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Only allow admins
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    console.log(`🧹 Mock ID cleanup initiated by admin: ${session.user.email}`)

    await connectToDatabase()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')

    // Find users with mock IDs
    const usersWithMockIds = await usersCollection.find({
      $or: [
        { 'addresses.cityId': 'default-city-id' },
        { 'addresses.locationId': 'default-location-id' }
      ]
    }).toArray()

    console.log(`📋 Found ${usersWithMockIds.length} users with mock IDs`)

    let cleanedUsers = 0
    let cleanedAddresses = 0

    for (const user of usersWithMockIds) {
      let userUpdated = false
      const cleanedUserAddresses = user.addresses.map((address: any) => {
        let addressUpdated = false
        const cleanedAddress = { ...address }

        // Replace mock cityId with empty string
        if (address.cityId === 'default-city-id') {
          cleanedAddress.cityId = ''
          addressUpdated = true
          console.log(`🧹 Cleaned cityId for ${user.email}: ${address.city}`)
        }

        // Replace mock locationId with empty string
        if (address.locationId === 'default-location-id') {
          cleanedAddress.locationId = ''
          addressUpdated = true
          console.log(`🧹 Cleaned locationId for ${user.email}: ${address.location}`)
        }

        if (addressUpdated) {
          cleanedAddresses++
          userUpdated = true
        }

        return cleanedAddress
      })

      if (userUpdated) {
        await usersCollection.updateOne(
          { _id: user._id },
          { $set: { addresses: cleanedUserAddresses } }
        )
        cleanedUsers++
        console.log(`✅ Cleaned user: ${user.email}`)
      }
    }

    const result = {
      success: true,
      message: 'Mock ID cleanup completed',
      stats: {
        usersProcessed: usersWithMockIds.length,
        usersUpdated: cleanedUsers,
        addressesCleaned: cleanedAddresses
      }
    }

    console.log('🎉 Cleanup completed:', result.stats)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Mock ID cleanup failed:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/cleanup-mock-ids - Check for mock IDs in database
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

    // Count users with mock IDs
    const usersWithMockCityIds = await usersCollection.countDocuments({
      'addresses.cityId': 'default-city-id'
    })

    const usersWithMockLocationIds = await usersCollection.countDocuments({
      'addresses.locationId': 'default-location-id'
    })

    const totalUsersWithMockIds = await usersCollection.countDocuments({
      $or: [
        { 'addresses.cityId': 'default-city-id' },
        { 'addresses.locationId': 'default-location-id' }
      ]
    })

    return NextResponse.json({
      success: true,
      status: {
        usersWithMockCityIds,
        usersWithMockLocationIds,
        totalUsersWithMockIds,
        cleanupNeeded: totalUsersWithMockIds > 0
      }
    })

  } catch (error) {
    console.error('❌ Mock ID status check failed:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}