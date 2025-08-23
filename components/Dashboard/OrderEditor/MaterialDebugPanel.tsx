'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, ChevronUp, Package, AlertCircle, CheckCircle, Info } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'

interface MaterialTransaction {
  transactionId: string
  type: 'DEDUCT' | 'RESTORE'
  materials: Array<{
    materialId: string
    materialName: string
    quantity: number
    unit: string
    stockBefore: number
    stockAfter: number
  }>
  success: boolean
  errors: string[]
  warnings: string[]
}

interface MaterialDebugPanelProps {
  materialTransaction?: {
    success: boolean
    transactions?: MaterialTransaction[]
    transactionCount: number
    message: string
    error?: string
    skipped?: boolean
  } | null
  isVisible?: boolean
}

export default function MaterialDebugPanel({ 
  materialTransaction, 
  isVisible = true 
}: MaterialDebugPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  if (!isVisible || !materialTransaction) {
    return null
  }

  const getStatusIcon = () => {
    if (materialTransaction.skipped) {
      return <Info className="w-5 h-5 text-blue-500" />
    }
    if (materialTransaction.success) {
      return <CheckCircle className="w-5 h-5 text-green-500" />
    }
    return <AlertCircle className="w-5 h-5 text-red-500" />
  }

  const getStatusColor = () => {
    if (materialTransaction.skipped) {
      return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/20'
    }
    if (materialTransaction.success) {
      return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
    }
    return 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'border rounded-xl p-4 mb-4',
        getStatusColor()
      )}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center space-x-3 rtl:space-x-reverse">
          {getStatusIcon()}
          <div>
            <h3 className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
              تحديث المواد الخام
            </h3>
            <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
              {materialTransaction.message}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {materialTransaction.transactionCount > 0 && (
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-lg">
              {materialTransaction.transactionCount} معاملة
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-gray-400" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-400" />
          )}
        </div>
      </div>

      {/* Expanded Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
          >
            {/* Error Display */}
            {materialTransaction.error && (
              <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-red-800 dark:text-red-200 text-sm">
                  <strong>خطأ:</strong> {materialTransaction.error}
                </p>
              </div>
            )}

            {/* Transaction Details */}
            {materialTransaction.transactions && materialTransaction.transactions.length > 0 && (
              <div className="space-y-4">
                <h4 className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                  تفاصيل المعاملات:
                </h4>
                
                {materialTransaction.transactions.map((transaction, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2 rtl:space-x-reverse">
                        <Package className="w-4 h-4 text-gray-500" />
                        <span className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                          معاملة {index + 1}
                        </span>
                        <span className={cn(
                          'px-2 py-1 text-xs rounded-lg',
                          transaction.type === 'DEDUCT' 
                            ? 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            : 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                        )}>
                          {transaction.type === 'DEDUCT' ? 'خصم' : 'إرجاع'}
                        </span>
                      </div>
                      <span className={cn(
                        'text-xs',
                        transaction.success ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                      )}>
                        {transaction.success ? 'نجح' : 'فشل'}
                      </span>
                    </div>

                    {/* Materials */}
                    {transaction.materials && transaction.materials.length > 0 && (
                      <div className="space-y-2">
                        <h5 className={cn('text-sm font-medium text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                          المواد المتأثرة:
                        </h5>
                        {transaction.materials.map((material, materialIndex) => (
                          <div key={materialIndex} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2">
                            <div className="flex justify-between items-center">
                              <span className={cn('text-sm font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                                {material.materialName}
                              </span>
                              <span className={cn('text-xs text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                {material.quantity} {material.unit}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className={cn('text-xs text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                                المخزون: {material.stockBefore} → {material.stockAfter}
                              </span>
                              <span className={cn(
                                'text-xs',
                                material.stockAfter > material.stockBefore 
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-red-600 dark:text-red-400'
                              )}>
                                {material.stockAfter > material.stockBefore ? '+' : ''}
                                {material.stockAfter - material.stockBefore}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Errors and Warnings */}
                    {transaction.errors && transaction.errors.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-red-700 dark:text-red-300 mb-1">أخطاء:</h5>
                        {transaction.errors.map((error, errorIndex) => (
                          <p key={errorIndex} className="text-xs text-red-600 dark:text-red-400">
                            • {error}
                          </p>
                        ))}
                      </div>
                    )}

                    {transaction.warnings && transaction.warnings.length > 0 && (
                      <div className="mt-3">
                        <h5 className="text-sm font-medium text-yellow-700 dark:text-yellow-300 mb-1">تحذيرات:</h5>
                        {transaction.warnings.map((warning, warningIndex) => (
                          <p key={warningIndex} className="text-xs text-yellow-600 dark:text-yellow-400">
                            • {warning}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* No Transactions */}
            {(!materialTransaction.transactions || materialTransaction.transactions.length === 0) && !materialTransaction.error && (
              <div className="text-center py-4">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className={cn('text-sm text-gray-500 dark:text-gray-400', theme.text.secondary)}>
                  {materialTransaction.skipped 
                    ? 'تم تخطي تحديث المواد - الطلب ليس في حالة استخدام المواد'
                    : 'لا توجد تغييرات في المواد الخام'
                  }
                </p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}