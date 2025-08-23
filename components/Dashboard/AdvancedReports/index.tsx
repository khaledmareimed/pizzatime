'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  RefreshCw,
  Filter,
  Eye,
  Users,
  Package,
  Clock,
  Target,
  Activity,
  AlertCircle,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  FileText,
  Zap,
  ShoppingCart,
  Truck,
  CreditCard
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanCurrency, formatJordanDateTime } from '@/funcs/jordanLocale'
import Button from '@/components/Button'
import ReportFilters from './ReportFilters'
import ReportCharts from './ReportCharts'
import KPICards from './KPICards'
import DataTable from './DataTable'
import ExportModal from './ExportModal'

interface AdvancedReportsProps {
  session: Session
}

interface ReportFilters {
  dateRange: string
  startDate: string
  endDate: string
  categoryId: string
  productId: string
  customerId: string
  orderStatus: string
  paymentMethod: string
  deliveryMethod: string
  groupBy: string
  compareWith: string
}

interface ReportData {
  overview?: any
  salesRevenue?: any
  customerAnalytics?: any
  productPerformance?: any
  financialPerformance?: any
  operationalEfficiency?: any
  inventoryAnalytics?: any
  timeSeries?: any
}

const reportTypes = [
  {
    id: 'overview',
    name: 'نظرة عامة',
    description: 'ملخص شامل للأداء العام',
    icon: Eye,
    color: 'blue'
  },
  {
    id: 'sales-revenue',
    name: 'المبيعات والإيرادات',
    description: 'تحليل مفصل للمبيعات والإيرادات',
    icon: DollarSign,
    color: 'green'
  },
  {
    id: 'customer-analytics',
    name: 'تحليلات العملاء',
    description: 'سلوك العملاء وقيمة العمر',
    icon: Users,
    color: 'purple'
  },
  {
    id: 'product-performance',
    name: 'أداء المنتجات',
    description: 'تحليل أداء المنتجات والفئات',
    icon: Package,
    color: 'orange'
  },
  {
    id: 'financial-performance',
    name: 'الأداء المالي',
    description: 'الربحية والتدفق النقدي',
    icon: BarChart3,
    color: 'indigo'
  },
  {
    id: 'operational-efficiency',
    name: 'الكفاءة التشغيلية',
    description: 'أوقات المعالجة والتسليم',
    icon: Clock,
    color: 'teal'
  },

  {
    id: 'time-series',
    name: 'التحليل الزمني',
    description: 'الاتجاهات عبر الزمن',
    icon: TrendingUp,
    color: 'cyan'
  }
]

