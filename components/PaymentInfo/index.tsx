'use client';

import { CreditCard } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Card from '../Card';

export default function PaymentInfo() {
  return (
    <Card className="mb-6">
      <h3 className={cn(
        'font-bold mb-4',
        responsive.fontSize.lg,
        theme.text.primary
      )}>
        <CreditCard className="w-5 h-5 inline mr-2" />
        طريقة الدفع
      </h3>
      
      <div className={cn(
        'p-4 rounded-2xl border-2 border-dashed',
        'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
      )}>
        <div className="flex items-center justify-between mb-2">
          <span className={cn('font-medium', theme.text.primary)}>
            💵 الدفع عند الإستلام
          </span>
          <span className="text-green-600 dark:text-green-400 text-sm font-bold">
            COD
          </span>
        </div>
        <p className={cn('text-sm', theme.text.secondary)}>
ادفع عند توصيل طلبك إلى باب منزلك        </p>
      </div>
    </Card>
  );
}
