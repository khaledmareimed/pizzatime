import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection, User, UserSchema, UserIndexes } from '../../../../funcs/collections'

/**
 * GET /api/users/debug - Debug user data to see what's in the user object
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
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

    // Find user and return complete user object
    const user = await userCollection.model.findOne({ 
      email: session.user.email 
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        userId: user._id,
        email: user.email,
        name: user.name,
        ordersCount: user.orders?.length || 0,
        orders: user.orders || [],
        favoritesCount: user.favorites?.length || 0,
        addressesCount: user.addresses?.length || 0
      }
    })

  } catch (error) {
    console.error('Error fetching user debug data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}