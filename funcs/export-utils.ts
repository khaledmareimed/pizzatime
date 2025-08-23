/**
 * Professional Export Utilities for Financial Reports
 * 
 * Enterprise-grade export system with accounting standards compliance
 * Supports Excel, CSV with proper formatting and data integrity
 */

import * as XLSX from 'xlsx'
import { formatJordanCurrency } from './jordanLocale'

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  includeCharts: boolean
  includeTables: boolean
  includeKPIs: boolean
  dateRange: string
  customFileName: string
  orientation: 'portrait' | 'landscape'
  pageSize: 'A4' | 'A3' | 'Letter'
}

export interface ExportData {
  kpis?: any[]
  tables?: any[]
  charts?: any[]
  metadata?: {
    reportType: string
    generatedAt: string
    dateRange: string
    filters?: any
  }
}

interface KPIData {
  title: string
  value: string | number
  format?: 'currency' | 'number' | 'percentage' | 'text'
  change?: number
  changeType?: 'increase' | 'decrease' | 'neutral'
}

interface TableData {
  title: string
  data: any[]
  headers?: string[]
  formatting?: { [key: string]: 'currency' | 'number' | 'percentage' | 'date' | 'text' }
}

/**
 * Professional Excel Export with Accounting Standards
 */
export const exportToExcel = (data: ExportData, options: ExportOptions): void => {
  try {
    // Create a new workbook with professional styling
    const workbook = XLSX.utils.book_new()
    
    // Set workbook properties for professional appearance
    workbook.Props = {
      Title: getReportTypeName(data.metadata?.reportType || ''),
      Subject: 'تقرير مالي ومحاسبي',
      Author: 'نظام إدارة المطعم',
      CreatedDate: new Date(),
      Company: 'نظام إدارة المطعم'
    }

    // Add Executive Summary Sheet (Metadata + KPIs)
    if (data.metadata || (options.includeKPIs && data.kpis)) {
      const summaryData = createExecutiveSummary(data, options)
      const summarySheet = XLSX.utils.aoa_to_sheet(summaryData)
      
      // Apply professional formatting to summary
      applySummaryFormatting(summarySheet)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'الملخص التنفيذي')
    }

    // Add detailed data sheets with proper formatting
    if (options.includeTables && data.tables && data.tables.length > 0) {
      data.tables.forEach((table, index) => {
        if (table.data && table.data.length > 0) {
          const formattedSheet = createFormattedDataSheet(table)
          const sheetName = sanitizeSheetName(table.title || `جدول ${index + 1}`)
          XLSX.utils.book_append_sheet(workbook, formattedSheet, sheetName)
        }
      })
    }

    // If no data was added, create a placeholder sheet
    if (workbook.SheetNames.length === 0) {
      const placeholderSheet = XLSX.utils.aoa_to_sheet([
        ['لا توجد بيانات متاحة للتصدير'],
        ['يرجى التأكد من وجود بيانات في التقرير المحدد'],
        ['أو تعديل خيارات التصدير لتشمل البيانات المطلوبة']
      ])
      XLSX.utils.book_append_sheet(workbook, placeholderSheet, 'تنبيه')
    }

    // Generate professional filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0]
    const reportName = getReportTypeName(data.metadata?.reportType || 'عام')
    const fileName = options.customFileName || `${reportName}_${timestamp}`
    
    // Write file with proper encoding for Arabic
    XLSX.writeFile(workbook, `${fileName}.xlsx`, {
      bookType: 'xlsx',
      bookSST: true,
      type: 'binary'
    })
    
  } catch (error) {
    console.error('Error exporting to Excel:', error)
    throw new Error('فشل في تصدير ملف Excel')
  }
}

/**
 * Create Executive Summary with KPIs and Metadata
 */
