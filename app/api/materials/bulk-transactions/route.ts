import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection } from '../../../../funcs/collections'
import { BulkTransaction, BulkTransactionSchema, BulkTransactionIndexes } from '../../../../funcs/collections/bulk-transaction'

/**
 * GET /api/materials/bulk-transactions - Get all bulk transactions
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '25')
    const type = searchParams.get('type') // 'purchase', 'usage', or 'all'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const search = searchParams.get('search')

    const bulkTransactionCollection = await createCollection<BulkTransaction>('bulktransactions', BulkTransactionSchema, {
      indexes: BulkTransactionIndexes
    })

    // Build query
    const query: any = {}

    // Filter by type
    if (type && type !== 'all') {
      query.type = type
    }

    // Filter by date range
    if (startDate || endDate) {
      query.transactionDate = {}
      if (startDate) {
        query.transactionDate.$gte = new Date(startDate)
      }
      if (endDate) {
        query.transactionDate.$lte = new Date(endDate)
      }
    }

    // Search in supplier name, purpose, or notes
    if (search) {
      query.$or = [
        { supplierName: { $regex: search, $options: 'i' } },
        { purpose: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
        { 'items.materialName': { $regex: search, $options: 'i' } }
      ]
    }

    // Get total count
    const total = await bulkTransactionCollection.model.countDocuments(query)

    // Get transactions with pagination
    const transactions = await bulkTransactionCollection.model
      .find(query)
      .sort({ transactionDate: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean()

    // Calculate summary statistics
    const summaryPipeline = [
      { $match: query },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' }
        }
      }
    ]

    const summary = await bulkTransactionCollection.model.aggregate(summaryPipeline)
    
    const summaryData = {
      totalTransactions: total,
      purchaseCount: 0,
      usageCount: 0,
      totalPurchaseAmount: 0,
      totalUsageQuantity: 0
    }

    summary.forEach(item => {
      if (item._id === 'purchase') {
        summaryData.purchaseCount = item.count
        summaryData.totalPurchaseAmount = item.totalAmount
      } else if (item._id === 'usage') {
        summaryData.usageCount = item.count
        summaryData.totalUsageQuantity = item.totalAmount
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: summaryData
      }
    })

  } catch (error) {
    console.error('Error fetching bulk transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch bulk transactions' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/materials/bulk-transactions - Delete a bulk transaction (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const transactionId = searchParams.get('id')

    if (!transactionId) {
      return NextResponse.json(
        { error: 'Transaction ID is required' },
        { status: 400 }
      )
    }

    const bulkTransactionCollection = await createCollection<BulkTransaction>('bulktransactions', BulkTransactionSchema, {
      indexes: BulkTransactionIndexes
    })

    const transaction = await bulkTransactionCollection.model.findById(transactionId)

    if (!transaction) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      )
    }

    await bulkTransactionCollection.model.findByIdAndDelete(transactionId)

    return NextResponse.json({
      success: true,
      message: 'Bulk transaction deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting bulk transaction:', error)
    return NextResponse.json(
      { error: 'Failed to delete bulk transaction' },
      { status: 500 }
    )
  }
}