'use client'

import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'
import { motion } from 'framer-motion'
import { 
  User, 
  Settings, 
  ShoppingBag, 
  Heart, 
  Clock, 
  CreditCard,
  LogOut,
  Home,
  Activity
} from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/Button'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'

interface AdminDashboardProps {
  session: Session
}

export default function AdminDashboard({ session }: AdminDashboardProps) {
  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  const menuItems = [
    {
      icon: ShoppingBag,
      title: 'إدارة الطلبات',
      description: 'عرض وإدارة جميع طلبات العملاء',
      href: '/admin/orders',
      color: 'bg-blue-500'
    },
    {
      icon: User,
      title: 'إدارة المستخدمين',
      description: 'عرض وإدارة حسابات العملاء',
      href: '/admin/users',
      color: 'bg-green-500'
    },
    {
      icon: Settings,
      title: 'إدارة المنتجات',
      description: 'إضافة وتعديل المنتجات والقوائم',
      href: '/admin/products',
      color: 'bg-orange-500'
    },
    {
      icon: CreditCard,
      title: 'التقارير المالية',
      description: 'عرض المبيعات والإحصائيات',
      href: '/admin/reports',
      color: 'bg-purple-500'
    },
    {
      icon: Activity,
      title: 'حالة النظام',
      description: 'مراقبة حالة التطبيق وقاعدة البيانات',
      href: '/dash/status',
      color: 'bg-red-500'
    }
  ]

  return (
    <div className={cn(responsive.container.xl, 'px-4 py-8')}>
      {/* Header */}
      <motion.div 
        {...animations.slideIn}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            {session.user?.image && (
              <motion.img
                whileHover={{ scale: 1.05 }}
                src={session.user.image}
                alt={session.user.name || 'Admin'}
                className="w-16 h-16 rounded-full border-4 border-red-500"
              />
            )}
            <div>
              <h1 className={cn(
                'text-2xl font-bold text-gray-900 dark:text-white',
                theme.text.primary
              )}>
                لوحة تحكم الإدارة
              </h1>
              <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                مرحباً {session.user?.name || 'مدير'} ({session.user?.email})
              </p>
              <div className="flex items-center mt-2 text-xs text-red-600 dark:text-red-400">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2 rtl:ml-2"></div>
                وضع الإدارة
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Link href="/">
              <Button variant="outline" size="sm">
                <Home className="w-4 h-4 mr-2 rtl:ml-2" />
                الرئيسية
              </Button>
            </Link>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSignOut}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 mr-2 rtl:ml-2" />
              تسجيل خروج
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { title: 'إجمالي الطلبات', value: '1,247', icon: ShoppingBag, color: 'bg-blue-500' },
          { title: 'عدد العملاء', value: '324', icon: User, color: 'bg-green-500' },
          { title: 'الإيرادات اليوم', value: '12,450 ر.س', icon: CreditCard, color: 'bg-purple-500' },
          { title: 'الطلبات المعلقة', value: '18', icon: Clock, color: 'bg-yellow-500' }
        ].map((stat, index) => (
          <motion.div
            key={stat.title}
            {...animations.scaleIn}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs text-gray-600 dark:text-gray-400', theme.text.secondary)}>{stat.title}</p>
                <p className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>{stat.value}</p>
              </div>
              <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Menu Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item, index) => (
          <motion.div
            key={item.title}
            {...animations.slideIn}
            transition={{ delay: index * 0.1 }}
          >
            <Link href={item.href}>
              <motion.div
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-100 dark:border-gray-700"
              >
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <div className={cn(
                    'w-14 h-14 rounded-2xl flex items-center justify-center',
                    item.color
                  )}>
                    <item.icon className="w-7 h-7 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className={cn(
                      'text-lg font-bold mb-1 text-gray-900 dark:text-white',
                      theme.text.primary
                    )}>
                      {item.title}
                    </h3>
                    <p className={cn(
                      'text-sm text-gray-600 dark:text-gray-300',
                      theme.text.secondary
                    )}>
                      {item.description}
                    </p>
                  </div>
                  <motion.div
                    className="w-6 h-6 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center"
                    whileHover={{ backgroundColor: '#f97316' }}
                  >
                    <svg
                      className="w-3 h-3 text-gray-600 dark:text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                        className="rtl:rotate-180"
                      />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </div>

      {/* Recent Activity */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.5 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mt-8"
      >
        <h2 className={cn(
          'text-xl font-bold mb-6 text-gray-900 dark:text-white',
          theme.text.primary
        )}>
          النشاط الأخير للنظام
        </h2>
        <div className="space-y-4">
          {[
            {
              title: 'طلب جديد من أحمد محمد - #1247',
              time: 'منذ 5 دقائق',
              status: 'معلق',
              price: '125 ر.س'
            },
            {
              title: 'تم تسجيل عميل جديد - سارة أحمد',
              time: 'منذ 15 دقيقة',
              status: 'مكتمل',
              price: ''
            },
            {
              title: 'طلب مكتمل - #1246',
              time: 'منذ 30 دقيقة',
              status: 'تم التوصيل',
              price: '89 ر.س'
            }
          ].map((activity, index) => (
            <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
              <div>
                <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                  {activity.title}
                </p>
                <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                  {activity.time}
                </p>
              </div>
              <div className="text-left">
                <p className={cn(
                  'text-sm font-medium',
                  activity.status === 'معلق' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                )}>
                  {activity.status}
                </p>
                {activity.price && (
                  <p className={cn('text-sm font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                    {activity.price}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  )
}
