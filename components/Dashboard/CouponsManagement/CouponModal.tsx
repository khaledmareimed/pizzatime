'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Save, 
  DollarSign, 
  Percent, 
  Calendar, 
  Users, 
  Settings,
  Tag,
  FileText,
  ToggleLeft,
  ToggleRight,
  AlertCircle,
  Info
} from 'lucide-react'
import Button from '../../Button'
import { CouponForm } from './types'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'

interface CouponModalProps {
  show: boolean
  onClose: () => void
  couponForm: CouponForm
  setCouponForm: (form: CouponForm) => void
  onSave: () => void
  isEditing: boolean
  loading?: boolean
}

export default function CouponModal({ 
  show, 
  onClose, 
  couponForm, 
  setCouponForm, 
  onSave, 
  isEditing,
  loading = false
}: CouponModalProps) {

  const generateCouponCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    setCouponForm({ ...couponForm, code: result })
  }


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
        className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {isEditing ? 'تعديل القسيمة' : 'إضافة قسيمة جديدة'}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          {/* Basic Info Section */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Tag className="w-5 h-5 mr-2" />
              المعلومات الأساسية
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 mr-2" />
                  رمز القسيمة *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                    placeholder="SAVE20"
                    disabled={loading}
                    maxLength={20}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={generateCouponCode}
                    disabled={loading}
                    className="px-3"
                  >
                    توليد
                  </Button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  أحرف كبيرة وأرقام فقط (3-20 حرف)
                </p>
              </div>

              <div>
                <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <FileText className="w-4 h-4 mr-2" />
                  اسم القسيمة *
                </label>
                <input
                  type="text"
                  value={couponForm.name}
                  onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="خصم 20% على جميع المنتجات"
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label className="flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                الوصف
              </label>
              <textarea
                value={couponForm.description}
                onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                placeholder="وصف القسيمة (اختياري)"
                disabled={loading}
              />
            </div>
          </div>

          {/* Discount Settings */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <DollarSign className="w-5 h-5 mr-2" />
              إعدادات الخصم
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  نوع الخصم *
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setCouponForm({ ...couponForm, discountType: 'percentage' })}
                    className={cn(
                      'p-3 rounded-lg border transition-all flex items-center justify-center gap-2',
                      couponForm.discountType === 'percentage'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    )}
                    disabled={loading}
                  >
                    <Percent className="w-4 h-4" />
                    نسبة مئوية
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponForm({ ...couponForm, discountType: 'fixed' })}
                    className={cn(
                      'p-3 rounded-lg border transition-all flex items-center justify-center gap-2',
                      couponForm.discountType === 'fixed'
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-300'
                    )}
                    disabled={loading}
                  >
                    <DollarSign className="w-4 h-4" />
                    مبلغ ثابت
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  قيمة الخصم *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    max={couponForm.discountType === 'percentage' ? 100 : 1000}
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {couponForm.discountType === 'percentage' ? '%' : 'د.أ'}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {couponForm.discountType === 'percentage' 
                    ? 'نسبة الخصم (1-100%)'
                    : 'مبلغ الخصم بالدينار الأردني'
                  }
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الحد الأدنى للطلب
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={couponForm.minimumOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minimumOrderAmount: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="0"
                    disabled={loading}
                  />
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    د.أ
                  </div>
                </div>
              </div>

              {couponForm.discountType === 'percentage' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الحد الأقصى للخصم
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={couponForm.maximumDiscountAmount}
                      onChange={(e) => setCouponForm({ ...couponForm, maximumDiscountAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      placeholder="غير محدود"
                      disabled={loading}
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      د.أ
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    اتركه فارغاً لعدم تحديد حد أقصى
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Usage Limits */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Users className="w-5 h-5 mr-2" />
              حدود الاستخدام
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  إجمالي مرات الاستخدام
                </label>
                <input
                  type="number"
                  min="1"
                  value={couponForm.usageLimit || ''}
                  onChange={(e) => setCouponForm({ ...couponForm, usageLimit: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="غير محدود"
                  disabled={loading}
                />
                <p className="text-xs text-gray-500 mt-1">
                  اتركه فارغاً لعدم تحديد حد أقصى
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  مرات الاستخدام لكل مستخدم *
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={couponForm.userUsageLimit}
                  onChange={(e) => setCouponForm({ ...couponForm, userUsageLimit: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Calendar className="w-5 h-5 mr-2" />
              فترة الصلاحية
            </h4>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ البداية *
                </label>
                <input
                  type="date"
                  value={couponForm.startDate}
                  onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  تاريخ الانتهاء *
                </label>
                <input
                  type="date"
                  value={couponForm.endDate}
                  onChange={(e) => setCouponForm({ ...couponForm, endDate: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-6">
            <h4 className="flex items-center text-lg font-medium text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
              <Settings className="w-5 h-5 mr-2" />
              حالة القسيمة
            </h4>
            
            <div className="flex items-center">
              <label className="flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={couponForm.isActive}
                  onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                  className="sr-only"
                  disabled={loading}
                />
                <div className="flex items-center">
                  {couponForm.isActive ? (
                    <ToggleRight className="w-8 h-8 text-green-500" />
                  ) : (
                    <ToggleLeft className="w-8 h-8 text-gray-400" />
                  )}
                  <span className="mr-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    القسيمة نشطة
                  </span>
                </div>
              </label>
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
            disabled={!couponForm.code.trim() || !couponForm.name.trim() || couponForm.discountValue <= 0 || loading}
            className="order-1 sm:order-2"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? 'جاري الحفظ...' : (isEditing ? 'حفظ التغييرات' : 'إنشاء القسيمة')}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  )
}