import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection } from '@/funcs/collections'
import { Order, OrderSchema } from '@/funcs/collections/order'
import { RawMaterial, RawMaterialSchema } from '@/funcs/collections/material'

/**
 * GET /api/admin/materials/usage-analytics - Get comprehensive material usage analytics (Admin only)
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

    // Get query parameters
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')
    const materialId = searchParams.get('materialId')

    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Get collections
    const ordersCollection = await createCollection<Order>('orders', OrderSchema)
    const materialsCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema)

    // Get orders in the specified date range with material-using statuses
    const materialUsingStatuses = ['ready', 'out-for-delivery', 'delivered']
    const ordersQuery: any = {
      createdAt: { $gte: startDate, $lte: endDate },
      status: { $in: materialUsingStatuses }
    }

    const orders = await ordersCollection.model.find(ordersQuery).lean() as Order[]

    // Get all materials
    const materialsQuery = materialId ? { _id: materialId } : {}
    const materials = await materialsCollection.model.find(materialsQuery).lean() as RawMaterial[]

    // Calculate material usage analytics
    const analytics = {
      summary: {
        totalOrders: orders.length,
        dateRange: { startDate, endDate, days },
        materialsTracked: materials.length,
        totalMaterialTypes: 0,
        totalUsageTransactions: 0
      },
      materialUsage: [] as any[],
      orderAnalytics: {
        byStatus: {} as any,
        byDate: {} as any,
        topMaterialConsumers: [] as any[]
      },
      stockAlerts: {
        lowStock: [] as any[],
        outOfStock: [] as any[],
        overStock: [] as any[]
      }
    }

    // Process each material
    for (const material of materials) {
      const materialAnalysis = {
        materialId: material._id,
        materialName: material.name,
        category: material.category,
        unit: material.unit,
        currentStock: material.currentStock,
        minimumStock: material.minimumStock,
        maximumStock: material.maximumStock,
        averageCost: material.averageCost,
        usage: {
          totalUsed: 0,
          transactionCount: 0,
          orderCount: 0,
          averagePerOrder: 0,
          peakUsageDay: null as any,
          usageByDate: {} as any,
          usageByPurpose: {} as any
        },
        stockStatus: 'normal' as 'low' | 'out' | 'over' | 'normal',
        projectedDaysUntilEmpty: null as number | null
      }

      // Analyze usage transactions in the date range
      const relevantUsages = material.usages.filter(usage => 
        usage.createdAt >= startDate && 
        usage.createdAt <= endDate &&
        usage.quantity > 0 // Only count actual usage (not reversals)
      )

      materialAnalysis.usage.transactionCount = relevantUsages.length
      materialAnalysis.usage.totalUsed = relevantUsages.reduce((sum, usage) => sum + usage.quantity, 0)

      // Group usage by date
      relevantUsages.forEach(usage => {
        const dateKey = usage.createdAt.toISOString().split('T')[0]
        materialAnalysis.usage.usageByDate[dateKey] = 
          (materialAnalysis.usage.usageByDate[dateKey] || 0) + usage.quantity

        // Group by purpose
        materialAnalysis.usage.usageByPurpose[usage.purpose] = 
          (materialAnalysis.usage.usageByPurpose[usage.purpose] || 0) + usage.quantity
      })

      // Find peak usage day
      const usageByDate = materialAnalysis.usage.usageByDate
      const peakDay = Object.keys(usageByDate).reduce((peak, date) => 
        !peak || usageByDate[date] > usageByDate[peak] ? date : peak
      , null as string | null)

      if (peakDay) {
        materialAnalysis.usage.peakUsageDay = {
          date: peakDay,
          quantity: usageByDate[peakDay]
        }
      }

      // Calculate average usage per order
      const ordersUsingThisMaterial = orders.filter(order => {
        // This would require calculating material usage for each order
        // For now, we'll estimate based on usage transactions that mention order IDs
        return relevantUsages.some(usage => usage.notes?.includes(order.orderId))
      })

      materialAnalysis.usage.orderCount = ordersUsingThisMaterial.length
      if (materialAnalysis.usage.orderCount > 0) {
        materialAnalysis.usage.averagePerOrder = materialAnalysis.usage.totalUsed / materialAnalysis.usage.orderCount
      }

      // Determine stock status
      if (material.currentStock <= 0) {
        materialAnalysis.stockStatus = 'out'
        analytics.stockAlerts.outOfStock.push(materialAnalysis)
      } else if (material.currentStock <= material.minimumStock) {
        materialAnalysis.stockStatus = 'low'
        analytics.stockAlerts.lowStock.push(materialAnalysis)
      } else if (material.maximumStock && material.currentStock >= material.maximumStock) {
        materialAnalysis.stockStatus = 'over'
        analytics.stockAlerts.overStock.push(materialAnalysis)
      }

      // Calculate projected days until empty
      if (materialAnalysis.usage.totalUsed > 0 && days > 0) {
        const dailyAverageUsage = materialAnalysis.usage.totalUsed / days
        if (dailyAverageUsage > 0) {
          materialAnalysis.projectedDaysUntilEmpty = Math.floor(material.currentStock / dailyAverageUsage)
        }
      }

      analytics.materialUsage.push(materialAnalysis)
    }

    // Calculate order analytics
    const statusCounts = {} as any
    const dateCounts = {} as any

    orders.forEach(order => {
      // Count by status
      statusCounts[order.status] = (statusCounts[order.status] || 0) + 1

      // Count by date
      if (order.createdAt) {
        const dateKey = order.createdAt.toISOString().split('T')[0]
        dateCounts[dateKey] = (dateCounts[dateKey] || 0) + 1
      }
    })

    analytics.orderAnalytics.byStatus = statusCounts
    analytics.orderAnalytics.byDate = dateCounts

    // Find top material consuming orders (simplified)
    analytics.orderAnalytics.topMaterialConsumers = orders
      .slice(0, 10) // Top 10 for performance
      .map(order => ({
        orderId: order.orderId,
        status: order.status,
        createdAt: order.createdAt,
        itemCount: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        estimatedMaterialComplexity: order.items.reduce((sum, item) => 
          sum + item.quantity + item.addons.length + item.options.length, 0
        )
      }))
      .sort((a, b) => b.estimatedMaterialComplexity - a.estimatedMaterialComplexity)

    // Update summary
    analytics.summary.totalMaterialTypes = analytics.materialUsage.length
    analytics.summary.totalUsageTransactions = analytics.materialUsage.reduce(
      (sum, material) => sum + material.usage.transactionCount, 0
    )

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error fetching material usage analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/materials/usage-analytics/export - Export material usage data
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
    const { format, dateRange, materialIds } = body

    // This would implement CSV/Excel export functionality
    // For now, return a simple JSON export
    
    return NextResponse.json({
      message: 'Export functionality will be implemented',
      requestedFormat: format,
      dateRange,
      materialIds
    })

  } catch (error) {
    console.error('Error exporting material usage data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}