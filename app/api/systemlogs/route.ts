import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, SystemLog, SystemLogSchema, SystemLogIndexes } from '@/funcs/collections'

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
    const dateRange = searchParams.get('dateRange') || 'today'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const skip = (page - 1) * limit

    // Create system logs collection
    const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
      indexes: SystemLogIndexes
    })

    // Build date filter
    const dateFilter: any = {}
    const now = new Date()
    
    if (startDate && endDate) {
      // Custom date range
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    } else {
      // Predefined date ranges
      switch (dateRange) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
          dateFilter.createdAt = { $gte: todayStart, $lte: todayEnd }
          break
        case 'yesterday':
          const yesterdayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1)
          const yesterdayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999)
          dateFilter.createdAt = { $gte: yesterdayStart, $lte: yesterdayEnd }
          break
        case 'week':
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          dateFilter.createdAt = { $gte: weekStart, $lte: now }
          break
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter.createdAt = { $gte: monthStart, $lte: now }
          break
        case 'all':
        default:
          // No date filter
          break
      }
    }

    // Get system logs with pagination, sorted by most recent first
    const logs = await systemLogCollection.model
      .find(dateFilter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get total count for pagination
    const totalCount = await systemLogCollection.model.countDocuments(dateFilter)

    return NextResponse.json({
      logs,
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
    console.error('Error fetching system logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}