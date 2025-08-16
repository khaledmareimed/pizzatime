'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive } from '../../funcs/responsive';
import Button from '../Button';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'تأكيد',
  cancelText = 'إلغاء',
  variant = 'danger'
}: ConfirmDialogProps) {
  const variantStyles = {
    danger: {
      icon: 'text-red-500',
      confirmButton: 'bg-red-500 hover:bg-red-600 text-white',
      iconBg: 'bg-red-100 dark:bg-red-900/30'
    },
    warning: {
      icon: 'text-yellow-500',
      confirmButton: 'bg-yellow-500 hover:bg-yellow-600 text-white',
      iconBg: 'bg-yellow-100 dark:bg-yellow-900/30'
    },
    info: {
      icon: 'text-blue-500',
      confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
      iconBg: 'bg-blue-100 dark:bg-blue-900/30'
    }
  };

  const currentVariant = variantStyles[variant];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={cn(
                'w-full max-w-md rounded-2xl shadow-2xl',
                theme.background.card,
                'border',
                theme.border.primary
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 pb-4">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    currentVariant.iconBg
                  )}>
                    <AlertTriangle className={cn('w-5 h-5', currentVariant.icon)} />
                  </div>
                  <h3 className={cn(
                    'font-bold',
                    responsive.fontSize.lg,
                    theme.text.primary
                  )}>
                    {title}
                  </h3>
                </div>
                
                <button
                  onClick={onClose}
                  className={cn(
                    'p-2 rounded-lg transition-colors',
                    'hover:bg-gray-100 dark:hover:bg-gray-800',
                    theme.text.secondary
                  )}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="px-6 pb-6">
                <p className={cn(
                  'mb-6',
                  responsive.fontSize.base,
                  theme.text.secondary
                )}>
                  {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                  <Button
                    onClick={onClose}
                    variant="outline"
                    size="sm"
                    className="min-w-[80px]"
                  >
                    {cancelText}
                  </Button>
                  
                  <Button
                    onClick={() => {
                      onConfirm();
                      onClose();
                    }}
                    size="sm"
                    className={cn(
                      'min-w-[80px]',
                      currentVariant.confirmButton
                    )}
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}