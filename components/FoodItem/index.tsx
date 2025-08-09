'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, Trash2, MessageSquare } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';

export interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  addons?: {
    id: string;
    name: string;
    price: number;
  }[];
  comments?: string;
}

interface FoodItemProps {
  item: OrderItem;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
}

export default function FoodItem({ item, onUpdateQuantity, onRemoveItem }: FoodItemProps) {
  const calculateItemTotal = (item: OrderItem) => {
    const basePrice = item.price;
    const addonsPrice = item.addons?.reduce((sum, addon) => sum + addon.price, 0) || 0;
    return (basePrice + addonsPrice) * item.quantity;
  };

  return (
    <div className={cn(
      'p-4 rounded-2xl border',
      theme.background.card,
      theme.border.primary
    )}>
      <div className="flex items-start gap-3" dir="rtl">
        <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src={item.image}
            alt={item.name}
            fill
            className="object-cover"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className={cn(
                'font-medium text-sm',
                theme.text.primary
              )}>
                {item.name}
              </h4>
              <p className={cn('text-xs', theme.text.secondary)}>
                {item.price.toFixed(2)} ر.س للقطعة
              </p>
            </div>
            
            {/* Remove Item Button */}
            <button
              onClick={() => onRemoveItem(item.id)}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center',
                'text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20',
                'transition-all duration-200 hover:scale-110'
              )}
              title="حذف العنصر"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          {/* Addons */}
          {item.addons && item.addons.length > 0 && (
            <div className="mb-3">
              <p className={cn('text-xs font-medium mb-1', theme.text.secondary)}>
                الإضافات:
              </p>
              <div className="space-y-1">
                {item.addons.map((addon) => (
                  <div key={addon.id} className="flex justify-between text-xs">
                    <span className={theme.text.secondary}>+ {addon.name}</span>
                    <span className={theme.text.primary}>+{addon.price.toFixed(2)} ر.س</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Comments */}
          {item.comments && (
            <div className="mb-3">
              <div className="flex items-center gap-1 mb-1">
                <MessageSquare className="w-3 h-3 text-gray-400" />
                <p className={cn('text-xs font-medium', theme.text.secondary)}>
                  تعليمات خاصة:
                </p>
              </div>
              <p className={cn(
                'text-xs px-2 py-1 rounded-lg',
                'bg-gray-50 dark:bg-gray-800',
                theme.text.secondary
              )}>
                {item.comments}
              </p>
            </div>
          )}

          {/* Quantity and Price */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-sm',
                  'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                  'transition-colors',
                  theme.text.primary
                )}
              >
                <Plus className="w-3 h-3" />
              </button>
              
              <span className={cn(
                'text-sm font-medium min-w-[20px] text-center',
                theme.text.primary
              )}>
                {item.quantity}
              </span>
              
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-sm',
                  'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                  'transition-colors',
                  theme.text.primary
                )}
                disabled={item.quantity <= 1}
              >
                <Minus className="w-3 h-3" />
              </button>
            </div>
            
            <div className="text-left">
              <p className={cn('text-sm font-medium', theme.text.primary)}>
                {calculateItemTotal(item).toFixed(2)} دينار أردني
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
