'use client';

import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Card from '../Card';

export default function DeliveryInfo() {
  return (
    <Card>
      <h3 className={cn(
        'font-bold mb-4',
        responsive.fontSize.lg,
        theme.text.primary
      )}>
        معلومات خدمة التوصيل
      </h3>
      
      <div className="space-y-3">
        <div className="flex justify-between">
          <span className={cn('text-sm', theme.text.secondary)}>وقت التوصيل المتوقع:</span>
          <span className={cn('text-sm font-medium', theme.text.primary)}>30-45 دقيقة</span>
        </div>
        
        <div className="flex justify-between">
          <span className={cn('text-sm', theme.text.secondary)}>رسوم التوصيل:</span>
          <span className={cn('text-sm font-medium text-green-600')}>مجانا</span>
        </div>
        
        <div className="flex justify-between">
          <span className={cn('text-sm', theme.text.secondary)}>الدفع:</span>
          <span className={cn('text-sm font-medium', theme.text.primary)}>الدفع عند الإستلام</span>
        </div>
      </div>

      <div className={cn(
        'mt-4 p-3 rounded-xl',
        theme.background.secondary
      )}>
        <p className={cn('text-xs', theme.text.secondary)}>
📞 سيتصل بك فريق التوصيل لدينا قبل 10 دقائق من الوصول        </p>
      </div>
    </Card>
  );
}
