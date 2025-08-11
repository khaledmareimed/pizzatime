'use client'

import React, { useState } from 'react'
import { CartSummary } from '@/funcs/types/cart'
import Button from '@/components/Button'

interface CustomerFormProps {
  onSubmit: (customerData: any) => void
  onCancel: () => void
  cartSummary: CartSummary
}

export default function CustomerForm({ onSubmit, onCancel, cartSummary }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '', // Simple address field
    city: '', // City field for delivery
    deliveryMethod: 'pickup', // pickup or delivery
    paymentMethod: 'cash', // cash, card
    notes: ''
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const handleInputChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value
    })

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: ''
      })
    }
  }

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Customer name is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (formData.deliveryMethod === 'delivery') {
      if (!formData.address.trim()) {
        newErrors.address = 'Address is required for delivery'
      }
      if (!formData.city.trim()) {
        newErrors.city = 'City is required for delivery'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (validateForm()) {
      onSubmit(formData)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" dir="rtl">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <div className="p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white">
              إكمال الطلب
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              ×
            </button>
          </div>

          {/* Order Summary */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">ملخص الطلب</h3>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">
                {cartSummary.totalItems} عنصر ({cartSummary.totalQuantity} إجمالي)
              </span>
              <span className="font-bold text-green-600 dark:text-green-400">
                {cartSummary.total.toFixed(2)} ر.س
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Customer Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                اسم العميل *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.name ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="أدخل اسم العميل"
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                رقم الهاتف *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder="أدخل رقم الهاتف"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                البريد الإلكتروني (اختياري)
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="أدخل عنوان البريد الإلكتروني"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                العنوان {formData.deliveryMethod === 'delivery' ? '*' : '(اختياري)'}
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                  errors.address ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                placeholder={formData.deliveryMethod === 'delivery' ? 'أدخل عنوان التوصيل' : 'أدخل العنوان (اختياري)'}
              />
              {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
            </div>

            {/* City field - only show for delivery */}
            {formData.deliveryMethod === 'delivery' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  المدينة *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white ${
                    errors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="أدخل المدينة"
                />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
            )}

            {/* Delivery Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع الطلب
              </label>
              <div className="flex space-x-4 space-x-reverse">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="pickup"
                    checked={formData.deliveryMethod === 'pickup'}
                    onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                    className="ml-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">استلام</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="delivery"
                    checked={formData.deliveryMethod === 'delivery'}
                    onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                    className="ml-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">توصيل</span>
                </label>
              </div>
            </div>


            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                طريقة الدفع
              </label>
              <div className="flex space-x-4 space-x-reverse">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cash"
                    checked={formData.paymentMethod === 'cash'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="ml-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">نقدي</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    className="ml-2"
                  />
                  <span className="text-gray-700 dark:text-gray-300">بطاقة</span>
                </label>
              </div>
            </div>

            {/* Order Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ملاحظات الطلب (اختياري)
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                placeholder="أي تعليمات خاصة لهذا الطلب..."
                rows={3}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3 space-x-reverse pt-4">
              <Button
                onClick={onCancel}
                variant="outline"
                size="md"
              >
                إلغاء
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="bg-green-500 hover:bg-green-600"
              >
                إنشاء الطلب - {cartSummary.total.toFixed(2)} ر.س
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}