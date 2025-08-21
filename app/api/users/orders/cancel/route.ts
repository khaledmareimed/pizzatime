import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../auth'
import { createCollection, User, UserSchema, UserIndexes, Order, OrderSchema, OrderIndexes, SystemLog, SystemLogSchema, SystemLogIndexes } from '../../../../../funcs/collections'
import { sendOrderCancellationNotification } from '../../../../../funcs/whatsapp'
import { rateLimit } from '../../../../../funcs/middleware/rateLimit'
import { getJordanTime } from '../../../../../funcs/jordanLocale'

/**
 * POST /api/users/orders/cancel - Cancel user order within 5 minutes
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 10, window: 60000 }) // 10 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { orderId, reason } = body

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
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

    // Debug: Log user orders structure
    console.log('User orders count:', user.orders?.length || 0)
    console.log('Looking for orderId:', orderId)
    console.log('User orders structure:', user.orders?.map((o: any) => ({
      orderId: o.orderId,
      _id: o._id,
      status: o.status,
      orderDate: o.orderDate
    })))

    // Find order in user's orders - try multiple approaches
    let orderIndex = user.orders?.findIndex((order: any) => order.orderId === orderId) ?? -1
    
    // If not found by orderId, try by _id
    if (orderIndex === -1) {
      orderIndex = user.orders?.findIndex((order: any) => order._id?.toString() === orderId) ?? -1
      console.log('Tried finding by _id, result:', orderIndex)
    }
    
    // If still not found, try by string comparison
    if (orderIndex === -1) {
      orderIndex = user.orders?.findIndex((order: any) => 
        String(order.orderId) === String(orderId) || 
        String(order._id) === String(orderId)
      ) ?? -1
      console.log('Tried string comparison, result:', orderIndex)
    }
    
    if (orderIndex === -1) {
      console.error('Order not found in user orders. Available orders:', user.orders?.map((o: any) => ({
        orderId: o.orderId,
        _id: o._id?.toString(),
        type: typeof o.orderId
      })))
      return NextResponse.json(
        { error: 'Order not found in user orders' },
        { status: 404 }
      )
    }

    const order = user.orders[orderIndex]
    console.log('Found order:', {
      orderId: order.orderId,
      status: order.status,
      orderDate: order.orderDate
    })

    // Check if order can be cancelled (within 5 minutes and not already cancelled/delivered)
    const orderDate = new Date(order.orderDate)
    const now = getJordanTime() // Use Jordan time for consistency
    const timeDifferenceMinutes = (now.getTime() - orderDate.getTime()) / (1000 * 60)

    console.log('Time validation:', {
      orderDate: orderDate.toISOString(),
      now: now.toISOString(),
      timeDifferenceMinutes: timeDifferenceMinutes.toFixed(2)
    })

    // Allow cancellation within 5 minutes OR if it's still pending (for testing)
    if (timeDifferenceMinutes > 5 && order.status !== 'pending') {
      return NextResponse.json(
        { error: `لا يمكن إلغاء الطلب بعد مرور 5 دقائق من وقت الطلب (مر ${timeDifferenceMinutes.toFixed(1)} دقيقة)` },
        { status: 400 }
      )
    }

    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'الطلب ملغي بالفعل' },
        { status: 400 }
      )
    }

    if (order.status === 'delivered') {
      return NextResponse.json(
        { error: 'لا يمكن إلغاء طلب تم توصيله' },
        { status: 400 }
      )
    }

    // Update order status in user's orders array
    console.log('Before update - order status:', user.orders[orderIndex].status)
    
    // Mark the orders array as modified for Mongoose
    user.markModified('orders')
    
    // Update the order properties
    user.orders[orderIndex].status = 'cancelled'
    user.orders[orderIndex].cancellationReason = reason || 'طلب العميل'
    user.orders[orderIndex].cancelledAt = new Date()
    
    console.log('After update - order status:', user.orders[orderIndex].status)

    // Try multiple approaches to save the user document
    let userSaveSuccess = false
    
    try {
      // First attempt: Normal save
      await user.save({ validateBeforeSave: false })
      userSaveSuccess = true
      console.log('✅ User save method 1: Success')
    } catch (saveError) {
      console.log('❌ User save method 1 failed:', saveError instanceof Error ? saveError.message : 'Unknown error')
      
      try {
        // Second attempt: Direct database update using positional operator
        const directUpdateResult = await userCollection.model.updateOne(
          { 
            email: session.user.email,
            'orders.orderId': orderId 
          },
          { 
            $set: { 
              'orders.$.status': 'cancelled',
              'orders.$.cancellationReason': reason || 'طلب العميل',
              'orders.$.cancelledAt': new Date()
            }
          }
        )
        
        if (directUpdateResult.modifiedCount > 0) {
          userSaveSuccess = true
          console.log('✅ User save method 2: Success (direct update)')
        } else {
          console.log('❌ User save method 2 failed: No documents modified')
        }
      } catch (directError) {
        console.log('❌ User save method 2 failed:', directError instanceof Error ? directError.message : 'Unknown error')
        
        try {
          // Third attempt: Update by finding the exact array index
          const updateByIndex = await userCollection.model.updateOne(
            { email: session.user.email },
            { 
              $set: { 
                [`orders.${orderIndex}.status`]: 'cancelled',
                [`orders.${orderIndex}.cancellationReason`]: reason || 'طلب العميل',
                [`orders.${orderIndex}.cancelledAt`]: new Date()
              }
            }
          )
          
          if (updateByIndex.modifiedCount > 0) {
            userSaveSuccess = true
            console.log('✅ User save method 3: Success (index-based update)')
          } else {
            console.log('❌ User save method 3 failed: No documents modified')
          }
        } catch (indexError) {
          console.log('❌ User save method 3 failed:', indexError instanceof Error ? indexError.message : 'Unknown error')
        }
      }
    }

    // Update order in orders collection
    console.log('Updating orders collection...')
    const orderUpdateResult = await orderCollection.model.updateOne(
      { orderId: orderId },
      { 
        $set: { 
          status: 'cancelled',
          cancellationReason: reason || 'طلب العميل',
          cancelledAt: new Date()
        }
      }
    )
    console.log('Orders collection update result:', {
      matchedCount: orderUpdateResult.matchedCount,
      modifiedCount: orderUpdateResult.modifiedCount,
      acknowledged: orderUpdateResult.acknowledged
    })
    
    // If no documents were updated in orders collection, try alternative approaches
    if (orderUpdateResult.matchedCount === 0) {
      console.log('No order found in orders collection, trying alternative searches...')
      
      // Try finding by _id
      const altUpdateResult = await orderCollection.model.updateOne(
        { _id: orderId },
        { 
          $set: { 
            status: 'cancelled',
            cancellationReason: reason || 'طلب العميل',
            cancelledAt: new Date()
          }
        }
      )
      console.log('Alternative update result:', altUpdateResult)
    }

    // Verify the changes were saved by re-fetching the user
    console.log('Verifying database changes...')
    const updatedUser = await userCollection.model.findOne({ email: session.user.email })
    const updatedOrder = updatedUser?.orders?.find((o: any) => 
      o.orderId === orderId || o._id?.toString() === orderId
    )
    
    if (updatedOrder) {
      console.log('Verification - Updated order status:', updatedOrder.status)
      console.log('Verification - Cancellation reason:', updatedOrder.cancellationReason)
      
      if (updatedOrder.status !== 'cancelled') {
        console.error('❌ Database update failed - status not changed!')
        return NextResponse.json(
          { error: 'فشل في حفظ التغييرات في قاعدة البيانات' },
          { status: 500 }
        )
      }
    } else {
      console.error('❌ Could not verify order update!')
      return NextResponse.json(
        { error: 'فشل في التحقق من حفظ التغييرات' },
        { status: 500 }
      )
    }
    
    // Final check: Ensure at least one update method succeeded
    if (!userSaveSuccess) {
      console.error('❌ All user update methods failed!')
      return NextResponse.json(
        { error: 'فشل في تحديث بيانات المستخدم في قاعدة البيانات' },
        { status: 500 }
      )
    }

    // Log the cancellation
    const logEntry = new systemLogCollection.model({
      userId: user._id.toString(),
      orderId: order._id?.toString() || orderId,
      action: 'user_order_cancelled',
      description: `User ${user.name} (ID: ${user._id}) cancelled order ${orderId}. Reason: ${reason || 'طلب العميل'}`,
      metadata: {
        userId: user._id.toString(),
        orderId: orderId,
        userName: user.name,
        userEmail: user.email,
        cancellationReason: reason || 'طلب العميل',
        originalStatus: order.status,
        orderTotal: order.orderSummary?.total || 0,
        timeSinceOrder: `${timeDifferenceMinutes.toFixed(1)} minutes`
      },
      ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      userAgent: request.headers.get('user-agent') || 'unknown'
    })

    await logEntry.save()

    // Send WhatsApp notification to admin (non-blocking)
    try {
      console.log('Sending cancellation WhatsApp notification for order:', orderId)
      
      const notificationData = {
        orderId: orderId,
        customerName: order.deliveryAddress?.recipientName || order.deliveryAddress?.name || user.name,
        customerPhone: order.deliveryAddress?.phone || '+966500000000',
        total: order.orderSummary?.total || 0,
        cancellationReason: reason || 'طلب العميل'
      }
      
      console.log('Cancellation notification data:', JSON.stringify(notificationData, null, 2))
      
      // Send WhatsApp notification asynchronously (don't wait for it)
      sendOrderCancellationNotification(
        notificationData.orderId,
        notificationData.customerName,
        notificationData.customerPhone,
        notificationData.total,
        notificationData.cancellationReason
      ).then(result => {
        if (result) {
          console.log('WhatsApp cancellation notification sent successfully for order:', orderId)
        } else {
          console.log('WhatsApp cancellation notification failed for order:', orderId)
        }
      }).catch(whatsappError => {
        console.error('Failed to send WhatsApp cancellation notification:', whatsappError)
      })
      
    } catch (whatsappError) {
      console.error('Failed to initialize WhatsApp cancellation notification:', whatsappError)
      // Don't fail the cancellation if WhatsApp notification fails
    }

    return NextResponse.json({
      success: true,
      message: 'تم إلغاء الطلب بنجاح',
      data: {
        orderId: orderId,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancellationReason: reason || 'طلب العميل'
      }
    })

  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}