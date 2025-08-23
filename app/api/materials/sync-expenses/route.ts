import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Financial, FinancialSchema, FinancialIndexes, FinancialHelpers } from '@/funcs/collections'
import { RawMaterial, RawMaterialSchema, RawMaterialIndexes } from '@/funcs/collections/material'

/**
 * Material Expenses Sync API
 * Syncs material purchases with the financial system as expenses
 * This ensures material costs are properly tracked in financial reports
 */

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { materialId, purchaseData } = body

    // Validate required fields
    if (!materialId || !purchaseData) {
      return NextResponse.json({ 
        error: 'Missing required fields: materialId, purchaseData' 
      }, { status: 400 })
    }

    // Create collections
    const [materialCollection, financialCollection] = await Promise.all([
      createCollection<RawMaterial>('materials', RawMaterialSchema, { indexes: RawMaterialIndexes }),
      createCollection<Financial>('financial', FinancialSchema, { indexes: FinancialIndexes })
    ])

    // Get material details
    const material = await materialCollection.model.findById(materialId)
    if (!material) {
      return NextResponse.json({ error: 'Material not found' }, { status: 404 })
    }

    // Create financial expense record for material purchase
    const expenseTransaction = new financialCollection.model({
      transactionId: FinancialHelpers.generateTransactionId(),
      type: 'expense',
      category: 'materials', // Special category for material purchases
      amount: purchaseData.totalCost,
      description: `شراء مواد خام - ${material.name}`,
      paymentMethod: 'cash', // Default, can be updated
      notes: `كمية: ${purchaseData.quantity} ${material.unit} - سعر الوحدة: ${purchaseData.unitPrice}`,
      invoiceNumber: purchaseData.invoiceNumber,
      invoiceImage: purchaseData.invoiceImage,
      transactionDate: new Date(purchaseData.purchaseDate),
      isVerified: true,
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
      metadata: {
        materialId: materialId,
        materialName: material.name,
        quantity: purchaseData.quantity,
        unitPrice: purchaseData.unitPrice,
        supplierId: purchaseData.supplierId,
        supplierName: purchaseData.supplierName,
        expenseType: 'material_purchase',
        createdBy: session.user.id,
        createdByName: session.user.name || session.user.email
      }
    })

    const savedExpense = await expenseTransaction.save()

    return NextResponse.json({
      success: true,
      expense: savedExpense.toObject(),
      message: 'Material purchase synced with financial system'
    })

  } catch (error) {
    console.error('Error syncing material expense:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const materialId = searchParams.get('materialId')

    // Create financial collection
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    // Build filter for material expenses
    const filter: any = {
      type: 'expense',
      category: 'materials'
    }

    if (materialId) {
      filter['metadata.materialId'] = materialId
    }

    if (startDate && endDate) {
      filter.transactionDate = {
        $gte: new Date(startDate),
        $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
      }
    }

    // Get material expenses
    const materialExpenses = await financialCollection.model
      .find(filter)
      .sort({ transactionDate: -1 })
      .lean()

    // Get summary statistics
    const summary = await financialCollection.model.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalAmount: { $sum: '$amount' },
          totalTransactions: { $sum: 1 },
          averageAmount: { $avg: '$amount' }
        }
      }
    ])

    // Get expenses by material
    const expensesByMaterial = await financialCollection.model.aggregate([
      { $match: filter },
      {
        $group: {
          _id: '$metadata.materialId',
          materialName: { $first: '$metadata.materialName' },
          totalAmount: { $sum: '$amount' },
          totalQuantity: { $sum: '$metadata.quantity' },
          transactionCount: { $sum: 1 },
          averageUnitPrice: { $avg: '$metadata.unitPrice' },
          lastPurchase: { $max: '$transactionDate' }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])

    // Get monthly trends
    const monthlyTrends = await financialCollection.model.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' }
          },
          totalAmount: { $sum: '$amount' },
          transactionCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 12 }
    ])

    return NextResponse.json({
      success: true,
      materialExpenses,
      summary: summary[0] || { totalAmount: 0, totalTransactions: 0, averageAmount: 0 },
      expensesByMaterial,
      monthlyTrends
    })

  } catch (error) {
    console.error('Error fetching material expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * Bulk sync all material purchases with financial system
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create collections
    const [materialCollection, financialCollection] = await Promise.all([
      createCollection<RawMaterial>('materials', RawMaterialSchema, { indexes: RawMaterialIndexes }),
      createCollection<Financial>('financial', FinancialSchema, { indexes: FinancialIndexes })
    ])

    // Get all materials with purchases
    const materials = await materialCollection.model.find({
      'purchases.0': { $exists: true }
    }).lean()

    let syncedCount = 0
    const errors: string[] = []

    for (const material of materials) {
      try {
        for (const purchase of material.purchases) {
          // Check if this purchase is already synced
          const existingExpense = await financialCollection.model.findOne({
            'metadata.materialId': material._id.toString(),
            'metadata.purchaseId': purchase._id?.toString(),
            type: 'expense',
            category: 'materials'
          })

          if (!existingExpense) {
            // Create expense record
            const expenseTransaction = new financialCollection.model({
              transactionId: FinancialHelpers.generateTransactionId(),
              type: 'expense',
              category: 'materials',
              amount: purchase.totalCost,
              description: `شراء مواد خام - ${material.name}`,
              paymentMethod: 'cash',
              notes: `كمية: ${purchase.quantity} ${material.unit} - سعر الوحدة: ${purchase.unitPrice}`,
              invoiceNumber: purchase.invoiceNumber,
              invoiceImage: purchase.invoiceImage,
              transactionDate: new Date(purchase.purchaseDate),
              isVerified: true,
              verifiedBy: session.user.id,
              verifiedAt: new Date(),
              metadata: {
                materialId: material._id.toString(),
                materialName: material.name,
                purchaseId: purchase._id?.toString(),
                quantity: purchase.quantity,
                unitPrice: purchase.unitPrice,
                supplierId: purchase.supplierId,
                supplierName: purchase.supplierName,
                expenseType: 'material_purchase',
                createdBy: session.user.id,
                createdByName: session.user.name || session.user.email,
                syncedAt: new Date()
              }
            })

            await expenseTransaction.save()
            syncedCount++
          }
        }
      } catch (error) {
        console.error(`Error syncing material ${material.name}:`, error)
        errors.push(`Failed to sync ${material.name}: ${error}`)
      }
    }

    return NextResponse.json({
      success: true,
      syncedCount,
      totalMaterials: materials.length,
      errors: errors.length > 0 ? errors : undefined,
      message: `Successfully synced ${syncedCount} material purchases with financial system`
    })

  } catch (error) {
    console.error('Error bulk syncing material expenses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}