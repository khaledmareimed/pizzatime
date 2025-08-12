import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Financial, FinancialSchema, FinancialIndexes, FinancialHelpers, Order, OrderSchema, OrderIndexes } from '@/funcs/collections'

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
    const dateRange = searchParams.get('dateRange') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const type = searchParams.get('type')
    const category = searchParams.get('category')

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
        case 'quarter':
          const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          dateFilter.transactionDate = { $gte: quarterStart, $lte: now }
          break
        case 'year':
          const yearStart = new Date(now.getFullYear(), 0, 1)
          dateFilter.transactionDate = { $gte: yearStart, $lte: now }
          break
      }
    }

    // Build additional filters
    const filter: any = { ...dateFilter }
    if (type) filter.type = type
    if (category) filter.category = category

    // Get financial transactions
    const transactions = await financialCollection.model
      .find(filter)
      .sort({ transactionDate: -1 })
      .lean()

    // Calculate financial metrics
    const revenue = FinancialHelpers.calculateNetRevenue(transactions)
    const expenses = FinancialHelpers.calculateTotalExpenses(transactions)
    const profit = revenue - expenses
    const taxes = FinancialHelpers.calculateTaxes(transactions)
    const refunds = FinancialHelpers.calculateRefunds(transactions)
    const discounts = FinancialHelpers.calculateDiscounts(transactions)

    // Calculate revenue by category
    const revenueByCategory = transactions
      .filter(t => t.type === 'revenue')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    // Calculate expenses by category
    const expensesByCategory = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

    // Calculate daily revenue for charts (last 30 days)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const dailyRevenueData = await financialCollection.model.aggregate([
      {
        $match: {
          type: 'revenue',
          transactionDate: { $gte: thirtyDaysAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            day: { $dayOfMonth: '$transactionDate' }
          },
          totalRevenue: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 }
      }
    ])

    // Calculate monthly trends (last 12 months)
    const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
    const monthlyTrends = await financialCollection.model.aggregate([
      {
        $match: {
          transactionDate: { $gte: twelveMonthsAgo, $lte: now }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 }
      }
    ])

    // Calculate payment method distribution
    const paymentMethodStats = await financialCollection.model.aggregate([
      {
        $match: {
          ...filter,
          type: 'revenue',
          paymentMethod: { $exists: true }
        }
      },
      {
        $group: {
          _id: '$paymentMethod',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ])

    // Get top performing categories
    const topCategories = Object.entries(revenueByCategory)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([category, amount]) => ({ category, amount }))

    // Calculate growth rates (compare with previous period)
    const previousPeriodFilter = { ...filter }
    if (dateRange === 'month') {
      const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
      previousPeriodFilter.transactionDate = { $gte: prevMonthStart, $lte: prevMonthEnd }
    }

    const previousTransactions = await financialCollection.model
      .find(previousPeriodFilter)
      .lean()

    const previousRevenue = FinancialHelpers.calculateNetRevenue(previousTransactions)
    const previousExpenses = FinancialHelpers.calculateTotalExpenses(previousTransactions)
    const previousProfit = previousRevenue - previousExpenses

    const revenueGrowth = previousRevenue > 0 ? ((revenue - previousRevenue) / previousRevenue) * 100 : 0
    const expenseGrowth = previousExpenses > 0 ? ((expenses - previousExpenses) / previousExpenses) * 100 : 0
    const profitGrowth = previousProfit > 0 ? ((profit - previousProfit) / previousProfit) * 100 : 0

    return NextResponse.json({
      summary: {
        revenue,
        expenses,
        profit,
        taxes,
        refunds,
        discounts,
        netProfit: profit - taxes,
        profitMargin: revenue > 0 ? (profit / revenue) * 100 : 0,
        transactionCount: transactions.length
      },
      growth: {
        revenue: revenueGrowth,
        expenses: expenseGrowth,
        profit: profitGrowth
      },
      breakdown: {
        revenueByCategory,
        expensesByCategory,
        topCategories,
        paymentMethodStats
      },
      charts: {
        dailyRevenue: dailyRevenueData,
        monthlyTrends
      },
      transactions: transactions.slice(0, 50) // Latest 50 transactions
    })

  } catch (error) {
    console.error('Error fetching financial data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
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
    const {
      type,
      category,
      amount,
      description,
      paymentMethod,
      notes,
      orderId,
      userId
    } = body

    // Create financial collection
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Create new financial transaction
    const transaction = new financialCollection.model({
      transactionId: FinancialHelpers.generateTransactionId(),
      type,
      category,
      amount,
      description,
      paymentMethod,
      notes,
      orderId,
      userId,
      transactionDate: new Date(),
      isVerified: true,
      verifiedBy: session.user.id,
      verifiedAt: new Date()
    })

    const savedTransaction = await transaction.save()

    return NextResponse.json({
      success: true,
      transaction: savedTransaction.toObject()
    })

  } catch (error) {
    console.error('Error creating financial transaction:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}