import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection } from '../../../../funcs/collections'
import { RawMaterial, RawMaterialSchema, RawMaterialIndexes } from '../../../../funcs/collections/material'
import { BulkTransaction, BulkTransactionSchema, BulkTransactionIndexes } from '../../../../funcs/collections/bulk-transaction'
import { uploadToImgBB } from '../../../../funcs/imgbb'

interface BulkPurchaseItem {
  materialId: string
  quantity: number
  unitPrice: number
}

/**
 * POST /api/materials/bulk-purchase - Add bulk purchases to multiple materials
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

    const formData = await request.formData()
    
    // Extract bulk purchase data
    const supplierName = formData.get('supplierName') as string
    const supplierId = formData.get('supplierId') as string
    const purchaseDate = formData.get('purchaseDate') as string
    const invoiceNumber = formData.get('invoiceNumber') as string
    const notes = formData.get('notes') as string
    const invoiceImage = formData.get('invoiceImage') as File
    const itemsJson = formData.get('items') as string

    // Parse items
    let items: BulkPurchaseItem[]
    try {
      items = JSON.parse(itemsJson)
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid items format' },
        { status: 400 }
      )
    }

    // Validate required fields
    if (!supplierName || !purchaseDate || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier name, purchase date, and items are required' },
        { status: 400 }
      )
    }

    // Validate each item
    for (const item of items) {
      if (!item.materialId || !item.quantity || !item.unitPrice) {
        return NextResponse.json(
          { error: 'Each item must have materialId, quantity, and unitPrice' },
          { status: 400 }
        )
      }
      if (item.quantity <= 0 || item.unitPrice <= 0) {
        return NextResponse.json(
          { error: 'Quantity and unit price must be greater than 0' },
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

    // Handle invoice image upload if provided
    let invoiceImageUrl = ''
    if (invoiceImage && invoiceImage.size > 0) {
      try {
        console.log('📸 Uploading bulk purchase invoice image to ImgBB...')
        
        const uploadResult = await uploadToImgBB(invoiceImage)
        
        if (uploadResult.success && uploadResult.url) {
          invoiceImageUrl = uploadResult.url
          console.log('✅ Bulk invoice image uploaded successfully:', invoiceImageUrl)
        } else {
          console.warn('⚠️ Failed to upload bulk invoice image:', uploadResult.error)
        }
      } catch (uploadError) {
        console.error('❌ Error uploading bulk invoice image:', uploadError)
      }
    }

    const results = []
    const errors = []
    const bulkTransactionItems = []

    // First, validate all materials exist and prepare bulk transaction items
    for (const item of items) {
      const material = await materialCollection.model.findById(item.materialId)

      if (!material) {
        errors.push({
          materialId: item.materialId,
          error: 'Material not found'
        })
        continue
      }

      const totalCost = item.quantity * item.unitPrice

      bulkTransactionItems.push({
        materialId: item.materialId,
        materialName: material.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalCost,
        unit: material.unit
      })
    }

    // If there are errors, return them without processing
    if (errors.length > 0) {
      return NextResponse.json({
        success: false,
        errors,
        message: 'Some materials were not found'
      }, { status: 400 })
    }

    // Create the bulk transaction record
    const bulkTransaction = new bulkTransactionCollection.model({
      type: 'purchase',
      transactionDate: new Date(purchaseDate),
      supplierName: supplierName.trim(),
      supplierId: supplierId || undefined,
      invoiceNumber: invoiceNumber?.trim() || undefined,
      invoiceImage: invoiceImageUrl || undefined,
      notes: notes?.trim() || undefined,
      items: bulkTransactionItems,
      totalAmount: bulkTransactionItems.reduce((sum, item) => sum + item.totalCost, 0),
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
        material.currentStock += item.quantity
        
        // Update last purchase info
        material.lastPurchasePrice = item.unitPrice
        material.lastPurchaseDate = new Date(purchaseDate)
        
        // Update metadata
        material.updatedBy = session.user.id || session.user.email
        material.updatedAt = new Date()
        
        await material.save()

        results.push({
          materialId: item.materialId,
          materialName: material.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalCost: item.quantity * item.unitPrice,
          newStock: material.currentStock
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
          totalCost: results.reduce((sum, item) => sum + item.totalCost, 0)
        }
      },
      message: `Bulk purchase completed. ${results.length} items processed successfully. Transaction ID: ${bulkTransaction._id}`
    })

  } catch (error) {
    console.error('Error processing bulk purchase:', error)
    return NextResponse.json(
      { error: 'Failed to process bulk purchase' },
      { status: 500 }
    )
  }
}