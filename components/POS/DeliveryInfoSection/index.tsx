'use client'

import { useState, useEffect } from 'react'
import { MapPin, Truck, Package, Phone, User } from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import Card from '../../Card'
import Button from '../../Button'

interface DeliveryArea {
  _id: string
  cityName: string
  name: string
  locations: {
    _id: string
    locationName: string
    name: string
    customerCost: number
  }[]
}

interface CustomerInfo {
  name: string
  phone: string
  email?: string
}

interface DeliveryInfo {
  recipientName: string
  city: string
  cityId: string
  location: string
  locationId: string
  deliveryCost: number
  phone: string
  addressDetails: string
  isDefault: boolean
}

interface DeliveryInfoSectionProps {
  deliveryMethod: 'delivery' | 'pickup'
  customerInfo: CustomerInfo
  deliveryInfo?: DeliveryInfo
  onDeliveryMethodChange: (method: 'delivery' | 'pickup') => void
  onCustomerInfoUpdate: (customerInfo: CustomerInfo) => void
  onDeliveryInfoUpdate: (deliveryInfo: DeliveryInfo) => void
  isEditable?: boolean
}

export default function DeliveryInfoSection({
  deliveryMethod,
  customerInfo,
  deliveryInfo,
  onDeliveryMethodChange,
  onCustomerInfoUpdate,
  onDeliveryInfoUpdate,
  isEditable = true
}: DeliveryInfoSectionProps) {
  
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([])
  const [selectedCity, setSelectedCity] = useState<DeliveryArea | null>(null)
  const [isLoadingAreas, setIsLoadingAreas] = useState(false)

  // Load delivery areas on component mount
  useEffect(() => {
    fetchDeliveryAreas()
  }, [])

  // Set selected city when delivery areas load and we have existing delivery info
  useEffect(() => {
    if (deliveryAreas.length > 0 && deliveryMethod === 'delivery' && deliveryInfo) {
      if (deliveryInfo.cityId) {
        const city = deliveryAreas.find(area => area._id === deliveryInfo.cityId)
        if (city) {
          setSelectedCity(city)
        }
      } else if (deliveryInfo.city && !deliveryInfo.cityId) {
        const city = deliveryAreas.find(area => 
          (area.cityName && area.cityName === deliveryInfo.city) ||
          (area.name && area.name === deliveryInfo.city)
        )
        if (city) {
          setSelectedCity(city)
          handleDeliveryInfoChange('cityId', city._id)
          handleDeliveryInfoChange('city', city.cityName || city.name)
        }
      }
    }
  }, [deliveryAreas, deliveryInfo?.cityId, deliveryInfo?.city, deliveryMethod])

  const fetchDeliveryAreas = async () => {
    try {
      setIsLoadingAreas(true)
      const response = await fetch('/api/public/delivery-areas')
      const data = await response.json()
      
      if (data.success && data.data && Array.isArray(data.data.areas)) {
        setDeliveryAreas(data.data.areas)
      } else if (data.success && Array.isArray(data.data)) {
        setDeliveryAreas(data.data)
      }
    } catch (error) {
      console.error('Error fetching delivery areas:', error)
    } finally {
      setIsLoadingAreas(false)
    }
  }

  const handleCustomerInfoChange = (field: keyof CustomerInfo, value: string) => {
    if (!isEditable) return
    
    onCustomerInfoUpdate({
      ...customerInfo,
      [field]: value
    })
  }

  const handleDeliveryInfoChange = (field: keyof DeliveryInfo, value: string | number | boolean) => {
    if (!isEditable || !deliveryInfo) return
    
    onDeliveryInfoUpdate({
      ...deliveryInfo,
      [field]: value
    })
  }

  const handleDeliveryMethodChange = (method: 'delivery' | 'pickup') => {
    if (!isEditable) return
    
    console.log('🔄 POS: Changing delivery method to:', method)
    onDeliveryMethodChange(method)
    
    if (method === 'delivery' && !deliveryInfo) {
      // Create default delivery info
      const defaultDeliveryInfo: DeliveryInfo = {
        recipientName: customerInfo.name,
        city: '',
        cityId: '',
        location: '',
        locationId: '',
        deliveryCost: 0,
        phone: customerInfo.phone,
        addressDetails: '',
        isDefault: false
      }
      onDeliveryInfoUpdate(defaultDeliveryInfo)
    }
  }

  const handleCityChange = (cityId: string) => {
    if (!isEditable || !deliveryInfo) return
    
    console.log('🏙️ POS: Handling city change:', cityId)
    const city = deliveryAreas.find(area => area._id === cityId)
    console.log('🏙️ POS: Found city:', city)
    
    setSelectedCity(city || null)
    
    if (city) {
      const cityName = city.cityName || city.name
      console.log('🏙️ POS: Setting city info:', { cityId: city._id, cityName })
      
      // Update delivery info with new city
      const updatedDeliveryInfo = {
        ...deliveryInfo,
        cityId: city._id,
        city: cityName,
        locationId: '',
        location: '',
        deliveryCost: 0
      }
      
      console.log('🏙️ POS: Updated delivery info:', updatedDeliveryInfo)
      onDeliveryInfoUpdate(updatedDeliveryInfo)
    }
  }

  const handleLocationChange = (locationId: string) => {
    if (!isEditable || !selectedCity || !deliveryInfo) return
    
    console.log('📍 POS: Handling location change:', locationId)
    const location = selectedCity.locations.find(loc => loc._id === locationId)
    console.log('📍 POS: Found location:', location)
    
    if (location) {
      const locationName = location.locationName || location.name
      console.log('📍 POS: Setting location info:', { 
        locationId: location._id, 
        locationName, 
        cost: location.customerCost 
      })
      
      // Update delivery info with new location
      const updatedDeliveryInfo = {
        ...deliveryInfo,
        locationId: location._id,
        location: locationName,
        deliveryCost: location.customerCost
      }
      
      console.log('📍 POS: Updated delivery info:', updatedDeliveryInfo)
      onDeliveryInfoUpdate(updatedDeliveryInfo)
    }
  }

  return (
    <Card>
      <h3 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
        <Truck className="w-5 h-5 inline ml-2" />
        معلومات التوصيل والعميل
      </h3>

      {/* Delivery Method Toggle */}
      <div className="mb-6">
        <label className={cn('block text-sm font-medium mb-3', theme.text.secondary)}>
          طريقة الاستلام
        </label>
        <div className="flex gap-3">
          <Button
            onClick={() => handleDeliveryMethodChange('delivery')}
            disabled={!isEditable}
            variant={deliveryMethod === 'delivery' ? 'primary' : 'secondary'}
            size="sm"
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              deliveryMethod === 'delivery' 
                ? 'ring-2 ring-orange-500 ring-opacity-50' 
                : 'hover:ring-1 hover:ring-orange-300'
            )}
          >
            <Truck className="w-4 h-4" />
            توصيل
          </Button>
          <Button
            onClick={() => handleDeliveryMethodChange('pickup')}
            disabled={!isEditable}
            variant={deliveryMethod === 'pickup' ? 'primary' : 'secondary'}
            size="sm"
            className={cn(
              "flex items-center gap-2 transition-all duration-200",
              deliveryMethod === 'pickup' 
                ? 'ring-2 ring-green-500 ring-opacity-50' 
                : 'hover:ring-1 hover:ring-green-300'
            )}
          >
            <Package className="w-4 h-4" />
            استلام من المحل
          </Button>
        </div>
      </div>

      {/* Customer Information - Always show */}
      <div className="space-y-4 mb-6">
        <h4 className={cn('font-semibold', theme.text.primary)}>
          معلومات العميل
        </h4>
        
        {/* Customer Name */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
            اسم العميل {deliveryMethod === 'delivery' ? '*' : '(اختياري)'}
          </label>
          <input
            type="text"
            value={customerInfo.name}
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
            رقم الهاتف {deliveryMethod === 'delivery' ? '*' : '(اختياري)'}
          </label>
          <input
            type="tel"
            value={customerInfo.phone}
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
            placeholder="أدخل رقم الهاتف"
            dir="ltr"
          />
        </div>

        {/* Customer Email */}
        <div>
          <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
            البريد الإلكتروني (اختياري)
          </label>
          <input
            type="email"
            value={customerInfo.email || ''}
            onChange={(e) => handleCustomerInfoChange('email', e.target.value)}
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
          />
        </div>
      </div>

      {/* Delivery Details - Only show for delivery method */}
      {deliveryMethod === 'delivery' && deliveryInfo && (
        <div className="space-y-4">
          <h4 className={cn('font-semibold mb-4', theme.text.primary)}>
            معلومات التوصيل
          </h4>

          {/* Recipient Name */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              اسم المستلم
            </label>
            <input
              type="text"
              value={deliveryInfo.recipientName}
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
              المدينة *
            </label>
            <div className="relative">
              <select
                value={deliveryInfo.cityId || ''}
                onChange={(e) => {
                  console.log('🏙️ City selected:', e.target.value)
                  handleCityChange(e.target.value)
                }}
                disabled={!isEditable || isLoadingAreas}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border appearance-none bg-white dark:bg-gray-800',
                  theme.border.primary,
                  theme.text.primary,
                  'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
                  'transition-all duration-200',
                  (!isEditable || isLoadingAreas) && 'opacity-60 cursor-not-allowed',
                  deliveryInfo.cityId && 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                )}
              >
                <option value="" disabled>
                  {isLoadingAreas ? 'جاري التحميل...' : 'اختر المدينة'}
                </option>
                {Array.isArray(deliveryAreas) && deliveryAreas.map((area) => (
                  <option key={area._id} value={area._id}>
                    {area.cityName || area.name || 'مدينة غير محددة'}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {deliveryInfo.cityId && (
                <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                  <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                </div>
              )}
            </div>
            {deliveryInfo.cityId && selectedCity && (
              <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                ✓ تم اختيار: {selectedCity.cityName || selectedCity.name}
              </p>
            )}
          </div>

          {/* Location Selection */}
          {selectedCity && Array.isArray(selectedCity.locations) && selectedCity.locations.length > 0 && (
            <div>
              <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
                المنطقة *
              </label>
              <div className="relative">
                <select
                  value={deliveryInfo.locationId || ''}
                  onChange={(e) => {
                    console.log('📍 Location selected:', e.target.value)
                    handleLocationChange(e.target.value)
                  }}
                  disabled={!isEditable}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border appearance-none bg-white dark:bg-gray-800',
                    theme.border.primary,
                    theme.text.primary,
                    'focus:ring-2 focus:ring-orange-500 focus:border-orange-500',
                    'transition-all duration-200',
                    !isEditable && 'opacity-60 cursor-not-allowed',
                    deliveryInfo.locationId && 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  )}
                >
                  <option value="" disabled>اختر المنطقة</option>
                  {selectedCity.locations.map((location) => (
                    <option key={location._id} value={location._id}>
                      {location.locationName || location.name || 'منطقة غير محددة'} - {formatJordanCurrency(location.customerCost)}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {deliveryInfo.locationId && (
                  <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                  </div>
                )}
              </div>
              {deliveryInfo.locationId && (
                <p className="mt-1 text-xs text-orange-600 dark:text-orange-400">
                  ✓ تم اختيار: {selectedCity.locations.find(loc => loc._id === deliveryInfo.locationId)?.locationName || 
                    selectedCity.locations.find(loc => loc._id === deliveryInfo.locationId)?.name} - 
                  {formatJordanCurrency(deliveryInfo.deliveryCost)}
                </p>
              )}
            </div>
          )}

          {/* Address Details */}
          <div>
            <label className={cn('block text-sm font-medium mb-2', theme.text.secondary)}>
              تفاصيل العنوان
            </label>
            <textarea
              value={deliveryInfo.addressDetails}
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
              value={deliveryInfo.phone}
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
          {deliveryInfo.deliveryCost > 0 && (
            <div className={cn('p-3 rounded-lg', 'bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800')}>
              <div className="flex items-center justify-between">
                <span className={cn('text-sm font-medium', theme.text.secondary)}>
                  <MapPin className="w-4 h-4 inline ml-1" />
                  رسوم التوصيل:
                </span>
                <span className="text-orange-600 font-semibold">
                  {formatJordanCurrency(deliveryInfo.deliveryCost)}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pickup Message */}
      {deliveryMethod === 'pickup' && (
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

export type { DeliveryArea, CustomerInfo, DeliveryInfo }