'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Download, 
  FileText, 
  FileSpreadsheet, 
  File,
  Calendar,
  Settings,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/funcs/utils'
import Button from '@/components/Button'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  onExport: (format: 'pdf' | 'excel' | 'csv', options: ExportOptions) => void
  reportType: string
  reportData: any
}

interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv'
  includeCharts: boolean
  includeTables: boolean
  includeKPIs: boolean
  dateRange: string
  customFileName: string
  orientation: 'portrait' | 'landscape'
  pageSize: 'A4' | 'A3' | 'Letter'
}

const exportFormats = [
  {
    id: 'pdf',
    name: 'PDF',
    description: 'ملف PDF مع الرسوم البيانية والجداول',
    icon: FileText,
    color: 'red',
    features: ['رسوم بيانية', 'جداول', 'تنسيق احترافي']
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'ملف Excel مع البيانات والرسوم البيانية',
    icon: FileSpreadsheet,
    color: 'green',
    features: ['بيانات قابلة للتحرير', 'رسوم بيانية', 'صيغ حسابية']
  },
  {
    id: 'csv',
    name: 'CSV',
    description: 'ملف CSV للبيانات الخام فقط',
    icon: File,
    color: 'blue',
    features: ['بيانات خام', 'سهولة الاستيراد', 'حجم صغير']
  }
]

export default function ExportModal({ isOpen, onClose, onExport, reportType, reportData }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf')
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    includeCharts: true,
    includeTables: true,
    includeKPIs: true,
    dateRange: 'current',
    customFileName: '',
    orientation: 'landscape',
    pageSize: 'A4'
  })
  const [isExporting, setIsExporting] = useState(false)
  const [exportStatus, setExportStatus] = useState<'idle' | 'success' | 'error'>('idle')

  const handleExport = async () => {
    try {
      setIsExporting(true)
      setExportStatus('idle')
      
      const options = {
        ...exportOptions,
        format: selectedFormat
      }
      
      await onExport(selectedFormat, options)
      setExportStatus('success')
      
      // Auto close after success
      setTimeout(() => {
        onClose()
        setExportStatus('idle')
      }, 2000)
      
    } catch (error) {
      console.error('Export error:', error)
      setExportStatus('error')
    } finally {
      setIsExporting(false)
    }
  }

  const updateOption = (key: keyof ExportOptions, value: any) => {
    setExportOptions(prev => ({ ...prev, [key]: value }))
  }

  const getReportTypeName = () => {
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

  const generateFileName = () => {
    if (exportOptions.customFileName) {
      return exportOptions.customFileName
    }
    
    const reportName = getReportTypeName()
    const date = new Date().toLocaleDateString('ar-JO').replace(/\//g, '-')
    return `تقرير_${reportName}_${date}`
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Download className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    تصدير التقرير
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getReportTypeName()}
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Export Format Selection */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  اختر صيغة التصدير
                </h3>
                
                <div className="grid grid-cols-1 gap-4">
                  {exportFormats.map((format) => {
                    const Icon = format.icon
                    const isSelected = selectedFormat === format.id
                    
                    return (
                      <motion.button
                        key={format.id}
                        onClick={() => setSelectedFormat(format.id as any)}
                        className={cn(
                          "p-4 rounded-lg border-2 transition-all text-right",
                          isSelected
                            ? `border-${format.color}-500 bg-${format.color}-50 dark:bg-${format.color}-900/20`
                            : "border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500"
                        )}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-start space-x-4 rtl:space-x-reverse">
                          <Icon className={cn(
                            "w-8 h-8 mt-1",
                            isSelected 
                              ? `text-${format.color}-600 dark:text-${format.color}-400`
                              : "text-gray-400"
                          )} />
                          
                          <div className="flex-1">
                            <h4 className={cn(
                              "font-medium text-lg",
                              isSelected
                                ? `text-${format.color}-900 dark:text-${format.color}-100`
                                : "text-gray-900 dark:text-white"
                            )}>
                              {format.name}
                            </h4>
                            <p className={cn(
                              "text-sm mt-1",
                              isSelected
                                ? `text-${format.color}-700 dark:text-${format.color}-300`
                                : "text-gray-500 dark:text-gray-400"
                            )}>
                              {format.description}
                            </p>
                            
                            <div className="flex flex-wrap gap-2 mt-2">
                              {format.features.map((feature, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    "px-2 py-1 text-xs rounded-full",
                                    isSelected
                                      ? `bg-${format.color}-100 dark:bg-${format.color}-800 text-${format.color}-800 dark:text-${format.color}-200`
                                      : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                                  )}
                                >
                                  {feature}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    )
                  })}
                </div>
              </div>

              {/* Export Options */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  خيارات التصدير
                </h3>
                
                <div className="space-y-4">
                  {/* Content Options */}
                  {selectedFormat !== 'csv' && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        المحتوى المراد تضمينه
                      </h4>
                      <div className="space-y-2">
                        <label className="flex items-center space-x-3 rtl:space-x-reverse">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeKPIs}
                            onChange={(e) => updateOption('includeKPIs', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            مؤشرات الأداء الرئيسية (KPIs)
                          </span>
                        </label>
                        
                        <label className="flex items-center space-x-3 rtl:space-x-reverse">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeCharts}
                            onChange={(e) => updateOption('includeCharts', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            الرسوم البيانية
                          </span>
                        </label>
                        
                        <label className="flex items-center space-x-3 rtl:space-x-reverse">
                          <input
                            type="checkbox"
                            checked={exportOptions.includeTables}
                            onChange={(e) => updateOption('includeTables', e.target.checked)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            الجداول التفصيلية
                          </span>
                        </label>
                      </div>
                    </div>
                  )}

                  {/* PDF Options */}
                  {selectedFormat === 'pdf' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          اتجاه الصفحة
                        </label>
                        <select
                          value={exportOptions.orientation}
                          onChange={(e) => updateOption('orientation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="portrait">عمودي</option>
                          <option value="landscape">أفقي</option>
                        </select>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          حجم الصفحة
                        </label>
                        <select
                          value={exportOptions.pageSize}
                          onChange={(e) => updateOption('pageSize', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        >
                          <option value="A4">A4</option>
                          <option value="A3">A3</option>
                          <option value="Letter">Letter</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* File Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      اسم الملف (اختياري)
                    </label>
                    <input
                      type="text"
                      value={exportOptions.customFileName}
                      onChange={(e) => updateOption('customFileName', e.target.value)}
                      placeholder={generateFileName()}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Export Status */}
              {exportStatus !== 'idle' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-4 rounded-lg flex items-center space-x-3 rtl:space-x-reverse",
                    exportStatus === 'success' 
                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                  )}
                >
                  {exportStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                  <span className={cn(
                    "text-sm",
                    exportStatus === 'success'
                      ? "text-green-800 dark:text-green-200"
                      : "text-red-800 dark:text-red-200"
                  )}>
                    {exportStatus === 'success' 
                      ? "تم تصدير التقرير بنجاح!"
                      : "حدث خطأ أثناء تصدير التقرير"
                    }
                  </span>
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse p-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isExporting}
              >
                إلغاء
              </Button>
              
              <Button
                onClick={handleExport}
                disabled={isExporting || (!exportOptions.includeKPIs && !exportOptions.includeCharts && !exportOptions.includeTables && selectedFormat !== 'csv')}
                className="flex items-center space-x-2 rtl:space-x-reverse"
              >
                {isExporting ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                    />
                    <span>جاري التصدير...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    <span>تصدير {selectedFormat.toUpperCase()}</span>
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}