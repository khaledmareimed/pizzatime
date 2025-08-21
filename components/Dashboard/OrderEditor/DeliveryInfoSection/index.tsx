'use client'

import { MapPin, Truck, Package, Phone } from 'lucide-react'
import { cn } from '../../../../funcs/utils'
import { theme } from '../../../../funcs/responsive'
import { formatJordanCurrency } from '../../../../funcs/jordanLocale'
import Card from '../../../Card'
import Button from '../../../Button'
import { DeliveryInfo, DeliveryArea, EditedOrder, CustomerInfo } from '../types'

interface DeliveryInfoSectionProps {
  editedOrder: EditedOrder
  deliveryAreas: DeliveryArea[]
  selectedCity: DeliveryArea | null
  onDeliveryInfoUpdate: (deliveryInfo: DeliveryInfo) => void
  onDeliveryMethodChange: (method: 'delivery' | 'pickup') => void
  onCitySelect: (city: DeliveryArea | null) => void
  onCustomerInfoUpdate: (customerInfo: CustomerInfo) => void
  isEditable?: boolean
}

export default function DeliveryInfoSection({
  editedOrder,
  deliveryAreas,
  selectedCity,
  onDeliveryInfoUpdate,
  onDeliveryMethodChange,
  onCitySelect,
  onCustomerInfoUpdate,
  isEditable = true
}: DeliveryInfoSectionProps) {
  
  const handleDeliveryInfoChange = (field: keyof DeliveryInfo, value: string | number | boolean) => {
    if (!isEditable || !editedOrder.deliveryInfo) return
    
    onDeliveryInfoUpdate({
      ...editedOrder.deliveryInfo,
      [field]: value
    })
  }

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    if (!isEditable) return
    
    onCustomerInfoUpdate({
      ...editedOrder.customerInfo,
      [field]: value
    })
  }

  const handleCityChange = (cityId: string) => {
    if (!isEditable) return
    
    const city = deliveryAreas.find(area => area._id === cityId)
    onCitySelect(city || null)
    
    if (city && editedOrder.deliveryInfo) {
      onDeliveryInfoUpdate({
        ...editedOrder.deliveryInfo,
        cityId: city._id,
        city: city.cityName,
        locationId: '',
        location: '',
        deliveryCost: 0
      })
    }
  }

  const handleLocationChange = (locationId: string) => {
    if (!isEditable || !selectedCity || !editedOrder.deliveryInfo) return
    
    const location = selectedCity.locations.find(loc => loc._id === locationId)
    if (location) {
      onDeliveryInfoUpdate({
        ...editedOrder.deliveryInfo,
        locationId: location._id,
        location: location.locationName,
        deliveryCost: location.customerCost
      })
    }
  }

  return (
    <Card>
      <h3 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
        <Truck className="w-5 h-5 inline ml-2" />
        معلومات التوصيل والعميل
      </h3>

      {/* Current Information Display */}
      <div className={cn('p-4 rounded-lg border-2 border-dashed mb-4', 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20')}>
        <h4 className={cn('font-semibold mb-3 text-blue-800 dark:text-blue-200')}>
          المعلومات الحالية
        </h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className={cn('font-medium', theme.text.secondary)}>طريقة الاستلام:</span>
            <span className={theme.text.primary}>
              {editedOrder.deliveryMethod === 'delivery' ? 'توصيل' : 'استلام من المحل'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className={cn('font-medium', theme.text.secondary)}>اسم العميل:</span>
            <span className={theme.text.primary}>{editedOrder.customerInfo.name || 'غير محدد'}</span>
          </div>
          <div className="flex justify-between">
            <span className={cn('font-medium', theme.text.secondary)}>رقم الهاتف:</span>
            <span className={theme.text.primary} dir="ltr">{editedOrder.customerInfo.phone || 'غير محدد'}</span>
          </div>
          {editedOrder.deliveryMethod === 'delivery' && editedOrder.deliveryInfo && (
            <>
              <div className="flex justify-between">
                <span className={cn('font-medium', theme.text.secondary)}>المدينة:</span>
                <span className={theme.text.primary}>{editedOrder.deliveryInfo.city || 'غير محددة'}</span>
              </div>
              <div className="flex justify-between">
                <span className={cn('font-medium', theme.text.secondary)}>المنطقة:</span>
                <span className={theme.text.primary}>{editedOrder.deliveryInfo.location || 'غير محددة'}</span>
              </div>
              <div className="flex justify-between">
                <span className={cn('font-medium', theme.text.secondary)}>تفاصيل العنوان:</span>
                <span className={theme.text.primary}>{editedOrder.deliveryInfo.addressDetails || 'غير محدد'}</span>
              </div>
              {editedOrder.deliveryInfo.deliveryCost > 0 && (
                <div className="flex justify-between pt-2 border-t border-blue-200 dark:border-blue-700">
                  <span className={cn('font-medium', theme.text.secondary)}>رسوم التوصيل:</span>
                  <span className="text-orange-600 font-semibold">
                    {formatJordanCurrency(editedOrder.deliveryInfo.deliveryCost)}
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Delivery Method Toggle */}
      <div className="mb-6">
        <label className={cn('block text-sm font-medium mb-3', theme.text.secondary)}>
          طريقة الاستلام
        </label>
        <div className="flex gap-3">
          <Button
            onClick={() => {
              console.log('🚚 Delivery button clicked')
              onDeliveryMethodChange('delivery')
            }}
            disabled={!isEditable}
            variant={editedOrder.deliveryMethod === 'delivery' ? 'primary' : 'secondary'}
            size="sm"
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              editedOrder.deliveryMethod === 'delivery' 
                ? 'ring-2 ring-orange-500 ring-opacity-50' 
                : 'hover:ring-1 hover:ring-orange-300'
            )}
          >
            <Truck className="w-4 h-4" />
            توصيل
          </Button>
          <Button
            onClick={() => {
              console.log('🏪 Pickup button clicked')
              onDeliveryMethodChange('pickup')
            }}
            disabled={!isEditable}
            variant={editedOrder.deliveryMethod === 'pickup' ? 'primary' : 'secondary'}
            size="sm"
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              editedOrder.deliveryMethod === 'pickup' 
                ? 'ring-2 ring-green-500 ring-opacity-50' 
                : 'hover:ring-1 hover:ring-green-300'
            )}
          >
            <Package className="w-4 h-4" />
            استلام من المحل
          </Button>
        </div>
        
        {/* Debug info for development */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
            <p><strong>Current Method:</strong> {editedOrder.deliveryMethod}</p>
            <p><strong>Has Delivery Info:</strong> {editedOrder.deliveryInfo ? 'Yes' : 'No'}</p>
            {editedOrder.deliveryInfo && (
              <p><strong>Delivery Cost:</strong> {editedOrder.deliveryInfo.deliveryCost}</p>
            )}
          </div>
        )}
      </div>

      {/* Pickup Customer Information - Only show for pickup method */}
      {editedOrder.deliveryMethod === 'pickup' && (
        <div className="space-y-4">
          <h4 className={cn('font-semibold mb-4', theme.text.primary)}>
            معلومات العميل (اختياري)
          </h4>
          
          {/* Customer Name */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              اسم العميل
            </label>
            <input
              type="text"
              value={editedOrder.customerInfo.name}
              onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                !isEditable && 'opacity-60 cursor-not-allowed'
              )}
              placeholder="أدخل اسم العميل (اختياري)"
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
              value={editedOrder.customerInfo.phone}
              onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                !isEditable && 'opacity-60 cursor-not-allowed'
              )}
              placeholder="أدخل رقم الهاتف (اختياري)"
              dir="ltr"
            />
          </div>
        </div>
      )}

      {/* Delivery Details - Only show for delivery method */}
      {editedOrder.deliveryMethod === 'delivery' && editedOrder.deliveryInfo && (
        <div className="space-y-4">
          <h4 className={cn('font-semibold mb-4', theme.text.primary)}>
            معلومات العميل والتوصيل
          </h4>

          {/* Customer Name */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              اسم العميل
            </label>
            <input
              type="text"
              value={editedOrder.customerInfo.name}
              onChange={(e) => handleCustomerInfoChange('name', e.target.value)}
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
              رقم هاتف العميل
            </label>
            <input
              type="tel"
              value={editedOrder.customerInfo.phone}
              onChange={(e) => handleCustomerInfoChange('phone', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                !isEditable && 'opacity-60 cursor-not-allowed'
              )}
              placeholder="أدخل رقم هاتف العميل"
              dir="ltr"
            />
          </div>

          {/* Recipient Name */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              اسم المستلم
            </label>
            <input
              type="text"
              value={editedOrder.deliveryInfo.recipientName}
              onChange={(e) => handleDeliveryInfoChange('recipientName', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                !isEditable && 'opacity-60 cursor-not-allowed'
              )}
              placeholder="أدخل اسم المستلم"
            />
          </div>

          {/* City Selection */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              المدينة
            </label>
            <select
              value={editedOrder.deliveryInfo.cityId || ''}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={!isEditable}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                !isEditable && 'opacity-60 cursor-not-allowed'
              )}
            >
              <option value="">اختر المدينة</option>
              {Array.isArray(deliveryAreas) && deliveryAreas.map((area) => (
                <option key={area._id} value={area._id}>
                  {area.cityName || 'مدينة غير محددة'}
                </option>
              ))}
            </select>
          </div>

          {/* Location Selection */}
          {selectedCity && Array.isArray(selectedCity.locations) && selectedCity.locations.length > 0 && (
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                المنطقة
              </label>
              <select
                value={editedOrder.deliveryInfo.locationId || ''}
                onChange={(e) => handleLocationChange(e.target.value)}
                disabled={!isEditable}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                  !isEditable && 'opacity-60 cursor-not-allowed'
                )}
              >
                <option value="">اختر المنطقة</option>
                {selectedCity.locations.map((location) => (
                  <option key={location._id} value={location._id}>
                    {location.locationName || 'منطقة غير محددة'} - {formatJordanCurrency(location.customerCost)}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Address Details */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              تفاصيل العنوان
            </label>
            <textarea
              value={editedOrder.deliveryInfo.addressDetails}
              onChange={(e) => handleDeliveryInfoChange('addressDetails', e.target.value)}
              disabled={!isEditable}
              rows={3}
              className={cn(
                'w-full px-4 py-3 rounded-xl border resize-none',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                !isEditable && 'opacity-60 cursor-not-allowed'
              )}
              placeholder="أدخل تفاصيل العنوان (رقم البناية، الشارع، إلخ)"
            />
          </div>

          {/* Delivery Phone */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              رقم هاتف التوصيل
            </label>
            <input
              type="tel"
              value={editedOrder.deliveryInfo.phone}
              onChange={(e) => handleDeliveryInfoChange('phone', e.target.value)}
              disabled={!isEditable}
              className={cn(
                'w-full px-4 py-3 rounded-xl border',
                theme.background.card,
                theme.border.primary,
                theme.text.primary,
                'focus:ring-2 focus:ring-orange-500 focus:border-transparent',
                !isEditable && 'opacity-60 cursor-not-allowed'
              )}
              placeholder="أدخل رقم هاتف التوصيل"
              dir="ltr"
            />
          </div>

          {/* Delivery Cost Display */}
          {editedOrder.deliveryInfo.deliveryCost > 0 && (
            <div className={cn('p-3 rounded-lg', 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800')}>
              <div className="flex items-center justify-between">
                <span className={cn('text-sm font-medium', theme.text.secondary)}>
                  <MapPin className="w-4 h-4 inline ml-1" />
                  رسوم التوصيل:
                </span>
                <span className="text-orange-600 font-semibold">
                  {formatJordanCurrency(editedOrder.deliveryInfo.deliveryCost)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pickup Message */}
      {editedOrder.deliveryMethod === 'pickup' && (
        <div className={cn('p-4 rounded-lg text-center', 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800')}>
          <Package className="w-8 h-8 mx-auto mb-2 text-green-600" />
          <p className={cn('text-sm font-medium', theme.text.primary)}>
            سيتم استلام الطلب من المحل
          </p>
          <p className={cn('text-xs mt-1', theme.text.secondary)}>
            لا توجد رسوم توصيل
          </p>
        </div>
      )}
    </Card>
  )
}