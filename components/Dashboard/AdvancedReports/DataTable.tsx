'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  ChevronDown, 
  ChevronUp, 
  Search, 
  Filter,
  Download,
  Eye,
  ArrowUpDown,
  MoreHorizontal
} from 'lucide-react'
import { cn } from '@/funcs/utils'
import { formatJordanCurrency, formatJordanDateTime } from '@/funcs/jordanLocale'
import Button from '@/components/Button'

interface DataTableProps {
  reportType: string
  data: any
}

interface TableColumn {
  key: string
  label: string
  sortable?: boolean
  format?: 'currency' | 'number' | 'percentage' | 'date' | 'text'
  width?: string
}

interface TableData {
  columns: TableColumn[]
  rows: any[]
  title: string
}

export default function DataTable({ reportType, data }: DataTableProps) {
  const [sortColumn, setSortColumn] = useState<string>('')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)

  const handleTableExport = async (tableData: TableData) => {
    try {
      // Import the export utilities dynamically
      const { exportToExcel } = await import('@/funcs/export-utils')
      
      // Prepare export data for this specific table
      const exportData = {
        metadata: {
          reportType,
          generatedAt: new Date().toLocaleString('ar-SA'),
          dateRange: 'حسب الفلاتر المحددة'
        },
        tables: [{
          title: tableData.title,
          data: tableData.rows.map(row => {
            const exportRow: any = {}
            tableData.columns.forEach(column => {
              exportRow[column.label] = formatCellValue(getNestedValue(row, column.key), column.format)
            })
            return exportRow
          })
        }]
      }
      
      // Export options for individual table
      const options = {
        format: 'excel' as const,
        includeCharts: false,
        includeTables: true,
        includeKPIs: false,
        dateRange: '',
        customFileName: `${tableData.title}_${new Date().toISOString().split('T')[0]}`,
        orientation: 'landscape' as const,
        pageSize: 'A4' as const
      }
      
      exportToExcel(exportData, options)
      
    } catch (error) {
      console.error('Error exporting table:', error)
      alert('حدث خطأ أثناء تصدير الجدول')
    }
  }

  if (!data) return null

  const getTableData = (): TableData[] => {
    switch (reportType) {
      case 'overview':
        return [
          {
            title: 'أفضل المنتجات',
            columns: [
              { key: 'productName', label: 'اسم المنتج', sortable: true },
              { key: 'totalQuantity', label: 'الكمية المباعة', sortable: true, format: 'number' },
              { key: 'totalRevenue', label: 'إجمالي الإيرادات', sortable: true, format: 'currency' },
              { key: 'orderCount', label: 'عدد الطلبات', sortable: true, format: 'number' }
            ],
            rows: data.topProducts || []
          },
          {
            title: 'الطلبات الأخيرة',
            columns: [
              { key: 'orderId', label: 'رقم الطلب', sortable: true },
              { key: 'orderDate', label: 'تاريخ الطلب', sortable: true, format: 'date' },
              { key: 'orderSummary.total', label: 'قيمة الطلب', sortable: true, format: 'currency' },
              { key: 'status', label: 'الحالة', sortable: true }
            ],
            rows: data.recentOrders || []
          }
        ]

      case 'sales-revenue':
        return [
          {
            title: 'الإيرادات حسب المنتج',
            columns: [
              { key: 'productName', label: 'اسم المنتج', sortable: true },
              { key: 'revenue', label: 'الإيرادات', sortable: true, format: 'currency' },
              { key: 'quantity', label: 'الكمية', sortable: true, format: 'number' },
              { key: 'averagePrice', label: 'متوسط السعر', sortable: true, format: 'currency' },
              { key: 'orderCount', label: 'عدد الطلبات', sortable: true, format: 'number' }
            ],
            rows: data.revenueByProduct || []
          },
          {
            title: 'الإيرادات حسب الفئة',
            columns: [
              { key: 'categoryName', label: 'الفئة', sortable: true },
              { key: 'revenue', label: 'الإيرادات', sortable: true, format: 'currency' },
              { key: 'quantity', label: 'الكمية', sortable: true, format: 'number' },
              { key: 'orderCount', label: 'عدد الطلبات', sortable: true, format: 'number' }
            ],
            rows: data.revenueByCategory || []
          }
        ]

      case 'customer-analytics':
        return [
          {
            title: 'أفضل العملاء',
            columns: [
              { key: '_id', label: 'معرف العميل', sortable: true },
              { key: 'totalSpent', label: 'إجمالي الإنفاق', sortable: true, format: 'currency' },
              { key: 'orderCount', label: 'عدد الطلبات', sortable: true, format: 'number' },
              { key: 'lastOrder', label: 'آخر طلب', sortable: true, format: 'date' }
            ],
            rows: data.topCustomers || []
          },
          {
            title: 'تقسيم العملاء',
            columns: [
              { key: '_id', label: 'فئة الإنفاق', sortable: true },
              { key: 'count', label: 'عدد العملاء', sortable: true, format: 'number' },
              { key: 'averageSpent', label: 'متوسط الإنفاق', sortable: true, format: 'currency' },
              { key: 'totalRevenue', label: 'إجمالي الإيرادات', sortable: true, format: 'currency' }
            ],
            rows: data.customerSegmentation || []
          }
        ]

      case 'product-performance':
        return [
          {
            title: 'أداء المنتجات',
            columns: [
              { key: 'productName', label: 'اسم المنتج', sortable: true },
              { key: 'totalQuantity', label: 'الكمية المباعة', sortable: true, format: 'number' },
              { key: 'totalRevenue', label: 'إجمالي الإيرادات', sortable: true, format: 'currency' },
              { key: 'averagePrice', label: 'متوسط السعر', sortable: true, format: 'currency' },
              { key: 'uniqueOrders', label: 'طلبات فريدة', sortable: true, format: 'number' }
            ],
            rows: data.productSales || []
          },
          {
            title: 'أداء الفئات',
            columns: [
              { key: 'categoryName', label: 'الفئة', sortable: true },
              { key: 'totalRevenue', label: 'إجمالي الإيرادات', sortable: true, format: 'currency' },
              { key: 'totalQuantity', label: 'الكمية المباعة', sortable: true, format: 'number' },
              { key: 'productCount', label: 'عدد المنتجات', sortable: true, format: 'number' },
              { key: 'uniqueOrders', label: 'طلبات فريدة', sortable: true, format: 'number' }
            ],
            rows: data.categoryPerformance || []
          }
        ]

      case 'financial-performance':
        return [
          {
            title: 'بيان الأرباح والخسائر',
            columns: [
              { key: '_id', label: 'النوع', sortable: true },
              { key: 'total', label: 'المبلغ', sortable: true, format: 'currency' },
              { key: 'count', label: 'عدد المعاملات', sortable: true, format: 'number' }
            ],
            rows: data.profitLossStatement || []
          },
          {
            title: 'تفصيل المصروفات',
            columns: [
              { key: '_id', label: 'فئة المصروف', sortable: true },
              { key: 'total', label: 'إجمالي المبلغ', sortable: true, format: 'currency' },
              { key: 'count', label: 'عدد المعاملات', sortable: true, format: 'number' },
              { key: 'average', label: 'متوسط المبلغ', sortable: true, format: 'currency' }
            ],
            rows: data.expenseBreakdown || []
          }
        ]

      case 'operational-efficiency':
        return [
          {
            title: 'أداء التسليم حسب المنطقة',
            columns: [
              { key: '_id', label: 'المنطقة', sortable: true },
              { key: 'averageDeliveryTime', label: 'متوسط وقت التسليم (دقيقة)', sortable: true, format: 'number' },
              { key: 'orderCount', label: 'عدد الطلبات', sortable: true, format: 'number' },
              { key: 'successRate', label: 'معدل النجاح', sortable: true, format: 'percentage' }
            ],
            rows: data.deliveryPerformance || []
          },
          {
            title: 'توزيع حالات الطلبات',
            columns: [
              { key: '_id', label: 'الحالة', sortable: true },
              { key: 'count', label: 'عدد الطلبات', sortable: true, format: 'number' },
              { key: 'totalValue', label: 'إجمالي القيمة', sortable: true, format: 'currency' }
            ],
            rows: data.orderStatusDistribution || []
          }
        ]

      case 'inventory-analytics':
        console.log('🔍 Inventory Analytics Data:', data)
        console.log('🔍 Stock Levels:', data.stockLevels?.length || 0, 'items')
        console.log('🔍 Cost Analysis:', data.costAnalysis?.length || 0, 'items')
        console.log('🔍 Reorder Alerts:', data.reorderAlerts?.length || 0, 'items')
        console.log('🔍 Material Usage:', data.materialUsage?.length || 0, 'items')
        return [
          {
            title: 'مستويات المخزون',
            columns: [
              { key: 'name', label: 'اسم المادة', sortable: true },
              { key: 'category', label: 'الفئة', sortable: true },
              { key: 'unit', label: 'الوحدة', sortable: true },
              { key: 'currentStock', label: 'المخزون الحالي', sortable: true, format: 'number' },
              { key: 'minimumStock', label: 'الحد الأدنى', sortable: true, format: 'number' },
              { key: 'stockValue', label: 'قيمة المخزون', sortable: true, format: 'currency' },
              { key: 'stockStatus', label: 'حالة المخزون', sortable: true }
            ],
            rows: data.stockLevels || []
          },
          {
            title: 'تحليل التكاليف',
            columns: [
              { key: 'materialName', label: 'اسم المادة', sortable: true },
              { key: 'category', label: 'الفئة', sortable: true },
              { key: 'totalPurchases', label: 'إجمالي المشتريات', sortable: true, format: 'currency' },
              { key: 'totalQuantity', label: 'إجمالي الكمية', sortable: true, format: 'number' },
              { key: 'averageUnitPrice', label: 'متوسط سعر الوحدة', sortable: true, format: 'currency' },
              { key: 'purchaseCount', label: 'عدد المشتريات', sortable: true, format: 'number' }
            ],
            rows: data.costAnalysis || []
          },
          {
            title: 'تنبيهات إعادة الطلب',
            columns: [
              { key: 'name', label: 'اسم المادة', sortable: true },
              { key: 'category', label: 'الفئة', sortable: true },
              { key: 'currentStock', label: 'المخزون الحالي', sortable: true, format: 'number' },
              { key: 'minimumStock', label: 'الحد الأدنى', sortable: true, format: 'number' },
              { key: 'averageCost', label: 'متوسط التكلفة', sortable: true, format: 'currency' }
            ],
            rows: data.reorderAlerts || []
          },
          {
            title: 'استخدام المواد',
            columns: [
              { key: '_id', label: 'اسم المادة', sortable: true },
              { key: 'totalUsed', label: 'الكمية المستخدمة', sortable: true, format: 'number' },
              { key: 'usageCount', label: 'عدد الاستخدامات', sortable: true, format: 'number' },
              { key: 'averageUsage', label: 'متوسط الاستخدام', sortable: true, format: 'number' }
            ],
            rows: data.materialUsage || []
          }
        ]

      case 'time-series':
        return [
          {
            title: 'السلسلة الزمنية للإيرادات',
            columns: [
              { key: '_id', label: 'الفترة', sortable: true },
              { key: 'revenue', label: 'الإيرادات', sortable: true, format: 'currency' },
              { key: 'orders', label: 'عدد الطلبات', sortable: true, format: 'number' }
            ],
            rows: data.revenueTimeSeries || []
          },
          {
            title: 'السلسلة الزمنية لعدد الطلبات',
            columns: [
              { key: '_id', label: 'الفترة', sortable: true },
              { key: 'count', label: 'عدد الطلبات', sortable: true, format: 'number' }
            ],
            rows: data.orderCountTimeSeries || []
          }
        ]

      default:
        return []
    }
  }

  const formatCellValue = (value: any, format?: string): string => {
    if (value === null || value === undefined) return '-'

    switch (format) {
      case 'currency':
        return formatJordanCurrency(Number(value))
      case 'number':
        return Number(value).toLocaleString('ar-JO')
      case 'percentage':
        return `${Number(value).toFixed(1)}%`
      case 'date':
        return formatJordanDateTime(new Date(value))
      default:
        return String(value)
    }
  }

  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('desc')
    }
  }

  const sortData = (rows: any[], columns: TableColumn[]) => {
    if (!sortColumn) return rows

    return [...rows].sort((a, b) => {
      const aValue = getNestedValue(a, sortColumn)
      const bValue = getNestedValue(b, sortColumn)
      
      if (aValue === null || aValue === undefined) return 1
      if (bValue === null || bValue === undefined) return -1
      
      let comparison = 0
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue
      } else {
        comparison = String(aValue).localeCompare(String(bValue), 'ar')
      }
      
      return sortDirection === 'asc' ? comparison : -comparison
    })
  }

  const filterData = (rows: any[]) => {
    if (!searchTerm) return rows
    
    return rows.filter(row =>
      Object.values(row).some(value =>
        String(value).toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  }

  const paginateData = (rows: any[]) => {
    const startIndex = (currentPage - 1) * itemsPerPage
    return rows.slice(startIndex, startIndex + itemsPerPage)
  }

  const renderTable = (tableData: TableData, index: number) => {
    const filteredRows = filterData(tableData.rows)
    const sortedRows = sortData(filteredRows, tableData.columns)
    const paginatedRows = paginateData(sortedRows)
    const totalPages = Math.ceil(filteredRows.length / itemsPerPage)

    return (
      <motion.div
        key={index}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700"
      >
        {/* Table Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {tableData.title}
            </h3>
            
            <div className="flex items-center space-x-3 rtl:space-x-reverse">
              <div className="relative">
                <Search className="absolute right-3 rtl:left-3 rtl:right-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 rtl:pr-10 rtl:pl-3 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleTableExport(tableData)}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                <Download className="w-4 h-4" />
                <span>تصدير</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {tableData.columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      "px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider",
                      column.sortable && "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                    )}
                    onClick={() => column.sortable && handleSort(column.key)}
                  >
                    <div className="flex items-center justify-between">
                      <span>{column.label}</span>
                      {column.sortable && (
                        <div className="flex flex-col">
                          <ChevronUp 
                            className={cn(
                              "w-3 h-3",
                              sortColumn === column.key && sortDirection === 'asc'
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-400"
                            )} 
                          />
                          <ChevronDown 
                            className={cn(
                              "w-3 h-3 -mt-1",
                              sortColumn === column.key && sortDirection === 'desc'
                                ? "text-blue-600 dark:text-blue-400"
                                : "text-gray-400"
                            )} 
                          />
                        </div>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedRows.length > 0 ? (
                paginatedRows.map((row, rowIndex) => (
                  <tr 
                    key={rowIndex}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    {tableData.columns.map((column) => (
                      <td 
                        key={column.key}
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white"
                      >
                        {formatCellValue(getNestedValue(row, column.key), column.format)}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td 
                    colSpan={tableData.columns.length}
                    className="px-6 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    لا توجد بيانات متاحة
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                عرض {((currentPage - 1) * itemsPerPage) + 1} إلى {Math.min(currentPage * itemsPerPage, filteredRows.length)} من {filteredRows.length} نتيجة
              </div>
              
              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  السابق
                </Button>
                
                <div className="flex items-center space-x-1 rtl:space-x-reverse">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const page = i + 1
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={cn(
                          "px-3 py-1 text-sm rounded",
                          currentPage === page
                            ? "bg-blue-600 text-white"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        )}
                      >
                        {page}
                      </button>
                    )
                  })}
                </div>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                >
                  التالي
                </Button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    )
  }

  const tablesData = getTableData()

  if (tablesData.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <Eye className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">
            لا توجد جداول بيانات متاحة لهذا التقرير
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3 rtl:space-x-reverse">
        <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
          جداول البيانات التفصيلية
        </h2>
      </div>
      
      {tablesData.map((tableData, index) => renderTable(tableData, index))}
    </div>
  )
}