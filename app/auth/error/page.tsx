'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { motion } from 'framer-motion'
import { AlertTriangle, Loader, Home, RotateCcw } from 'lucide-react'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import Button from '@/components/Button'
import Card from '@/components/Card'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return {
          title: 'خطأ في إعدادات الخادم',
          description: 'هناك مشكلة في إعدادات الخادم. يرجى التحقق من متغيرات البيئة.',
          suggestions: [
            'تحقق من إعداد GOOGLE_CLIENT_ID',
            'تحقق من إعداد GOOGLE_CLIENT_SECRET', 
            'تحقق من إعداد AUTH_SECRET',
            'تحقق من صحة رابط Google OAuth'
          ]
        }
      case 'AccessDenied':
        return {
          title: 'تم رفض الوصول',
          description: 'ليس لديك صلاحية لتسجيل الدخول.',
          suggestions: ['جرب تسجيل الدخول بحساب آخر']
        }
      case 'Verification':
        return {
          title: 'تعذر تسجيل الدخول',
          description: 'رابط تسجيل الدخول غير صالح. ربما تم استخدامه من قبل أو انتهت صلاحيته.',
          suggestions: ['جرب تسجيل الدخول مرة أخرى']
        }
      default:
        return {
          title: 'خطأ في المصادقة',
          description: 'عذراً، حدثت مشكلة أثناء تسجيل الدخول.',
          suggestions: [
            'جرب تسجيل الدخول مرة أخرى',
            'تحقق من اتصال الإنترنت',
            'تواصل مع الدعم إذا استمرت المشكلة'
          ]
        }
    }
  }

  const errorInfo = getErrorMessage(error)

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
          {/* Error Icon */}
          <motion.div 
            {...animations.scaleIn}
            className={cn(
              'inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4',
              'bg-red-100 dark:bg-red-900/30'
            )}
          >
            <AlertTriangle className="w-8 h-8 text-red-500" />
          </motion.div>

          {/* Error Title */}
          <h1 className={cn(
            'font-bold mb-3',
            responsive.fontSize['2xl'],
            theme.text.primary
          )}>
            {errorInfo.title}
          </h1>

          {/* Error Description */}
          <p className={cn(
            'mb-6',
            responsive.fontSize.base,
            theme.text.secondary
          )}>
            {errorInfo.description}
          </p>
          
          {/* Error Code */}
          {error && (
            <div className={cn(
              'p-4 rounded-xl border',
              'bg-red-50 dark:bg-red-900/20',
              'border-red-200 dark:border-red-800'
            )}>
              <p className={cn(
                'text-sm',
                'text-red-800 dark:text-red-200'
              )}>
                <strong>رمز الخطأ:</strong> {error}
              </p>
            </div>
          )}

          {/* Troubleshooting */}
          <div className={cn(
            'p-4 rounded-xl border text-right',
            'bg-blue-50 dark:bg-blue-900/20',
            'border-blue-200 dark:border-blue-800'
          )}>
            <h3 className={cn(
              'font-semibold mb-3',
              'text-blue-900 dark:text-blue-100'
            )}>
              خطوات الحل:
            </h3>
            <ul className={cn(
              'text-sm space-y-2',
              'text-blue-800 dark:text-blue-200'
            )}>
              {errorInfo.suggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-4">
            <Link href="/auth/signin">
              <Button 
                variant="accent" 
                size="lg" 
                fullWidth
                className="gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                المحاولة مرة أخرى
              </Button>
            </Link>
            <Link href="/">
              <Button 
                variant="outline" 
                size="lg" 
                fullWidth
                className="gap-2"
              >
                <Home className="w-4 h-4" />
                العودة للرئيسية
              </Button>
            </Link>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className={cn(
        'min-h-screen flex items-center justify-center p-4',
        theme.background.primary
      )}>
        <Card className="text-center">
          <div className="flex flex-col items-center gap-4">
            <Loader className="w-8 h-8 animate-spin text-orange-500" />
            <p className={cn('text-sm', theme.text.secondary)}>جاري التحميل...</p>
          </div>
        </Card>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}