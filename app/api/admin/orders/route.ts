import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Order, OrderSchema, OrderIndexes } from '@/funcs/collections'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const page = parseInt(searchParams.get('page') || '1')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const dateRange = searchParams.get('dateRange') || 'today'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const skip = (page - 1) * limit

    // Create orders collection
    const orderCollection = await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    // Build filter query
    const filter: any = {}
    
    if (status && status !== 'all') {
      filter.status = status
    }
    
    if (search) {
      filter.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'deliveryAddress.recipientName': { $regex: search, $options: 'i' } },
        { 'deliveryAddress.phone': { $regex: search, $options: 'i' } },
        { userId: { $regex: search, $options: 'i' } }
      ]
    }

    // Build date filter
    const now = new Date()
    
    if (startDate && endDate) {
      // Custom date range
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    } else {
      // Predefined date ranges
      switch (dateRange) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
          filter.createdAt = { $gte: todayStart, $lte: todayEnd }
          break
        case 'yesterday':
          const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
          filter.createdAt = { $gte: yesterdayStart, $lte: yesterdayEnd }
          break
        case 'week':
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          filter.createdAt = { $gte: weekStart, $lte: now }
          break
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          filter.createdAt = { $gte: monthStart, $lte: now }
          break
        case 'all':
        default:
          // No date filter for 'all'
          break
      }
    }

    // Get orders with pagination, sorted by most recent first
    const orders = await orderCollection.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const totalCount = await orderCollection.model.countDocuments(filter)

    // Get status counts for dashboard stats
    const statusCounts = await orderCollection.model.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ])

    const stats = {
      total: totalCount,
      pending: statusCounts.find(s => s._id === 'pending')?.count || 0,
      confirmed: statusCounts.find(s => s._id === 'confirmed')?.count || 0,
      preparing: statusCounts.find(s => s._id === 'preparing')?.count || 0,
      ready: statusCounts.find(s => s._id === 'ready')?.count || 0,
      delivered: statusCounts.find(s => s._id === 'delivered')?.count || 0,
      cancelled: statusCounts.find(s => s._id === 'cancelled')?.count || 0
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
    console.error('Error fetching admin orders:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}