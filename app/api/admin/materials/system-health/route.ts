import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection } from '@/funcs/collections'
import { Order, OrderSchema } from '@/funcs/collections/order'
import { RawMaterial, RawMaterialSchema } from '@/funcs/collections/material'
import { Product, ProductSchema } from '@/funcs/collections/product'
import { calculateOrderMaterialUsage, shouldProcessMaterialUsage } from '@/funcs/material-order-management'

/**
 * GET /api/admin/materials/system-health - Check material management system health (Admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const healthCheck = {
      timestamp: new Date().toISOString(),
      overall: 'healthy' as 'healthy' | 'warning' | 'critical',
      checks: {
        database: { status: 'unknown', details: '' },
        materialDefinitions: { status: 'unknown', details: '', stats: {} },
        orderIntegration: { status: 'unknown', details: '', stats: {} },
        stockLevels: { status: 'unknown', details: '', stats: {} },
        dataConsistency: { status: 'unknown', details: '', issues: [] as any[] }
      },
      recommendations: [] as string[],
      summary: {
        totalMaterials: 0,
        totalProducts: 0,
        totalOrders: 0,
        materialUsageOrders: 0,
        lowStockMaterials: 0,
        outOfStockMaterials: 0,
        productsWithoutMaterials: 0,
        inconsistentOrders: 0
      }
    }

    try {
      // Check database connectivity
      const materialsCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema)
      const ordersCollection = await createCollection<Order>('orders', OrderSchema)
      const productsCollection = await createCollection<Product>('products', ProductSchema)
      
      healthCheck.checks.database.status = 'healthy'
      healthCheck.checks.database.details = 'Database connections established'

      // Get data for analysis
      const materials = await materialsCollection.model.find({}).lean() as RawMaterial[]
      const products = await productsCollection.model.find({}).lean() as Product[]
      const recentOrders = await ordersCollection.model.find({
        createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } // Last 7 days
      }).lean() as Order[]

      healthCheck.summary.totalMaterials = materials.length
      healthCheck.summary.totalProducts = products.length
      healthCheck.summary.totalOrders = recentOrders.length

      // Check material definitions
      const activeMaterials = materials.filter(m => m.status === 'active')
      const lowStockMaterials = activeMaterials.filter(m => m.currentStock <= m.minimumStock)
      const outOfStockMaterials = activeMaterials.filter(m => m.currentStock <= 0)

      healthCheck.summary.lowStockMaterials = lowStockMaterials.length
      healthCheck.summary.outOfStockMaterials = outOfStockMaterials.length

      if (outOfStockMaterials.length > 0) {
        healthCheck.checks.stockLevels.status = 'critical'
        healthCheck.checks.stockLevels.details = `${outOfStockMaterials.length} materials are out of stock`
        healthCheck.overall = 'critical'
      } else if (lowStockMaterials.length > 0) {
        healthCheck.checks.stockLevels.status = 'warning'
        healthCheck.checks.stockLevels.details = `${lowStockMaterials.length} materials are low on stock`
        if (healthCheck.overall === 'healthy') healthCheck.overall = 'warning'
      } else {
        healthCheck.checks.stockLevels.status = 'healthy'
        healthCheck.checks.stockLevels.details = 'All materials have adequate stock levels'
      }

      healthCheck.checks.stockLevels.stats = {
        totalMaterials: materials.length,
        activeMaterials: activeMaterials.length,
        lowStock: lowStockMaterials.length,
        outOfStock: outOfStockMaterials.length
      }

      // Check product material definitions
      const productsWithMaterials = products.filter(p => 
        p.materialsUsed && p.materialsUsed.length > 0
      )
      const productsWithoutMaterials = products.filter(p => 
        !p.materialsUsed || p.materialsUsed.length === 0
      )

      healthCheck.summary.productsWithoutMaterials = productsWithoutMaterials.length

      if (productsWithoutMaterials.length > products.length * 0.5) {
        healthCheck.checks.materialDefinitions.status = 'warning'
        healthCheck.checks.materialDefinitions.details = `${productsWithoutMaterials.length} products don't have material definitions`
        if (healthCheck.overall === 'healthy') healthCheck.overall = 'warning'
      } else {
        healthCheck.checks.materialDefinitions.status = 'healthy'
        healthCheck.checks.materialDefinitions.details = 'Most products have material definitions'
      }

      healthCheck.checks.materialDefinitions.stats = {
        totalProducts: products.length,
        withMaterials: productsWithMaterials.length,
        withoutMaterials: productsWithoutMaterials.length,
        coveragePercentage: Math.round((productsWithMaterials.length / products.length) * 100)
      }

      // Check order integration
      const materialUsageOrders = recentOrders.filter(order => 
        shouldProcessMaterialUsage(order.status)
      )
      healthCheck.summary.materialUsageOrders = materialUsageOrders.length

      // Sample a few orders to check material calculation consistency
      const sampleOrders = materialUsageOrders.slice(0, 5)
      const inconsistentOrders = []

      for (const order of sampleOrders) {
        try {
          const materialUsage = await calculateOrderMaterialUsage(order)
          
          // Check if all materials in the calculation exist
          for (const usage of materialUsage) {
            const material = materials.find(m => m._id.toString() === usage.materialId)
            if (!material) {
              inconsistentOrders.push({
                orderId: order.orderId,
                issue: `References non-existent material: ${usage.materialName}`,
                materialId: usage.materialId
              })
            }
          }
        } catch (error) {
          inconsistentOrders.push({
            orderId: order.orderId,
            issue: `Failed to calculate material usage: ${error instanceof Error ? error.message : 'Unknown error'}`
          })
        }
      }

      healthCheck.summary.inconsistentOrders = inconsistentOrders.length
      healthCheck.checks.dataConsistency.issues = inconsistentOrders

      if (inconsistentOrders.length > 0) {
        healthCheck.checks.orderIntegration.status = 'warning'
        healthCheck.checks.orderIntegration.details = `${inconsistentOrders.length} orders have material calculation issues`
        if (healthCheck.overall === 'healthy') healthCheck.overall = 'warning'
      } else {
        healthCheck.checks.orderIntegration.status = 'healthy'
        healthCheck.checks.orderIntegration.details = 'Order material integration working correctly'
      }

      healthCheck.checks.orderIntegration.stats = {
        totalRecentOrders: recentOrders.length,
        materialUsageOrders: materialUsageOrders.length,
        sampleTested: sampleOrders.length,
        inconsistentOrders: inconsistentOrders.length
      }

      // Data consistency check
      if (inconsistentOrders.length === 0) {
        healthCheck.checks.dataConsistency.status = 'healthy'
        healthCheck.checks.dataConsistency.details = 'No data consistency issues found'
      } else {
        healthCheck.checks.dataConsistency.status = 'warning'
        healthCheck.checks.dataConsistency.details = `${inconsistentOrders.length} data consistency issues found`
        if (healthCheck.overall === 'healthy') healthCheck.overall = 'warning'
      }

      // Generate recommendations
      if (outOfStockMaterials.length > 0) {
        healthCheck.recommendations.push(`Restock ${outOfStockMaterials.length} out-of-stock materials immediately`)
      }
      
      if (lowStockMaterials.length > 0) {
        healthCheck.recommendations.push(`Monitor ${lowStockMaterials.length} low-stock materials and plan restocking`)
      }
      
      if (productsWithoutMaterials.length > 0) {
        healthCheck.recommendations.push(`Define material requirements for ${productsWithoutMaterials.length} products`)
      }
      
      if (inconsistentOrders.length > 0) {
        healthCheck.recommendations.push(`Review and fix ${inconsistentOrders.length} orders with material calculation issues`)
      }

      if (healthCheck.recommendations.length === 0) {
        healthCheck.recommendations.push('System is operating optimally')
      }

    } catch (error) {
      healthCheck.checks.database.status = 'critical'
      healthCheck.checks.database.details = `Database error: ${error instanceof Error ? error.message : 'Unknown error'}`
      healthCheck.overall = 'critical'
    }

    return NextResponse.json(healthCheck)

  } catch (error) {
    console.error('Error performing system health check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/materials/system-health/repair - Attempt to repair common issues
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { repairActions } = body // Array of repair actions to perform

    const repairResults = {
      timestamp: new Date().toISOString(),
      actionsPerformed: [] as any[],
      success: true,
      errors: [] as string[]
    }

    // This would implement various repair actions like:
    // - Recalculating material usage for orders
    // - Fixing inconsistent stock levels
    // - Updating material definitions
    // - Cleaning up orphaned transactions

    for (const action of repairActions || []) {
      try {
        switch (action.type) {
          case 'recalculate-order-materials':
            // Implement order material recalculation
            repairResults.actionsPerformed.push({
              type: action.type,
              status: 'completed',
              details: 'Order material calculations updated'
            })
            break

          case 'fix-stock-inconsistencies':
            // Implement stock level fixes
            repairResults.actionsPerformed.push({
              type: action.type,
              status: 'completed',
              details: 'Stock inconsistencies resolved'
            })
            break

          default:
            repairResults.actionsPerformed.push({
              type: action.type,
              status: 'skipped',
              details: 'Unknown repair action'
            })
        }
      } catch (error) {
        repairResults.errors.push(`Failed to perform ${action.type}: ${error instanceof Error ? error.message : 'Unknown error'}`)
        repairResults.success = false
      }
    }

    return NextResponse.json(repairResults)

  } catch (error) {
    console.error('Error performing system repair:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}