import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Financial, FinancialSchema, FinancialIndexes, Order, OrderSchema, OrderIndexes } from '@/funcs/collections'
import { createFinancialTransaction } from '@/funcs/financial-utils'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all orders that are paid but don't have financial records
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Find all paid orders
    const paidOrders = await orderCollection.model
      .find({ paymentStatus: 'paid' })
      .lean()

    let syncedCount = 0
    let skippedCount = 0

    for (const order of paidOrders) {
      // Check if financial record already exists for this order
      const existingRecord = await financialCollection.model
        .findOne({ orderId: order.orderId })
        .lean()

      if (existingRecord) {
        skippedCount++
        continue
      }

      // Create financial records for this order
      try {
        // Main revenue transaction
        await createFinancialTransaction({
          orderId: order.orderId,
          userId: order.userId,
          type: 'revenue',
          category: 'food_sales',
          amount: order.orderSummary.subtotal + order.orderSummary.addonsTotal + order.orderSummary.optionsTotal,
          description: `إيرادات من الطلب #${order.orderId.slice(-6)} (مزامنة)`,
          paymentMethod: order.paymentMethod,
          metadata: {
            syncedBy: session.user.id,
            syncedAt: new Date(),
            itemsCount: order.items.length,
            originalOrderDate: order.createdAt
          }
        })

        // Delivery fee if applicable
        if (order.orderSummary.deliveryFee > 0) {
          await createFinancialTransaction({
            orderId: order.orderId,
            userId: order.userId,
            type: 'delivery_fee',
            category: 'delivery',
            amount: order.orderSummary.deliveryFee,
            description: `رسوم توصيل للطلب #${order.orderId.slice(-6)} (مزامنة)`,
            paymentMethod: order.paymentMethod,
            metadata: {
              syncedBy: session.user.id,
              syncedAt: new Date()
            }
          })
        }

        // Coupon discount if applicable
        if (order.orderSummary.couponDiscount > 0) {
          await createFinancialTransaction({
            orderId: order.orderId,
            userId: order.userId,
            type: 'discount',
            category: 'discounts',
            amount: order.orderSummary.couponDiscount,
            description: `خصم كوبون للطلب #${order.orderId.slice(-6)} (مزامنة)`,
            metadata: {
              syncedBy: session.user.id,
              syncedAt: new Date(),
              couponCode: order.coupon?.code
            }
          })
        }

        // Manual discount if applicable
        if (order.orderSummary.manualDiscount > 0) {
          await createFinancialTransaction({
            orderId: order.orderId,
            userId: order.userId,
            type: 'discount',
            category: 'discounts',
            amount: order.orderSummary.manualDiscount,
            description: `خصم إداري للطلب #${order.orderId.slice(-6)} (مزامنة)`,
            metadata: {
              syncedBy: session.user.id,
              syncedAt: new Date(),
              discountType: 'manual'
            }
          })
        }

        syncedCount++
      } catch (error) {
        console.error(`Error syncing order ${order.orderId}:`, error)
      }
    }

    return NextResponse.json({
      success: true,
      message: `تم مزامنة ${syncedCount} طلب، تم تخطي ${skippedCount} طلب (موجود مسبقاً)`,
      syncedCount,
      skippedCount,
      totalProcessed: paidOrders.length
    })

  } catch (error) {
    console.error('Error syncing orders with financial records:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}