export default function AdvancedReports({ session }: AdvancedReportsProps) {
  const [selectedReportType, setSelectedReportType] = useState('overview')
  const [reportData, setReportData] = useState<ReportData>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  
  const [filters, setFilters] = useState<ReportFilters>({
    dateRange: 'month',
    startDate: '',
    endDate: '',
    categoryId: '',
    productId: '',
    customerId: '',
    orderStatus: '',
    paymentMethod: '',
    deliveryMethod: '',
    groupBy: 'day',
    compareWith: ''
  })

  const fetchReportData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({
        type: selectedReportType,
        ...Object.fromEntries(
          Object.entries(filters).filter(([_, value]) => value !== '')
        )
      })

      const response = await fetch(`/api/reports/analytics?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch report data')
      }

      const data = await response.json()
      setReportData(prev => ({
        ...prev,
        [selectedReportType]: data.data
      }))
      
    } catch (err) {
      console.error('Error fetching report data:', err)
      setError('فشل في تحميل بيانات التقرير')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchReportData()
  }, [selectedReportType, filters])

  const handleFilterChange = (newFilters: Partial<ReportFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const handleExport = async (format: 'pdf' | 'excel' | 'csv', options: any) => {
    try {
      // Import the export utilities dynamically
      const { exportToExcel, exportToCSV } = await import('@/funcs/export-utils')
      
      // Get the actual data that's being displayed in the tables
      const tablesData = getExportTablesData(selectedReportType, currentReportData)
      
      // Prepare export data with the actual table data
      const exportData = {
        metadata: {
          reportType: selectedReportType,
          generatedAt: new Date().toLocaleString('ar-SA'),
          dateRange: filters.dateRange,
          filters: filters
        },
        tables: tablesData,
        kpis: []
      }
      
      // Export based on format
      if (format === 'excel') {
        exportToExcel(exportData, options)
      } else if (format === 'csv') {
        exportToCSV(exportData, options)
      } else {
        // PDF fallback to Excel
        exportToExcel(exportData, options)
      }
      
    } catch (error) {
      console.error('Export error:', error)
      throw error
    }
  }

  // Function to get the actual table data that's being displayed
  const getExportTablesData = (reportType: string, data: any) => {
    if (!data) return []
    
    const tables: any[] = []
    
    switch (reportType) {
      case 'overview':
        if (data.topProducts && data.topProducts.length > 0) {
          tables.push({
            title: 'أفضل المنتجات',
            data: data.topProducts.map((item: any) => ({
              'اسم المنتج': item.productName,
              'الكمية المباعة': item.totalQuantity,
              'إجمالي الإيرادات': item.totalRevenue,
              'عدد الطلبات': item.orderCount
            }))
          })
        }
        if (data.recentOrders && data.recentOrders.length > 0) {
          tables.push({
            title: 'الطلبات الأخيرة',
            data: data.recentOrders.map((item: any) => ({
              'رقم الطلب': item.orderId,
              'تاريخ الطلب': new Date(item.orderDate).toLocaleDateString('ar-SA'),
              'قيمة الطلب': item.orderSummary?.total || 0,
              'الحالة': item.status
            }))
          })
        }
        break

      case 'sales-revenue':
        if (data.revenueByProduct && data.revenueByProduct.length > 0) {
          tables.push({
            title: 'الإيرادات حسب المنتج',
            data: data.revenueByProduct.map((item: any) => ({
              'اسم المنتج': item.productName,
              'الإيرادات': item.revenue,
              'الكمية': item.quantity,
              'متوسط السعر': item.averagePrice,
              'عدد الطلبات': item.orderCount
            }))
          })
        }
        if (data.revenueByCategory && data.revenueByCategory.length > 0) {
          tables.push({
            title: 'الإيرادات حسب الفئة',
            data: data.revenueByCategory.map((item: any) => ({
              'الفئة': item.categoryName || item._id,
              'الإيرادات': item.revenue,
              'الكمية': item.quantity,
              'عدد الطلبات': item.orderCount
            }))
          })
        }
        break

      case 'customer-analytics':
        if (data.topCustomers && data.topCustomers.length > 0) {
          tables.push({
            title: 'أفضل العملاء',
            data: data.topCustomers.map((item: any) => ({
              'معرف العميل': item._id,
              'إجمالي الإنفاق': item.totalSpent,
              'عدد الطلبات': item.orderCount,
              'آخر طلب': new Date(item.lastOrder).toLocaleDateString('ar-SA')
            }))
          })
        }
        if (data.customerSegmentation && data.customerSegmentation.length > 0) {
          tables.push({
            title: 'تقسيم العملاء',
            data: data.customerSegmentation.map((item: any) => ({
              'فئة الإنفاق': item._id,
              'عدد العملاء': item.count,
              'متوسط الإنفاق': item.averageSpent,
              'إجمالي الإيرادات': item.totalRevenue
            }))
          })
        }
        break

      case 'product-performance':
        if (data.productSales && data.productSales.length > 0) {
          tables.push({
            title: 'أداء المنتجات',
            data: data.productSales.map((item: any) => ({
              'اسم المنتج': item.productName,
              'الكمية المباعة': item.totalQuantity,
              'إجمالي الإيرادات': item.totalRevenue,
              'متوسط السعر': item.averagePrice,
              'طلبات فريدة': item.uniqueOrders
            }))
          })
        }
        if (data.categoryPerformance && data.categoryPerformance.length > 0) {
          tables.push({
            title: 'أداء الفئات',
            data: data.categoryPerformance.map((item: any) => ({
              'الفئة': item.categoryName || item._id,
              'إجمالي الإيرادات': item.totalRevenue,
              'الكمية المباعة': item.totalQuantity,
              'عدد المنتجات': item.productCount,
              'طلبات فريدة': item.uniqueOrders
            }))
          })
        }
        break

      case 'financial-performance':
        if (data.profitLossStatement && data.profitLossStatement.length > 0) {
          tables.push({
            title: 'بيان الأرباح والخسائر',
            data: data.profitLossStatement.map((item: any) => ({
              'النوع': item._id,
              'المبلغ': item.total,
              'عدد المعاملات': item.count
            }))
          })
        }
        if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
          tables.push({
            title: 'تفصيل المصروفات',
            data: data.expenseBreakdown.map((item: any) => ({
              'فئة المصروف': item._id,
              'إجمالي المبلغ': item.total,
              'عدد المعاملات': item.count,
              'متوسط المبلغ': item.average
            }))
          })
        }
        if (data.materialExpenses && data.materialExpenses.length > 0) {
          tables.push({
            title: 'مصروفات المواد',
            data: data.materialExpenses.map((item: any) => ({
              'اسم المادة': item._id,
              'إجمالي التكلفة': item.totalCost,
              'الكمية': item.quantity,
              'متوسط سعر الوحدة': item.averageUnitPrice,
              'عدد المشتريات': item.purchaseCount
            }))
          })
        }
        break

      case 'operational-efficiency':
        if (data.deliveryPerformance && data.deliveryPerformance.length > 0) {
          tables.push({
            title: 'أداء التسليم حسب المنطقة',
            data: data.deliveryPerformance.map((item: any) => ({
              'المنطقة': item._id,
              'متوسط وقت التسليم (دقيقة)': item.averageDeliveryTime,
              'عدد الطلبات': item.orderCount,
              'معدل النجاح': `${item.successRate}%`
            }))
          })
        }
        if (data.orderStatusDistribution && data.orderStatusDistribution.length > 0) {
          tables.push({
            title: 'توزيع حالات الطلبات',
            data: data.orderStatusDistribution.map((item: any) => ({
              'الحالة': item._id,
              'عدد الطلبات': item.count,
              'إجمالي القيمة': item.totalValue
            }))
          })
        }
        break

      case 'inventory-analytics':
        if (data.stockLevels && data.stockLevels.length > 0) {
          tables.push({
            title: 'مستويات المخزون',
            data: data.stockLevels.map((item: any) => ({
              'اسم المادة': item.name,
              'الفئة': item.category,
              'الوحدة': item.unit,
              'المخزون الحالي': item.currentStock,
              'الحد الأدنى': item.minimumStock,
              'قيمة المخزون': item.stockValue,
              'حالة المخزون': item.stockStatus
            }))
          })
        }
        break

      case 'time-series':
        if (data.revenueTimeSeries && data.revenueTimeSeries.length > 0) {
          tables.push({
            title: 'السلسلة الزمنية للإيرادات',
            data: data.revenueTimeSeries.map((item: any) => ({
              'الفترة': JSON.stringify(item._id),
              'الإيرادات': item.revenue,
              'عدد الطلبات': item.orders
            }))
          })
        }
        if (data.orderCountTimeSeries && data.orderCountTimeSeries.length > 0) {
          tables.push({
            title: 'السلسلة الزمنية لعدد الطلبات',
            data: data.orderCountTimeSeries.map((item: any) => ({
              'الفترة': JSON.stringify(item._id),
              'عدد الطلبات': item.count
            }))
          })
        }
        break

      default:
        // Generic fallback - export any array data found
        Object.keys(data).forEach(key => {
          if (Array.isArray(data[key]) && data[key].length > 0) {
            tables.push({
              title: key,
              data: data[key]
            })
          }
        })
    }
    
    return tables
  }

  const currentReportData = reportData[selectedReportType as keyof ReportData]

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Link
                href="/dash"
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  التقارير والتحليلات المتقدمة
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  تحليل شامل للأداء المالي والتشغيلي
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <Button
                variant="outline"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Filter className="w-4 h-4" />
                <span>فلاتر</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Download className="w-4 h-4" />
                <span>تصدير</span>
              </Button>
              
              <Button
                onClick={fetchReportData}
                disabled={loading}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                <span>تحديث</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar - Report Types */}
        <div className="w-80 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 min-h-screen">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              أنواع التقارير
            </h2>
            
            <div className="space-y-2">
              {reportTypes.map((reportType) => {
                const Icon = reportType.icon
                const isSelected = selectedReportType === reportType.id
                
                return (
                  <motion.button
                    key={reportType.id}
                    onClick={() => setSelectedReportType(reportType.id)}
                    className={cn(
                      "w-full text-right p-4 rounded-lg transition-all duration-200",
                      "flex items-center space-x-3 rtl:space-x-reverse",
                      isSelected
                        ? `bg-${reportType.color}-50 dark:bg-${reportType.color}-900/20 border-2 border-${reportType.color}-200 dark:border-${reportType.color}-700`
                        : "bg-gray-50 dark:bg-gray-700 border-2 border-transparent hover:bg-gray-100 dark:hover:bg-gray-600"
                    )}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={cn(
                      "w-6 h-6",
                      isSelected 
                        ? `text-${reportType.color}-600 dark:text-${reportType.color}-400`
                        : "text-gray-500 dark:text-gray-400"
                    )} />
                    <div className="flex-1 text-right">
                      <h3 className={cn(
                        "font-medium",
                        isSelected
                          ? `text-${reportType.color}-900 dark:text-${reportType.color}-100`
                          : "text-gray-900 dark:text-white"
                      )}>
                        {reportType.name}
                      </h3>
                      <p className={cn(
                        "text-sm",
                        isSelected
                          ? `text-${reportType.color}-700 dark:text-${reportType.color}-300`
                          : "text-gray-500 dark:text-gray-400"
                      )}>
                        {reportType.description}
                      </p>
                    </div>
                  </motion.button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Filters Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
              >
                <ReportFilters
                  filters={filters}
                  onFiltersChange={handleFilterChange}
                  reportType={selectedReportType}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Report Content */}
          <div className="p-6">
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg"
              >
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <p className="text-red-800 dark:text-red-200">{error}</p>
                </div>
              </motion.div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                  <span className="text-gray-600 dark:text-gray-400">
                    جاري تحميل البيانات...
                  </span>
                </div>
              </div>
            ) : currentReportData ? (
              <div className="space-y-6">
                {/* KPI Cards */}
                <KPICards 
                  reportType={selectedReportType}
                  data={currentReportData}
                />
                
                {/* Charts */}
                <ReportCharts
                  reportType={selectedReportType}
                  data={currentReportData}
                  groupBy={filters.groupBy}
                />
                
                {/* Data Tables */}
                <DataTable
                  reportType={selectedReportType}
                  data={currentReportData}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">
                  لا توجد بيانات متاحة للتقرير المحدد
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Export Modal */}
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleExport}
        reportType={selectedReportType}
        reportData={currentReportData}
      />
    </div>
  )
}