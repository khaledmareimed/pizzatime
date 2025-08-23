'use client'

import { motion } from 'framer-motion'
import { BarChart3, PieChart, TrendingUp, Activity } from 'lucide-react'
import { formatJordanCurrency } from '@/funcs/jordanLocale'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart
} from 'recharts'

interface ReportChartsProps {
  reportType: string
  data: any
  groupBy: string
}

interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string
    borderWidth?: number
  }[]
}

export default function ReportCharts({ reportType, data, groupBy }: ReportChartsProps) {
  if (!data) return null

  const renderChart = (chartData: ChartData, title: string, type: 'line' | 'bar' | 'pie' | 'doughnut' = 'bar') => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
        <div className="h-80">
          <RealChart data={chartData} type={type} />
        </div>
      </motion.div>
    )
  }

  const getChartsForReportType = () => {
    switch (reportType) {
      case 'overview':
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderChart(
              prepareRevenueTimeSeriesData(data.recentOrders),
              'الإيرادات عبر الزمن',
              'line'
            )}
            {renderChart(
              prepareTopProductsData(data.topProducts),
              'أفضل المنتجات',
              'bar'
            )}
          </div>
        )

      case 'sales-revenue':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareRevenueByPeriodData(data.revenueByPeriod, groupBy),
                `الإيرادات حسب ${getGroupByLabel(groupBy)}`,
                'line'
              )}
              {renderChart(
                preparePaymentMethodData(data.paymentMethodDistribution),
                'توزيع طرق الدفع',
                'doughnut'
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareCategoryRevenueData(data.revenueByCategory),
                'الإيرادات حسب الفئة',
                'bar'
              )}
              {renderChart(
                prepareProductRevenueData(data.revenueByProduct?.slice(0, 10)),
                'أفضل 10 منتجات',
                'bar'
              )}
            </div>
          </div>
        )

      case 'customer-analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareNewVsReturningData(data.newVsReturning),
                'العملاء الجدد مقابل العائدين',
                'doughnut'
              )}
              {renderChart(
                prepareCustomerSegmentationData(data.customerSegmentation),
                'تقسيم العملاء حسب الإنفاق',
                'bar'
              )}
            </div>
            <div className="grid grid-cols-1 gap-6">
              {renderChart(
                prepareTopCustomersData(data.topCustomers?.slice(0, 10)),
                'أفضل 10 عملاء',
                'bar'
              )}
            </div>
          </div>
        )

      case 'product-performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareProductSalesData(data.productSales?.slice(0, 10)),
                'أداء المنتجات - الكمية',
                'bar'
              )}
              {renderChart(
                prepareCategoryPerformanceData(data.categoryPerformance),
                'أداء الفئات',
                'doughnut'
              )}
            </div>
            <div className="grid grid-cols-1 gap-6">
              {renderChart(
                prepareProductTrendsData(data.productTrends),
                'اتجاهات المنتجات عبر الزمن',
                'line'
              )}
            </div>
          </div>
        )

      case 'financial-performance':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareProfitLossData(data.profitLossStatement),
                'بيان الأرباح والخسائر',
                'bar'
              )}
              {renderChart(
                prepareCashFlowData(data.cashFlowAnalysis),
                'التدفق النقدي',
                'line'
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareExpenseBreakdownData(data.expenseBreakdown),
                'تفصيل المصروفات',
                'doughnut'
              )}
              {renderChart(
                prepareMarginAnalysisData(data.marginAnalysis),
                'تحليل الهوامش',
                'bar'
              )}
            </div>
          </div>
        )

      case 'operational-efficiency':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareOrderStatusData(data.orderStatusDistribution),
                'توزيع حالات الطلبات',
                'doughnut'
              )}
              {renderChart(
                prepareDeliveryPerformanceData(data.deliveryPerformance),
                'أداء التسليم حسب المنطقة',
                'bar'
              )}
            </div>
            <div className="grid grid-cols-1 gap-6">
              {renderChart(
                preparePeakHoursData(data.peakHoursAnalysis),
                'ساعات الذروة',
                'bar'
              )}
            </div>
          </div>
        )

      case 'inventory-analytics':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareStockLevelsData(data.stockLevels),
                'مستويات المخزون',
                'bar'
              )}
              {renderChart(
                prepareMaterialCategoriesData(data.materialCategories),
                'توزيع المواد حسب الفئة',
                'doughnut'
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareUsageAnalysisData(data.directUsageAnalysis),
                'تحليل الاستهلاك',
                'bar'
              )}
              {renderChart(
                prepareTurnoverRatesData(data.turnoverRates),
                'معدلات دوران المخزون',
                'bar'
              )}
            </div>
            <div className="grid grid-cols-1 gap-6">
              {renderChart(
                preparePurchaseHistoryData(data.purchaseHistory),
                'تاريخ المشتريات',
                'line'
              )}
            </div>
          </div>
        )

      case 'time-series':
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-6">
              {renderChart(
                prepareTimeSeriesData(data.revenueTimeSeries, 'الإيرادات'),
                `الإيرادات عبر الزمن - ${getGroupByLabel(groupBy)}`,
                'line'
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {renderChart(
                prepareTimeSeriesData(data.orderCountTimeSeries, 'عدد الطلبات'),
                `عدد الطلبات عبر الزمن - ${getGroupByLabel(groupBy)}`,
                'line'
              )}
              {renderChart(
                prepareTimeSeriesData(data.averageOrderValueTimeSeries, 'متوسط قيمة الطلب'),
                `متوسط قيمة الطلب عبر الزمن - ${getGroupByLabel(groupBy)}`,
                'line'
              )}
            </div>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <BarChart3 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          الرسوم البيانية والتحليلات
        </h2>
      </div>
      {getChartsForReportType()}
    </div>
  )
}

