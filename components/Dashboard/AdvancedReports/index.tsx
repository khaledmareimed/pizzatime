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
    id: 'inventory-analytics',
    name: 'تحليلات المخزون',
    description: 'إدارة المواد والمخزون',
    icon: Activity,
    color: 'red'
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

  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    // Implementation for export functionality
    console.log('Exporting report as:', format)
    setShowExportModal(false)
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