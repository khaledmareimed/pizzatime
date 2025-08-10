import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { migrateUserAddressSchema, cleanupInvalidAddresses } from '../../../../funcs/migrations/updateUserAddressSchema'

/**
 * POST /api/migrate/user-addresses - Run user address schema migration
 * This should only be accessible by admins
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

    console.log(`Migration initiated by admin: ${session.user.email}`)

    // Run cleanup first
    const cleanupResult = await cleanupInvalidAddresses()
    
    // Then run migration
    const migrationResult = await migrateUserAddressSchema()

    return NextResponse.json({
      success: true,
      cleanup: cleanupResult,
      migration: migrationResult,
      message: 'User address schema migration completed'
    })

  } catch (error) {
    console.error('Migration API error:', error)
    return NextResponse.json(
      { error: 'Migration failed' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/migrate/user-addresses - Check migration status
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

    // Check if there are any users with old address format
    const { connectToDatabase, getModel } = await import('../../../../funcs/database')
    const { Schema } = await import('mongoose')
    
    await connectToDatabase()
    
    const tempSchema = new Schema({}, { strict: false, collection: 'users' })
    const UserModel = getModel('TempUserCheck', tempSchema)
    
    const usersWithOldFormat = await UserModel.countDocuments({
      'addresses.street': { $exists: true }
    })
    
    const usersWithNewFormat = await UserModel.countDocuments({
      'addresses.addressDetails': { $exists: true }
    })

    return NextResponse.json({
      success: true,
      status: {
        usersWithOldFormat,
        usersWithNewFormat,
        migrationNeeded: usersWithOldFormat > 0
      }
    })

  } catch (error) {
    console.error('Migration status check error:', error)
    return NextResponse.json(
      { error: 'Status check failed' },
      { status: 500 }
    )
  }
}