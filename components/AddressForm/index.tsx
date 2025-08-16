'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Phone, User, Save, DollarSign } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import { UserAddress } from '../../funcs/collections/user';
import { formatJordanCurrency } from '../../funcs/jordanLocale';
import Button from '../Button';
import Card from '../Card';

interface DeliveryLocation {
  _id: string
  locationName: string
  customerCost: number
}

interface DeliveryArea {
  _id: string
  cityName: string
  locations: DeliveryLocation[]
}

interface AddressFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (address: Omit<UserAddress, '_id'>) => Promise<void>;
  editingAddress?: UserAddress | null;
  isSubmitting?: boolean;
  hideDeliveryPrice?: boolean;
}

export default function AddressForm({
  isOpen,
  onClose,
  onSave,
  editingAddress,
  isSubmitting = false,
  hideDeliveryPrice = false
}: AddressFormProps) {
  const [formData, setFormData] = useState<Omit<UserAddress, '_id'>>({
    name: '',
    recipientName: '',
    city: '',
    cityId: '',
    location: '',
    locationId: '',
    deliveryCost: 0,
    phone: '',
    addressDetails: '',
    isDefault: false
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deliveryAreas, setDeliveryAreas] = useState<DeliveryArea[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(true);
  const [selectedCity, setSelectedCity] = useState<DeliveryArea | null>(null);

  // Load delivery areas on component mount
  useEffect(() => {
    if (isOpen) {
      loadDeliveryAreas();
    }
  }, [isOpen]);

  // Update form data when editingAddress changes
  useEffect(() => {
    if (editingAddress) {
      setFormData({
        name: editingAddress.name || '',
        recipientName: editingAddress.recipientName || '',
        city: editingAddress.city || '',
        cityId: editingAddress.cityId || '',
        location: editingAddress.location || '',
        locationId: editingAddress.locationId || '',
        deliveryCost: editingAddress.deliveryCost || 0,
        phone: editingAddress.phone || '',
        addressDetails: editingAddress.addressDetails || '',
        isDefault: editingAddress.isDefault || false
      });
      
      // Set selected city when editing - try both cityId and cityName for compatibility
      if (deliveryAreas.length > 0) {
        let city = null;
        
        // First try to find by cityId (preferred method)
        if (editingAddress.cityId) {
          city = deliveryAreas.find(area => area._id === editingAddress.cityId);
        }
        
        // Fallback: find by cityName if cityId doesn't work
        if (!city && editingAddress.city) {
          city = deliveryAreas.find(area => area.cityName === editingAddress.city);
        }
        
        setSelectedCity(city || null);
      }
    } else {
      setFormData({
        name: '',
        recipientName: '',
        city: '',
        cityId: '',
        location: '',
        locationId: '',
        deliveryCost: 0,
        phone: '',
        addressDetails: '',
        isDefault: false
      });
      setSelectedCity(null);
    }
    setErrors({}); // Clear errors when switching between add/edit
  }, [editingAddress, isOpen, deliveryAreas]);

  // Update form cityId and locationId when selectedCity changes during editing
  useEffect(() => {
    if (editingAddress && selectedCity && deliveryAreas.length > 0) {
      // Update cityId if it's different from the selected city
      if (formData.cityId !== selectedCity._id) {
        setFormData(prev => ({
          ...prev,
          cityId: selectedCity._id,
          city: selectedCity.cityName
        }));
      }
      
      // Set the correct location if we have locationId or location name
      if (editingAddress.locationId || editingAddress.location) {
        let location = null;
        
        // First try to find by locationId (preferred method)
        if (editingAddress.locationId) {
          location = selectedCity.locations.find(loc => loc._id === editingAddress.locationId);
        }
        
        // Fallback: find by location name if locationId doesn't work
        if (!location && editingAddress.location) {
          location = selectedCity.locations.find(loc => loc.locationName === editingAddress.location);
        }
        
        // Update form data with correct location info
        if (location) {
          setFormData(prev => ({
            ...prev,
            locationId: location._id,
            location: location.locationName,
            deliveryCost: location.customerCost
          }));
        }
      }
    }
  }, [selectedCity, editingAddress, deliveryAreas]);

  const loadDeliveryAreas = async () => {
    try {
      setLoadingAreas(true);
      const response = await fetch('/api/public/delivery-areas');
      const result = await response.json();

      if (result.success) {
        setDeliveryAreas(result.data.areas || []);
      } else {
        setErrors({ general: 'خطأ في تحميل مناطق التوصيل' });
      }
    } catch (error) {
      console.error('Error loading delivery areas:', error);
      setErrors({ general: 'خطأ في تحميل مناطق التوصيل' });
    } finally {
      setLoadingAreas(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'اسم العنوان مطلوب';
    }

    if (!formData.recipientName.trim()) {
      newErrors.recipientName = 'اسم المستلم مطلوب';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'المدينة مطلوبة';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'المنطقة مطلوبة';
    }

    if (formData.deliveryCost <= 0) {
      newErrors.location = 'يرجى اختيار منطقة صحيحة';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^[\+]?[0-9\s\-\(\)]{10,15}$/.test(formData.phone.trim())) {
      newErrors.phone = 'رقم الهاتف غير صحيح';
    }

    if (!formData.addressDetails.trim()) {
      newErrors.addressDetails = 'تفاصيل العنوان مطلوبة';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCityChange = (cityId: string) => {
    const city = deliveryAreas.find(area => area._id === cityId);
    setSelectedCity(city || null);
    
    setFormData(prev => ({
      ...prev,
      city: city?.cityName || '',
      cityId: cityId,
      location: '',
      locationId: '',
      deliveryCost: 0
    }));

    // Clear location error when city changes
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleLocationChange = (locationId: string) => {
    if (!selectedCity) return;
    
    const location = selectedCity.locations.find(loc => loc._id === locationId);
    
    setFormData(prev => ({
      ...prev,
      location: location?.locationName || '',
      locationId: locationId,
      deliveryCost: location?.customerCost || 0
    }));

    // Clear location error when location changes
    if (errors.location) {
      setErrors(prev => ({ ...prev, location: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onSave({
        name: formData.name.trim(),
        recipientName: formData.recipientName.trim(),
        city: formData.city.trim(),
        cityId: formData.cityId.trim(),
        location: formData.location.trim(),
        locationId: formData.locationId.trim(),
        deliveryCost: formData.deliveryCost,
        phone: formData.phone.trim(),
        addressDetails: formData.addressDetails.trim(),
        isDefault: formData.isDefault
      });
      
      // Reset form only if not editing
      if (!editingAddress) {
        setFormData({
          name: '',
          recipientName: '',
          city: '',
          location: '',
          deliveryCost: 0,
          phone: '',
          addressDetails: '',
          isDefault: false
        });
      }
      setErrors({});
      onClose();
    } catch (error) {
      console.error('Error saving address:', error);
      // Show user-friendly error message
      if (error instanceof Error) {
        setErrors({ general: error.message });
      } else {
        setErrors({ general: 'حدث خطأ في حفظ العنوان. يرجى المحاولة مرة أخرى.' });
      }
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm overflow-y-auto"
        onClick={onClose}
      >
        <div className="min-h-full flex items-center justify-center p-4 py-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto"
          >
          <Card className="p-4 sm:p-6 my-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h2 className={cn(
                'font-bold',
                responsive.fontSize.xl,
                theme.text.primary
              )}>
                {editingAddress ? 'تعديل العنوان' : 'إضافة عنوان جديد'}
              </h2>
              
              <button
                onClick={onClose}
                className={cn(
                  'p-2 rounded-xl transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  theme.text.secondary
                )}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* General Error Display */}
            {errors.general && (
              <div className="p-3 bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
                <p className="text-red-600 dark:text-red-400 text-sm">{errors.general}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              {/* Address Name */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme.text.primary
                )}>
                  اسم العنوان *
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="مثل: المنزل، العمل، عند الأصدقاء"
                    className={cn(
                      'w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors',
                      theme.background.card,
                      errors.name ? 'border-red-500' : theme.border.primary,
                      theme.text.primary,
                      'placeholder-gray-400 dark:placeholder-gray-500'
                    )}
                    dir="rtl"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                )}
              </div>

              {/* Recipient Name */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme.text.primary
                )}>
                  اسم المستلم *
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.recipientName}
                    onChange={(e) => handleInputChange('recipientName', e.target.value)}
                    placeholder="اسم الشخص الذي سيستلم الطلب"
                    className={cn(
                      'w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors',
                      theme.background.card,
                      errors.recipientName ? 'border-red-500' : theme.border.primary,
                      theme.text.primary,
                      'placeholder-gray-400 dark:placeholder-gray-500'
                    )}
                    dir="rtl"
                  />
                </div>
                {errors.recipientName && (
                  <p className="text-red-500 text-sm mt-1">{errors.recipientName}</p>
                )}
              </div>

              {/* City Selection */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme.text.primary
                )}>
                  المدينة *
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.cityId}
                    onChange={(e) => handleCityChange(e.target.value)}
                    disabled={loadingAreas}
                    className={cn(
                      'w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors appearance-none',
                      theme.background.card,
                      errors.city ? 'border-red-500' : theme.border.primary,
                      theme.text.primary,
                      loadingAreas ? 'opacity-50 cursor-not-allowed' : ''
                    )}
                    dir="rtl"
                  >
                    <option value="">
                      {loadingAreas ? 'جاري التحميل...' : 'اختر المدينة'}
                    </option>
                    {deliveryAreas.map((area) => (
                      <option key={area._id} value={area._id}>
                        {area.cityName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.city && (
                  <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                )}
              </div>

              {/* Location Selection */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme.text.primary
                )}>
                  المنطقة *
                </label>
                <div className="relative">
                  <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    disabled={!selectedCity || selectedCity.locations.length === 0}
                    className={cn(
                      'w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors appearance-none',
                      theme.background.card,
                      errors.location ? 'border-red-500' : theme.border.primary,
                      theme.text.primary,
                      !selectedCity ? 'opacity-50 cursor-not-allowed' : ''
                    )}
                    dir="rtl"
                  >
                    <option value="">
                      {!selectedCity 
                        ? 'اختر المدينة أولاً' 
                        : selectedCity.locations.length === 0 
                          ? 'لا توجد مناطق متاحة'
                          : 'اختر المنطقة'
                      }
                    </option>
                    {selectedCity?.locations.map((location) => (
                      <option key={location._id} value={location._id}>
                        {location.locationName}
                      </option>
                    ))}
                  </select>
                  <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.location && (
                  <p className="text-red-500 text-sm mt-1">{errors.location}</p>
                )}
              </div>


              {/* Phone */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme.text.primary
                )}>
                  رقم الهاتف *
                </label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="+966 50 123 4567"
                    className={cn(
                      'w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors',
                      theme.background.card,
                      errors.phone ? 'border-red-500' : theme.border.primary,
                      theme.text.primary,
                      'placeholder-gray-400 dark:placeholder-gray-500'
                    )}
                    dir="ltr"
                  />
                </div>
                {errors.phone && (
                  <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
                )}
              </div>

              {/* Address Details */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme.text.primary
                )}>
                  تفاصيل العنوان *
                </label>
                <textarea
                  value={formData.addressDetails}
                  onChange={(e) => handleInputChange('addressDetails', e.target.value)}
                  placeholder="الحي، الشارع، رقم المبنى، رقم الشقة، معالم مميزة..."
                  rows={3}
                  className={cn(
                    'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors resize-none',
                    theme.background.card,
                    errors.addressDetails ? 'border-red-500' : theme.border.primary,
                    theme.text.primary,
                    'placeholder-gray-400 dark:placeholder-gray-500'
                  )}
                  dir="rtl"
                />
                {errors.addressDetails && (
                  <p className="text-red-500 text-sm mt-1">{errors.addressDetails}</p>
                )}
              </div>

              {/* Default Address */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => handleInputChange('isDefault', e.target.checked)}
                  className="w-4 h-4 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
                />
                <label
                  htmlFor="isDefault"
                  className={cn('text-sm', theme.text.primary)}
                >
                  جعل هذا العنوان الافتراضي
                </label>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  variant="accent"
                  fullWidth
                  disabled={isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الحفظ...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingAddress ? 'تحديث العنوان' : 'حفظ العنوان'}
                    </>
                  )}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  disabled={isSubmitting}
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </Card>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}