import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { createCollection, User, UserSchema, UserIndexes } from '../../../funcs/collections'

/**
 * GET /api/users - Get current user profile
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

    // Find user by email
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
      data: user
    })

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users - Create or update user profile
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

    const body = await request.json()
    
    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Check if user already exists
    let user = await userCollection.model.findOne({ 
      email: session.user.email 
    })

    if (user) {
      // Update existing user
      user.name = session.user.name || user.name
      user.profileImage = session.user.image || user.profileImage
      user.lastLogin = new Date()
      
      // Update other fields if provided in body
      if (body.addresses) user.addresses = body.addresses
      
      await user.save()
    } else {
      // Create new user
      user = new userCollection.model({
        email: session.user.email,
        name: session.user.name || 'مستخدم جديد',
        profileImage: session.user.image,
        googleId: session.user.id,
        role: session.user.role || 'user',
        orders: [],
        favorites: [],
        addresses: [],
        dateJoined: new Date(),
        lastLogin: new Date(),
        isActive: true
      })
      
      await user.save()
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: user.isNew ? 'User created successfully' : 'User updated successfully'
    })

  } catch (error) {
    console.error('Error creating/updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users - Update user profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, addresses } = body
    
    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Find and update user
    const user = await userCollection.model.findOneAndUpdate(
      { email: session.user.email },
      {
        ...(name && { name }),
        ...(addresses && { addresses }),
        lastLogin: new Date()
      },
      { new: true, runValidators: true }
    )

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user,
      message: 'User updated successfully'
    })

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}