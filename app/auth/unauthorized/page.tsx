'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ShieldX, Home, LogIn } from 'lucide-react'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import Button from '@/components/Button'
import Card from '@/components/Card'

export default function UnauthorizedPage() {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4',
      theme.background.primary
    )}>
      <motion.div 
        {...animations.fadeIn}
        className={cn('w-full', responsive.container.sm)}
      >
        <Card className="text-center space-y-6">
          {/* Unauthorized Icon */}
          <motion.div 
            {...animations.scaleIn}
            className={cn(
              'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4',
              'bg-red-100 dark:bg-red-900/30'
            )}
          >
            <ShieldX className="w-8 h-8 text-red-500" />
          </motion.div>

          {/* Title */}
          <h1 className={cn(
            'font-bold mb-3',
            responsive.fontSize['3xl'],
            theme.text.primary
          )}>
            غير مخول للوصول
          </h1>

          {/* Description */}
          <p className={cn(
            'mb-6',
            responsive.fontSize.base,
            theme.text.secondary
          )}>
            عذراً، لا تملك الصلاحيات اللازمة للوصول إلى هذه الصفحة. هذه المنطقة مخصصة للإدارة فقط.
          </p>
          
          {/* Warning Note */}
          <div className={cn(
            'p-4 rounded-xl border',
            'bg-yellow-50 dark:bg-yellow-900/20',
            'border-yellow-200 dark:border-yellow-800'
          )}>
            <p className={cn(
              'text-sm',
              'text-yellow-800 dark:text-yellow-200'
            )}>
              <strong>ملاحظة:</strong> إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع الإدارة.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Link href="/">
              <Button 
                variant="accent" 
                size="lg" 
                fullWidth
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                العودة للرئيسية
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button 
                variant="outline" 
                size="lg" 
                fullWidth
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                تسجيل دخول بحساب آخر
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}
