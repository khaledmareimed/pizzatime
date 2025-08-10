import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { connectToDatabase } from '../../../funcs/database'
import mongoose from 'mongoose'

/**
 * POST /api/force-schema-update - Force update MongoDB collection schema
 * This endpoint drops and recreates the users collection with the new schema
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log(`Schema update initiated by user: ${session.user.email}`)

    await connectToDatabase()

    // Step 1: Get all users data before dropping collection
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')
    
    const allUsers = await usersCollection.find({}).toArray()
    console.log(`Found ${allUsers.length} users to migrate`)

    // Step 2: Transform addresses to new format
    const migratedUsers = allUsers.map(user => {
      const updatedUser = { ...user }
      
      if (user.addresses && Array.isArray(user.addresses)) {
        updatedUser.addresses = user.addresses.map((addr: any) => {
          // If address has old format, convert it
          if (addr.street || addr.zipCode) {
            return {
              name: addr.name || 'عنوان محفوظ',
              city: addr.city || 'غير محدد',
              phone: addr.phone || '+966500000000',
              addressDetails: `${addr.street || ''} ${addr.zipCode || ''}`.trim() || 'غير محدد',
              isDefault: addr.isDefault || false
            }
          }
          // If address already has new format but missing fields, fix it
          return {
            name: addr.name || 'عنوان محفوظ',
            city: addr.city || 'غير محدد',
            phone: addr.phone || '+966500000000',
            addressDetails: addr.addressDetails || 'غير محدد',
            isDefault: addr.isDefault || false
          }
        }).filter(addr => addr.name && addr.city && addr.phone && addr.addressDetails)
      } else {
        updatedUser.addresses = []
      }

      // Ensure all required fields exist
      updatedUser.orders = user.orders || []
      updatedUser.favorites = user.favorites || []
      updatedUser.dateJoined = user.dateJoined || new Date()
      updatedUser.lastLogin = user.lastLogin || new Date()
      updatedUser.isActive = user.isActive !== false

      return updatedUser
    })

    // Step 3: Drop the collection to remove old schema validation
    try {
      await usersCollection.drop()
      console.log('Dropped users collection')
    } catch (error) {
      console.log('Collection might not exist, continuing...')
    }

    // Step 4: Recreate collection with new schema
    const newUsersCollection = db.collection('users')
    
    // Step 5: Insert migrated data
    if (migratedUsers.length > 0) {
      await newUsersCollection.insertMany(migratedUsers)
      console.log(`Inserted ${migratedUsers.length} migrated users`)
    }

    // Step 6: Create indexes for performance
    await newUsersCollection.createIndex({ email: 1 }, { unique: true })
    await newUsersCollection.createIndex({ googleId: 1 }, { unique: true, sparse: true })
    await newUsersCollection.createIndex({ role: 1 })
    await newUsersCollection.createIndex({ isActive: 1 })
    await newUsersCollection.createIndex({ dateJoined: -1 })
    await newUsersCollection.createIndex({ lastLogin: -1 })

    console.log('Schema update completed successfully!')

    return NextResponse.json({
      success: true,
      message: 'Schema updated successfully',
      usersProcessed: allUsers.length,
      usersMigrated: migratedUsers.length
    })

  } catch (error) {
    console.error('Schema update failed:', error)
    return NextResponse.json(
      { error: 'Schema update failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}