'use client'

import { DollarSign, Calendar } from 'lucide-react'
import { cn } from '../../../../funcs/utils'
import { theme } from '../../../../funcs/responsive'
import { formatJordanCurrency } from '../../../../funcs/jordanLocale'
import Card from '../../../Card'
import { OrderTotals, EditedOrder } from '../types'

interface OrderSummarySectionProps {
  editedOrder: EditedOrder
  totals: OrderTotals
  isEditable?: boolean
}

export default function OrderSummarySection({
  editedOrder,
  totals,
  isEditable = true
}: OrderSummarySectionProps) {

  return (
    <Card>
      <h3 className={cn('text-lg font-semibold mb-4', theme.text.primary)}>
        <DollarSign className="w-5 h-5 inline ml-2" />
        ملخص الطلب
      </h3>

      <div className="space-y-4">
        {/* Order Totals */}
        <div className={cn('border-t pt-4', theme.border.primary)}>
          <div className="space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between">
              <span className={theme.text.secondary}>المجموع الفرعي:</span>
              <span className={theme.text.primary}>
                {formatJordanCurrency(totals.subtotal)}
              </span>
            </div>

            {/* Coupon Discount */}
            {editedOrder.couponDiscount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>خصم الكوبون:</span>
                <span>-{formatJordanCurrency(editedOrder.couponDiscount)}</span>
              </div>
            )}

            {/* Delivery Fee */}
            <div className="flex justify-between">
              <span className={theme.text.secondary}>رسوم التوصيل:</span>
              <span className={theme.text.primary}>
                {editedOrder.deliveryMethod === 'pickup' 
                  ? 'مجاني' 
                  : formatJordanCurrency(editedOrder.deliveryFee)
                }
              </span>
            </div>

            {/* Total */}
            <div className={cn('flex justify-between pt-3 border-t font-bold text-lg', theme.border.primary)}>
              <span className={theme.text.primary}>المجموع:</span>
              <span className="text-orange-600">
                {formatJordanCurrency(totals.total)}
              </span>
            </div>
          </div>
        </div>

        {/* Order Info */}
        {(editedOrder.status || editedOrder.createdAt) && (
          <div className={cn('border-t pt-4', theme.border.primary)}>
            <div className="space-y-2">
              {editedOrder.status && (
                <div className="flex justify-between">
                  <span className={theme.text.secondary}>حالة الطلب:</span>
                  <span className={cn(
                    'px-2 py-1 rounded-full text-xs font-medium',
                    editedOrder.status === 'pending' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300',
                    editedOrder.status === 'confirmed' && 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
                    editedOrder.status === 'preparing' && 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
                    editedOrder.status === 'ready' && 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
                    editedOrder.status === 'delivered' && 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
                    editedOrder.status === 'cancelled' && 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300'
                  )}>
                    {editedOrder.status === 'pending' && 'في الانتظار'}
                    {editedOrder.status === 'confirmed' && 'مؤكد'}
                    {editedOrder.status === 'preparing' && 'قيد التحضير'}
                    {editedOrder.status === 'ready' && 'جاهز'}
                    {editedOrder.status === 'delivered' && 'تم التوصيل'}
                    {editedOrder.status === 'cancelled' && 'ملغي'}
                  </span>
                </div>
              )}
              
              {editedOrder.createdAt && (
                <div className="flex justify-between">
                  <span className={theme.text.secondary}>
                    <Calendar className="w-4 h-4 inline ml-1" />
                    تاريخ الطلب:
                  </span>
                  <span className={cn('text-sm', theme.text.primary)}>
                    {new Date(editedOrder.createdAt).toLocaleDateString('ar-JO', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}