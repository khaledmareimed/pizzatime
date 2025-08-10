'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import Button from '../../Button'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'

interface DeleteConfirmModalProps {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  itemName: string
  itemType: 'coupon'
  loading?: boolean
}

export default function DeleteConfirmModal({
  show,
  onClose,
  onConfirm,
  itemName,
  itemType,
  loading = false
}: DeleteConfirmModalProps) {
  if (!show) return null

  const getItemTypeText = () => {
    switch (itemType) {
      case 'coupon':
        return 'القسيمة'
      default:
        return 'العنصر'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className={cn(
          'rounded-xl shadow-xl w-full max-w-md p-6',
          theme.background.card
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className={cn('text-lg font-semibold', theme.text.primary)}>
              تأكيد الحذف
            </h3>
          </div>
          
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <p className={cn('mb-2', theme.text.primary)}>
            هل أنت متأكد من أنك تريد حذف {getItemTypeText()}:
          </p>
          <p className={cn('font-medium text-red-600 dark:text-red-400')}>
            "{itemName}"
          </p>
          
          {itemType === 'coupon' && (
            <div className={cn(
              'mt-4 p-3 rounded-lg border',
              'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
            )}>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>تنبيه:</strong> لا يمكن حذف القسائم التي تم استخدامها. يمكنك إلغاء تفعيلها بدلاً من ذلك.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 order-2 sm:order-1"
          >
            إلغاء
          </Button>
          
          <Button
            variant="accent"
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 order-1 sm:order-2"
          >
            {loading ? 'جاري الحذف...' : 'حذف نهائياً'}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}