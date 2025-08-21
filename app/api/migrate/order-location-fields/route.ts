import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Order, OrderSchema, OrderIndexes } from '@/funcs/collections'

/**
 * POST /api/migrate/order-location-fields - Migrate existing orders to include location fields
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    // Create orders collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Find all orders that don't have the new location fields
    const ordersToUpdate = await orderCollection.model.find({
      $or: [
        { 'deliveryAddress.cityId': { $exists: false } },
        { 'deliveryAddress.location': { $exists: false } },
        { 'deliveryAddress.locationId': { $exists: false } }
      ]
    }).lean()

    console.log(`Found ${ordersToUpdate.length} orders to migrate`)

    let updatedCount = 0
    let errorCount = 0

    // Update each order to include the new fields
    for (const order of ordersToUpdate) {
      try {
        const updateData = {
          'deliveryAddress.cityId': order.deliveryAddress?.cityId || '',
          'deliveryAddress.location': order.deliveryAddress?.location || '',
          'deliveryAddress.locationId': order.deliveryAddress?.locationId || ''
        }

        await orderCollection.model.updateOne(
          { _id: order._id },
          { $set: updateData }
        )

        updatedCount++
      } catch (error) {
        console.error(`Error updating order ${order._id}:`, error)
        errorCount++
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed successfully`,
      stats: {
        totalFound: ordersToUpdate.length,
        updated: updatedCount,
        errors: errorCount
      }
    })

  } catch (error) {
    console.error('Error during migration:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}