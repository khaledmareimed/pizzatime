import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { getOrderMaterialHistory, calculateOrderMaterialUsage } from '@/funcs/material-order-management'
import { createCollection, Order, OrderSchema } from '@/funcs/collections'

/**
 * GET /api/admin/orders/[id]/materials - Get material usage information for an order (Admin only)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    // Get order details
    const orderCollection = await createCollection<Order>('orders', OrderSchema)
    const order = await orderCollection.model.findOne({ orderId }).lean()
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Calculate current material usage
    const materialCalculations = await calculateOrderMaterialUsage(order as Order)
    
    // Get material transaction history
    const materialHistory = await getOrderMaterialHistory(orderId)
    
    // Get order status information
    const statusInfo = {
      currentStatus: order.status,
      shouldUseMaterials: ['ready', 'out-for-delivery', 'delivered'].includes(order.status),
      statusHistory: [] // Could be enhanced to track status changes
    }

    return NextResponse.json({
      orderId,
      orderStatus: order.status,
      statusInfo,
      materialCalculations,
      materialHistory: materialHistory.transactions,
      summary: {
        totalMaterialTypes: materialCalculations.length,
        totalTransactions: materialHistory.transactions.length,
        hasActiveUsage: statusInfo.shouldUseMaterials,
        lastTransactionDate: materialHistory.transactions.length > 0 
          ? materialHistory.transactions[0].createdAt 
          : null
      }
    })

  } catch (error) {
    console.error('Error fetching order material information:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/orders/[id]/materials/recalculate - Recalculate and fix material usage for an order
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const body = await request.json()
    const { action } = body // 'recalculate', 'force-apply', 'force-reverse'

    // Get order details
    const orderCollection = await createCollection<Order>('orders', OrderSchema)
    const order = await orderCollection.model.findOne({ orderId }).lean()
    
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Import material management functions
    const { 
      processOrderMaterialUsage, 
      reverseOrderMaterialUsage, 
      handleOrderStatusChange 
    } = await import('@/funcs/material-order-management')

    let result = null
    const userId = session.user.id || session.user.email || 'admin'

    switch (action) {
      case 'force-apply':
        // Force apply material usage regardless of status
        result = await processOrderMaterialUsage(
          order as Order,
          userId,
          `Manual material application by admin - Order: ${orderId}`
        )
        break

      case 'force-reverse':
        // Force reverse material usage regardless of status
        result = await reverseOrderMaterialUsage(
          order as Order,
          userId,
          `Manual material reversal by admin - Order: ${orderId}`
        )
        break

      case 'recalculate':
        // Recalculate based on current status
        const shouldUse = ['ready', 'out-for-delivery', 'delivered'].includes(order.status)
        if (shouldUse) {
          // First reverse any existing usage, then apply fresh
          await reverseOrderMaterialUsage(
            order as Order,
            userId,
            `Material recalculation (reverse) - Order: ${orderId}`
          )
          result = await processOrderMaterialUsage(
            order as Order,
            userId,
            `Material recalculation (apply) - Order: ${orderId}`
          )
        } else {
          // Just reverse any existing usage
          result = await reverseOrderMaterialUsage(
            order as Order,
            userId,
            `Material recalculation (cleanup) - Order: ${orderId}`
          )
        }
        break

      default:
        return NextResponse.json({ error: 'Invalid action. Use: recalculate, force-apply, or force-reverse' }, { status: 400 })
    }

    return NextResponse.json({
      action,
      orderId,
      result,
      message: `Material ${action} completed for order ${orderId}`
    })

  } catch (error) {
    console.error('Error processing material recalculation:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}