import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection, User, UserSchema, UserIndexes } from '../../../../funcs/collections'

/**
 * POST /api/migrate/user-orders-schema - Migrate user orders from ObjectId array to full order objects
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Only allow admin users to run migrations
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Check if user is admin
    const adminUser = await userCollection.model.findOne({ 
      email: session.user.email,
      role: 'admin'
    })

    if (!adminUser) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    // Find all users and reset their orders array to empty
    const allUsers = await userCollection.model.find({})

    let migratedCount = 0
    let errorCount = 0

    for (const user of allUsers) {
      try {
        // Reset orders array to empty array to clear ObjectId conflicts
        await userCollection.model.updateOne(
          { _id: user._id },
          { $set: { orders: [] } }
        )
        migratedCount++
        console.log(`Migrated user ${user.email} - cleared orders array`)
      } catch (error) {
        console.error(`Error migrating user ${user._id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed. ${migratedCount} users migrated, ${errorCount} errors. All user orders arrays have been reset to empty.`,
      data: {
        migratedCount,
        errorCount,
        totalUsers: allUsers.length
      }
    })

  } catch (error) {
    console.error('Error running user orders migration:', error)
    return NextResponse.json(
      { error: 'Migration failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}