'use client';

import { useState } from 'react';
import { User, MapPin, Phone, FileText, CheckCircle } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Card from '../Card';
import Button from '../Button';

interface FormData {
  name: string;
  city: string;
  phone: string;
  address: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  city?: string;
  phone?: string;
  address?: string;
}

interface CheckoutFormProps {
  onSubmit: (formData: FormData) => void;
  isSubmitting?: boolean;
}

const cities = [
  'New York',
  'Los Angeles',
  'Chicago',
  'Houston',
  'Phoenix',
  'Philadelphia',
  'San Antonio',
  'San Diego',
  'Dallas',
  'San Jose'
];

export default function CheckoutForm({ onSubmit, isSubmitting = false }: CheckoutFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    city: '',
    phone: '',
    address: '',
    notes: ''
  });

  const [errors, setErrors] = useState<FormErrors>({});

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field in errors) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'الإسم مطلوب';
    }

    if (!formData.city) {
      newErrors.city = 'الرجاء اختيار مدينة';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'رقم الهاتف مطلوب';
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phone)) {
      newErrors.phone = 'الرجاء إدخال رقم هاتف صالح';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'عنوان التسليم مطلوب';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <Card className="mb-6">
      <h2 className={cn(
        'font-bold mb-6',
        responsive.fontSize.xl,
        theme.text.primary
      )}>

معلومات التوصيل      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Field */}
        <div>
          <label className={cn(
            'block text-sm font-medium mb-2',
            theme.text.primary
          )}>
            <User className="w-4 h-4 inline mr-2" />
            الإسم الكامل *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="أدخل اسمك الكامل"
            className={cn(
              'w-full px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 transition-colors',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              'placeholder-gray-400 dark:placeholder-gray-500',
              errors.name && 'border-red-500 focus:ring-red-500'
            )}
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* City Dropdown */}
        <div>
          <label className={cn(
            'block text-sm font-medium mb-2',
            theme.text.primary
          )}>
            <MapPin className="w-4 h-4 inline mr-2" />
            المدينة *
          </label>
          <select
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            className={cn(
              'w-full px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 transition-colors',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              errors.city && 'border-red-500 focus:ring-red-500'
            )}
          >
            <option value="">اختر مدينتك</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
          {errors.city && (
            <p className="text-red-500 text-sm mt-1">{errors.city}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className={cn(
            'block text-sm font-medium mb-2',
            theme.text.primary
          )}>
            <Phone className="w-4 h-4 inline mr-2" />
            رقم الهاتف *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            placeholder="أدخل رقم هاتفك"
            className={cn(
              'w-full px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 transition-colors',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              'placeholder-gray-400 dark:placeholder-gray-500',
              errors.phone && 'border-red-500 focus:ring-red-500'
            )}
          />
          {errors.phone && (
            <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className={cn(
            'block text-sm font-medium mb-2',
            theme.text.primary
          )}>
            <MapPin className="w-4 h-4 inline mr-2" />
            عنوان التسليم *
          </label>
          <textarea
            value={formData.address}
            onChange={(e) => handleInputChange('address', e.target.value)}
            placeholder="أدخل عنوان التسليم الكامل"
            rows={3}
            className={cn(
              'w-full px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 transition-colors resize-none',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              'placeholder-gray-400 dark:placeholder-gray-500',
              errors.address && 'border-red-500 focus:ring-red-500'
            )}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className={cn(
            'block text-sm font-medium mb-2',
            theme.text.primary
          )}>
            <FileText className="w-4 h-4 inline mr-2" />
            ملاحظات إضافية (اختياري)
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder="أي ملاحظات لديك للتوصيل او غير ذلك..."
            rows={3}
            className={cn(
              'w-full px-4 py-3 rounded-2xl border focus:ring-2 focus:ring-orange-500 transition-colors resize-none',
              theme.background.card,
              theme.border.primary,
              theme.text.primary,
              'placeholder-gray-400 dark:placeholder-gray-500'
            )}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          variant="accent"
          size="lg"
          fullWidth
          disabled={isSubmitting}
          className="group"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جاري معالجة الطلب...
            </>
          ) : (
            <>
              أرسل طلبك
              <CheckCircle className="ml-2 w-5 h-5 group-hover:scale-110 transition-transform" />
            </>
          )}
        </Button>
      </form>
    </Card>
  );
}