// Real Chart component using Recharts
function RealChart({ data, type }: { data: ChartData; type: string }) {
  const colors = [
    '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
    '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6366F1'
  ]

  // Transform ChartData to Recharts format
  const chartData = data.labels?.map((label, index) => {
    const dataPoint: any = { name: label }
    data.datasets.forEach((dataset, datasetIndex) => {
      dataPoint[dataset.label] = dataset.data[index] || 0
    })
    return dataPoint
  }) || []

  // Custom tooltip formatter
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <p className="text-gray-900 dark:text-white font-medium">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {typeof entry.value === 'number' && entry.name.includes('الإيرادات') 
                ? formatJordanCurrency(entry.value) 
                : entry.value?.toLocaleString('ar-JO')}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (!chartData.length) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
        <div className="text-center">
          <Activity className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500 dark:text-gray-400">لا توجد بيانات للعرض</p>
        </div>
      </div>
    )
  }

  switch (type) {
    case 'line':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              fontSize={12}
              tick={{ fill: '#6B7280' }}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tick={{ fill: '#6B7280' }}
              tickFormatter={(value) => 
                data.datasets[0]?.label?.includes('الإيرادات') 
                  ? formatJordanCurrency(value).replace('د.أ', '') 
                  : value.toLocaleString('ar-JO')
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {data.datasets.map((dataset, index) => (
              <Line
                key={index}
                type="monotone"
                dataKey={dataset.label}
                stroke={colors[index % colors.length]}
                strokeWidth={3}
                dot={{ fill: colors[index % colors.length], strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )

    case 'bar':
      return (
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
            <XAxis 
              dataKey="name" 
              stroke="#6B7280"
              fontSize={12}
              tick={{ fill: '#6B7280' }}
              angle={-45}
              textAnchor="end"
              height={60}
            />
            <YAxis 
              stroke="#6B7280"
              fontSize={12}
              tick={{ fill: '#6B7280' }}
              tickFormatter={(value) => 
                data.datasets[0]?.label?.includes('الإيرادات') 
                  ? formatJordanCurrency(value).replace('د.أ', '') 
                  : value.toLocaleString('ar-JO')
              }
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {data.datasets.map((dataset, index) => (
              <Bar
                key={index}
                dataKey={dataset.label}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )

    case 'pie':
    case 'doughnut':
      // For pie charts, we need to transform data differently
      const pieData = data.labels?.map((label, index) => ({
        name: label,
        value: data.datasets[0]?.data[index] || 0
      })) || []

      return (
        <ResponsiveContainer width="100%" height="100%">
          <RechartsPieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={type === 'doughnut' ? 60 : 0}
              outerRadius={120}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
              labelLine={false}
            >
              {pieData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: any) => [
                data.datasets[0]?.label?.includes('الإيرادات') 
                  ? formatJordanCurrency(value) 
                  : value.toLocaleString('ar-JO'),
                data.datasets[0]?.label || 'القيمة'
              ]}
            />
            <Legend />
          </RechartsPieChart>
        </ResponsiveContainer>
      )

    default:
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="text-center">
            <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500 dark:text-gray-400">نوع الرسم البياني غير مدعوم</p>
          </div>
        </div>
      )
  }
}

// Data preparation functions
function prepareRevenueTimeSeriesData(orders: any[]): ChartData {
  if (!Array.isArray(orders)) return { labels: [], datasets: [] }
  
  const dailyRevenue = orders.reduce((acc: any, order) => {
    const date = new Date(order.orderDate).toLocaleDateString('ar-JO')
    acc[date] = (acc[date] || 0) + order.orderSummary.total
    return acc
  }, {})

  return {
    labels: Object.keys(dailyRevenue),
    datasets: [{
      label: 'الإيرادات',
      data: Object.values(dailyRevenue) as number[],
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  }
}

function prepareTopProductsData(products: any[]): ChartData {
  if (!Array.isArray(products)) return { labels: [], datasets: [] }
  
  return {
    labels: products.map(p => p.productName || 'غير محدد'),
    datasets: [{
      label: 'الإيرادات',
      data: products.map(p => p.totalRevenue || 0),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    }]
  }
}

function prepareRevenueByPeriodData(revenueData: any[], groupBy: string): ChartData {
  if (!Array.isArray(revenueData)) return { labels: [], datasets: [] }
  
  return {
    labels: revenueData.map(item => formatPeriodLabel(item._id, groupBy)),
    datasets: [{
      label: 'الإيرادات',
      data: revenueData.map(item => item.revenue || 0),
      borderColor: '#10B981',
      backgroundColor: 'rgba(16, 185, 129, 0.1)'
    }]
  }
}

function preparePaymentMethodData(paymentData: any[]): ChartData {
  if (!Array.isArray(paymentData)) return { labels: [], datasets: [] }
  
  const methodLabels: { [key: string]: string } = {
    cash: 'نقداً',
    card: 'بطاقة',
    online: 'أونلاين'
  }
  
  return {
    labels: paymentData.map(item => methodLabels[item._id] || item._id),
    datasets: [{
      label: 'الإيرادات',
      data: paymentData.map(item => item.revenue || 0),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B']
    }]
  }
}

function prepareCategoryRevenueData(categoryData: any[]): ChartData {
  if (!Array.isArray(categoryData)) return { labels: [], datasets: [] }
  
  return {
    labels: categoryData.map(item => item._id || 'غير محدد'),
    datasets: [{
      label: 'الإيرادات',
      data: categoryData.map(item => item.revenue || 0),
      backgroundColor: '#8B5CF6'
    }]
  }
}

function prepareProductRevenueData(productData: any[]): ChartData {
  if (!Array.isArray(productData)) return { labels: [], datasets: [] }
  
  return {
    labels: productData.map(item => item.productName || 'غير محدد'),
    datasets: [{
      label: 'الإيرادات',
      data: productData.map(item => item.revenue || 0),
      backgroundColor: '#F59E0B'
    }]
  }
}

function prepareNewVsReturningData(customerData: any[]): ChartData {
  if (!Array.isArray(customerData)) return { labels: [], datasets: [] }
  
  const labels = customerData.map(item => item._id === 'new' ? 'عملاء جدد' : 'عملاء عائدون')
  
  return {
    labels,
    datasets: [{
      label: 'عدد العملاء',
      data: customerData.map(item => item.count || 0),
      backgroundColor: ['#10B981', '#3B82F6']
    }]
  }
}

function prepareCustomerSegmentationData(segmentData: any[]): ChartData {
  if (!Array.isArray(segmentData)) return { labels: [], datasets: [] }
  
  return {
    labels: segmentData.map(item => `${item._id} دينار`),
    datasets: [{
      label: 'عدد العملاء',
      data: segmentData.map(item => item.count || 0),
      backgroundColor: '#8B5CF6'
    }]
  }
}

function prepareTopCustomersData(customerData: any[]): ChartData {
  if (!Array.isArray(customerData)) return { labels: [], datasets: [] }
  
  return {
    labels: customerData.map((item, index) => `عميل ${index + 1}`),
    datasets: [{
      label: 'إجمالي الإنفاق',
      data: customerData.map(item => item.totalSpent || 0),
      backgroundColor: '#06B6D4'
    }]
  }
}

function prepareProductSalesData(productData: any[]): ChartData {
  if (!Array.isArray(productData)) return { labels: [], datasets: [] }
  
  return {
    labels: productData.map(item => item.productName || 'غير محدد'),
    datasets: [{
      label: 'الكمية المباعة',
      data: productData.map(item => item.totalQuantity || 0),
      backgroundColor: '#F97316'
    }]
  }
}

function prepareCategoryPerformanceData(categoryData: any[]): ChartData {
  if (!Array.isArray(categoryData)) return { labels: [], datasets: [] }
  
  return {
    labels: categoryData.map(item => item._id || 'غير محدد'),
    datasets: [{
      label: 'الإيرادات',
      data: categoryData.map(item => item.totalRevenue || 0),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']
    }]
  }
}

function prepareProductTrendsData(trendsData: any[]): ChartData {
  if (!Array.isArray(trendsData)) return { labels: [], datasets: [] }
  
  // Group by product and create time series
  const productGroups = trendsData.reduce((acc: any, item) => {
    const productId = item._id.productId
    if (!acc[productId]) acc[productId] = []
    acc[productId].push(item)
    return acc
  }, {})
  
  const labels = [...new Set(trendsData.map(item => formatPeriodLabel(item._id.period, 'week')))]
  const datasets = Object.keys(productGroups).slice(0, 5).map((productId, index) => ({
    label: `منتج ${index + 1}`,
    data: labels.map(label => {
      const item = productGroups[productId].find((p: any) => formatPeriodLabel(p._id.period, 'week') === label)
      return item?.revenue || 0
    }),
    borderColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'][index],
    backgroundColor: 'transparent'
  }))
  
  return { labels, datasets }
}

function prepareProfitLossData(profitLossData: any[]): ChartData {
  if (!Array.isArray(profitLossData)) return { labels: [], datasets: [] }
  
  const typeLabels: { [key: string]: string } = {
    revenue: 'الإيرادات',
    expense: 'المصروفات',
    refund: 'المردودات'
  }
  
  return {
    labels: profitLossData.map(item => typeLabels[item._id] || item._id),
    datasets: [{
      label: 'المبلغ',
      data: profitLossData.map(item => item.total || 0),
      backgroundColor: ['#10B981', '#EF4444', '#F59E0B']
    }]
  }
}

function prepareCashFlowData(cashFlowData: any[]): ChartData {
  if (!Array.isArray(cashFlowData)) return { labels: [], datasets: [] }
  
  // Group by period and type
  const periods = [...new Set(cashFlowData.map(item => formatPeriodLabel(item._id.period, 'day')))]
  const revenueData = periods.map(period => {
    const item = cashFlowData.find(cf => cf._id.type === 'revenue' && formatPeriodLabel(cf._id.period, 'day') === period)
    return item?.amount || 0
  })
  const expenseData = periods.map(period => {
    const item = cashFlowData.find(cf => cf._id.type === 'expense' && formatPeriodLabel(cf._id.period, 'day') === period)
    return item?.amount || 0
  })
  
  return {
    labels: periods,
    datasets: [
      {
        label: 'الإيرادات',
        data: revenueData,
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)'
      },
      {
        label: 'المصروفات',
        data: expenseData,
        borderColor: '#EF4444',
        backgroundColor: 'rgba(239, 68, 68, 0.1)'
      }
    ]
  }
}

function prepareExpenseBreakdownData(expenseData: any[]): ChartData {
  if (!Array.isArray(expenseData)) return { labels: [], datasets: [] }
  
  return {
    labels: expenseData.map(item => item._id || 'غير محدد'),
    datasets: [{
      label: 'المصروفات',
      data: expenseData.map(item => item.total || 0),
      backgroundColor: ['#EF4444', '#F59E0B', '#8B5CF6', '#06B6D4', '#84CC16']
    }]
  }
}

function prepareMarginAnalysisData(marginData: any[]): ChartData {
  if (!Array.isArray(marginData)) return { labels: [], datasets: [] }
  
  return {
    labels: marginData.map(item => item.category || 'غير محدد'),
    datasets: [{
      label: 'هامش الربح %',
      data: marginData.map(item => item.marginPercentage || 0),
      backgroundColor: '#10B981'
    }]
  }
}

function prepareOrderStatusData(statusData: any[]): ChartData {
  if (!Array.isArray(statusData)) return { labels: [], datasets: [] }
  
  const statusLabels: { [key: string]: string } = {
    pending: 'في الانتظار',
    confirmed: 'مؤكد',
    preparing: 'قيد التحضير',
    ready: 'جاهز',
    'out-for-delivery': 'في الطريق',
    delivered: 'تم التسليم',
    cancelled: 'ملغي'
  }
  
  return {
    labels: statusData.map(item => statusLabels[item._id] || item._id),
    datasets: [{
      label: 'عدد الطلبات',
      data: statusData.map(item => item.count || 0),
      backgroundColor: ['#F59E0B', '#3B82F6', '#8B5CF6', '#10B981', '#06B6D4', '#84CC16', '#EF4444']
    }]
  }
}

function prepareDeliveryPerformanceData(deliveryData: any[]): ChartData {
  if (!Array.isArray(deliveryData)) return { labels: [], datasets: [] }
  
  return {
    labels: deliveryData.map(item => item._id || 'غير محدد'),
    datasets: [{
      label: 'معدل النجاح %',
      data: deliveryData.map(item => item.successRate || 0),
      backgroundColor: '#10B981'
    }]
  }
}

function preparePeakHoursData(peakData: any[]): ChartData {
  if (!Array.isArray(peakData)) return { labels: [], datasets: [] }
  
  // Group by hour
  const hourlyData = peakData.reduce((acc: any, item) => {
    const hour = item._id.hour
    acc[hour] = (acc[hour] || 0) + item.orderCount
    return acc
  }, {})
  
  const hours = Array.from({ length: 24 }, (_, i) => i)
  
  return {
    labels: hours.map(h => `${h}:00`),
    datasets: [{
      label: 'عدد الطلبات',
      data: hours.map(h => hourlyData[h] || 0),
      backgroundColor: '#3B82F6'
    }]
  }
}

function prepareTimeSeriesData(timeSeriesData: any[], label: string): ChartData {
  if (!Array.isArray(timeSeriesData)) return { labels: [], datasets: [] }
  
  return {
    labels: timeSeriesData.map(item => formatPeriodLabel(item._id, 'day')),
    datasets: [{
      label,
      data: timeSeriesData.map(item => item.revenue || item.count || item.averageOrderValue || 0),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  }
}

// Helper functions
function getGroupByLabel(groupBy: string): string {
  const labels: { [key: string]: string } = {
    hour: 'الساعة',
    day: 'اليوم',
    week: 'الأسبوع',
    month: 'الشهر',
    year: 'السنة'
  }
  return labels[groupBy] || groupBy
}

function formatPeriodLabel(period: any, groupBy: string): string {
  if (!period) return 'غير محدد'
  
  if (typeof period === 'string') return period
  
  switch (groupBy) {
    case 'hour':
      return `${period.day}/${period.month} ${period.hour}:00`
    case 'day':
      return `${period.day}/${period.month}/${period.year}`
    case 'week':
      return `أسبوع ${period.week}/${period.year}`
    case 'month':
      return `${period.month}/${period.year}`
    case 'year':
      return `${period.year}`
    default:
      return JSON.stringify(period)
  }
}

// Inventory Analytics Data Preparation Functions
function prepareStockLevelsData(stockData: any[]): ChartData {
  if (!Array.isArray(stockData)) return { labels: [], datasets: [] }
  
  const topStockItems = stockData.slice(0, 10) // Show top 10 by value
  
  return {
    labels: topStockItems.map(item => item.name || 'غير محدد'),
    datasets: [{
      label: 'قيمة المخزون',
      data: topStockItems.map(item => item.stockValue || 0),
      backgroundColor: '#10B981'
    }]
  }
}

function prepareMaterialCategoriesData(categoryData: any[]): ChartData {
  if (!Array.isArray(categoryData)) return { labels: [], datasets: [] }
  
  return {
    labels: categoryData.map(item => item._id || 'غير محدد'),
    datasets: [{
      label: 'قيمة المخزون',
      data: categoryData.map(item => item.totalStockValue || 0),
      backgroundColor: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4']
    }]
  }
}

function prepareUsageAnalysisData(usageData: any[]): ChartData {
  if (!Array.isArray(usageData)) return { labels: [], datasets: [] }
  
  const topUsageItems = usageData.slice(0, 10) // Show top 10 most used
  
  return {
    labels: topUsageItems.map(item => item.materialName || 'غير محدد'),
    datasets: [{
      label: 'الكمية المستهلكة',
      data: topUsageItems.map(item => item.totalUsage || 0),
      backgroundColor: '#F59E0B'
    }]
  }
}

function prepareTurnoverRatesData(turnoverData: any[]): ChartData {
  if (!Array.isArray(turnoverData)) return { labels: [], datasets: [] }
  
  const topTurnoverItems = turnoverData.slice(0, 10) // Show top 10 turnover rates
  
  return {
    labels: topTurnoverItems.map(item => item.name || 'غير محدد'),
    datasets: [{
      label: 'معدل الدوران',
      data: topTurnoverItems.map(item => item.turnoverRate || 0),
      backgroundColor: '#8B5CF6'
    }]
  }
}

function preparePurchaseHistoryData(purchaseData: any[]): ChartData {
  if (!Array.isArray(purchaseData)) return { labels: [], datasets: [] }
  
  return {
    labels: purchaseData.map(item => {
      if (item._id) {
        return `${item._id.month}/${item._id.year}`
      }
      return 'غير محدد'
    }),
    datasets: [{
      label: 'إجمالي المشتريات',
      data: purchaseData.map(item => item.totalCost || 0),
      borderColor: '#3B82F6',
      backgroundColor: 'rgba(59, 130, 246, 0.1)'
    }]
  }
}