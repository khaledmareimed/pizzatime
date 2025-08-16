import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection, Order, OrderSchema, OrderIndexes } from '../../../../funcs/collections'
import { checkDeliveryAvailability, getUserRoleFromSession, formatAvailabilityMessage } from '../../../../funcs/delivery-availability'

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

    // Check delivery availability (admins bypass time restrictions but still check maintenance mode)
    const availabilityResult = await checkDeliveryAvailability(session.user.role)
    
    // For internal orders, we only block if in maintenance mode, not for time restrictions
    if (!availabilityResult.isAvailable && availabilityResult.reason?.includes('صيانة')) {
      return NextResponse.json(
        { 
          error: 'النظام في وضع الصيانة',
          message: formatAvailabilityMessage(availabilityResult),
          availabilityInfo: availabilityResult
        },
        { status: 503 }
      )
    }

    const body = await request.json()
    const { 
      orderId,
      items, 
      customer, 
      summary,
      coupon,
      discount,
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

    if (!summary || !summary.finalTotal || summary.finalTotal <= 0) {
      return NextResponse.json(
        { error: 'Valid order total is required' },
        { status: 400 }
      )
    }

    // Get order collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Transform cart items to order items format according to schema
    const orderItems = items.map((item: any) => ({
      productId: item.productId,
      productName: item.name,
      quantity: item.quantity,
      price: item.price,
      originalPrice: item.originalPrice || item.price,
      image: item.image,
      categoryId: item.categoryId,
      addons: item.addons || [],
      options: item.options || [],
      comments: item.comments || ''
    }))

    // Create delivery address according to schema
    const deliveryAddress = {
      name: customer.name,
      recipientName: customer.name,
      city: customer.city || 'N/A',
      phone: customer.phone,
      addressDetails: customer.address || (deliveryMethod === 'pickup' ? 'Pickup from restaurant' : 'N/A')
    }

    // Create order summary according to schema
    const orderSummary = {
      subtotal: summary.total || 0,
      addonsTotal: summary.addonsTotal || 0,
      optionsTotal: summary.optionsTotal || 0,
      deliveryFee: summary.deliveryFee || 0,
      couponDiscount: summary.couponDiscount || 0,
      manualDiscount: summary.manualDiscount || 0,
      total: summary.finalTotal
    }

    // Create coupon data if applied
    const couponData = coupon ? {
      couponId: coupon.code,
      code: coupon.code,
      name: coupon.name,
      discountAmount: coupon.discountAmount
    } : undefined

    // Create new internal order
    const newOrder = new orderCollection.model({
      userId: 'internal', // Special identifier for internal orders
      orderId: orderId,
      items: orderItems,
      deliveryAddress,
      orderSummary,
      coupon: couponData,
      paymentMethod: paymentMethod || 'cash',
      deliveryMethod: deliveryMethod || 'pickup',
      status: 'confirmed', // Internal orders start as confirmed
      paymentStatus: 'pending', // POS orders start as pending, will be paid when delivered
      estimatedDeliveryTime: deliveryMethod === 'pickup' 
        ? new Date(Date.now() + 15 * 60 * 1000) // 15 minutes for pickup
        : new Date(Date.now() + 45 * 60 * 1000), // 45 minutes for delivery
      notes: notes || '',
      orderDate: new Date(),
      isInternalOrder: true, // Mark as internal POS order
      posOrderId: orderId // Store the POS order ID
    })

    await newOrder.save()

    // Apply coupon usage if coupon was used
    if (coupon && coupon.code) {
      try {
        const couponApplyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/coupons/apply`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': request.headers.get('Cookie') || ''
          },
          body: JSON.stringify({
            couponCode: coupon.code,
            orderId: newOrder._id.toString(),
            orderData: {
              orderTotal: summary.total || 0,
              categoryIds: [...new Set(items.map((item: any) => item.categoryId))],
              productIds: items.map((item: any) => item.productId)
            }
          })
        })

        if (!couponApplyResponse.ok) {
          console.warn('Failed to apply coupon usage tracking:', await couponApplyResponse.text())
          // Don't fail the order creation if coupon tracking fails
        }
      } catch (error) {
        console.warn('Error applying coupon usage:', error)
        // Don't fail the order creation if coupon tracking fails
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: newOrder._id,
        posOrderId: orderId,
        status: newOrder.status,
        totalAmount: newOrder.orderSummary.total,
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

    // Build query for internal orders (only POS orders)
    const query: any = {
      isInternalOrder: true,
      userId: 'internal' // Only orders created from POS system
    }

    if (status) {
      query.status = status
    }

    // Get internal orders with pagination
    const orders = await orderCollection.model.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

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