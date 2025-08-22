'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Truck, Store, User, Phone } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Card from '../Card';

interface DeliveryMethodSelectorProps {
  selectedMethod: 'delivery' | 'pickup';
  onMethodChange: (method: 'delivery' | 'pickup') => void;
  pickupInfo?: {
    fullName: string;
    phone: string;
  };
  onPickupInfoChange?: (info: { fullName: string; phone: string }) => void;
  errors?: {
    fullName?: string;
    phone?: string;
  };
}

export default function DeliveryMethodSelector({
  selectedMethod,
  onMethodChange,
  pickupInfo = { fullName: '', phone: '' },
  onPickupInfoChange,
  errors = {}
}: DeliveryMethodSelectorProps) {
  
  const handleInputChange = (field: 'fullName' | 'phone', value: string) => {
    if (onPickupInfoChange) {
      onPickupInfoChange({
        ...pickupInfo,
        [field]: value
      });
    }
  };

  return (
    <Card className="p-6">
      <h3 className={cn(
        'font-bold mb-6',
        responsive.fontSize.lg,
        theme.text.primary
      )}>
        طريقة الاستلام
      </h3>

      <div className="space-y-4">
        {/* Delivery Option */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onMethodChange('delivery')}
          className={cn(
            'p-4 rounded-xl border cursor-pointer transition-all',
            selectedMethod === 'delivery'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : cn(theme.border.primary, theme.background.card, 'hover:border-orange-300')
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                selectedMethod === 'delivery'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              )}>
                <Truck className="w-5 h-5" />
              </div>
              
              <div>
                <h4 className={cn('font-medium', theme.text.primary)}>
                  توصيل للمنزل
                </h4>
                <p className={cn('text-sm', theme.text.secondary)}>
                  سيتم توصيل طلبك إلى العنوان المحدد
                </p>
              </div>
            </div>
            
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              selectedMethod === 'delivery'
                ? 'border-orange-500 bg-orange-500'
                : 'border-gray-300 dark:border-gray-600'
            )}>
              {selectedMethod === 'delivery' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Pickup Option */}
        <motion.div
          whileTap={{ scale: 0.98 }}
          onClick={() => onMethodChange('pickup')}
          className={cn(
            'p-4 rounded-xl border cursor-pointer transition-all',
            selectedMethod === 'pickup'
              ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
              : cn(theme.border.primary, theme.background.card, 'hover:border-orange-300')
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={cn(
                'p-2 rounded-lg',
                selectedMethod === 'pickup'
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
              )}>
                <Store className="w-5 h-5" />
              </div>
              
              <div>
                <h4 className={cn('font-medium', theme.text.primary)}>
                  استلام من المطعم
                </h4>
                <p className={cn('text-sm', theme.text.secondary)}>
                  احضر لاستلام طلبك من المطعم مباشرة
                </p>
              </div>
            </div>
            
            <div className={cn(
              'w-5 h-5 rounded-full border-2 flex items-center justify-center',
              selectedMethod === 'pickup'
                ? 'border-orange-500 bg-orange-500'
                : 'border-gray-300 dark:border-gray-600'
            )}>
              {selectedMethod === 'pickup' && (
                <div className="w-2 h-2 bg-white rounded-full" />
              )}
            </div>
          </div>
        </motion.div>

        {/* Pickup Information Form */}
        {selectedMethod === 'pickup' && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'mt-4 p-4 rounded-xl border-2 border-dashed',
              'border-orange-200 bg-orange-50/50 dark:border-orange-800 dark:bg-orange-900/10'
            )}
          >
            <h4 className={cn(
              'font-medium mb-4 flex items-center gap-2',
              theme.text.primary
            )}>
              <User className="w-4 h-4" />
              معلومات الاستلام
            </h4>

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className={cn(
                  'block text-sm font-medium mb-2',
                  theme.text.primary
                )}>
                  الاسم الكامل *
                </label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={pickupInfo.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    placeholder="أدخل اسمك الكامل"
                    className={cn(
                      'w-full pr-10 pl-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors',
                      theme.background.card,
                      errors.fullName ? 'border-red-500' : theme.border.primary,
                      theme.text.primary,
                      'placeholder-gray-400 dark:placeholder-gray-500'
                    )}
                    dir="rtl"
                  />
                </div>
                {errors.fullName && (
                  <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>
                )}
              </div>

              {/* Phone Number */}
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
                    value={pickupInfo.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="0797758060"
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

            </div>
          </motion.div>
        )}
      </div>
    </Card>
  );
}