function createExecutiveSummary(data: ExportData, options: ExportOptions): any[][] {
  const summary: any[][] = []
  
  // Header
  summary.push(['تقرير مالي ومحاسبي شامل'])
  summary.push([]) // Empty row
  
  // Metadata section
  if (data.metadata) {
    summary.push(['معلومات التقرير'])
    summary.push(['نوع التقرير', getReportTypeName(data.metadata.reportType)])
    summary.push(['تاريخ الإنشاء', data.metadata.generatedAt])
    summary.push(['النطاق الزمني', data.metadata.dateRange])
    summary.push(['تم التصدير في', new Date().toLocaleString('ar-SA')])
    summary.push([]) // Empty row
  }
  
  // KPIs section
  if (options.includeKPIs && data.kpis && data.kpis.length > 0) {
    summary.push(['المؤشرات الرئيسية للأداء'])
    summary.push(['المؤشر', 'القيمة', 'التغيير', 'الاتجاه'])
    
    data.kpis.forEach(kpi => {
      const formattedValue = formatKPIValue(kpi.value, kpi.format)
      const changeText = kpi.change ? `${kpi.change > 0 ? '+' : ''}${kpi.change}%` : ''
      const trendText = kpi.changeType === 'increase' ? '↗️' : 
                       kpi.changeType === 'decrease' ? '↘️' : '→'
      
      summary.push([kpi.title, formattedValue, changeText, trendText])
    })
  }
  
  return summary
}

/**
 * Create formatted data sheet with proper headers and styling
 */
function createFormattedDataSheet(table: TableData): XLSX.WorkSheet {
  if (!table.data || table.data.length === 0) {
    return XLSX.utils.aoa_to_sheet([['لا توجد بيانات متاحة']])
  }
  
  // Get headers from first data row or provided headers
  const headers = table.headers || Object.keys(table.data[0])
  
  // Create data array with headers
  const sheetData: any[][] = []
  sheetData.push([table.title]) // Title row
  sheetData.push([]) // Empty row
  sheetData.push(headers) // Headers row
  
  // Add data rows with proper formatting
  table.data.forEach(row => {
    const formattedRow = headers.map(header => {
      const value = row[header]
      const format = table.formatting?.[header]
      return formatCellValue(value, format)
    })
    sheetData.push(formattedRow)
  })
  
  const worksheet = XLSX.utils.aoa_to_sheet(sheetData)
  
  // Apply formatting
  applyDataSheetFormatting(worksheet, headers.length, table.data.length + 3)
  
  return worksheet
}

/**
 * Apply professional formatting to summary sheet
 */
function applySummaryFormatting(sheet: XLSX.WorkSheet): void {
  // Set column widths
  sheet['!cols'] = [
    { width: 30 }, // Column A
    { width: 20 }, // Column B
    { width: 15 }, // Column C
    { width: 10 }  // Column D
  ]
  
  // Set row heights for better appearance
  sheet['!rows'] = [
    { hpt: 25 }, // Header row
    { hpt: 15 }, // Empty row
    { hpt: 20 }  // Section headers
  ]
}

/**
 * Apply professional formatting to data sheets
 */
function applyDataSheetFormatting(sheet: XLSX.WorkSheet, colCount: number, rowCount: number): void {
  // Set column widths based on content
  const colWidths = Array(colCount).fill(0).map(() => ({ width: 20 }))
  sheet['!cols'] = colWidths
  
  // Set autofilter for data range (excluding title and empty rows)
  if (rowCount > 3) {
    sheet['!autofilter'] = {
      ref: `A3:${XLSX.utils.encode_col(colCount - 1)}${rowCount}`
    }
  }
}

/**
 * Format KPI values based on their type
 */
