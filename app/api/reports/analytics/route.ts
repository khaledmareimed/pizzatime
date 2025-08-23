import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, Order, OrderSchema, OrderIndexes, Product, ProductSchema, ProductIndexes, User, UserSchema, UserIndexes, Financial, FinancialSchema, FinancialIndexes } from '@/funcs/collections'
import { RawMaterial, RawMaterialSchema, RawMaterialIndexes } from '@/funcs/collections/material'

/**
 * Advanced Analytics API Endpoint
 * Provides comprehensive business intelligence and reporting capabilities
 * Following accounting best practices and advanced data analysis principles
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview'
    const dateRange = searchParams.get('dateRange') || 'month'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const categoryId = searchParams.get('categoryId')
    const productId = searchParams.get('productId')
    const customerId = searchParams.get('customerId')
    const orderStatus = searchParams.get('orderStatus')
    const paymentMethod = searchParams.get('paymentMethod')
    const deliveryMethod = searchParams.get('deliveryMethod')
    const groupBy = searchParams.get('groupBy') || 'day'
    const compareWith = searchParams.get('compareWith') // For period comparison

    // Build date filter with proper date range handling
    const dateFilter = buildDateFilter(startDate, endDate, dateRange)
    
    // Initialize collections
    const [orderCollection, productCollection, userCollection, financialCollection, materialCollection] = await Promise.all([
      createCollection<Order>('orders', OrderSchema, { indexes: OrderIndexes }),
      createCollection<Product>('products', ProductSchema, { indexes: ProductIndexes }),
      createCollection<User>('users', UserSchema, { indexes: UserIndexes }),
      createCollection<Financial>('financial', FinancialSchema, { indexes: FinancialIndexes }),
      createCollection<RawMaterial>('materials', RawMaterialSchema, { indexes: RawMaterialIndexes })
    ])

    let reportData: any = {}

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(orderCollection, financialCollection, userCollection, dateFilter)
        break
      case 'sales-revenue':
        reportData = await generateSalesRevenueReport(orderCollection, financialCollection, dateFilter, { categoryId, productId, groupBy })
        break
      case 'customer-analytics':
        reportData = await generateCustomerAnalytics(orderCollection, userCollection, dateFilter, { customerId })
        break
      case 'product-performance':
        reportData = await generateProductPerformanceReport(orderCollection, productCollection, dateFilter, { categoryId, productId })
        break
      case 'financial-performance':
        reportData = await generateFinancialPerformanceReport(financialCollection, orderCollection, materialCollection, dateFilter)
        break
      case 'operational-efficiency':
        reportData = await generateOperationalEfficiencyReport(orderCollection, dateFilter, { orderStatus, deliveryMethod })
        break
      case 'inventory-analytics':
        reportData = await generateInventoryAnalytics(materialCollection, orderCollection, productCollection, dateFilter)
        break
      case 'time-series':
        reportData = await generateTimeSeriesReport(orderCollection, financialCollection, dateFilter, { groupBy, compareWith })
        break
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      reportType,
      dateRange: { dateRange, startDate, endDate },
      filters: { categoryId, productId, customerId, orderStatus, paymentMethod, deliveryMethod },
      data: reportData,
      generatedAt: new Date().toISOString(),
      appliedDateFilter: dateFilter // For debugging
    })

  } catch (error) {
    console.error('Error generating analytics report:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildDateFilter(startDate: string | null, endDate: string | null, dateRange?: string) {
  const now = new Date()
  
  // Handle custom date range first
  if (startDate && endDate) {
    return {
      $gte: new Date(startDate),
      $lte: new Date(new Date(endDate).setHours(23, 59, 59, 999))
    }
  }
  
  // Handle predefined date ranges
  if (dateRange) {
    switch (dateRange) {
      case 'today':
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999)
        return {
          $gte: todayStart,
          $lte: todayEnd
        }
        
      case 'week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        return {
          $gte: weekStart,
          $lte: now
        }
        
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
        return {
          $gte: monthStart,
          $lte: now
        }
        
      case 'quarter':
        const quarterMonth = Math.floor(now.getMonth() / 3) * 3
        const quarterStart = new Date(now.getFullYear(), quarterMonth, 1)
        return {
          $gte: quarterStart,
          $lte: now
        }
        
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1)
        return {
          $gte: yearStart,
          $lte: now
        }
        
      default:
        // Default to last 30 days for unknown ranges
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        return {
          $gte: thirtyDaysAgo,
          $lte: now
        }
    }
  }
  
  // Default to last 30 days
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  return {
    $gte: thirtyDaysAgo,
    $lte: now
  }
}

async function generateOverviewReport(orderCollection: any, financialCollection: any, userCollection: any, dateFilter: any) {
  const [
    orderStats,
    revenueStats,
    customerStats,
    topProducts,
    recentOrders
  ] = await Promise.all([
    // Order statistics
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$orderSummary.total' },
          averageOrderValue: { $avg: '$orderSummary.total' },
          totalItems: { $sum: { $sum: '$items.quantity' } }
        }
      }
    ]),
    
    // Revenue breakdown
    financialCollection.model.aggregate([
      { $match: { transactionDate: dateFilter } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]),
    
    // Customer statistics
    userCollection.model.aggregate([
      { $match: { createdAt: dateFilter } },
      {
        $group: {
          _id: null,
          newCustomers: { $sum: 1 }
        }
      }
    ]),
    
    // Top performing products
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          orderCount: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 }
    ]),
    
    // Recent orders
    orderCollection.model.find({ orderDate: dateFilter })
      .sort({ orderDate: -1 })
      .limit(10)
      .lean()
  ])

  return {
    summary: {
      totalOrders: orderStats[0]?.totalOrders || 0,
      totalRevenue: orderStats[0]?.totalRevenue || 0,
      averageOrderValue: orderStats[0]?.averageOrderValue || 0,
      totalItems: orderStats[0]?.totalItems || 0,
      newCustomers: customerStats[0]?.newCustomers || 0
    },
    revenueBreakdown: revenueStats,
    topProducts,
    recentOrders
  }
}

async function generateSalesRevenueReport(orderCollection: any, financialCollection: any, dateFilter: any, filters: any) {
  const matchStage: any = { orderDate: dateFilter }
  
  if (filters.categoryId) {
    matchStage['items.categoryId'] = filters.categoryId
  }
  if (filters.productId) {
    matchStage['items.productId'] = filters.productId
  }

  const [
    revenueByPeriod,
    revenueByCategory,
    revenueByProduct,
    revenueGrowth,
    paymentMethodDistribution
  ] = await Promise.all([
    // Revenue by time period
    orderCollection.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: getGroupByExpression(filters.groupBy),
          revenue: { $sum: '$orderSummary.total' },
          orders: { $sum: 1 },
          averageOrderValue: { $avg: '$orderSummary.total' }
        }
      },
      { $sort: { '_id': 1 } }
    ]),
    
    // Revenue by category
    orderCollection.model.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.categoryId',
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          quantity: { $sum: '$items.quantity' },
          orders: { $addToSet: '$orderId' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$categoryId' }]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' },
          categoryName: { 
            $ifNull: [
              { $arrayElemAt: ['$categoryInfo.name', 0] },
              'فئة غير معروفة'
            ]
          }
        }
      },
      { $sort: { revenue: -1 } }
    ]),
    
    // Revenue by product
    orderCollection.model.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          quantity: { $sum: '$items.quantity' },
          averagePrice: { $avg: '$items.price' },
          orders: { $addToSet: '$orderId' }
        }
      },
      {
        $addFields: {
          orderCount: { $size: '$orders' }
        }
      },
      { $sort: { revenue: -1 } },
      { $limit: 20 }
    ]),
    
    // Revenue growth calculation
    calculateRevenueGrowth(orderCollection, dateFilter),
    
    // Payment method distribution
    orderCollection.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$paymentMethod',
          revenue: { $sum: '$orderSummary.total' },
          orders: { $sum: 1 }
        }
      }
    ])
  ])

  return {
    revenueByPeriod,
    revenueByCategory,
    revenueByProduct,
    revenueGrowth,
    paymentMethodDistribution
  }
}

async function generateCustomerAnalytics(orderCollection: any, userCollection: any, dateFilter: any, filters: any) {
  const [
    customerLifetimeValue,
    customerRetention,
    newVsReturning,
    customerSegmentation,
    topCustomers
  ] = await Promise.all([
    // Customer Lifetime Value
    orderCollection.model.aggregate([
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$orderSummary.total' },
          orderCount: { $sum: 1 },
          firstOrder: { $min: '$orderDate' },
          lastOrder: { $max: '$orderDate' },
          averageOrderValue: { $avg: '$orderSummary.total' }
        }
      },
      {
        $addFields: {
          customerLifetimeDays: {
            $divide: [
              { $subtract: ['$lastOrder', '$firstOrder'] },
              1000 * 60 * 60 * 24
            ]
          }
        }
      },
      {
        $group: {
          _id: null,
          averageLifetimeValue: { $avg: '$totalSpent' },
          averageOrderCount: { $avg: '$orderCount' },
          averageLifetimeDays: { $avg: '$customerLifetimeDays' }
        }
      }
    ]),
    
    // Customer retention rate
    calculateCustomerRetention(orderCollection, dateFilter),
    
    // New vs returning customers
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      {
        $group: {
          _id: '$userId',
          orderCount: { $sum: 1 },
          firstOrderInPeriod: { $min: '$orderDate' }
        }
      },
      {
        $lookup: {
          from: 'orders',
          let: { userId: '$_id', firstOrder: '$firstOrderInPeriod' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$userId', '$$userId'] },
                    { $lt: ['$orderDate', '$$firstOrder'] }
                  ]
                }
              }
            }
          ],
          as: 'previousOrders'
        }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: [{ $size: '$previousOrders' }, 0] },
              'new',
              'returning'
            ]
          },
          count: { $sum: 1 },
          revenue: { $sum: '$orderCount' }
        }
      }
    ]),
    
    // Customer segmentation by spending
    orderCollection.model.aggregate([
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$orderSummary.total' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $bucket: {
          groupBy: '$totalSpent',
          boundaries: [0, 50, 100, 200, 500, 1000, Infinity],
          default: 'Other',
          output: {
            count: { $sum: 1 },
            averageSpent: { $avg: '$totalSpent' },
            totalRevenue: { $sum: '$totalSpent' }
          }
        }
      }
    ]),
    
    // Top customers
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      {
        $group: {
          _id: '$userId',
          totalSpent: { $sum: '$orderSummary.total' },
          orderCount: { $sum: 1 },
          lastOrder: { $max: '$orderDate' }
        }
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 20 }
    ])
  ])

  return {
    customerLifetimeValue: customerLifetimeValue[0] || {},
    customerRetention,
    newVsReturning,
    customerSegmentation,
    topCustomers
  }
}

async function generateProductPerformanceReport(orderCollection: any, productCollection: any, dateFilter: any, filters: any) {
  const matchStage: any = { orderDate: dateFilter }
  
  const [
    productSales,
    categoryPerformance,
    productProfitability,
    slowMovingProducts,
    productTrends
  ] = await Promise.all([
    // Product sales performance
    orderCollection.model.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          averagePrice: { $avg: '$items.price' },
          orderCount: { $addToSet: '$orderId' }
        }
      },
      {
        $addFields: {
          uniqueOrders: { $size: '$orderCount' }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),
    
    // Category performance
    orderCollection.model.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.categoryId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } },
          uniqueProducts: { $addToSet: '$items.productId' },
          orderCount: { $addToSet: '$orderId' }
        }
      },
      {
        $lookup: {
          from: 'categories',
          let: { categoryId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$categoryId' }]
                }
              }
            }
          ],
          as: 'categoryInfo'
        }
      },
      {
        $addFields: {
          productCount: { $size: '$uniqueProducts' },
          uniqueOrders: { $size: '$orderCount' },
          categoryName: { 
            $ifNull: [
              { $arrayElemAt: ['$categoryInfo.name', 0] },
              'فئة غير معروفة'
            ]
          }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]),
    
    // Product profitability (requires cost data from materials)
    calculateProductProfitability(orderCollection, productCollection, dateFilter),
    
    // Slow moving products
    identifySlowMovingProducts(orderCollection, productCollection, dateFilter),
    
    // Product trends over time
    orderCollection.model.aggregate([
      { $match: matchStage },
      { $unwind: '$items' },
      {
        $group: {
          _id: {
            productId: '$items.productId',
            period: getGroupByExpression('week')
          },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', '$items.price'] } }
        }
      },
      {
        $lookup: {
          from: 'products',
          let: { productId: '$_id.productId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: ['$_id', { $toObjectId: '$$productId' }]
                }
              }
            }
          ],
          as: 'productInfo'
        }
      },
      {
        $addFields: {
          productName: { 
            $ifNull: [
              { $arrayElemAt: ['$productInfo.name', 0] },
              'منتج غير معروف'
            ]
          }
        }
      },
      { $sort: { '_id.period': 1 } }
    ])
  ])

  return {
    productSales,
    categoryPerformance,
    productProfitability,
    slowMovingProducts,
    productTrends
  }
}

async function generateFinancialPerformanceReport(financialCollection: any, orderCollection: any, materialCollection: any, dateFilter: any) {
  const [
    profitLossStatement,
    cashFlowAnalysis,
    expenseBreakdown,
    expenseByCategory,
    materialExpenses,
    operationalExpenses,
    financialRatios,
    monthlyTrends
  ] = await Promise.all([
    // Comprehensive Profit & Loss Statement
    financialCollection.model.aggregate([
      { $match: { transactionDate: dateFilter } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          categories: { $addToSet: '$category' }
        }
      }
    ]),
    
    // Cash flow analysis by day
    financialCollection.model.aggregate([
      { $match: { transactionDate: dateFilter } },
      {
        $group: {
          _id: {
            type: '$type',
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: '$transactionDate'
              }
            }
          },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]),
    
    // All expenses breakdown by category
    financialCollection.model.aggregate([
      { 
        $match: { 
          transactionDate: dateFilter,
          type: 'expense'
        } 
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' },
          lastTransaction: { $max: '$transactionDate' }
        }
      },
      { $sort: { total: -1 } }
    ]),

    // Expense breakdown with category details
    financialCollection.model.aggregate([
      { 
        $match: { 
          transactionDate: dateFilter,
          type: 'expense'
        } 
      },
      {
        $group: {
          _id: {
            category: '$category',
            month: { $month: '$transactionDate' }
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]),

    // Material expenses specifically
    financialCollection.model.aggregate([
      { 
        $match: { 
          transactionDate: dateFilter,
          type: 'expense',
          category: 'materials'
        } 
      },
      {
        $group: {
          _id: '$metadata.materialName',
          totalCost: { $sum: '$amount' },
          quantity: { $sum: '$metadata.quantity' },
          averageUnitPrice: { $avg: '$metadata.unitPrice' },
          purchaseCount: { $sum: 1 },
          lastPurchase: { $max: '$transactionDate' }
        }
      },
      { $sort: { totalCost: -1 } }
    ]),

    // Operational expenses (non-material)
    financialCollection.model.aggregate([
      { 
        $match: { 
          transactionDate: dateFilter,
          type: 'expense',
          category: { $ne: 'materials' }
        } 
      },
      {
        $group: {
          _id: '$category',
          total: { $sum: '$amount' },
          count: { $sum: 1 },
          average: { $avg: '$amount' },
          description: { $first: '$description' }
        }
      },
      { $sort: { total: -1 } }
    ]),
    
    // Calculate financial ratios
    calculateFinancialRatios(financialCollection, orderCollection, dateFilter),

    // Monthly expense trends
    financialCollection.model.aggregate([
      { 
        $match: { 
          type: 'expense',
          transactionDate: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1),
            $lte: new Date()
          }
        } 
      },
      {
        $group: {
          _id: {
            year: { $year: '$transactionDate' },
            month: { $month: '$transactionDate' },
            category: '$category'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ])
  ])

  // Calculate totals and ratios
  const totalRevenue = profitLossStatement.find((item: any) => item._id === 'revenue')?.total || 0
  const totalExpenses = profitLossStatement.find((item: any) => item._id === 'expense')?.total || 0
  const grossProfit = totalRevenue - totalExpenses
  const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0

  return {
    profitLossStatement,
    cashFlowAnalysis,
    expenseBreakdown,
    expenseByCategory,
    materialExpenses,
    operationalExpenses,
    financialRatios,
    monthlyTrends,
    summary: {
      totalRevenue,
      totalExpenses,
      grossProfit,
      profitMargin,
      materialExpenseTotal: materialExpenses.reduce((sum: number, item: any) => sum + item.totalCost, 0),
      operationalExpenseTotal: operationalExpenses.reduce((sum: number, item: any) => sum + item.total, 0)
    }
  }
}

async function generateOperationalEfficiencyReport(orderCollection: any, dateFilter: any, filters: any) {
  const matchStage: any = { orderDate: dateFilter }
  
  if (filters.orderStatus) {
    matchStage.status = filters.orderStatus
  }
  if (filters.deliveryMethod) {
    matchStage.deliveryMethod = filters.deliveryMethod
  }

  const [
    orderProcessingTimes,
    deliveryPerformance,
    orderStatusDistribution,
    cancellationAnalysis,
    peakHoursAnalysis
  ] = await Promise.all([
    // Order processing times
    orderCollection.model.aggregate([
      { 
        $match: { 
          ...matchStage,
          actualDeliveryTime: { $exists: true },
          estimatedDeliveryTime: { $exists: true }
        } 
      },
      {
        $addFields: {
          processingTime: {
            $divide: [
              { $subtract: ['$actualDeliveryTime', '$orderDate'] },
              1000 * 60 // Convert to minutes
            ]
          },
          deliveryAccuracy: {
            $abs: {
              $divide: [
                { $subtract: ['$actualDeliveryTime', '$estimatedDeliveryTime'] },
                1000 * 60
              ]
            }
          }
        }
      },
      {
        $group: {
          _id: null,
          averageProcessingTime: { $avg: '$processingTime' },
          averageDeliveryAccuracy: { $avg: '$deliveryAccuracy' },
          onTimeDeliveries: {
            $sum: {
              $cond: [
                { $lte: ['$deliveryAccuracy', 15] }, // Within 15 minutes
                1,
                0
              ]
            }
          },
          totalOrders: { $sum: 1 }
        }
      }
    ]),
    
    // Delivery performance by area
    orderCollection.model.aggregate([
      { 
        $match: { 
          ...matchStage,
          deliveryMethod: 'delivery'
        } 
      },
      {
        $group: {
          _id: '$deliveryAddress.city',
          averageDeliveryTime: {
            $avg: {
              $divide: [
                { $subtract: ['$actualDeliveryTime', '$orderDate'] },
                1000 * 60
              ]
            }
          },
          orderCount: { $sum: 1 },
          successfulDeliveries: {
            $sum: {
              $cond: [
                { $eq: ['$status', 'delivered'] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $addFields: {
          successRate: {
            $multiply: [
              { $divide: ['$successfulDeliveries', '$orderCount'] },
              100
            ]
          }
        }
      }
    ]),
    
    // Order status distribution
    orderCollection.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$orderSummary.total' }
        }
      }
    ]),
    
    // Cancellation analysis
    orderCollection.model.aggregate([
      { 
        $match: { 
          ...matchStage,
          status: 'cancelled'
        } 
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$orderDate' },
            dayOfWeek: { $dayOfWeek: '$orderDate' }
          },
          count: { $sum: 1 },
          totalValue: { $sum: '$orderSummary.total' }
        }
      }
    ]),
    
    // Peak hours analysis
    orderCollection.model.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            hour: { $hour: '$orderDate' },
            dayOfWeek: { $dayOfWeek: '$orderDate' }
          },
          orderCount: { $sum: 1 },
          totalRevenue: { $sum: '$orderSummary.total' },
          averageOrderValue: { $avg: '$orderSummary.total' }
        }
      },
      { $sort: { orderCount: -1 } }
    ])
  ])

  return {
    orderProcessingTimes: orderProcessingTimes[0] || {},
    deliveryPerformance,
    orderStatusDistribution,
    cancellationAnalysis,
    peakHoursAnalysis
  }
}

async function generateInventoryAnalytics(materialCollection: any, orderCollection: any, productCollection: any, dateFilter: any) {
  const [
    stockLevels,
    directUsageAnalysis,
    orderBasedUsage,
    costAnalysis,
    reorderAlerts,
    turnoverRates,
    materialCategories,
    purchaseHistory,
    usageByPurpose
  ] = await Promise.all([
    // Current stock levels with comprehensive data
    materialCollection.model.aggregate([
      {
        $project: {
          name: 1,
          category: 1,
          unit: 1,
          currentStock: 1,
          minimumStock: 1,
          maximumStock: 1,
          averageCost: 1,
          lastPurchasePrice: 1,
          lastPurchaseDate: 1,
          status: 1,
          stockValue: { $multiply: ['$currentStock', '$averageCost'] },
          stockStatus: {
            $cond: [
              { $lte: ['$currentStock', '$minimumStock'] },
              'low',
              { $cond: [
                { $lte: ['$currentStock', { $multiply: ['$minimumStock', 1.5] }] },
                'medium',
                'high'
              ]}
            ]
          },
          stockPercentage: {
            $cond: [
              { $gt: ['$maximumStock', 0] },
              { $multiply: [{ $divide: ['$currentStock', '$maximumStock'] }, 100] },
              0
            ]
          }
        }
      },
      { $sort: { stockValue: -1 } }
    ]),

    // Direct material usage analysis from material records
    materialCollection.model.aggregate([
      { $unwind: { path: '$usages', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { 'usages.usageDate': dateFilter },
            { usages: { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: '$_id',
          materialName: { $first: '$name' },
          category: { $first: '$category' },
          unit: { $first: '$unit' },
          currentStock: { $first: '$currentStock' },
          averageCost: { $first: '$averageCost' },
          totalUsage: { $sum: { $ifNull: ['$usages.quantity', 0] } },
          usageCount: { 
            $sum: { 
              $cond: [{ $ifNull: ['$usages.quantity', false] }, 1, 0] 
            } 
          },
          averageUsage: { $avg: { $ifNull: ['$usages.quantity', 0] } },
          lastUsage: { $max: '$usages.usageDate' },
          usageCost: { 
            $sum: { 
              $multiply: [
                { $ifNull: ['$usages.quantity', 0] }, 
                { $first: '$averageCost' }
              ] 
            } 
          }
        }
      },
      { $sort: { totalUsage: -1 } }
    ]),

    // Order-based material usage (estimated from order volumes)
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productId',
          productName: { $first: '$items.productName' },
          totalQuantity: { $sum: '$items.quantity' },
          totalOrders: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: '_id',
          as: 'productInfo'
        }
      },
      { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          productName: 1,
          totalQuantity: 1,
          totalOrders: 1,
          estimatedMaterialUsage: {
            $multiply: ['$totalQuantity', 1] // Assume 1 unit of material per product
          }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ]),

    // Cost analysis with purchase history
    materialCollection.model.aggregate([
      { $unwind: { path: '$purchases', preserveNullAndEmptyArrays: true } },
      {
        $match: {
          $or: [
            { 'purchases.purchaseDate': dateFilter },
            { purchases: { $exists: false } }
          ]
        }
      },
      {
        $group: {
          _id: '$_id',
          materialName: { $first: '$name' },
          category: { $first: '$category' },
          unit: { $first: '$unit' },
          currentStock: { $first: '$currentStock' },
          averageCost: { $first: '$averageCost' },
          totalPurchases: { $sum: { $ifNull: ['$purchases.totalCost', 0] } },
          totalQuantity: { $sum: { $ifNull: ['$purchases.quantity', 0] } },
          purchaseCount: { 
            $sum: { 
              $cond: [{ $ifNull: ['$purchases.totalCost', false] }, 1, 0] 
            } 
          },
          averageUnitPrice: { $avg: { $ifNull: ['$purchases.unitPrice', 0] } },
          lastPurchase: { $max: '$purchases.purchaseDate' },
          suppliers: { $addToSet: '$purchases.supplierName' }
        }
      },
      { $sort: { totalPurchases: -1 } }
    ]),

    // Reorder alerts (low stock items)
    materialCollection.model.find({
      $expr: { $lte: ['$currentStock', '$minimumStock'] },
      status: 'active'
    }).select('name category unit currentStock minimumStock averageCost lastPurchaseDate').lean(),

    // Turnover rates and efficiency metrics
    materialCollection.model.aggregate([
      {
        $addFields: {
          totalPurchases: { $sum: '$purchases.quantity' },
          totalUsages: { $sum: '$usages.quantity' },
          purchaseValue: { $sum: '$purchases.totalCost' },
          usageValue: { 
            $multiply: [
              { $sum: '$usages.quantity' }, 
              '$averageCost'
            ] 
          },
          turnoverRate: {
            $cond: [
              { $gt: ['$currentStock', 0] },
              { $divide: [{ $sum: '$usages.quantity' }, '$currentStock'] },
              0
            ]
          },
          efficiency: {
            $cond: [
              { $gt: [{ $sum: '$purchases.quantity' }, 0] },
              { 
                $multiply: [
                  { $divide: [{ $sum: '$usages.quantity' }, { $sum: '$purchases.quantity' }] },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      {
        $project: {
          name: 1,
          category: 1,
          unit: 1,
          currentStock: 1,
          totalPurchases: 1,
          totalUsages: 1,
          purchaseValue: 1,
          usageValue: 1,
          turnoverRate: 1,
          efficiency: 1,
          stockValue: { $multiply: ['$currentStock', '$averageCost'] },
          wastePercentage: {
            $cond: [
              { $gt: ['$totalPurchases', 0] },
              {
                $multiply: [
                  { 
                    $divide: [
                      { $subtract: ['$totalPurchases', { $add: ['$totalUsages', '$currentStock'] }] },
                      '$totalPurchases'
                    ]
                  },
                  100
                ]
              },
              0
            ]
          }
        }
      },
      { $sort: { turnoverRate: -1 } }
    ]),

    // Material categories summary
    materialCollection.model.aggregate([
      {
        $group: {
          _id: '$category',
          materialCount: { $sum: 1 },
          totalStockValue: { $sum: { $multiply: ['$currentStock', '$averageCost'] } },
          averageStock: { $avg: '$currentStock' },
          lowStockCount: {
            $sum: {
              $cond: [
                { $lte: ['$currentStock', '$minimumStock'] },
                1,
                0
              ]
            }
          }
        }
      },
      { $sort: { totalStockValue: -1 } }
    ]),

    // Purchase history trends
    materialCollection.model.aggregate([
      { $unwind: '$purchases' },
      {
        $match: {
          'purchases.purchaseDate': {
            $gte: new Date(new Date().getTime() - 90 * 24 * 60 * 60 * 1000), // Last 90 days
            $lte: new Date()
          }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$purchases.purchaseDate' },
            month: { $month: '$purchases.purchaseDate' },
            week: { $week: '$purchases.purchaseDate' }
          },
          totalCost: { $sum: '$purchases.totalCost' },
          totalQuantity: { $sum: '$purchases.quantity' },
          purchaseCount: { $sum: 1 },
          averageUnitPrice: { $avg: '$purchases.unitPrice' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } }
    ]),

    // Usage by purpose analysis
    materialCollection.model.aggregate([
      { $unwind: '$usages' },
      {
        $match: {
          'usages.usageDate': dateFilter
        }
      },
      {
        $group: {
          _id: '$usages.purpose',
          totalQuantity: { $sum: '$usages.quantity' },
          usageCount: { $sum: 1 },
          materials: { $addToSet: '$name' }
        }
      },
      { $sort: { totalQuantity: -1 } }
    ])
  ])

  // Calculate comprehensive summary
  const totalStockValue = stockLevels.reduce((sum: number, item: any) => sum + (item.stockValue || 0), 0)
  const totalPurchaseValue = costAnalysis.reduce((sum: number, item: any) => sum + (item.totalPurchases || 0), 0)
  const totalUsageValue = directUsageAnalysis.reduce((sum: number, item: any) => sum + (item.usageCost || 0), 0)
  const averageTurnover = turnoverRates.length > 0 ? 
    turnoverRates.reduce((sum: number, item: any) => sum + (item.turnoverRate || 0), 0) / turnoverRates.length : 0

  return {
    stockLevels,
    directUsageAnalysis,
    orderBasedUsage,
    costAnalysis,
    reorderAlerts,
    turnoverRates,
    materialCategories,
    purchaseHistory,
    usageByPurpose,
    summary: {
      totalStockValue,
      totalPurchaseValue,
      totalUsageValue,
      lowStockItems: reorderAlerts.length,
      totalMaterials: stockLevels.length,
      averageTurnover,
      totalCategories: materialCategories.length,
      efficiency: totalPurchaseValue > 0 ? (totalUsageValue / totalPurchaseValue) * 100 : 0
    }
  }
}

async function generateTimeSeriesReport(orderCollection: any, financialCollection: any, dateFilter: any, options: any) {
  const groupByExpression = getGroupByExpression(options.groupBy)
  
  const [
    revenueTimeSeries,
    orderCountTimeSeries,
    averageOrderValueTimeSeries
  ] = await Promise.all([
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      {
        $group: {
          _id: groupByExpression,
          revenue: { $sum: '$orderSummary.total' },
          orders: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]),
    
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      {
        $group: {
          _id: groupByExpression,
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]),
    
    orderCollection.model.aggregate([
      { $match: { orderDate: dateFilter } },
      {
        $group: {
          _id: groupByExpression,
          averageOrderValue: { $avg: '$orderSummary.total' }
        }
      },
      { $sort: { '_id': 1 } }
    ])
  ])

  return {
    revenueTimeSeries,
    orderCountTimeSeries,
    averageOrderValueTimeSeries
  }
}

// Helper functions
function getGroupByExpression(groupBy: string) {
  switch (groupBy) {
    case 'hour':
      return {
        year: { $year: '$orderDate' },
        month: { $month: '$orderDate' },
        day: { $dayOfMonth: '$orderDate' },
        hour: { $hour: '$orderDate' }
      }
    case 'day':
      return {
        year: { $year: '$orderDate' },
        month: { $month: '$orderDate' },
        day: { $dayOfMonth: '$orderDate' }
      }
    case 'week':
      return {
        year: { $year: '$orderDate' },
        week: { $week: '$orderDate' }
      }
    case 'month':
      return {
        year: { $year: '$orderDate' },
        month: { $month: '$orderDate' }
      }
    case 'year':
      return {
        year: { $year: '$orderDate' }
      }
    default:
      return {
        year: { $year: '$orderDate' },
        month: { $month: '$orderDate' },
        day: { $dayOfMonth: '$orderDate' }
      }
  }
}

async function calculateRevenueGrowth(orderCollection: any, dateFilter: any) {
  // Implementation for revenue growth calculation
  return {
    currentPeriod: 0,
    previousPeriod: 0,
    growthRate: 0,
    growthAmount: 0
  }
}

async function calculateCustomerRetention(orderCollection: any, dateFilter: any) {
  // Implementation for customer retention calculation
  return {
    retentionRate: 0,
    churnRate: 0,
    repeatCustomers: 0,
    totalCustomers: 0
  }
}

async function calculateProductProfitability(orderCollection: any, productCollection: any, dateFilter: any) {
  // Implementation for product profitability calculation
  return []
}

async function identifySlowMovingProducts(orderCollection: any, productCollection: any, dateFilter: any) {
  // Implementation for slow moving products identification
  return []
}

async function calculateMarginAnalysis(orderCollection: any, materialCollection: any, dateFilter: any) {
  // Implementation for margin analysis
  return []
}

async function calculateFinancialRatios(financialCollection: any, orderCollection: any, dateFilter: any) {
  // Implementation for financial ratios calculation
  return {
    grossMargin: 0,
    netMargin: 0,
    returnOnSales: 0,
    averageOrderValue: 0
  }
}