import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Financial, FinancialSchema, FinancialIndexes, FinancialHelpers } from '@/funcs/collections'

/**
 * Expense Management API
 * Handles operational expenses like rent, utilities, salaries, etc.
 * Material purchases are handled separately in the materials system
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const skip = (page - 1) * limit

    // Create financial collection
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Build filter for expenses only
    const filter: any = { 
      type: 'expense'
    }

    if (category) {
      filter.category = category
    }

    if (startDate && endDate) {
      filter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    }

    // Get expenses with pagination
    const [expenses, totalCount] = await Promise.all([
      financialCollection.model
        .find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      financialCollection.model.countDocuments(filter)
    ])

    // Get expense summary by category
    const expenseSummary = await financialCollection.model.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      },
      { $sort: { total: -1 } }
    ])

    // Get monthly expense trends
    const monthlyTrends = await financialCollection.model.aggregate([
      { $match: { type: 'expense' } },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ])

    return NextResponse.json({
      success: true,
      expenses,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      },
      summary: {
        totalExpenses: expenseSummary.reduce((sum, item) => sum + item.total, 0),
        categoryBreakdown: expenseSummary,
        monthlyTrends
      }
    })

  } catch (error) {
    console.error('Error fetching expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      category,
      amount,
      description,
      paymentMethod = 'cash',
      notes,
      invoiceNumber,
      invoiceImage,
      dueDate,
      isRecurring = false,
      recurringPeriod,
      tags
    } = body

    // Validate required fields
    if (!category || !amount || !description) {
      return NextResponse.json({ 
        error: 'Missing required fields: category, amount, description' 
      }, { status: 400 })
    }

    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be greater than 0' 
      }, { status: 400 })
    }

    // Create financial collection
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Create expense transaction
    const expense = new financialCollection.model({
      transactionId: FinancialHelpers.generateTransactionId(),
      type: 'expense',
      category,
      amount: Number(amount),
      description,
      paymentMethod,
      notes,
      invoiceNumber,
      invoiceImage,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      isRecurring,
      recurringPeriod,
      tags: tags || [],
      transactionDate: new Date(),
      isVerified: true,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      metadata: {
        createdBy: session.user.id,
        createdByName: session.user.name || session.user.email,
        expenseType: 'operational'
      }
    })

    const savedExpense = await expense.save()

    return NextResponse.json({
      success: true,
      expense: savedExpense.toObject()
    })

  } catch (error) {
    console.error('Error creating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { expenseId, ...updateData } = body

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Create financial collection
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Update expense
    const updatedExpense = await financialCollection.model.findByIdAndUpdate(
      expenseId,
      {
        ...updateData,
        updatedAt: new Date(),
        'metadata.updatedBy': session.user.id,
        'metadata.updatedByName': session.user.name || session.user.email
      },
      { new: true }
    )

    if (!updatedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      expense: updatedExpense.toObject()
    })

  } catch (error) {
    console.error('Error updating expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const expenseId = searchParams.get('id')

    if (!expenseId) {
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    // Create financial collection
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Delete expense
    const deletedExpense = await financialCollection.model.findByIdAndDelete(expenseId)

    if (!deletedExpense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}