'use client'

import { User, Phone, Mail } from 'lucide-react'
import { cn } from '../../../../funcs/utils'
import { theme } from '../../../../funcs/responsive'
import Card from '../../../Card'
import { CustomerInfo } from '../types'

interface CustomerInfoSectionProps {
  customerInfo: CustomerInfo
  onUpdate: (customerInfo: CustomerInfo) => void
  isEditable?: boolean
}

export default function CustomerInfoSection({ 
  customerInfo, 
  onUpdate, 
  isEditable = true 
}: CustomerInfoSectionProps) {
  const handleInputChange = (field: keyof CustomerInfo, value: string) => {
    if (!isEditable) return
    onUpdate({
      ...customerInfo,
      [field]: value
    })
  }

  return (
    <Card>
      <h3 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
        <User className="w-5 h-5 inline ml-2" />
        معلومات العميل
      </h3>

      {/* Current Customer Information Display */}
      <div className={cn('p-4 rounded-lg border-2 border-dashed mb-4', 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20')}>
        <h4 className={cn('font-semibold mb-3 text-green-800 dark:text-green-200')}>
          معلومات العميل الحالية
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={cn('font-medium', theme.text.secondary)}>الاسم:</span>
            <span className={theme.text.primary}>{customerInfo.name || 'غير محدد'}</span>
          </div>
          <div className="flex justify-between">
            <span className={cn('font-medium', theme.text.secondary)}>رقم الهاتف:</span>
            <span className={theme.text.primary} dir="ltr">{customerInfo.phone || 'غير محدد'}</span>
          </div>
          <div className="flex justify-between">
            <span className={cn('font-medium', theme.text.secondary)}>البريد الإلكتروني:</span>
            <span className={theme.text.primary} dir="ltr">{customerInfo.email || 'غير محدد'}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        {/* Customer Name */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
            اسم العميل
          </label>
          <input
            type="text"
            value={customerInfo.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            disabled={!isEditable}
            className={cn(
              'w-full px-4 py-3 rounded-xl border',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
              !isEditable && 'opacity-60 cursor-not-allowed'
            )}
            placeholder="أدخل اسم العميل"
          />
        </div>

        {/* Customer Phone */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
            <Phone className="w-4 h-4 inline ml-1" />
            رقم الهاتف
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={!isEditable}
            className={cn(
              'w-full px-4 py-3 rounded-xl border',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
              !isEditable && 'opacity-60 cursor-not-allowed'
            )}
            placeholder="أدخل رقم الهاتف"
            dir="ltr"
          />
        </div>

        {/* Customer Email */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
            <Mail className="w-4 h-4 inline ml-1" />
            البريد الإلكتروني
          </label>
          <input
            type="email"
            value={customerInfo.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            disabled={!isEditable}
            className={cn(
              'w-full px-4 py-3 rounded-xl border',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
              !isEditable && 'opacity-60 cursor-not-allowed'
            )}
            placeholder="أدخل البريد الإلكتروني"
            dir="ltr"
          />
        </div>
      </div>
    </Card>
  )
}