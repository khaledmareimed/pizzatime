'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { Settings, DeliverySchedule, DeliveryArea, Banner } from '@/funcs/collections/settings'
import DeliveryScheduleSection from './DeliveryScheduleSection'
import DeliveryAreasSection from './DeliveryAreasSection'
import BannersSection from './BannersSection'
import { useToastContext } from '@/funcs/contexts/ToastContext'
import { motion } from 'framer-motion'
import { cn } from '@/funcs/utils'
import { theme, animations } from '@/funcs/responsive'
import Button from '@/components/Button'
import Card from '@/components/Card'

interface SettingsManagementProps {
  session: Session
}

export default function SettingsManagement({ session }: SettingsManagementProps) {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'schedule' | 'areas' | 'banners'>('schedule')
  const { success: showSuccess, error: showError } = useToastContext()

  // Load settings on component mount
  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/settings')
      const result = await response.json()

      if (result.success) {
        setSettings(result.data)
      } else {
        showError(result.error || 'خطأ في تحميل الإعدادات')
      }
    } catch (error) {
      console.error('Error loading settings:', error)
      showError('خطأ في تحميل الإعدادات')
    } finally {
      setLoading(false)
    }
  }

  const updateSettings = async (updatedData: Partial<Settings>) => {
    try {
      setSaving(true)
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedData),
      })

      const result = await response.json()

      if (result.success) {
        setSettings(result.data)
        showSuccess('تم حفظ الإعدادات بنجاح')
        return true
      } else {
        showError(result.error || 'خطأ في حفظ الإعدادات')
        return false
      }
    } catch (error) {
      console.error('Error updating settings:', error)
      showError('خطأ في حفظ الإعدادات')
      return false
    } finally {
      setSaving(false)
    }
  }

  const updateDeliverySchedule = async (schedule: DeliverySchedule) => {
    return await updateSettings({ deliverySchedule: schedule })
  }

  const updateDeliveryAreas = async (areas: DeliveryArea[]) => {
    return await updateSettings({ deliveryAreas: areas })
  }

  const updateBanners = async (banners: Banner[]) => {
    return await updateSettings({ banners })
  }

  if (loading) {
    return (
      <motion.div 
        {...animations.fadeIn}
        className="flex items-center justify-center min-h-[400px]"
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={cn('text-base', theme.text.secondary)}>جاري تحميل الإعدادات...</p>
        </div>
      </motion.div>
    )
  }

  if (!settings) {
    return (
      <motion.div {...animations.fadeIn}>
        <Card className="text-center py-12">
          <p className={cn('text-lg mb-6', theme.text.secondary)}>
            خطأ في تحميل الإعدادات
          </p>
          <Button
            onClick={loadSettings}
            variant="primary"
            className="mx-auto"
          >
            <span className="w-5 h-5 flex items-center justify-center bg-blue-500 rounded text-sm mr-2">↻</span>
            إعادة المحاولة
          </Button>
        </Card>
      </motion.div>
    )
  }

  const tabs = [
    { id: 'schedule', label: 'أوقات التوصيل' },
    { id: 'areas', label: 'المناطق والتكاليف' },
    { id: 'banners', label: 'إدارة البانرات' }
  ] as const

  return (
    <motion.div {...animations.fadeIn} className="space-y-6">
      {/* Tab Navigation */}
      <Card className="p-0 overflow-hidden">
        <div className={cn('flex', theme.border.primary, 'border-b')}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex-1 px-6 py-4 text-center font-medium transition-all duration-200',
                'hover:bg-gray-50 dark:hover:bg-gray-700/50',
                activeTab === tab.id
                  ? cn(
                      'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600',
                      'bg-blue-50 dark:bg-blue-900/20'
                    )
                  : theme.text.secondary
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </Card>

      {/* Tab Content */}
      <Card className="overflow-hidden">
        {activeTab === 'schedule' && (
          <DeliveryScheduleSection
            schedule={settings.deliverySchedule}
            onUpdate={updateDeliverySchedule}
            saving={saving}
          />
        )}

        {activeTab === 'areas' && (
          <DeliveryAreasSection
            areas={settings.deliveryAreas}
            onUpdate={updateDeliveryAreas}
            saving={saving}
          />
        )}

        {activeTab === 'banners' && (
          <BannersSection
            banners={settings.banners}
            onUpdate={updateBanners}
            saving={saving}
          />
        )}
      </Card>

      {/* Last Updated Info */}
      <Card className="text-center py-4">
        <p className={cn('text-sm', theme.text.secondary)}>
          آخر تحديث: {new Date(settings.lastUpdated).toLocaleString('ar-JO', {
            timeZone: 'Asia/Amman',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })} بواسطة {settings.updatedBy}
        </p>
      </Card>
    </motion.div>
  )
}