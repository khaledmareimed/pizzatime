'use client'

import { useSession } from 'next-auth/react'
import { ShieldCheck, ShieldX, User, Mail } from 'lucide-react'
import { cn } from '@/funcs/utils'
import { theme } from '@/funcs/responsive'

export function AdminStatus() {
  const { data: session } = useSession()

  if (!session) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <User className="w-5 h-5 text-gray-500 mr-2" />
          <span className="text-gray-600">غير مسجل دخول</span>
        </div>
      </div>
    )
  }

  const isAdmin = session.user.role === 'admin'

  return (
    <div className={cn(
      'border rounded-lg p-4',
      isAdmin 
        ? 'bg-green-50 border-green-200' 
        : 'bg-yellow-50 border-yellow-200'
    )}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          {isAdmin ? (
            <ShieldCheck className="w-5 h-5 text-green-600 mr-2" />
          ) : (
            <ShieldX className="w-5 h-5 text-yellow-600 mr-2" />
          )}
          <div>
            <p className={cn(
              'font-medium',
              isAdmin ? 'text-green-800' : 'text-yellow-800'
            )}>
              {isAdmin ? 'مدير مخول' : 'مستخدم عادي'}
            </p>
            <div className="flex items-center mt-1">
              <Mail className="w-3 h-3 mr-1 opacity-60" />
              <p className={cn(
                'text-xs',
                isAdmin ? 'text-green-600' : 'text-yellow-600'
              )}>
                {session.user.email}
              </p>
            </div>
          </div>
        </div>
        
        <div className={cn(
          'px-2 py-1 rounded text-xs font-medium',
          isAdmin 
            ? 'bg-green-100 text-green-800' 
            : 'bg-yellow-100 text-yellow-800'
        )}>
          {isAdmin ? 'Admin' : 'User'}
        </div>
      </div>
      
      {!isAdmin && (
        <p className="text-xs text-yellow-600 mt-2">
          لا يمكنك الوصول إلى لوحة تحكم الإدارة
        </p>
      )}
    </div>
  )
}
