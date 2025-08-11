import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection, Order, OrderSchema, OrderIndexes } from '../../../../funcs/collections'

/**
 * POST /api/orders/internal - Create internal restaurant order (POS)
 * 
 * This endpoint allows admin users to create orders directly from the POS system
 * for walk-in customers or phone orders.
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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { 
      orderId,
      items, 
      customer, 
      summary,
      paymentMethod,
      deliveryMethod,
      notes,
      isInternalOrder = true
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Order items are required' },
        { status: 400 }
      )
    }

    if (!customer || !customer.name || !customer.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      )
    }

    if (!summary || !summary.total || summary.total <= 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      )
    }

    // Get order collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Transform cart items to order items format
    const orderItems = items.map((item: any) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: item.price,
      customizations: {
        addons: item.addons || [],
        options: item.options || [],
        notes: item.comments || ''
      }
    }))

    // Create delivery address from customer data
    const deliveryAddress = {
      street: customer.address?.street || 'N/A (Pickup)',
      city: customer.address?.city || 'N/A',
      zipCode: customer.address?.zipCode || 'N/A',
      instructions: customer.address?.notes || ''
    }

    // Create new internal order
    const newOrder = new orderCollection.model({
      userId: 'internal', // Special identifier for internal orders
      items: orderItems,
      deliveryAddress,
      totalAmount: summary.total,
      status: 'confirmed', // Internal orders start as confirmed
      paymentStatus: paymentMethod === 'cash' ? 'paid' : 'pending',
      estimatedDeliveryTime: deliveryMethod === 'pickup' 
        ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes for pickup
        : new Date(Date.now() + 45 * 60 * 1000), // 45 minutes for delivery
      
      // Additional fields for internal orders
      customerInfo: {
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        deliveryMethod: deliveryMethod || 'pickup',
        paymentMethod: paymentMethod || 'cash'
      },
      orderSource: 'pos',
      createdBy: session.user.email,
      isInternalOrder: true,
      posOrderId: orderId,
      notes: notes || ''
    })

    await newOrder.save()

    return NextResponse.json({
      success: true,
      data: {
        orderId: newOrder._id,
        posOrderId: orderId,
        status: newOrder.status,
        totalAmount: newOrder.totalAmount,
        estimatedDeliveryTime: newOrder.estimatedDeliveryTime,
        customer: {
          name: customer.name,
          phone: customer.phone
        }
      },
      message: 'Internal order created successfully'
    })

  } catch (error) {
    console.error('Error creating internal order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/orders/internal - Get internal orders for admin
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

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden. Admin access required.' },
        { status: 403 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status')
    const skip = (page - 1) * limit

    // Get order collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Build query for internal orders
    const query: any = {
      isInternalOrder: true
    }

    if (status) {
      query.status = status
    }

    // Get internal orders with pagination
    const orders = await orderCollection.model.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate('items.productId')

    // Get total count for pagination
    const totalOrders = await orderCollection.model.countDocuments(query)

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
    console.error('Error fetching internal orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}