import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection, User, UserSchema, UserIndexes, Order, OrderSchema, OrderIndexes, SystemLog, SystemLogSchema, SystemLogIndexes, Coupon, CouponSchema, CouponIndexes } from '../../../../funcs/collections'
import { calculateCartSummary } from '../../../../funcs/types/cart'
import { ObjectId } from 'mongodb'
import { sendNewOrderNotification } from '../../../../funcs/whatsapp'

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

    // Since user.orders now contains complete order objects, return them directly
    let userOrders = []
    
    // Check if orders are ObjectIds (old format) or objects (new format)
    if (user.orders && user.orders.length > 0) {
      const firstOrder = user.orders[0]
      
      if (typeof firstOrder === 'string' || firstOrder.constructor?.name === 'ObjectId') {
        // Old format - fetch from orders collection
        const orders = await orderCollection.model.find({
          _id: { $in: user.orders }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        
        userOrders = orders
      } else {
        // New format - orders are already complete objects in user.orders
        userOrders = user.orders
          .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
          .slice(skip, skip + limit)
      }
    }

    // Get total count for pagination
    const totalOrders = user.orders.length

    return NextResponse.json({
      success: true,
      data: userOrders,
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
    const { items, deliveryAddress, notes, paymentMethod = 'cash', deliveryMethod = 'delivery', coupon, totals } = body

    console.log('Order creation request:', {
      itemsCount: items?.length,
      coupon: coupon,
      totals: totals,
      deliveryMethod
    })

    console.log('Detailed coupon data:', JSON.stringify(coupon, null, 2))
    console.log('Detailed totals data:', JSON.stringify(totals, null, 2))

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

    // Get collections
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })
    const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
      indexes: SystemLogIndexes
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

    console.log('Found user:', {
      id: user._id,
      email: user.email,
      name: user.name,
      currentOrdersCount: user.orders?.length || 0,
      currentOrders: user.orders
    })

    // Use provided totals if available, otherwise calculate
    let orderSummary;
    if (totals) {
      console.log('Using provided totals from frontend')
      orderSummary = {
        subtotal: totals.subtotal,
        addonsTotal: 0, // Will be calculated from items
        optionsTotal: 0, // Will be calculated from items
        deliveryFee: totals.deliveryFee,
        couponDiscount: totals.couponDiscount || 0,
        total: totals.total
      };
    } else {
      console.log('Calculating totals from scratch')
      // Fallback calculation if no totals provided
      const cartItems = items.map((item: any) => ({
        id: item.productId || '',
        productId: item.productId || '',
        name: item.productName || '',
        description: item.description || '',
        price: item.price || 0,
        originalPrice: item.originalPrice || item.price || 0,
        quantity: item.quantity || 1,
        image: item.image || '',
        addons: item.addons || [],
        options: item.options || [],
        comments: item.comments || '',
        addedAt: new Date().toISOString(),
        categoryId: item.categoryId || '',
        available: true
      }))
      
      const summary = calculateCartSummary(cartItems)
      const deliveryFee = deliveryMethod === 'delivery' ? 15 : 0
      orderSummary = {
        subtotal: summary.subtotal,
        addonsTotal: summary.addonsTotal,
        optionsTotal: summary.optionsTotal,
        deliveryFee,
        couponDiscount: 0,
        total: summary.total + deliveryFee
      };
    }

    console.log('Final orderSummary:', JSON.stringify(orderSummary, null, 2))

    // Generate unique order ID
    const orderId = `ORD-${Date.now().toString(36)}-${Math.random().toString(36).substr(2, 5)}`.toUpperCase()

    // STEP 1: Save complete order data in user object's orders array
    const completeOrderData = {
      orderId,
      items: items.map((item: any) => ({
        productId: item.productId || item.id,
        productName: item.name,
        quantity: item.quantity,
        price: item.price || 0,
        originalPrice: item.originalPrice || item.price || 0,
        image: item.image,
        categoryId: item.categoryId,
        addons: (item.addons || []).map((addon: any) => ({
          id: addon.id,
          name: addon.name,
          price: addon.price || 0
        })),
        options: (item.options || []).map((option: any) => ({
          optionTitle: option.optionTitle,
          choiceName: option.choiceName,
          choicePrice: option.choicePrice || 0
        })),
        comments: item.comments
      })),
      deliveryAddress: {
        name: deliveryAddress.name,
        recipientName: deliveryAddress.recipientName,
        city: deliveryAddress.city,
        phone: deliveryAddress.phone,
        addressDetails: deliveryAddress.addressDetails
      },
      orderSummary: orderSummary,
      // Add coupon information if provided
      coupon: coupon ? {
        couponId: coupon.couponId,
        code: coupon.code,
        name: coupon.name,
        discountAmount: coupon.discountAmount
      } : null,
      paymentMethod,
      deliveryMethod,
      status: 'pending',
      paymentStatus: 'pending',
      notes: notes || '',
      orderDate: new Date()
    }

    // Get current user to check existing orders
    const currentUser = await userCollection.model.findById(user._id)
    let existingOrders = []
    
    // Check if existing orders are ObjectIds (old format) or objects (new format)
    if (currentUser?.orders && currentUser.orders.length > 0) {
      const firstOrder = currentUser.orders[0]
      // If it's an ObjectId, start fresh with empty array
      if (typeof firstOrder === 'string' || firstOrder.constructor?.name === 'ObjectId') {
        existingOrders = []
      } else {
        // If it's already an object, keep existing orders
        existingOrders = currentUser.orders
      }
    }
    
    // Add new order to existing orders array
    const updatedOrders = [...existingOrders, completeOrderData]
    
    // Save complete order data in user's orders array
    const userUpdateResult = await userCollection.model.updateOne(
      { _id: user._id },
      { $set: { orders: updatedOrders } }
    )

    console.log('User update result:', userUpdateResult)
    console.log('User ID:', user._id)
    console.log('Order data being added to user:', JSON.stringify({
      orderId: completeOrderData.orderId,
      orderSummary: completeOrderData.orderSummary,
      coupon: completeOrderData.coupon
    }, null, 2))

    // STEP 2: Save order with userId and orderId in orders collection
    const newOrder = new orderCollection.model({
      userId: user._id.toString(),
      orderId: completeOrderData.orderId,
      items: completeOrderData.items,
      deliveryAddress: completeOrderData.deliveryAddress,
      orderSummary: completeOrderData.orderSummary,
      coupon: completeOrderData.coupon,
      paymentMethod: completeOrderData.paymentMethod,
      deliveryMethod: completeOrderData.deliveryMethod,
      status: completeOrderData.status,
      paymentStatus: completeOrderData.paymentStatus,
      notes: completeOrderData.notes,
      orderDate: completeOrderData.orderDate
    })

    await newOrder.save()
    console.log('Order saved to orders collection:', newOrder._id)
    console.log('Saved order details:', JSON.stringify({
      orderId: newOrder.orderId,
      orderSummary: newOrder.orderSummary,
      coupon: newOrder.coupon,
      total: newOrder.orderSummary?.total
    }, null, 2))

    // STEP 2.5: Apply coupon if provided
    if (coupon && coupon.couponId) {
      try {
        // Get coupon collection
        const couponCollection = await createCollection<Coupon>('coupons', CouponSchema, {
          indexes: CouponIndexes
        })

        // Find the coupon
        const couponDoc = await couponCollection.model.findById(coupon.couponId)
        
        if (couponDoc) {
          // Check if user has already used this coupon
          const existingUsage = couponDoc.usedBy.find(usage => 
            usage.userId === user._id.toString() || usage.userEmail === user.email
          )

          if (existingUsage) {
            // Increment existing user usage
            await couponCollection.model.updateOne(
              { 
                _id: new ObjectId(coupon.couponId),
                $or: [
                  { 'usedBy.userId': user._id.toString() },
                  { 'usedBy.userEmail': user.email }
                ]
              },
              {
                $inc: { 'usedBy.$.usageCount': 1, totalUsed: 1 },
                $set: { 
                  'usedBy.$.lastUsed': new Date(),
                  'usedBy.$.userEmail': user.email // Update email if needed
                }
              }
            )
          } else {
            // Add new user usage
            await couponCollection.model.updateOne(
              { _id: new ObjectId(coupon.couponId) },
              {
                $inc: { totalUsed: 1 },
                $push: {
                  usedBy: {
                    userId: user._id.toString(),
                    userEmail: user.email,
                    usageCount: 1,
                    lastUsed: new Date()
                  }
                }
              }
            )
          }

          console.log('Coupon applied successfully:', coupon.code, 'for user:', user.email);
        } else {
          console.error('Coupon not found:', coupon.couponId);
        }
      } catch (error) {
        console.error('Error applying coupon:', error);
        // Don't fail the order if coupon application fails
      }
    }

    // STEP 3: Save to system log with user ID and order ID
    const logEntry = new systemLogCollection.model({
      userId: user._id.toString(),
      orderId: newOrder._id.toString(),
      action: 'user_order_created',
      description: `User ${user.name} (ID: ${user._id}) created order ${orderId} (DB ID: ${newOrder._id}) with ${items.length} items totaling ${orderSummary.total.toFixed(2)} SAR${coupon ? ` with coupon ${coupon.code} (${coupon.discountAmount.toFixed(2)} SAR discount)` : ''}`,
      metadata: {
        userId: user._id.toString(),
        orderId: newOrder._id.toString(),
        orderIdReadable: orderId,
        userName: user.name,
        userEmail: user.email,
        itemCount: items.length,
        subtotal: orderSummary.subtotal,
        couponDiscount: orderSummary.couponDiscount || 0,
        deliveryFee: orderSummary.deliveryFee,
        totalAmount: orderSummary.total,
        deliveryMethod,
        paymentMethod,
        orderStatus: 'pending',
        // Add coupon metadata if used
        ...(coupon && {
          couponUsed: {
            couponId: coupon.couponId,
            code: coupon.code,
            name: coupon.name,
            discountAmount: coupon.discountAmount
          }
        })
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    await logEntry.save()

    // STEP 4: Send WhatsApp notification to admin
    try {
      console.log('Attempting to send WhatsApp notification for order:', newOrder.orderId)
      console.log('WhatsApp config check:', {
        hasPhone: !!process.env.WHATSAPP_ADMIN_PHONE,
        hasApiKey: !!process.env.WHATSAPP_API_KEY,
        phone: process.env.WHATSAPP_ADMIN_PHONE,
        apiKey: process.env.WHATSAPP_API_KEY ? 'configured' : 'missing'
      })
      
      const notificationData = {
        orderId: newOrder.orderId,
        customerName: deliveryAddress.recipientName || deliveryAddress.name,
        customerPhone: deliveryAddress.phone,
        total: orderSummary.total,
        items: items.map((item: any) => ({
          productName: item.name || item.productName,
          quantity: item.quantity,
          price: item.price || 0
        })),
        deliveryMethod: deliveryMethod,
        paymentMethod: paymentMethod,
        orderDate: newOrder.orderDate.toISOString()
      }
      
      console.log('Notification data:', JSON.stringify(notificationData, null, 2))
      
      const result = await sendNewOrderNotification(notificationData)
      
      if (result) {
        console.log('WhatsApp notification sent successfully for order:', newOrder.orderId)
      } else {
        console.log('WhatsApp notification failed for order:', newOrder.orderId)
      }
    } catch (whatsappError) {
      console.error('Failed to send WhatsApp notification:', whatsappError)
      // Don't fail the order if WhatsApp notification fails
    }

    return NextResponse.json({
      success: true,
      data: {
        orderId: newOrder.orderId,
        _id: newOrder._id,
        status: newOrder.status,
        total: orderSummary.total,
        couponDiscount: orderSummary.couponDiscount || 0,
        orderDate: newOrder.orderDate,
        couponApplied: coupon ? coupon.code : null
      },
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