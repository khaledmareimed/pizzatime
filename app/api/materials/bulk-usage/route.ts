import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection } from '../../../../funcs/collections'
import { RawMaterial, RawMaterialSchema, RawMaterialIndexes } from '../../../../funcs/collections/material'
import { BulkTransaction, BulkTransactionSchema, BulkTransactionIndexes } from '../../../../funcs/collections/bulk-transaction'

interface BulkUsageItem {
  materialId: string
  quantity: number
}

/**
 * POST /api/materials/bulk-usage - Add bulk usage to multiple materials
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      usageDate,
      purpose,
      notes,
      items
    } = body

    // Validate required fields
    if (!usageDate || !purpose || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Usage date, purpose, and items are required' },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.materialId || !item.quantity) {
        return NextResponse.json(
          { error: 'Each item must have materialId and quantity' },
          { status: 400 }
        )
      }
      if (item.quantity <= 0) {
        return NextResponse.json(
          { error: 'Quantity must be greater than 0' },
          { status: 400 }
        )
      }
    }

    const materialCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema, {
      indexes: RawMaterialIndexes
    })

    const bulkTransactionCollection = await createCollection<BulkTransaction>('bulktransactions', BulkTransactionSchema, {
      indexes: BulkTransactionIndexes
    })

    const results = []
    const errors = []
    const bulkTransactionItems = []

    // First, validate all materials exist and have sufficient stock
    for (const item of items) {
      const material = await materialCollection.model.findById(item.materialId)

      if (!material) {
        errors.push({
          materialId: item.materialId,
          error: 'Material not found'
        })
        continue
      }

      if (item.quantity > material.currentStock) {
        errors.push({
          materialId: item.materialId,
          materialName: material.name,
          error: `Insufficient stock. Requested: ${item.quantity} ${material.unit}, Available: ${material.currentStock} ${material.unit}`
        })
        continue
      }

      bulkTransactionItems.push({
        materialId: item.materialId,
        materialName: material.name,
        quantity: item.quantity,
        unit: material.unit
      })
    }

    // If there are any errors, return them without processing
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        message: 'Some items have insufficient stock or other errors'
      }, { status: 400 })
    }

    // Create the bulk transaction record
    const bulkTransaction = new bulkTransactionCollection.model({
      type: 'usage',
      transactionDate: new Date(usageDate),
      purpose: purpose.trim(),
      notes: notes?.trim() || undefined,
      items: bulkTransactionItems,
      totalAmount: bulkTransactionItems.reduce((sum, item) => sum + item.quantity, 0),
      createdBy: session.user.id || session.user.email
    })

    await bulkTransaction.save()

    // Now update individual materials with stock changes only
    for (const item of items) {
      try {
        const material = await materialCollection.model.findById(item.materialId)

        if (!material) {
          continue // This shouldn't happen as we validated above
        }

        // Update current stock
        material.currentStock -= item.quantity
        
        // Update metadata
        material.updatedBy = session.user.id || session.user.email
        material.updatedAt = new Date()
        
        await material.save()

        results.push({
          materialId: item.materialId,
          materialName: material.name,
          quantity: item.quantity,
          newStock: material.currentStock,
          isLowStock: material.currentStock <= material.minimumStock
        })

      } catch (error) {
        console.error(`Error updating material ${item.materialId}:`, error)
        errors.push({
          materialId: item.materialId,
          error: 'Failed to update material stock'
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        bulkTransactionId: bulkTransaction._id,
        processed: results,
        errors,
        summary: {
          totalItems: items.length,
          successCount: results.length,
          errorCount: errors.length,
          totalQuantityUsed: results.reduce((sum, item) => sum + item.quantity, 0),
          lowStockWarnings: results.filter(item => item.isLowStock).length
        }
      },
      message: `Bulk usage completed. ${results.length} items processed successfully. Transaction ID: ${bulkTransaction._id}`
    })

  } catch (error) {
    console.error('Error processing bulk usage:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk usage' },
      { status: 500 }
    )
  }
}