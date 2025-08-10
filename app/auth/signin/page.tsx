'use client'

import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { Loader, Shield } from 'lucide-react'
import { SignInForm } from '@/components/Auth/SignInForm'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import Card from '@/components/Card'

function LoadingSpinner() {
  return (
    <Card className="text-center">
      <div className="flex flex-col items-center gap-4">
        <Loader className="w-8 h-8 animate-spin text-orange-500" />
        <p className={cn('text-sm', theme.text.secondary)}>جاري التحميل...</p>
      </div>
    </Card>
  )
}

export default function SignInPage() {
  return (
    <div className={cn(
      'min-h-screen flex items-center justify-center p-4',
      theme.background.primary
    )}>
      <motion.div 
        {...animations.fadeIn}
        className={cn('w-full', responsive.container.sm)}
      >
        {/* Header */}
        <motion.div 
          {...animations.slideIn}
          className="text-center mb-8"
        >
          <div className={cn(
            'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-6',
            theme.colors.accent.light,
            theme.colors.accent.dark
          )}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          
          <h1 className={cn(
            'font-bold mb-3',
            responsive.fontSize['3xl'],
            theme.text.primary
          )}>
            مرحباً بك
          </h1>
          
          <p className={cn(
            responsive.fontSize.base,
            theme.text.secondary
          )}>
            سجل دخولك للمتابعة واستكشاف قائمة الطعام الشهية
          </p>
        </motion.div>

        {/* Sign In Form */}
        <Suspense fallback={<LoadingSpinner />}>
          <SignInForm />
        </Suspense>

        {/* Footer */}
        <motion.div 
          {...animations.fadeIn}
          className="text-center mt-8"
        >
          <p className={cn(
            'text-xs',
            theme.text.secondary
          )}>
            بالمتابعة، أنت توافق على شروط الخدمة وسياسة الخصوصية
          </p>
        </motion.div>
      </motion.div>
    </div>
  )
}
