'use client'

import { useState } from 'react'
import { DeliverySchedule, DaySchedule } from '@/funcs/collections/settings'
import { motion } from 'framer-motion'
import { cn } from '@/funcs/utils'
import { theme, animations } from '@/funcs/responsive'
import Button from '@/components/Button'
import Card from '@/components/Card'
import { formatJordanTime } from '@/funcs/jordanLocale'

interface DeliveryScheduleSectionProps {
  schedule: DeliverySchedule
  onUpdate: (schedule: DeliverySchedule) => Promise<boolean>
  saving: boolean
}

export default function DeliveryScheduleSection({ 
  schedule, 
  onUpdate, 
  saving 
}: DeliveryScheduleSectionProps) {
  const [localSchedule, setLocalSchedule] = useState<DeliverySchedule>(schedule)
  const [hasChanges, setHasChanges] = useState(false)

  const dayNames = {
    sunday: 'الأحد',
    monday: 'الاثنين',
    tuesday: 'الثلاثاء',
    wednesday: 'الأربعاء',
    thursday: 'الخميس',
    friday: 'الجمعة',
    saturday: 'السبت'
  }

  const updateDaySchedule = (day: keyof DeliverySchedule, updates: Partial<DaySchedule>) => {
    const newSchedule = {
      ...localSchedule,
      [day]: {
        ...localSchedule[day],
        ...updates
      }
    }
    setLocalSchedule(newSchedule)
    setHasChanges(true)
  }

  const handleSave = async () => {
    const success = await onUpdate(localSchedule)
    if (success) {
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setLocalSchedule(schedule)
    setHasChanges(false)
  }

  const setAllDays = (updates: Partial<DaySchedule>) => {
    const newSchedule = { ...localSchedule }
    Object.keys(dayNames).forEach(day => {
      newSchedule[day as keyof DeliverySchedule] = {
        ...newSchedule[day as keyof DeliverySchedule],
        ...updates
      }
    })
    setLocalSchedule(newSchedule)
    setHasChanges(true)
  }

  const getCurrentJordanTime = () => {
    return formatJordanTime(new Date())
  }

  return (
    <motion.div {...animations.fadeIn} className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className={cn('text-xl font-semibold', theme.text.primary)}>
            أوقات التوصيل اليومية
          </h2>
          <p className={cn('mt-1', theme.text.secondary)}>
            إدارة أوقات عمل المطعم لكل يوم من أيام الأسبوع (توقيت الأردن)
          </p>
          <p className={cn('text-sm mt-1', theme.text.accent)}>
            الوقت الحالي في الأردن: {getCurrentJordanTime()}
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex gap-3">
            <Button
              onClick={handleReset}
              disabled={saving}
              variant="outline"
              size="sm"
            >
              <span className="w-4 h-4 flex items-center justify-center ml-2">×</span>
              إلغاء
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              variant="primary"
              size="sm"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
              ) : (
                <span className="w-4 h-4 flex items-center justify-center bg-blue-500 rounded text-xs ml-2">✓</span>
              )}
              حفظ التغييرات
            </Button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <Card className="mb-6 p-4">
        <h3 className={cn('text-sm font-medium mb-3', theme.text.primary)}>
          إجراءات سريعة
        </h3>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setAllDays({ isOpen: true })}
            variant="secondary"
            size="sm"
            className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800/50"
          >
            فتح جميع الأيام
          </Button>
          <Button
            onClick={() => setAllDays({ isOpen: false })}
            variant="secondary"
            size="sm"
            className="bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800/50"
          >
            إغلاق جميع الأيام
          </Button>
          <Button
            onClick={() => setAllDays({ openTime: '09:00', closeTime: '23:00' })}
            variant="secondary"
            size="sm"
            className="bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800/50"
          >
            توحيد الأوقات (9 ص - 11 م)
          </Button>
        </div>
      </Card>

      {/* Days Schedule */}
      <div className="space-y-4">
        {Object.entries(dayNames).map(([dayKey, dayName]) => {
          const day = dayKey as keyof DeliverySchedule
          const daySchedule = localSchedule[day]
          
          return (
            <div
              key={day}
              className={`p-4 border rounded-lg transition-colors ${
                daySchedule.isOpen
                  ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                  : 'border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    {dayName}
                  </h3>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={daySchedule.isOpen}
                      onChange={(e) => updateDaySchedule(day, { isOpen: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className={`text-sm font-medium ${
                      daySchedule.isOpen 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-red-700 dark:text-red-300'
                    }`}>
                      {daySchedule.isOpen ? 'مفتوح' : 'مغلق'}
                    </span>
                  </label>
                </div>

                {daySchedule.isOpen && (
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        من:
                      </label>
                      <input
                        type="time"
                        value={daySchedule.openTime}
                        onChange={(e) => updateDaySchedule(day, { openTime: e.target.value })}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <label className="text-sm text-gray-600 dark:text-gray-400">
                        إلى:
                      </label>
                      <input
                        type="time"
                        value={daySchedule.closeTime}
                        onChange={(e) => updateDaySchedule(day, { closeTime: e.target.value })}
                        className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>

              {daySchedule.isOpen && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  ساعات العمل: {daySchedule.openTime} - {daySchedule.closeTime}
                  {(() => {
                    const [openHour, openMin] = daySchedule.openTime.split(':').map(Number)
                    const [closeHour, closeMin] = daySchedule.closeTime.split(':').map(Number)
                    const openMinutes = openHour * 60 + openMin
                    const closeMinutes = closeHour * 60 + closeMin
                    const totalMinutes = closeMinutes > openMinutes 
                      ? closeMinutes - openMinutes 
                      : (24 * 60) - openMinutes + closeMinutes
                    const hours = Math.floor(totalMinutes / 60)
                    const minutes = totalMinutes % 60
                    return ` (${hours} ساعة${minutes > 0 ? ` و ${minutes} دقيقة` : ''})`
                  })()}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Schedule Summary */}
      <Card className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20">
        <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
          ملخص الجدول الأسبوعي
        </h3>
        <div className="text-sm text-blue-800 dark:text-blue-300 grid grid-cols-2 gap-4">
          <div>
            أيام العمل: {Object.values(localSchedule).filter(day => day.isOpen).length} من 7 أيام
          </div>
          <div>
            أيام الإغلاق: {Object.values(localSchedule).filter(day => !day.isOpen).length} من 7 أيام
          </div>
        </div>
      </Card>
    </motion.div>
  )
}