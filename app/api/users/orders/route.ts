import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection, User, UserSchema, UserIndexes, Order, OrderSchema, OrderIndexes } from '../../../../funcs/collections'

/**
 * GET /api/users/orders - Get user's order history
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

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    const skip = (page - 1) * limit

    // Get collections
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Find user first
    const user = await userCollection.model.findOne({ 
      email: session.user.email 
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get user's orders with pagination
    const orders = await orderCollection.model.find({
      _id: { $in: user.orders }
    })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('items.productId')

    // Get total count for pagination
    const totalOrders = user.orders.length

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching user orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/orders - Create new order for user
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
    const { items, deliveryAddress, totalAmount, paymentMethod, notes } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required' },
        { status: 400 }
      )
    }

    if (!totalAmount || totalAmount <= 0) {
      return NextResponse.json(
        { error: 'Valid total amount is required' },
        { status: 400 }
      )
    }

    // Get collections
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Find user
    const user = await userCollection.model.findOne({ 
      email: session.user.email 
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create new order
    const newOrder = new orderCollection.model({
      userId: user._id,
      items: items.map((item: any) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        price: item.price,
        addons: item.addons || [],
        comments: item.comments
      })),
      deliveryAddress: {
        name: deliveryAddress.name,
        city: deliveryAddress.city,
        phone: deliveryAddress.phone,
        addressDetails: deliveryAddress.addressDetails
      },
      totalAmount,
      paymentMethod: paymentMethod || 'cash',
      status: 'pending',
      notes: notes || '',
      orderDate: new Date()
    })

    await newOrder.save()

    // Add order to user's orders array
    await userCollection.model.updateOne(
      { _id: user._id },
      { $push: { orders: newOrder._id } }
    )

    return NextResponse.json({
      success: true,
      data: newOrder,
      message: 'Order created successfully'
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}