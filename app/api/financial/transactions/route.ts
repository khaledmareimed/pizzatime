import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Financial, FinancialSchema, FinancialIndexes, SystemLog, SystemLogSchema, SystemLogIndexes } from '@/funcs/collections'
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

    const body = await request.json()
    const {
      type,
      category,
      amount,
      description,
      paymentMethod,
      notes,
      referenceNumber,
      invoiceNumber
    } = body

    // Validate required fields
    if (!type || !category || !amount || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: type, category, amount, description' 
      }, { status: 400 })
    }

    // Create financial transaction
    const transaction = await createFinancialTransaction({
      type,
      category,
      amount: parseFloat(amount),
      description,
      paymentMethod,
      notes,
      metadata: {
        createdBy: session.user.id,
        createdByEmail: session.user.email,
        referenceNumber,
        invoiceNumber
      }
    })

    if (!transaction) {
      return NextResponse.json({ 
        error: 'Failed to create transaction' 
      }, { status: 500 })
    }

    // Create system log
    try {
      const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
        indexes: SystemLogIndexes
      })

      const logEntry = new systemLogCollection.model({
        userId: session.user.id,
        action: type === 'revenue' ? 'admin_income_added' : 'admin_expense_added',
        description: `تم إضافة ${type === 'revenue' ? 'دخل' : 'مصروف'} جديد: ${description} - ${amount} د.أ`,
        metadata: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          transactionId: transaction.transactionId,
          type,
          category,
          amount
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
      transaction
    })

  } catch (error) {
    console.error('Error creating financial transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

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
    const type = searchParams.get('type')
    const category = searchParams.get('category')
    const dateRange = searchParams.get('dateRange') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const skip = (page - 1) * limit

    // Create financial collection
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Build date filter
    const dateFilter: any = {}
    const now = new Date()
    
    if (startDate && endDate) {
      dateFilter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    } else {
      switch (dateRange) {
        case 'today':
          const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
          dateFilter.transactionDate = { $gte: todayStart, $lte: todayEnd }
          break
        case 'week':
          const weekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7)
          dateFilter.transactionDate = { $gte: weekStart, $lte: now }
          break
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter.transactionDate = { $gte: monthStart, $lte: now }
          break
      }
    }

    // Build filter
    const filter: any = { ...dateFilter }
    if (type && type !== 'all') {
      filter.type = type
    }
    if (category && category !== 'all') {
      filter.category = category
    }

    // Get transactions
    const transactions = await financialCollection.model
      .find(filter)
      .sort({ transactionDate: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    const totalCount = await financialCollection.model.countDocuments(filter)

    return NextResponse.json({
      transactions,
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
    console.error('Error fetching financial transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}