function formatKPIValue(value: any, format?: string): string {
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

/**
 * Format cell values based on their type
 */
function formatCellValue(value: any, format?: string): any {
  if (value === null || value === undefined) return ''
  
  switch (format) {
    case 'currency':
      return Number(value) // Keep as number for Excel calculations
    case 'percentage':
      return Number(value) / 100 // Excel percentage format
    case 'number':
      return Number(value)
    case 'date':
      return new Date(value)
    default:
      return value
  }
}

/**
 * Sanitize sheet names for Excel compatibility
 */
function sanitizeSheetName(name: string): string {
  // Remove invalid characters and limit length
  return name
    .replace(/[\\\/\?\*\[\]]/g, '')
    .substring(0, 31)
}

/**
 * Extract KPIs from data using same logic as KPICards component
 */
function extractKPIsFromData(reportType: string, data: any): KPIData[] {
  if (!data) return []

  switch (reportType) {
    case 'overview':
      return [
        {
          title: 'إجمالي الإيرادات',
          value: data.summary?.totalRevenue || 0,
          format: 'currency',
          change: 12.5,
          changeType: 'increase'
        },
        {
          title: 'عدد الطلبات',
          value: data.summary?.totalOrders || 0,
          format: 'number',
          change: 8.2,
          changeType: 'increase'
        },
        {
          title: 'متوسط قيمة الطلب',
          value: data.summary?.averageOrderValue || 0,
          format: 'currency',
          change: -2.1,
          changeType: 'decrease'
        },
        {
          title: 'عملاء جدد',
          value: data.summary?.newCustomers || 0,
          format: 'number',
          change: 15.3,
          changeType: 'increase'
        }
      ]

    case 'sales-revenue':
      return [
        {
          title: 'إجمالي المبيعات',
          value: calculateTotalRevenue(data.revenueByPeriod),
          format: 'currency'
        },
        {
          title: 'نمو الإيرادات',
          value: calculateGrowthRate(data.revenueGrowth),
          format: 'percentage'
        },
        {
          title: 'أفضل منتج',
          value: getTopProduct(data.revenueByProduct)?.productName || 'غير متاح',
          format: 'text'
        },
        {
          title: 'متوسط قيمة الطلب',
          value: calculateAverageOrderValue(data.revenueByPeriod),
          format: 'currency'
        }
      ]

    case 'financial-performance':
      return [
        {
          title: 'الربح الإجمالي',
          value: data.summary?.grossProfit || 0,
          format: 'currency',
          change: 8.5,
          changeType: 'increase'
        },
        {
          title: 'هامش الربح',
          value: data.summary?.profitMargin || 0,
          format: 'percentage'
        },
        {
          title: 'إجمالي المصروفات',
          value: data.summary?.totalExpenses || 0,
          format: 'currency'
        },
        {
          title: 'مصروفات المواد',
          value: data.summary?.materialExpenseTotal || 0,
          format: 'currency'
        }
      ]

    case 'customer-analytics':
      return [
        {
          title: 'إجمالي العملاء',
          value: data.summary?.totalCustomers || 0,
          format: 'number'
        },
        {
          title: 'عملاء جدد',
          value: data.summary?.newCustomers || 0,
          format: 'number'
        },
        {
          title: 'متوسط الإنفاق للعميل',
          value: data.summary?.averageCustomerSpending || 0,
          format: 'currency'
        },
        {
          title: 'معدل الاحتفاظ بالعملاء',
          value: data.summary?.customerRetentionRate || 0,
          format: 'percentage'
        }
      ]

    case 'product-performance':
      return [
        {
          title: 'أفضل منتج مبيعاً',
          value: getTopProduct(data.productSales)?.productName || 'غير متاح',
          format: 'text'
        },
        {
          title: 'إجمالي المنتجات المباعة',
          value: data.summary?.totalProductsSold || 0,
          format: 'number'
        },
        {
          title: 'متوسط سعر المنتج',
          value: data.summary?.averageProductPrice || 0,
          format: 'currency'
        },
        {
          title: 'عدد الفئات النشطة',
          value: data.summary?.activeCategories || 0,
          format: 'number'
        }
      ]

    case 'operational-efficiency':
      return [
        {
          title: 'متوسط وقت التحضير',
          value: data.summary?.averagePreparationTime || 0,
          format: 'number'
        },
        {
          title: 'متوسط وقت التسليم',
          value: data.summary?.averageDeliveryTime || 0,
          format: 'number'
        },
        {
          title: 'معدل نجاح التسليم',
          value: data.summary?.deliverySuccessRate || 0,
          format: 'percentage'
        },
        {
          title: 'الطلبات المكتملة',
          value: data.summary?.completedOrders || 0,
          format: 'number'
        }
      ]

    case 'inventory-analytics':
      return [
        {
          title: 'قيمة المخزون الحالي',
          value: data.summary?.totalStockValue || 0,
          format: 'currency'
        },
        {
          title: 'قيمة الاستهلاك',
          value: data.summary?.totalUsageValue || 0,
          format: 'currency'
        },
        {
          title: 'معدل دوران المخزون',
          value: data.summary?.averageTurnover || 0,
          format: 'number'
        },
        {
          title: 'تنبيهات المخزون المنخفض',
          value: data.summary?.lowStockItems || 0,
          format: 'number'
        }
      ]

    case 'time-series':
      return [
        {
          title: 'اتجاه الإيرادات',
          value: data.summary?.revenueTrend || 'مستقر',
          format: 'text'
        },
        {
          title: 'نمو الطلبات',
          value: data.summary?.orderGrowth || 0,
          format: 'percentage'
        },
        {
          title: 'أعلى فترة مبيعات',
          value: data.summary?.peakPeriod || 'غير محدد',
          format: 'text'
        },
        {
          title: 'متوسط النمو الشهري',
          value: data.summary?.monthlyGrowthRate || 0,
          format: 'percentage'
        }
      ]

    default:
      return []
  }
}

// Helper functions for KPI calculations
function calculateTotalRevenue(revenueData: any[]): number {
  if (!Array.isArray(revenueData)) return 0
  return revenueData.reduce((total, item) => total + (item.revenue || 0), 0)
}

function calculateGrowthRate(growthData: any): number {
  if (!growthData) return 0
  return growthData.growthRate || 0
}

function getTopProduct(productData: any[]): any {
  if (!Array.isArray(productData) || productData.length === 0) return null
  return productData[0]
}

function calculateAverageOrderValue(revenueData: any[]): number {
  if (!Array.isArray(revenueData) || revenueData.length === 0) return 0
  const totalRevenue = revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0)
  const totalOrders = revenueData.reduce((sum, item) => sum + (item.orders || 0), 0)
  return totalOrders > 0 ? totalRevenue / totalOrders : 0
}

