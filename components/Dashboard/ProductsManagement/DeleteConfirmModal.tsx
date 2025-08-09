'use client'

import { motion } from 'framer-motion'
import { AlertTriangle, Trash2, X } from 'lucide-react'
import Button from '@/components/Button'
import { DeleteConfirmData } from './types'

interface DeleteConfirmModalProps {
  show: boolean
  onClose: () => void
  onConfirm: () => void
  deleteData: DeleteConfirmData | null
}

export default function DeleteConfirmModal({ 
  show, 
  onClose, 
  onConfirm, 
  deleteData 
}: DeleteConfirmModalProps) {
  if (!show || !deleteData) return null

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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center">
            <AlertTriangle className="w-6 h-6 text-red-600 mr-3" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              تأكيد الحذف
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            هل أنت متأكد من حذف {deleteData.type === 'category' ? 'الفئة' : 'المنتج'}{' '}
            <span className="font-semibold text-gray-900 dark:text-white">"{deleteData.name}"</span>؟
            <br />
            <span className="text-sm text-red-600 dark:text-red-400 mt-2 block">
              لا يمكن التراجع عن هذا الإجراء.
            </span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 order-2 sm:order-1"
            >
              إلغاء
            </Button>
            <Button 
              onClick={onConfirm}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white order-1 sm:order-2"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              حذف نهائي
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
