'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Calendar, DollarSign, Tag, FileText, AlertCircle, CheckCircle } from 'lucide-react'
import { cn } from '@/funcs/utils'
import Button from '@/components/Button'

interface ExpenseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  expense?: any
}

interface ExpenseCategory {
  id: string
  name: string
  nameEn: string
  description: string
  icon: string
  color: string
  isRecurring: boolean
  defaultRecurringPeriod?: string
}

export default function ExpenseModal({ isOpen, onClose, onSave, expense }: ExpenseModalProps) {
  const [categories, setCategories] = useState<ExpenseCategory[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    description: '',
    paymentMethod: 'cash',
    notes: '',
    invoiceNumber: '',
    invoiceImage: '',
    dueDate: '',
    isRecurring: false,
    recurringPeriod: '',
    tags: [] as string[]
  })

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      if (expense) {
        setFormData({
          category: expense.category || '',
          amount: expense.amount?.toString() || '',
          description: expense.description || '',
          paymentMethod: expense.paymentMethod || 'cash',
          notes: expense.notes || '',
          invoiceNumber: expense.invoiceNumber || '',
          invoiceImage: expense.invoiceImage || '',
          dueDate: expense.dueDate ? new Date(expense.dueDate).toISOString().split('T')[0] : '',
          isRecurring: expense.isRecurring || false,
          recurringPeriod: expense.recurringPeriod || '',
          tags: expense.tags || []
        })
      } else {
        resetForm()
      }
    }
  }, [isOpen, expense])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/expenses/categories')
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      category: '',
      amount: '',
      description: '',
      paymentMethod: 'cash',
      notes: '',
      invoiceNumber: '',
      invoiceImage: '',
      dueDate: '',
      isRecurring: false,
      recurringPeriod: '',
      tags: []
    })
    setError(null)
  }

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Auto-set recurring period based on category
    if (field === 'category') {
      const selectedCategory = categories.find(cat => cat.id === value)
      if (selectedCategory?.isRecurring && selectedCategory.defaultRecurringPeriod) {
        setFormData(prev => ({
          ...prev,
          isRecurring: true,
          recurringPeriod: selectedCategory.defaultRecurringPeriod || ''
        }))
      }
    }
  }

  const handleTagAdd = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }))
    }
  }

  const handleTagRemove = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validation
    if (!formData.category || !formData.amount || !formData.description) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      return
    }

    if (Number(formData.amount) <= 0) {
      setError('يجب أن يكون المبلغ أكبر من صفر')
      return
    }

    try {
      setSaving(true)
      setError(null)

      const url = expense ? '/api/expenses' : '/api/expenses'
      const method = expense ? 'PUT' : 'POST'
      const body = expense 
        ? { expenseId: expense._id, ...formData, amount: Number(formData.amount) }
        : { ...formData, amount: Number(formData.amount) }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'فشل في حفظ المصروف')
      }

      onSave()
    } catch (error: any) {
      console.error('Error saving expense:', error)
      setError(error.message || 'حدث خطأ أثناء حفظ المصروف')
    } finally {
      setSaving(false)
    }
  }

  const paymentMethods = [
    { value: 'cash', label: 'نقداً' },
    { value: 'card', label: 'بطاقة' },
    { value: 'bank_transfer', label: 'تحويل بنكي' },
    { value: 'check', label: 'شيك' }
  ]

  const recurringPeriods = [
    { value: 'weekly', label: 'أسبوعياً' },
    { value: 'monthly', label: 'شهرياً' },
    { value: 'quarterly', label: 'ربع سنوي' },
    { value: 'yearly', label: 'سنوياً' }
  ]

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
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {expense ? 'تعديل المصروف' : 'إضافة مصروف جديد'}
                </h2>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-3 rtl:space-x-reverse"
                >
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  <span className="text-red-800 dark:text-red-200">{error}</span>
                </motion.div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Category */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    فئة المصروف *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">اختر فئة المصروف</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Amount */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    المبلغ (دينار أردني) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.amount}
                    onChange={(e) => handleInputChange('amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    طريقة الدفع
                  </label>
                  <select
                    value={formData.paymentMethod}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {paymentMethods.map(method => (
                      <option key={method.value} value={method.value}>
                        {method.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الوصف *
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="وصف المصروف"
                    required
                  />
                </div>

                {/* Invoice Number */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    رقم الفاتورة
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="رقم الفاتورة (اختياري)"
                  />
                </div>

                {/* Due Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تاريخ الاستحقاق
                  </label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => handleInputChange('dueDate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Recurring */}
                <div className="md:col-span-2">
                  <label className="flex items-center space-x-3 rtl:space-x-reverse">
                    <input
                      type="checkbox"
                      checked={formData.isRecurring}
                      onChange={(e) => handleInputChange('isRecurring', e.target.checked)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      مصروف متكرر
                    </span>
                  </label>
                </div>

                {/* Recurring Period */}
                {formData.isRecurring && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      فترة التكرار
                    </label>
                    <select
                      value={formData.recurringPeriod}
                      onChange={(e) => handleInputChange('recurringPeriod', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">اختر فترة التكرار</option>
                      {recurringPeriods.map(period => (
                        <option key={period.value} value={period.value}>
                          {period.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    ملاحظات
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="ملاحظات إضافية (اختياري)"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end space-x-3 rtl:space-x-reverse pt-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={saving}
                >
                  إلغاء
                </Button>
                
                <Button
                  type="submit"
                  disabled={saving || !formData.category || !formData.amount || !formData.description}
                  className="flex items-center space-x-2 rtl:space-x-reverse"
                >
                  {saving ? (
                    <>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                      />
                      <span>جاري الحفظ...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      <span>{expense ? 'تحديث' : 'حفظ'}</span>
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </AnimatePresence>
  )
}