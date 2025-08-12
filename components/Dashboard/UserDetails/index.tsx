'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { 
  ArrowLeft,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Shield,
  Edit,
  Save,
  X,
  Trash2,
  ShoppingBag,
  Heart,
  Plus
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanDateTime } from '@/funcs/jordanLocale'
import Button from '@/components/Button'

interface UserAddress {
  _id: string
  name: string
  recipientName: string
  city: string
  phone: string
  addressDetails: string
  isDefault: boolean
}

interface UserData {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'user'
  addresses: UserAddress[]
  favorites: string[]
  orders: string[]
  createdAt: string
  updatedAt: string
}

interface AdminUserDetailsProps {
  session: Session
  userId: string
}

const roleTranslations: Record<string, string> = {
  admin: 'مدير',
  user: 'مستخدم'
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  user: 'bg-blue-500'
}

export default function AdminUserDetails({ session, userId }: AdminUserDetailsProps) {
  const router = useRouter()
  const [user, setUser] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'user' as 'admin' | 'user'
  })

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${userId}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const userData = await response.json()
      setUser(userData)
      setEditForm({
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        role: userData.role
      })
      setError(null)
    } catch (err) {
      console.error('Error fetching user:', err)
      setError('فشل في تحميل بيانات المستخدم')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
  }, [userId])

  const handleSave = async () => {
    if (!user) return
    
    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editForm)
      })

      if (!response.ok) {
        throw new Error('Failed to update user')
      }

      const updatedUser = await response.json()
      setUser(updatedUser)
      setEditing(false)
      setError(null)
    } catch (err) {
      console.error('Error updating user:', err)
      setError('فشل في تحديث بيانات المستخدم')
    } finally {
      setUpdating(false)
    }
  }

  const handleCancel = () => {
    if (user) {
      setEditForm({
        name: user.name,
        email: user.email,
        phone: user.phone || '',
        role: user.role
      })
    }
    setEditing(false)
  }

  const handleDeleteUser = async () => {
    if (!user || user.role === 'admin') return
    
    if (!confirm('هل أنت متأكد من حذف هذا المستخدم؟ هذا الإجراء لا يمكن التراجع عنه.')) {
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete user')
      }

      router.push('/dash/users')
    } catch (err) {
      console.error('Error deleting user:', err)
      setError('فشل في حذف المستخدم')
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !user) {
    return (
      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 text-center">
          <User className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 dark:text-red-400">{error || 'المستخدم غير موجود'}</p>
          <Link href="/dash/users" className="mt-4 inline-block">
            <Button variant="outline">العودة للمستخدمين</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={cn(responsive.container.xl, 'px-4 py-8')}>
      {/* Header */}
      <motion.div 
        {...animations.slideIn}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 rtl:space-x-reverse">
            <Link href="/dash/users">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                العودة للمستخدمين
              </Button>
            </Link>
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-white" />
                </div>
                <span className={cn('absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white', roleColors[user.role])}>
                  {user.role === 'admin' ? <Shield className="w-3 h-3" /> : <User className="w-3 h-3" />}
                </span>
              </div>
              <div>
                <h1 className={cn('text-2xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  {user.name}
                </h1>
                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                  <span className={cn('px-2 py-1 rounded-lg text-xs font-medium text-white', roleColors[user.role])}>
                    {roleTranslations[user.role]}
                  </span>
                  <span className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                    {user.email}
                  </span>
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Link href={`/dash/users/${userId}/orders`}>
              <Button variant="outline" size="sm">
                <ShoppingBag className="w-4 h-4 mr-2 rtl:ml-2" />
                عرض الطلبات ({user.orders.length})
              </Button>
            </Link>
            {!editing ? (
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Edit className="w-4 h-4 mr-2 rtl:ml-2" />
                تعديل
              </Button>
            ) : (
              <div className="flex space-x-2 rtl:space-x-reverse">
                <Button size="sm" onClick={handleSave} disabled={updating}>
                  <Save className="w-4 h-4 mr-2 rtl:ml-2" />
                  حفظ
                </Button>
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  <X className="w-4 h-4 mr-2 rtl:ml-2" />
                  إلغاء
                </Button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* User Information */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Info */}
          <motion.div
            {...animations.slideIn}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              المعلومات الأساسية
            </h2>
            
            {editing ? (
              <div className="space-y-4">
                <div>
                  <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                    الاسم
                  </label>
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                    البريد الإلكتروني
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                    رقم الهاتف
                  </label>
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  />
                </div>
                
                <div>
                  <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
                    نوع المستخدم
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as 'admin' | 'user' })}
                    className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  >
                    <option value="user">مستخدم</option>
                    <option value="admin">مدير</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <User className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                      {user.name}
                    </p>
                    <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      الاسم الكامل
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                      {user.email}
                    </p>
                    <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      البريد الإلكتروني
                    </p>
                  </div>
                </div>
                
                {user.phone && (
                  <div className="flex items-center space-x-3 rtl:space-x-reverse">
                    <Phone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                        {user.phone}
                      </p>
                      <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                        رقم الهاتف
                      </p>
                    </div>
                  </div>
                )}
                
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Shield className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                      {roleTranslations[user.role]}
                    </p>
                    <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      نوع المستخدم
                    </p>
                  </div>
                </div>
              </div>
            )}
          </motion.div>

          {/* Addresses */}
          <motion.div
            {...animations.slideIn}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                العناوين ({user.addresses.length})
              </h2>
            </div>
            
            <div className="space-y-4">
              {user.addresses.length === 0 ? (
                <div className="text-center py-8">
                  <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    لا توجد عناوين مسجلة
                  </p>
                </div>
              ) : (
                user.addresses.map((address, index) => (
                  <div key={address._id} className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3 rtl:space-x-reverse">
                        <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                        <div>
                          <div className="flex items-center space-x-2 rtl:space-x-reverse mb-1">
                            <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                              {address.name}
                            </p>
                            {address.isDefault && (
                              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-lg">
                                افتراضي
                              </span>
                            )}
                          </div>
                          <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                            {address.recipientName} • {address.phone}
                          </p>
                          <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                            {address.city} - {address.addressDetails}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Statistics and Actions */}
        <div className="space-y-8">
          {/* Account Info */}
          <motion.div
            {...animations.slideIn}
            transition={{ delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              معلومات الحساب
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanDateTime(user.createdAt)}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    تاريخ التسجيل
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3 rtl:space-x-reverse">
                <Calendar className="w-5 h-5 text-gray-400" />
                <div>
                  <p className={cn('font-medium text-gray-900 dark:text-white', theme.text.primary)}>
                    {formatJordanDateTime(user.updatedAt)}
                  </p>
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    آخر تحديث
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Statistics */}
          <motion.div
            {...animations.slideIn}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6"
          >
            <h2 className={cn('text-xl font-bold mb-6 text-gray-900 dark:text-white', theme.text.primary)}>
              الإحصائيات
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <ShoppingBag className="w-5 h-5 text-blue-500" />
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    إجمالي الطلبات
                  </span>
                </div>
                <span className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  {user.orders.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <Heart className="w-5 h-5 text-red-500" />
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    المفضلة
                  </span>
                </div>
                <span className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  {user.favorites.length}
                </span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 rtl:space-x-reverse">
                  <MapPin className="w-5 h-5 text-green-500" />
                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    العناوين
                  </span>
                </div>
                <span className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  {user.addresses.length}
                </span>
              </div>
            </div>
          </motion.div>

          {/* Danger Zone */}
          {user.role !== 'admin' && (
            <motion.div
              {...animations.slideIn}
              transition={{ delay: 0.4 }}
              className="bg-red-50 dark:bg-red-900/20 rounded-3xl shadow-lg p-6 border border-red-200 dark:border-red-800"
            >
              <h2 className="text-xl font-bold mb-4 text-red-800 dark:text-red-400">
                منطقة الخطر
              </h2>
              <p className="text-sm text-red-600 dark:text-red-400 mb-4">
                حذف هذا المستخدم سيؤدي إلى إزالة جميع بياناته نهائياً. هذا الإجراء لا يمكن التراجع عنه.
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteUser}
                disabled={updating}
                className="text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2 rtl:ml-2" />
                حذف المستخدم
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}