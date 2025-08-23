'use client'

import { motion } from 'framer-motion'
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  ShoppingCart, 
  Package, 
  Clock, 
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  CreditCard,
  Truck,
  Activity,
  BarChart3,
  PieChart
} from 'lucide-react'
import { cn } from '@/funcs/utils'
import { formatJordanCurrency } from '@/funcs/jordanLocale'

interface KPICardsProps {
  reportType: string
  data: any
}

interface KPICard {
  title: string
  value: string | number
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
  icon: any
  color: string
  description?: string
  format?: 'currency' | 'number' | 'percentage'
}

export default function KPICards({ reportType, data }: KPICardsProps) {
  const getKPICards = (): KPICard[] => {
    if (!data) return []

    switch (reportType) {
      case 'overview':
        return [
          {
            title: 'إجمالي الإيرادات',
            value: data.summary?.totalRevenue || 0,
            change: 12.5,
            changeType: 'increase',
            icon: DollarSign,
            color: 'green',
            format: 'currency'
          },
          {
            title: 'عدد الطلبات',
            value: data.summary?.totalOrders || 0,
            change: 8.2,
            changeType: 'increase',
            icon: ShoppingCart,
            color: 'blue',
            format: 'number'
          },
          {
            title: 'متوسط قيمة الطلب',
            value: data.summary?.averageOrderValue || 0,
            change: -2.1,
            changeType: 'decrease',
            icon: Target,
            color: 'purple',
            format: 'currency'
          },
          {
            title: 'عملاء جدد',
            value: data.summary?.newCustomers || 0,
            change: 15.3,
            changeType: 'increase',
            icon: Users,
            color: 'orange',
            format: 'number'
          }
        ]

      case 'sales-revenue':
        return [
          {
            title: 'إجمالي المبيعات',
            value: calculateTotalRevenue(data.revenueByPeriod),
            change: calculateGrowthRate(data.revenueGrowth),
            changeType: getChangeType(calculateGrowthRate(data.revenueGrowth)),
            icon: DollarSign,
            color: 'green',
            format: 'currency'
          },
          {
            title: 'نمو الإيرادات',
            value: calculateGrowthRate(data.revenueGrowth),
            icon: TrendingUp,
            color: 'blue',
            format: 'percentage'
          },
          {
            title: 'أفضل منتج',
            value: getTopProduct(data.revenueByProduct)?.productName || 'غير متاح',
            icon: Package,
            color: 'purple',
            format: 'number'
          },
          {
            title: 'متوسط قيمة الطلب',
            value: calculateAverageOrderValue(data.revenueByPeriod),
            icon: Target,
            color: 'orange',
            format: 'currency'
          }
        ]

      case 'customer-analytics':
        return [
          {
            title: 'قيمة العميل مدى الحياة',
            value: data.customerLifetimeValue?.averageLifetimeValue || 0,
            icon: Users,
            color: 'green',
            format: 'currency'
          },
          {
            title: 'معدل الاحتفاظ',
            value: data.customerRetention?.retentionRate || 0,
            change: 5.2,
            changeType: 'increase',
            icon: Target,
            color: 'blue',
            format: 'percentage'
          },
          {
            title: 'عملاء جدد',
            value: getNewCustomersCount(data.newVsReturning),
            icon: TrendingUp,
            color: 'purple',
            format: 'number'
          },
          {
            title: 'عملاء عائدون',
            value: getReturningCustomersCount(data.newVsReturning),
            icon: Activity,
            color: 'orange',
            format: 'number'
          }
        ]

      case 'product-performance':
        return [
          {
            title: 'أفضل منتج مبيعاً',
            value: getTopSellingProduct(data.productSales)?.productName || 'غير متاح',
            icon: Package,
            color: 'green',
            format: 'number'
          },
          {
            title: 'إجمالي المنتجات المباعة',
            value: calculateTotalProductsSold(data.productSales),
            icon: BarChart3,
            color: 'blue',
            format: 'number'
          },
          {
            title: 'أفضل فئة',
            value: getTopCategory(data.categoryPerformance)?.categoryName || 'غير متاح',
            icon: PieChart,
            color: 'purple',
            format: 'number'
          },
        
        ]

      case 'financial-performance':
        return [
          {
            title: 'الربح الإجمالي',
            value: data.summary?.grossProfit || 0,
            change: 8.5,
            changeType: 'increase',
            icon: DollarSign,
            color: 'green',
            format: 'currency'
          },
          {
            title: 'هامش الربح',
            value: data.summary?.profitMargin || 0,
            icon: Target,
            color: 'blue',
            format: 'percentage'
          },
          {
            title: 'إجمالي المصروفات',
            value: data.summary?.totalExpenses || 0,
            icon: TrendingDown,
            color: 'red',
            format: 'currency'
          },
          {
            title: 'مصروفات المواد',
            value: data.summary?.materialExpenseTotal || 0,
            icon: Package,
            color: 'orange',
            format: 'currency',
            description: 'تكلفة المواد الخام'
          }
        ]

      case 'operational-efficiency':
        return [
          {
            title: 'متوسط وقت المعالجة',
            value: data.orderProcessingTimes?.averageProcessingTime || 0,
            icon: Clock,
            color: 'blue',
            format: 'number',
            description: 'دقيقة'
          },
          {
            title: 'معدل التسليم في الوقت',
            value: calculateOnTimeDeliveryRate(data.orderProcessingTimes),
            icon: Truck,
            color: 'green',
            format: 'percentage'
          },
          {
            title: 'معدل الإلغاء',
            value: calculateCancellationRate(data.orderStatusDistribution),
            icon: TrendingDown,
            color: 'red',
            format: 'percentage'
          },
          {
            title: 'معدل إتمام الطلبات',
            value: calculateFulfillmentRate(data.orderStatusDistribution),
            icon: Target,
            color: 'purple',
            format: 'percentage'
          }
        ]

      case 'inventory-analytics':
        return [
          {
            title: 'قيمة المخزون الحالي',
            value: data.summary?.totalStockValue || 0,
            icon: Package,
            color: 'green',
            format: 'currency'
          },
          {
            title: 'قيمة الاستهلاك',
            value: data.summary?.totalUsageValue || 0,
            icon: Activity,
            color: 'blue',
            format: 'currency',
            description: 'قيمة المواد المستهلكة'
          },
          
          {
            title: 'تنبيهات المخزون المنخفض',
            value: data.summary?.lowStockItems || 0,
            icon: TrendingDown,
            color: 'red',
            format: 'number',
            description: 'مواد تحتاج إعادة طلب'
          }
        ]

      default:
        return []
    }
  }

  const kpiCards = getKPICards()

  const formatValue = (value: any, format?: string, description?: string): string => {
    if (value === null || value === undefined) return 'غير متاح'
    
    switch (format) {
      case 'currency':
        return formatJordanCurrency(Number(value))
      case 'percentage':
        return `${Number(value).toFixed(1)}%`
      case 'number':
        if (typeof value === 'string') return value
        return Number(value).toLocaleString('ar-JO')
      default:
        return String(value)
    }
  }

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return ArrowUpRight
      case 'decrease':
        return ArrowDownRight
      default:
        return Minus
    }
  }

  const getChangeColor = (changeType?: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 dark:text-green-400'
      case 'decrease':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-gray-600 dark:text-gray-400'
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpiCards.map((card, index) => {
        const Icon = card.icon
        const ChangeIcon = getChangeIcon(card.changeType)
        
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={cn(
                "p-3 rounded-lg",
                `bg-${card.color}-50 dark:bg-${card.color}-900/20`
              )}>
                <Icon className={cn(
                  "w-6 h-6",
                  `text-${card.color}-600 dark:text-${card.color}-400`
                )} />
              </div>
              
              {card.change !== undefined && (
                <div className={cn(
                  "flex items-center space-x-1 rtl:space-x-reverse text-sm",
                  getChangeColor(card.changeType)
                )}>
                  <ChangeIcon className="w-4 h-4" />
                  <span>{Math.abs(card.change)}%</span>
                </div>
              )}
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                {card.title}
              </h3>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatValue(card.value, card.format)}
                {card.description && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 mr-2">
                    {card.description}
                  </span>
                )}
              </p>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// Helper functions
function calculateTotalRevenue(revenueData: any[]): number {
  if (!Array.isArray(revenueData)) return 0
  return revenueData.reduce((total, item) => total + (item.revenue || 0), 0)
}

function calculateGrowthRate(growthData: any): number {
  if (!growthData) return 0
  return growthData.growthRate || 0
}

function getChangeType(value: number): 'increase' | 'decrease' | 'neutral' {
  if (value > 0) return 'increase'
  if (value < 0) return 'decrease'
  return 'neutral'
}

function getTopProduct(productData: any[]): any {
  if (!Array.isArray(productData) || productData.length === 0) return null
  return productData[0]
}

function calculateAverageOrderValue(revenueData: any[]): number {
  if (!Array.isArray(revenueData)) return 0
  const totalRevenue = calculateTotalRevenue(revenueData)
  const totalOrders = revenueData.reduce((total, item) => total + (item.orders || 0), 0)
  return totalOrders > 0 ? totalRevenue / totalOrders : 0
}

function getNewCustomersCount(customerData: any[]): number {
  if (!Array.isArray(customerData)) return 0
  const newCustomers = customerData.find(item => item._id === 'new')
  return newCustomers?.count || 0
}

function getReturningCustomersCount(customerData: any[]): number {
  if (!Array.isArray(customerData)) return 0
  const returningCustomers = customerData.find(item => item._id === 'returning')
  return returningCustomers?.count || 0
}

function getTopSellingProduct(productData: any[]): any {
  if (!Array.isArray(productData) || productData.length === 0) return null
  return productData.sort((a, b) => (b.totalQuantity || 0) - (a.totalQuantity || 0))[0]
}

function calculateTotalProductsSold(productData: any[]): number {
  if (!Array.isArray(productData)) return 0
  return productData.reduce((total, item) => total + (item.totalQuantity || 0), 0)
}

function getTopCategory(categoryData: any[]): any {
  if (!Array.isArray(categoryData) || categoryData.length === 0) return null
  return categoryData[0]
}

function calculateInventoryTurnover(productData: any[]): number {
  // This would require more complex calculation with inventory data
  return 0
}

function calculateGrossProfit(profitLossData: any[]): number {
  if (!Array.isArray(profitLossData)) return 0
  const revenue = profitLossData.find(item => item._id === 'revenue')?.total || 0
  const expenses = profitLossData.find(item => item._id === 'expense')?.total || 0
  return revenue - expenses
}

function calculateTotalExpenses(expenseData: any[]): number {
  if (!Array.isArray(expenseData)) return 0
  return expenseData.reduce((total, item) => total + (item.total || 0), 0)
}

function calculateOnTimeDeliveryRate(processingData: any): number {
  if (!processingData) return 0
  const { onTimeDeliveries = 0, totalOrders = 0 } = processingData
  return totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0
}

function calculateCancellationRate(statusData: any[]): number {
  if (!Array.isArray(statusData)) return 0
  const totalOrders = statusData.reduce((total, item) => total + (item.count || 0), 0)
  const cancelledOrders = statusData.find(item => item._id === 'cancelled')?.count || 0
  return totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0
}

function calculateFulfillmentRate(statusData: any[]): number {
  if (!Array.isArray(statusData)) return 0
  const totalOrders = statusData.reduce((total, item) => total + (item.count || 0), 0)
  const deliveredOrders = statusData.find(item => item._id === 'delivered')?.count || 0
  return totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0
}