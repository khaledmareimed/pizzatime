'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Calendar, Filter, X, Search } from 'lucide-react'
import { cn } from '@/funcs/utils'
import Button from '@/components/Button'

interface ReportFiltersProps {
  filters: any
  onFiltersChange: (filters: any) => void
  reportType: string
}

interface FilterOption {
  value: string
  label: string
}

export default function ReportFilters({ filters, onFiltersChange, reportType }: ReportFiltersProps) {
  const [categories, setCategories] = useState<FilterOption[]>([])
  const [products, setProducts] = useState<FilterOption[]>([])
  const [customers, setCustomers] = useState<FilterOption[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchFilterOptions()
  }, [])

  const fetchFilterOptions = async () => {
    try {
      setLoading(true)
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories')
      if (categoriesResponse.ok) {
        const categoriesData = await categoriesResponse.json()
        setCategories(categoriesData.categories?.map((cat: any) => ({
          value: cat._id,
          label: cat.name
        })) || [])
      }

      // Fetch products if category is selected
      if (filters.categoryId) {
        const productsResponse = await fetch(`/api/public/categories/${filters.categoryId}/products`)
        if (productsResponse.ok) {
          const productsData = await productsResponse.json()
          setProducts(productsData.products?.map((prod: any) => ({
            value: prod._id,
            label: prod.name
          })) || [])
        }
      }

      // Fetch customers for admin
      const customersResponse = await fetch('/api/admin/users?limit=100')
      if (customersResponse.ok) {
        const customersData = await customersResponse.json()
        setCustomers(customersData.users?.map((user: any) => ({
          value: user._id,
          label: user.name || user.email
        })) || [])
      }

    } catch (error) {
      console.error('Error fetching filter options:', error)
    } finally {
      setLoading(false)
    }
  }

  const dateRangeOptions = [
    { value: 'today', label: 'اليوم' },
    { value: 'week', label: 'هذا الأسبوع' },
    { value: 'month', label: 'هذا الشهر' },
    { value: 'quarter', label: 'هذا الربع' },
    { value: 'year', label: 'هذا العام' },
    { value: 'custom', label: 'فترة مخصصة' }
  ]

  const orderStatusOptions = [
    { value: '', label: 'جميع الحالات' },
    { value: 'pending', label: 'في الانتظار' },
    { value: 'confirmed', label: 'مؤكد' },
    { value: 'preparing', label: 'قيد التحضير' },
    { value: 'ready', label: 'جاهز' },
    { value: 'out-for-delivery', label: 'في الطريق' },
    { value: 'delivered', label: 'تم التسليم' },
    { value: 'cancelled', label: 'ملغي' }
  ]

  const paymentMethodOptions = [
    { value: '', label: 'جميع طرق الدفع' },
    { value: 'cash', label: 'نقداً' },
    { value: 'card', label: 'بطاقة' },
    { value: 'online', label: 'أونلاين' }
  ]

  const deliveryMethodOptions = [
    { value: '', label: 'جميع طرق التسليم' },
    { value: 'delivery', label: 'توصيل' },
    { value: 'pickup', label: 'استلام' }
  ]

  const groupByOptions = [
    { value: 'hour', label: 'ساعة' },
    { value: 'day', label: 'يوم' },
    { value: 'week', label: 'أسبوع' },
    { value: 'month', label: 'شهر' },
    { value: 'year', label: 'سنة' }
  ]

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { [key]: value }
    
    // Reset dependent filters
    if (key === 'categoryId') {
      newFilters.productId = ''
      if (value) {
        // Fetch products for selected category
        fetchProductsForCategory(value)
      } else {
        setProducts([])
      }
    }
    
    // Apply all changes at once
    onFiltersChange(newFilters)
  }

  const fetchProductsForCategory = async (categoryId: string) => {
    try {
      const response = await fetch(`/api/public/categories/${categoryId}/products`)
      if (response.ok) {
        const data = await response.json()
        setProducts(data.products?.map((prod: any) => ({
          value: prod._id,
          label: prod.name
        })) || [])
      }
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: 'month',
      startDate: '',
      endDate: '',
      categoryId: '',
      productId: '',
      customerId: '',
      orderStatus: '',
      paymentMethod: '',
      deliveryMethod: '',
      groupBy: 'day',
      compareWith: ''
    })
    setProducts([])
  }

  const getRelevantFilters = () => {
    const baseFilters = ['dateRange', 'groupBy']
    
    switch (reportType) {
      case 'sales-revenue':
        return [...baseFilters, 'categoryId', 'productId', 'paymentMethod']
      case 'customer-analytics':
        return [...baseFilters, 'customerId']
      case 'product-performance':
        return [...baseFilters, 'categoryId', 'productId']
      case 'operational-efficiency':
        return [...baseFilters, 'orderStatus', 'deliveryMethod']
      case 'financial-performance':
        return [...baseFilters, 'paymentMethod']
      default:
        return [...baseFilters, 'categoryId', 'orderStatus', 'paymentMethod', 'deliveryMethod']
    }
  }

  const relevantFilters = getRelevantFilters()

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          فلاتر التقرير
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={clearAllFilters}
          className="flex items-center space-x-2 rtl:space-x-reverse"
        >
          <X className="w-4 h-4" />
          <span>مسح الكل</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {/* Date Range */}
        {relevantFilters.includes('dateRange') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              الفترة الزمنية
            </label>
            <select
              value={filters.dateRange}
              onChange={(e) => handleFilterChange('dateRange', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {dateRangeOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Custom Date Range */}
        {filters.dateRange === 'custom' && (
          <>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                من تاريخ
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                إلى تاريخ
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        )}

        {/* Category Filter */}
        {relevantFilters.includes('categoryId') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              الفئة
            </label>
            <select
              value={filters.categoryId}
              onChange={(e) => handleFilterChange('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع الفئات</option>
              {categories.map(category => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Product Filter */}
        {relevantFilters.includes('productId') && filters.categoryId && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              المنتج
            </label>
            <select
              value={filters.productId}
              onChange={(e) => handleFilterChange('productId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع المنتجات</option>
              {products.map(product => (
                <option key={product.value} value={product.value}>
                  {product.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Customer Filter */}
        {relevantFilters.includes('customerId') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              العميل
            </label>
            <select
              value={filters.customerId}
              onChange={(e) => handleFilterChange('customerId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">جميع العملاء</option>
              {customers.map(customer => (
                <option key={customer.value} value={customer.value}>
                  {customer.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Order Status Filter */}
        {relevantFilters.includes('orderStatus') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              حالة الطلب
            </label>
            <select
              value={filters.orderStatus}
              onChange={(e) => handleFilterChange('orderStatus', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {orderStatusOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Method Filter */}
        {relevantFilters.includes('paymentMethod') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              طريقة الدفع
            </label>
            <select
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {paymentMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Delivery Method Filter */}
        {relevantFilters.includes('deliveryMethod') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              طريقة التسليم
            </label>
            <select
              value={filters.deliveryMethod}
              onChange={(e) => handleFilterChange('deliveryMethod', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {deliveryMethodOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Group By Filter */}
        {relevantFilters.includes('groupBy') && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              تجميع البيانات
            </label>
            <select
              value={filters.groupBy}
              onChange={(e) => handleFilterChange('groupBy', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {groupByOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
    </div>
  )
}