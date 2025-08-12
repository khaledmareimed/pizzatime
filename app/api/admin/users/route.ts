import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, User, UserSchema, UserIndexes } from '@/funcs/collections'

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
    const search = searchParams.get('search')
    const role = searchParams.get('role')
    const dateRange = searchParams.get('dateRange') || 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const skip = (page - 1) * limit

    // Create users collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Build filter query
    const filter: any = {}
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ]
    }

    if (role && role !== 'all') {
      filter.role = role
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

    // Get users with pagination, sorted by most recent first
    const users = await userCollection.model
      .find(filter)
      .select('-password') // Exclude password field
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const totalCount = await userCollection.model.countDocuments(filter)

    // Get role counts for dashboard stats
    const roleCounts = await userCollection.model.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ])

    const stats = {
      total: totalCount,
      admin: roleCounts.find(r => r._id === 'admin')?.count || 0,
      user: roleCounts.find(r => r._id === 'user')?.count || 0
    }

    return NextResponse.json({
      users,
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
    console.error('Error fetching admin users:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}