/**
 * Export data to CSV format
 */
export const exportToCSV = (data: ExportData, options: ExportOptions): void => {
  try {
    let csvContent = ''
    
    // Add metadata header
    if (data.metadata) {
      csvContent += `نوع التقرير,${getReportTypeName(data.metadata.reportType)}\n`
      csvContent += `تاريخ الإنشاء,${data.metadata.generatedAt}\n`
      csvContent += `النطاق الزمني,${data.metadata.dateRange}\n`
      csvContent += `تم التصدير في,${new Date().toLocaleString('ar-SA')}\n\n`
    }

    // Add KPIs if included
    if (options.includeKPIs && data.kpis && data.kpis.length > 0) {
      csvContent += 'المؤشرات الرئيسية\n'
      const kpiSheet = XLSX.utils.json_to_sheet(data.kpis)
      const kpiCSV = XLSX.utils.sheet_to_csv(kpiSheet)
      csvContent += kpiCSV + '\n\n'
    }

    // Add tables if included
    if (options.includeTables && data.tables) {
      data.tables.forEach((table, index) => {
        if (table.data && table.data.length > 0) {
          csvContent += `${table.title || `جدول ${index + 1}`}\n`
          const tableSheet = XLSX.utils.json_to_sheet(table.data)
          const tableCSV = XLSX.utils.sheet_to_csv(tableSheet)
          csvContent += tableCSV + '\n\n'
        }
      })
    }

    // Create and download the file
    const fileName = options.customFileName || `تقرير_${data.metadata?.reportType || 'عام'}_${new Date().toISOString().split('T')[0]}`
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' }) // Add BOM for Arabic support
    const link = document.createElement('a')
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `${fileName}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }
    
  } catch (error) {
    console.error('Error exporting to CSV:', error)
    throw new Error('فشل في تصدير ملف CSV')
  }
}

/**
 * Export data to PDF format (placeholder - would need additional PDF library)
 */
export const exportToPDF = (data: ExportData, options: ExportOptions): void => {
  // For now, we'll export as Excel since PDF requires additional libraries
  console.warn('PDF export not yet implemented, falling back to Excel')
  exportToExcel(data, options)
}

/**
 * Main export function that routes to appropriate format
 */
export const exportReport = (data: ExportData, options: ExportOptions): void => {
  switch (options.format) {
    case 'excel':
      exportToExcel(data, options)
      break
    case 'csv':
      exportToCSV(data, options)
      break
    case 'pdf':
      exportToPDF(data, options)
      break
    default:
      throw new Error('تنسيق التصدير غير مدعوم')
  }
}

/**
 * Helper function to get Arabic report type names
 */
const getReportTypeName = (reportType: string): string => {
  const reportNames: { [key: string]: string } = {
    'overview': 'نظرة عامة',
    'sales-revenue': 'المبيعات والإيرادات',
    'customer-analytics': 'تحليلات العملاء',
    'product-performance': 'أداء المنتجات',
    'financial-performance': 'الأداء المالي',
    'operational-efficiency': 'الكفاءة التشغيلية',
    'inventory-analytics': 'تحليلات المخزون',
    'time-series': 'التحليل الزمني'
  }
  return reportNames[reportType] || reportType
}

/**
 * Extract tables from data with proper formatting
 */
function extractTablesFromData(reportType: string, data: any): TableData[] {
  if (!data) {
    console.warn('⚠️ extractTablesFromData: No data provided')
    return []
  }
  
  console.log(`🔍 Extracting tables for report type: ${reportType}`)
  console.log('🔍 Available data properties:', Object.keys(data))
  
  const tables: TableData[] = []
  
  switch (reportType) {
    case 'overview':
      // Top products table
      if (data.topProducts && data.topProducts.length > 0) {
        tables.push({
          title: 'أفضل المنتجات',
          data: data.topProducts.map((item: any) => ({
            'اسم المنتج': item.productName,
            'الكمية المباعة': item.totalQuantity,
            'إجمالي الإيرادات': item.totalRevenue,
            'عدد الطلبات': item.orderCount
          })),
          formatting: {
            'إجمالي الإيرادات': 'currency',
            'الكمية المباعة': 'number',
            'عدد الطلبات': 'number'
          }
        })
      }
      
      // Recent orders table
      if (data.recentOrders && data.recentOrders.length > 0) {
        tables.push({
          title: 'الطلبات الأخيرة',
          data: data.recentOrders.map((item: any) => ({
            'رقم الطلب': item.orderId,
            'تاريخ الطلب': item.orderDate,
            'قيمة الطلب': item.orderSummary?.total || 0,
            'الحالة': item.status
          })),
          formatting: {
            'تاريخ الطلب': 'date',
            'قيمة الطلب': 'currency'
          }
        })
      }
      break

    case 'sales-revenue':
      console.log('🔍 Processing sales-revenue data...')
      console.log('🔍 revenueByProduct exists:', !!data.revenueByProduct, 'length:', data.revenueByProduct?.length || 0)
      console.log('🔍 revenueByCategory exists:', !!data.revenueByCategory, 'length:', data.revenueByCategory?.length || 0)
      console.log('🔍 Sample revenueByProduct data:', data.revenueByProduct?.[0])
      console.log('🔍 Sample revenueByCategory data:', data.revenueByCategory?.[0])
      
      // Revenue by product
      if (data.revenueByProduct && data.revenueByProduct.length > 0) {
        console.log('✅ Adding revenueByProduct table with', data.revenueByProduct.length, 'items')
        tables.push({
          title: 'الإيرادات حسب المنتج',
          data: data.revenueByProduct.map((item: any) => ({
            'اسم المنتج': item.productName,
            'الإيرادات': item.revenue,
            'الكمية': item.quantity,
            'متوسط السعر': item.averagePrice,
            'عدد الطلبات': item.orderCount
          })),
          formatting: {
            'الإيرادات': 'currency',
            'متوسط السعر': 'currency',
            'الكمية': 'number',
            'عدد الطلبات': 'number'
          }
        })
      } else {
        console.warn('❌ No revenueByProduct data available')
      }
      
      // Revenue by category
      if (data.revenueByCategory && data.revenueByCategory.length > 0) {
        console.log('✅ Adding revenueByCategory table with', data.revenueByCategory.length, 'items')
        tables.push({
          title: 'الإيرادات حسب الفئة',
          data: data.revenueByCategory.map((item: any) => ({
            'الفئة': item._id,
            'الإيرادات': item.revenue,
            'الكمية': item.quantity,
            'عدد الطلبات': item.orderCount
          })),
          formatting: {
            'الإيرادات': 'currency',
            'الكمية': 'number',
            'عدد الطلبات': 'number'
          }
        })
      } else {
        console.warn('❌ No revenueByCategory data available')
      }
      
      // Check for any other potential data sources
      console.log('🔍 Checking for other potential data sources...')
      Object.keys(data).forEach(key => {
        if (Array.isArray(data[key]) && data[key].length > 0) {
          console.log(`📊 Found array data: ${key} (${data[key].length} items)`)
          console.log(`📊 Sample ${key} data:`, data[key][0])
        }
      })
      break

    case 'customer-analytics':
      // Top customers
      if (data.topCustomers && data.topCustomers.length > 0) {
        tables.push({
          title: 'أفضل العملاء',
          data: data.topCustomers.map((item: any) => ({
            'معرف العميل': item._id,
            'إجمالي الإنفاق': item.totalSpent,
            'عدد الطلبات': item.orderCount,
            'آخر طلب': item.lastOrder
          })),
          formatting: {
            'إجمالي الإنفاق': 'currency',
            'عدد الطلبات': 'number',
            'آخر طلب': 'date'
          }
        })
      }
      
      // Customer segmentation
      if (data.customerSegmentation && data.customerSegmentation.length > 0) {
        tables.push({
          title: 'تقسيم العملاء',
          data: data.customerSegmentation.map((item: any) => ({
            'فئة الإنفاق': item._id,
            'عدد العملاء': item.count,
            'متوسط الإنفاق': item.averageSpent,
            'إجمالي الإيرادات': item.totalRevenue
          })),
          formatting: {
            'عدد العملاء': 'number',
            'متوسط الإنفاق': 'currency',
            'إجمالي الإيرادات': 'currency'
          }
        })
      }
      break

    case 'product-performance':
      // Product sales
      if (data.productSales && data.productSales.length > 0) {
        tables.push({
          title: 'أداء المنتجات',
          data: data.productSales.map((item: any) => ({
            'اسم المنتج': item.productName,
            'الكمية المباعة': item.totalQuantity,
            'إجمالي الإيرادات': item.totalRevenue,
            'متوسط السعر': item.averagePrice,
            'طلبات فريدة': item.uniqueOrders
          })),
          formatting: {
            'الكمية المباعة': 'number',
            'إجمالي الإيرادات': 'currency',
            'متوسط السعر': 'currency',
            'طلبات فريدة': 'number'
          }
        })
      }
      
      // Category performance
      if (data.categoryPerformance && data.categoryPerformance.length > 0) {
        tables.push({
          title: 'أداء الفئات',
          data: data.categoryPerformance.map((item: any) => ({
            'الفئة': item._id,
            'إجمالي الإيرادات': item.totalRevenue,
            'الكمية المباعة': item.totalQuantity,
            'عدد المنتجات': item.productCount,
            'طلبات فريدة': item.uniqueOrders
          })),
          formatting: {
            'إجمالي الإيرادات': 'currency',
            'الكمية المباعة': 'number',
            'عدد المنتجات': 'number',
            'طلبات فريدة': 'number'
          }
        })
      }
      break

    case 'financial-performance':
      // Profit & Loss Statement
      if (data.profitLossStatement && data.profitLossStatement.length > 0) {
        tables.push({
          title: 'بيان الأرباح والخسائر',
          data: data.profitLossStatement.map((item: any) => ({
            'النوع': item._id,
            'المبلغ': item.total,
            'عدد المعاملات': item.count
          })),
          formatting: {
            'المبلغ': 'currency',
            'عدد المعاملات': 'number'
          }
        })
      }
      
      // Expense breakdown
      if (data.expenseBreakdown && data.expenseBreakdown.length > 0) {
        tables.push({
          title: 'تفصيل المصروفات',
          data: data.expenseBreakdown.map((item: any) => ({
            'فئة المصروف': item._id,
            'إجمالي المبلغ': item.total,
            'عدد المعاملات': item.count,
            'متوسط المبلغ': item.average
          })),
          formatting: {
            'إجمالي المبلغ': 'currency',
            'عدد المعاملات': 'number',
            'متوسط المبلغ': 'currency'
          }
        })
      }
      
      // Material expenses
      if (data.materialExpenses && data.materialExpenses.length > 0) {
        tables.push({
          title: 'مصروفات المواد',
          data: data.materialExpenses.map((item: any) => ({
            'اسم المادة': item._id,
            'إجمالي التكلفة': item.totalCost,
            'الكمية': item.quantity,
            'متوسط سعر الوحدة': item.averageUnitPrice,
            'عدد المشتريات': item.purchaseCount,
            'آخر شراء': item.lastPurchase
          })),
          formatting: {
            'إجمالي التكلفة': 'currency',
            'الكمية': 'number',
            'متوسط سعر الوحدة': 'currency',
            'عدد المشتريات': 'number',
            'آخر شراء': 'date'
          }
        })
      }
      break

    case 'operational-efficiency':
      // Delivery performance
      if (data.deliveryPerformance && data.deliveryPerformance.length > 0) {
        tables.push({
          title: 'أداء التسليم حسب المنطقة',
          data: data.deliveryPerformance.map((item: any) => ({
            'المنطقة': item._id,
            'متوسط وقت التسليم (دقيقة)': item.averageDeliveryTime,
            'عدد الطلبات': item.orderCount,
            'معدل النجاح': item.successRate
          })),
          formatting: {
            'متوسط وقت التسليم (دقيقة)': 'number',
            'عدد الطلبات': 'number',
            'معدل النجاح': 'percentage'
          }
        })
      }
      
      // Order status distribution
      if (data.orderStatusDistribution && data.orderStatusDistribution.length > 0) {
        tables.push({
          title: 'توزيع حالات الطلبات',
          data: data.orderStatusDistribution.map((item: any) => ({
            'الحالة': item._id,
            'عدد الطلبات': item.count,
            'إجمالي القيمة': item.totalValue
          })),
          formatting: {
            'عدد الطلبات': 'number',
            'إجمالي القيمة': 'currency'
          }
        })
      }
      break

    case 'inventory-analytics':
      // Stock levels
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
          })),
          formatting: {
            'المخزون الحالي': 'number',
            'الحد الأدنى': 'number',
            'قيمة المخزون': 'currency'
          }
        })
      }
      
      // Cost analysis
      if (data.costAnalysis && data.costAnalysis.length > 0) {
        tables.push({
          title: 'تحليل التكاليف',
          data: data.costAnalysis.map((item: any) => ({
            'اسم المادة': item.materialName,
            'الفئة': item.category,
            'إجمالي المشتريات': item.totalPurchases,
            'إجمالي الكمية': item.totalQuantity,
            'متوسط سعر الوحدة': item.averageUnitPrice,
            'عدد المشتريات': item.purchaseCount
          })),
          formatting: {
            'إجمالي المشتريات': 'currency',
            'إجمالي الكمية': 'number',
            'متوسط سعر الوحدة': 'currency',
            'عدد المشتريات': 'number'
          }
        })
      }
      
      // Reorder alerts
      if (data.reorderAlerts && data.reorderAlerts.length > 0) {
        tables.push({
          title: 'تنبيهات إعادة الطلب',
          data: data.reorderAlerts.map((item: any) => ({
            'اسم المادة': item.name,
            'الفئة': item.category,
            'المخزون الحالي': item.currentStock,
            'الحد الأدنى': item.minimumStock,
            'متوسط التكلفة': item.averageCost
          })),
          formatting: {
            'المخزون الحالي': 'number',
            'الحد الأدنى': 'number',
            'متوسط التكلفة': 'currency'
          }
        })
      }
      break

    case 'time-series':
      // Revenue time series
      if (data.revenueTimeSeries && data.revenueTimeSeries.length > 0) {
        tables.push({
          title: 'السلسلة الزمنية للإيرادات',
          data: data.revenueTimeSeries.map((item: any) => ({
            'الفترة': JSON.stringify(item._id),
            'الإيرادات': item.revenue,
            'عدد الطلبات': item.orders
          })),
          formatting: {
            'الإيرادات': 'currency',
            'عدد الطلبات': 'number'
          }
        })
      }
      
      // Order count time series
      if (data.orderCountTimeSeries && data.orderCountTimeSeries.length > 0) {
        tables.push({
          title: 'السلسلة الزمنية لعدد الطلبات',
          data: data.orderCountTimeSeries.map((item: any) => ({
            'الفترة': JSON.stringify(item._id),
            'عدد الطلبات': item.count
          })),
          formatting: {
            'عدد الطلبات': 'number'
          }
        })
      }
      break

    default:
      // Generic fallback for any array data
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

/**
 * Professional Data Preparation for Export
 * Extracts KPIs and tables with proper formatting and accounting standards
 */
export const prepareExportData = (reportType: string, reportData: any): ExportData => {
  // Debug logging to understand what data we're receiving
  console.log('🔍 Export Debug - Report Type:', reportType)
  console.log('🔍 Export Debug - Report Data:', reportData)
  console.log('🔍 Export Debug - Data Keys:', reportData ? Object.keys(reportData) : 'No data')

  const exportData: ExportData = {
    metadata: {
      reportType,
      generatedAt: new Date().toLocaleString('ar-SA'),
      dateRange: 'حسب الفلاتر المحددة'
    }
  }

  if (!reportData) {
    console.warn('⚠️ Export Warning: No report data provided')
    return exportData
  }

  // Extract KPIs using the same logic as KPICards component
  exportData.kpis = extractKPIsFromData(reportType, reportData)
  console.log('📊 Export Debug - Extracted KPIs:', exportData.kpis?.length || 0, 'items')
  
  // Prepare tables with proper formatting
  exportData.tables = extractTablesFromData(reportType, reportData)
  console.log('📋 Export Debug - Extracted Tables:', exportData.tables?.length || 0, 'tables')
  
  // Log each table's data count
  exportData.tables?.forEach((table, index) => {
    console.log(`📋 Table ${index + 1}: "${table.title}" - ${table.data?.length || 0} rows`)
  })

  return exportData
}