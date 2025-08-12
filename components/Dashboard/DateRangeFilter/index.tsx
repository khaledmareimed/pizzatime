'use client'

import { useState } from 'react'
import { Calendar, ChevronDown } from 'lucide-react'
import { cn } from '@/funcs/utils'
import { theme } from '@/funcs/responsive'
import { formatJordanShortDate } from '@/funcs/jordanLocale'

interface DateRangeFilterProps {
  selectedRange: string
  onRangeChange: (range: string, startDate?: string, endDate?: string) => void
  className?: string
}

const dateRangeOptions = [
  { value: 'today', label: 'اليوم' },
  { value: 'yesterday', label: 'أمس' },
  { value: 'week', label: 'آخر 7 أيام' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'custom', label: 'تاريخ مخصص' },
  { value: 'all', label: 'جميع التواريخ' }
]

export default function DateRangeFilter({ selectedRange, onRangeChange, className }: DateRangeFilterProps) {
  const [showCustomDates, setShowCustomDates] = useState(selectedRange === 'custom')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleRangeChange = (range: string) => {
    if (range === 'custom') {
      setShowCustomDates(true)
    } else {
      setShowCustomDates(false)
      onRangeChange(range)
    }
  }

  const handleCustomDateApply = () => {
    if (startDate && endDate) {
      onRangeChange('custom', startDate, endDate)
    }
  }

  const getCurrentRangeLabel = () => {
    if (selectedRange === 'custom' && startDate && endDate) {
      return `${formatJordanShortDate(startDate)} - ${formatJordanShortDate(endDate)}`
    }
    return dateRangeOptions.find(option => option.value === selectedRange)?.label || 'اليوم'
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
          فترة التاريخ
        </label>
        <div className="relative">
          <Calendar className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <select
            value={selectedRange}
            onChange={(e) => handleRangeChange(e.target.value)}
            className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
          >
            {dateRangeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {showCustomDates && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={cn('block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400', theme.text.secondary)}>
              من تاريخ
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className={cn('block text-xs font-medium mb-1 text-gray-600 dark:text-gray-400', theme.text.secondary)}>
              إلى تاريخ
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          {startDate && endDate && (
            <div className="col-span-2">
              <button
                onClick={handleCustomDateApply}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
              >
                تطبيق التاريخ المخصص
              </button>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 dark:text-gray-400">
        الفترة المحددة: {getCurrentRangeLabel()}
      </div>
    </div>
  )
}