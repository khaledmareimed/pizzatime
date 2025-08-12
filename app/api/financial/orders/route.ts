import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Financial, FinancialSchema, FinancialIndexes, Order, OrderSchema, OrderIndexes, SystemLog, SystemLogSchema, SystemLogIndexes } from '@/funcs/collections'
import { createFinancialTransaction } from '@/funcs/financial-utils'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const paymentStatus = searchParams.get('paymentStatus')
    const dateRange = searchParams.get('dateRange') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const skip = (page - 1) * limit

    // Create orders collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Build date filter
    const dateFilter: any = {}
    const now = new Date()
    
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    } else {
      switch (dateRange) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
          dateFilter.createdAt = { $gte: todayStart, $lte: todayEnd }
          break
        case 'week':
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          dateFilter.createdAt = { $gte: weekStart, $lte: now }
          break
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter.createdAt = { $gte: monthStart, $lte: now }
          break
      }
    }

    // Build filter
    const filter: any = { ...dateFilter }
    if (paymentStatus && paymentStatus !== 'all') {
      filter.paymentStatus = paymentStatus
    }

    // Get orders with financial data
    const orders = await orderCollection.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalCount = await orderCollection.model.countDocuments(filter)

    // Get payment status statistics
    const paymentStats = await orderCollection.model.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentStatus',
          count: { $sum: 1 },
          totalAmount: { $sum: '$orderSummary.total' }
        }
      }
    ])

    const stats = {
      total: totalCount,
      paid: paymentStats.find(s => s._id === 'paid')?.count || 0,
      pending: paymentStats.find(s => s._id === 'pending')?.count || 0,
      failed: paymentStats.find(s => s._id === 'failed')?.count || 0,
      refunded: paymentStats.find(s => s._id === 'refunded')?.count || 0,
      totalPaid: paymentStats.find(s => s._id === 'paid')?.totalAmount || 0,
      totalPending: paymentStats.find(s => s._id === 'pending')?.totalAmount || 0,
      totalRefunded: paymentStats.find(s => s._id === 'refunded')?.totalAmount || 0
    }

    return NextResponse.json({
      orders,
      stats,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNext: page * limit < totalCount,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching financial orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { orderId, paymentStatus, notes } = body

    // Create orders collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Find and update the order
    const order = await orderCollection.model.findOne({ orderId }).lean()
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    const previousPaymentStatus = order.paymentStatus
    
    // Update order payment status
    const updatedOrder = await orderCollection.model.findOneAndUpdate(
      { orderId },
      { 
        paymentStatus,
        ...(notes && { notes: (order.notes || '') + `\n[${new Date().toISOString()}] تحديث حالة الدفع: ${notes}` })
      },
      { new: true }
    ).lean()

    // Create financial transaction based on payment status change
    if (paymentStatus === 'paid' && previousPaymentStatus !== 'paid') {
      // Create main revenue transaction
      await createFinancialTransaction({
        orderId: order.orderId,
        userId: order.userId,
        type: 'revenue',
        category: 'food_sales',
        amount: order.orderSummary.subtotal + order.orderSummary.addonsTotal + order.orderSummary.optionsTotal,
        description: `إيرادات من الطلب #${order.orderId.slice(-6)}`,
        paymentMethod: order.paymentMethod,
        metadata: {
          previousStatus: previousPaymentStatus,
          adminId: session.user.id,
          itemsCount: order.items.length
        }
      })

      // Create delivery fee transaction if applicable
      if (order.orderSummary.deliveryFee > 0) {
        await createFinancialTransaction({
          orderId: order.orderId,
          userId: order.userId,
          type: 'delivery_fee',
          category: 'delivery',
          amount: order.orderSummary.deliveryFee,
          description: `رسوم توصيل للطلب #${order.orderId.slice(-6)}`,
          paymentMethod: order.paymentMethod,
          metadata: {
            adminId: session.user.id
          }
        })
      }

      // Create coupon discount transaction if applicable
      if (order.orderSummary.couponDiscount > 0) {
        await createFinancialTransaction({
          orderId: order.orderId,
          userId: order.userId,
          type: 'discount',
          category: 'discounts',
          amount: order.orderSummary.couponDiscount,
          description: `خصم كوبون للطلب #${order.orderId.slice(-6)}`,
          metadata: {
            adminId: session.user.id,
            couponCode: order.coupon?.code
          }
        })
      }

      // Create manual discount transaction if applicable
      if (order.orderSummary.manualDiscount > 0) {
        await createFinancialTransaction({
          orderId: order.orderId,
          userId: order.userId,
          type: 'discount',
          category: 'discounts',
          amount: order.orderSummary.manualDiscount,
          description: `خصم إداري للطلب #${order.orderId.slice(-6)}`,
          metadata: {
            adminId: session.user.id,
            discountType: 'manual'
          }
        })
      }
    } else if (paymentStatus === 'refunded' && previousPaymentStatus === 'paid') {
      // Create refund transaction
      await createFinancialTransaction({
        orderId: order.orderId,
        userId: order.userId,
        type: 'refund',
        category: 'refunds',
        amount: order.orderSummary.total,
        description: `استرداد الطلب #${order.orderId.slice(-6)}`,
        notes: notes || 'استرداد بواسطة الإدارة',
        metadata: {
          previousStatus: previousPaymentStatus,
          adminId: session.user.id
        }
      })
    }

    // Create system log
    try {
      const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
        indexes: SystemLogIndexes
      })

      const logEntry = new systemLogCollection.model({
        userId: session.user.id,
        orderId: order.orderId,
        action: 'admin_payment_updated',
        description: `تم تحديث حالة دفع الطلب #${order.orderId.slice(-6)} من ${previousPaymentStatus} إلى ${paymentStatus}`,
        metadata: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          previousPaymentStatus,
          newPaymentStatus: paymentStatus,
          orderTotal: order.orderSummary.total
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      })

      await logEntry.save()
    } catch (logError) {
      console.error('Error creating system log:', logError)
    }

    return NextResponse.json({
      success: true,
      order: updatedOrder
    })

  } catch (error) {
    console.error('Error updating order payment status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}