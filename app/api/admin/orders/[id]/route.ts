import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Order, OrderSchema, OrderIndexes, SystemLog, SystemLogSchema, SystemLogIndexes, User, UserSchema, UserIndexes } from '@/funcs/collections'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const { status, paymentStatus, notes } = body

    // Create orders collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Find the order
    const existingOrder = await orderCollection.model.findById(id).lean()
    
    if (!existingOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (status && status !== existingOrder.status) {
      updateData.status = status
    }
    
    if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
      updateData.paymentStatus = paymentStatus
    }
    
    if (notes !== undefined) {
      updateData.notes = notes
    }

    // Update the order
    const updatedOrder = await orderCollection.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean()

    if (!updatedOrder) {
      return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
    }

    // Sync the updated order status to the user's orders array
    try {
      const userCollection = await createCollection<User>('users', UserSchema, {
        indexes: UserIndexes
      })
      
      // Find the user who owns this order
      const user = await userCollection.model.findOne({ 
        'orders.orderId': updatedOrder.orderId 
      })
      
      if (user && user.orders) {
        // Update the specific order in the user's orders array
        const orderIndex = user.orders.findIndex((order: any) => 
          order.orderId === updatedOrder.orderId
        )
        
        if (orderIndex !== -1) {
          // Update the order status and other fields in the user's orders array
          const userOrderUpdate: any = {}
          
          if (status && status !== existingOrder.status) {
            userOrderUpdate[`orders.${orderIndex}.status`] = status
          }
          
          if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
            userOrderUpdate[`orders.${orderIndex}.paymentStatus`] = paymentStatus
          }
          
          if (notes !== undefined) {
            userOrderUpdate[`orders.${orderIndex}.notes`] = notes
          }
          
          // Apply the updates to the user's orders array
          if (Object.keys(userOrderUpdate).length > 0) {
            await userCollection.model.updateOne(
              { _id: user._id },
              { $set: userOrderUpdate }
            )
            console.log(`Synced order ${updatedOrder.orderId} status to user ${user._id}`)
          }
        }
      }
    } catch (syncError) {
      console.error('Error syncing order status to user orders array:', syncError)
      // Don't fail the admin update if user sync fails
    }

    // Create system log for the update
    try {
      const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
        indexes: SystemLogIndexes
      })

      const logActions = []
      
      if (status && status !== existingOrder.status) {
        logActions.push({
          action: `admin_order_${status}` as any,
          description: `تم تحديث حالة الطلب #${existingOrder.orderId.slice(-6)} إلى ${status}`
        })
      }
      
      if (paymentStatus && paymentStatus !== existingOrder.paymentStatus) {
        logActions.push({
          action: 'admin_order_updated' as any,
          description: `تم تحديث حالة الدفع للطلب #${existingOrder.orderId.slice(-6)} إلى ${paymentStatus}`
        })
      }

      // Create log entries
      for (const logAction of logActions) {
        const logEntry = new systemLogCollection.model({
          userId: session.user.id,
          orderId: existingOrder.orderId,
          action: logAction.action,
          description: logAction.description,
          metadata: {
            adminId: session.user.id,
            adminEmail: session.user.email,
            previousStatus: existingOrder.status,
            newStatus: status,
            previousPaymentStatus: existingOrder.paymentStatus,
            newPaymentStatus: paymentStatus
          },
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
          userAgent: request.headers.get('user-agent')
        })

        await logEntry.save()
      }
    } catch (logError) {
      console.error('Error creating system log:', logError)
      // Don't fail the order update if logging fails
    }

    return NextResponse.json(updatedOrder)

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create orders collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Find the order
    const order = await orderCollection.model.findById(id).lean()
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }


    return NextResponse.json(order)

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}