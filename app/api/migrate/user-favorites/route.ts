import { NextRequest, NextResponse } from 'next/server'
import { createCollection, User, UserSchema, UserIndexes } from '../../../../funcs/collections'

/**
 * Migration endpoint to ensure all users have a favorites field
 * GET /api/migrate/user-favorites
 */
export async function GET(request: NextRequest) {
  try {
    console.log('Starting user favorites field migration...')

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Update all users that don't have a favorites field or have null favorites
    const result = await userCollection.model.updateMany(
      {
        $or: [
          { favorites: { $exists: false } },
          { favorites: null }
        ]
      },
      {
        $set: { favorites: [] }
      }
    )

    console.log(`Migration completed. Updated ${result.modifiedCount} users.`)

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully. Updated ${result.modifiedCount} users with favorites field.`,
      modifiedCount: result.modifiedCount
    })

  } catch (error) {
    console.error('Error during user favorites migration:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'Migration failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}