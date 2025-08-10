import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection, User, UserSchema, UserIndexes, Product, ProductSchema, ProductIndexes } from '../../../../funcs/collections'
import { Types } from 'mongoose'

/**
 * GET /api/users/favorites - Get user's favorite products
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

    // Get collections
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })
    const productCollection = await createCollection<Product>('products', ProductSchema, {
      indexes: ProductIndexes
    })

    // Find user and populate favorites
    const user = await userCollection.model.findOne({ 
      email: session.user.email 
    }).populate({
      path: 'favorites',
      model: productCollection.model
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: user.favorites || []
    })

  } catch (error) {
    console.error('Error fetching user favorites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/favorites - Add product to favorites
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
    const { productId } = body


    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Get collections
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })
    const productCollection = await createCollection<Product>('products', ProductSchema, {
      indexes: ProductIndexes
    })

    // Validate productId format
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Convert to ObjectId and check if the product exists
    let objectId;
    try {
      objectId = new Types.ObjectId(productId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    const productExists = await productCollection.model.findById(objectId)
    
    if (!productExists) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Find the user first
    const user = await userCollection.model.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if product is already in favorites
    if (user.favorites && user.favorites.includes(objectId)) {
      return NextResponse.json(
        { error: 'Product already in favorites' },
        { status: 400 }
      )
    }

    // Add to favorites - ensure favorites array exists
    const result = await userCollection.model.updateOne(
      { email: session.user.email },
      { 
        $addToSet: { favorites: objectId } // $addToSet prevents duplicates
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to add product to favorites' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product added to favorites'
    })

  } catch (error) {
    console.error('Error adding to favorites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/favorites - Remove product from favorites
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('productId')


    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    // Validate productId format
    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }

    // Convert to ObjectId
    let objectId;
    try {
      objectId = new Types.ObjectId(productId);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid product ID' },
        { status: 400 }
      )
    }

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Find the user first
    const user = await userCollection.model.findOne({ email: session.user.email })
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if product is in favorites
    if (!user.favorites || !user.favorites.includes(objectId)) {
      return NextResponse.json(
        { error: 'Product not in favorites' },
        { status: 400 }
      )
    }

    // Remove from favorites
    const result = await userCollection.model.updateOne(
      { email: session.user.email },
      { 
        $pull: { favorites: objectId }
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to remove product from favorites' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product removed from favorites'
    })

  } catch (error) {
    console.error('Error removing from favorites:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}