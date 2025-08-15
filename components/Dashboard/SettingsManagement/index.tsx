'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { Settings, DeliverySchedule, DeliveryArea, Banner } from '@/funcs/collections/settings'
import DeliveryScheduleSection from './DeliveryScheduleSection'
import DeliveryAreasSection from './DeliveryAreasSection'
import BannersSection from './BannersSection'
import { useToastContext } from '@/funcs/contexts/ToastContext'

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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">
          خطأ في تحميل الإعدادات
        </p>
        <button
          onClick={loadSettings}
          className="mt-4 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <span className="w-5 h-5 flex items-center justify-center bg-blue-500 rounded text-sm">↻</span>
          إعادة المحاولة
        </button>
      </div>
    )
  }

  const tabs = [
    { id: 'schedule', label: 'أوقات التوصيل' },
    { id: 'areas', label: 'المناطق والتكاليف' },
    { id: 'banners', label: 'إدارة البانرات' }
  ] as const

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-center font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
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
      </div>

      {/* Last Updated Info */}
      <div className="text-sm text-gray-500 dark:text-gray-400 text-center">
        آخر تحديث: {new Date(settings.lastUpdated).toLocaleString('ar-JO', {
          timeZone: 'Asia/Amman',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })} بواسطة {settings.updatedBy}
      </div>
    </div>
  )
}