'use client';

import { useState } from 'react';
import { FileText, CheckCircle } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Card from '../Card';
import Button from '../Button';

interface FormData {
  notes: string;
}

interface CheckoutFormProps {
  onSubmit: (formData: FormData) => void;
  isSubmitting?: boolean;
  selectedAddress?: any;
}

export default function CheckoutForm({ onSubmit, isSubmitting = false, selectedAddress }: CheckoutFormProps) {
  const [formData, setFormData] = useState<FormData>({
    notes: ''
  });

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Card className="mb-6">
      <h2 className={cn(
        'font-bold mb-6',
        responsive.fontSize.xl,
        theme.text.primary
      )}>
        ملاحظات إضافية
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
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
            rows={4}
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
