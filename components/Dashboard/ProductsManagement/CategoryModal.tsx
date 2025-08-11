'use client'

import { motion } from 'framer-motion'
import { X, Save, Palette, Hash, FileText } from 'lucide-react'
import Button from '@/components/Button'
import { CategoryForm } from './types'

interface CategoryModalProps {
  show: boolean
  onClose: () => void
  categoryForm: CategoryForm
  setCategoryForm: (form: CategoryForm) => void
  onSave: () => void
  isEditing: boolean
  loading?: boolean
}

export default function CategoryModal({ 
  show, 
  onClose, 
  categoryForm, 
  setCategoryForm, 
  onSave, 
  isEditing,
  loading = false
}: CategoryModalProps) {
  if (!show) return null

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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'تعديل الفئة' : 'إضافة فئة جديدة'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Category Name */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              اسم الفئة *
            </label>
            <input
              type="text"
              value={categoryForm.name}
              onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              placeholder="أدخل اسم الفئة"
              disabled={loading}
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <FileText className="w-4 h-4 mr-2" />
              الوصف
            </label>
            <textarea
              value={categoryForm.description}
              onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              placeholder="أدخل وصف الفئة (اختياري)"
              disabled={loading}
            />
          </div>

          {/* Display Order and Color */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Hash className="w-4 h-4 mr-2" />
                ترتيب العرض
              </label>
              <input
                type="number"
                value={categoryForm.displayOrder}
                onChange={(e) => setCategoryForm({ ...categoryForm, displayOrder: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                min="0"
                disabled={loading}
              />
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                <Palette className="w-4 h-4 mr-2" />
                اللون
              </label>
              
              {/* Color Picker */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-16 h-16 border-2 border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer disabled:cursor-not-allowed transition-all hover:scale-105"
                    disabled={loading}
                  />
                </div>
                <div className="flex-1">
                  <div 
                    className="w-full h-16 rounded-xl border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center"
                    style={{ backgroundColor: categoryForm.color }}
                  >
                    <span className="text-white font-medium text-sm drop-shadow-lg">
                      معاينة اللون
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={loading}
            className="order-2 sm:order-1"
          >
            إلغاء
          </Button>
          <Button 
            onClick={onSave} 
            disabled={!categoryForm.name.trim() || loading}
            className="order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'جاري الحفظ...' : (isEditing ? 'حفظ التغييرات' : 'إضافة الفئة')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}
