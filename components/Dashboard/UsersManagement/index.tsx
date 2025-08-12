'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { motion } from 'framer-motion'
import { 
  User, 
  Users, 
  Shield, 
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  Phone,
  Mail,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Edit,
  Trash2,
  ShoppingBag,
  MapPin
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { cn } from '@/funcs/utils'
import { theme, responsive, animations } from '@/funcs/responsive'
import { formatJordanDateTime, formatJordanTimeAgo } from '@/funcs/jordanLocale'
import DateRangeFilter from '@/components/Dashboard/DateRangeFilter'
import Button from '@/components/Button'

interface UserData {
  _id: string
  name: string
  email: string
  phone?: string
  role: 'admin' | 'user'
  addresses: Array<{
    _id: string
    name: string
    recipientName: string
    city: string
    phone: string
    addressDetails: string
    isDefault: boolean
  }>
  favorites: string[]
  orders: string[]
  createdAt: string
  updatedAt: string
}

interface AdminUsersManagementProps {
  session: Session
}

const roleTranslations: Record<string, string> = {
  admin: 'مدير',
  user: 'مستخدم'
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  user: 'bg-blue-500'
}

export default function AdminUsersManagement({ session }: AdminUsersManagementProps) {
  const router = useRouter()
  const [users, setUsers] = useState<UserData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedRole, setSelectedRole] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    admin: 0,
    user: 0
  })

  const limit = 20

  const fetchUsers = async (page = 1, role = selectedRole, search = searchTerm) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        page: page.toString(),
        dateRange: dateRange
      })
      
      if (role !== 'all') {
        params.append('role', role)
      }
      
      if (search.trim()) {
        params.append('search', search.trim())
      }

      if (dateRange === 'custom' && customStartDate && customEndDate) {
        params.append('startDate', customStartDate)
        params.append('endDate', customEndDate)
      }

      const response = await fetch(`/api/admin/users?${params}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch users')
      }

      const data = await response.json()
      setUsers(data.users)
      setStats(data.stats)
      setCurrentPage(data.pagination.page)
      setTotalPages(data.pagination.totalPages)
      setTotalCount(data.pagination.totalCount)
      setError(null)
    } catch (err) {
      console.error('Error fetching users:', err)
      setError('فشل في تحميل المستخدمين')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers(currentPage, selectedRole, searchTerm)
  }, [currentPage, selectedRole, dateRange, customStartDate, customEndDate])

  const handleDateRangeChange = (range: string, startDate?: string, endDate?: string) => {
    setDateRange(range)
    if (range === 'custom' && startDate && endDate) {
      setCustomStartDate(startDate)
      setCustomEndDate(endDate)
    } else {
      setCustomStartDate('')
      setCustomEndDate('')
    }
    setCurrentPage(1) // Reset to first page when changing date range
  }

  const handleSearch = () => {
    setCurrentPage(1)
    fetchUsers(1, selectedRole, searchTerm)
  }

  const handleUserClick = (user: UserData) => {
    router.push(`/dash/users/${user._id}`)
  }

  const handleViewOrders = (user: UserData, e?: React.MouseEvent) => {
    e?.stopPropagation()
    router.push(`/dash/users/${user._id}/orders`)
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
            <Link href="/dash">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                العودة للوحة التحكم
              </Button>
            </Link>
            <div>
              <h1 className={cn('text-2xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                إدارة المستخدمين
              </h1>
              <p className={cn('text-sm text-gray-600 dark:text-gray-300', theme.text.secondary)}>
                عرض وإدارة جميع حسابات المستخدمين ({totalCount} مستخدم)
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchUsers(currentPage, selectedRole, searchTerm)}
            >
              <RefreshCw className="w-4 h-4 mr-2 rtl:ml-2" />
              تحديث
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          { title: 'إجمالي المستخدمين', value: stats.total, color: 'bg-gray-500', key: 'all', icon: Users },
          { title: 'المديرين', value: stats.admin, color: 'bg-red-500', key: 'admin', icon: Shield },
          { title: 'المستخدمين', value: stats.user, color: 'bg-blue-500', key: 'user', icon: User }
        ].map((stat, index) => (
          <motion.div
            key={stat.key}
            {...animations.scaleIn}
            transition={{ delay: index * 0.05 }}
            className={cn(
              'bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-lg cursor-pointer transition-all duration-200',
              selectedRole === stat.key ? 'ring-2 ring-blue-500' : 'hover:shadow-xl'
            )}
            onClick={() => setSelectedRole(stat.key)}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-xs text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                  {stat.title}
                </p>
                <p className={cn('text-xl font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                  {stat.value}
                </p>
              </div>
              <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center', stat.color)}>
                <stat.icon className="w-4 h-4 text-white" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Search and Filters */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.1 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg p-6 mb-8"
      >
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
              البحث
            </label>
            <div className="flex space-x-2 rtl:space-x-reverse">
              <div className="relative flex-1">
                <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="البحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                  className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>
              <Button onClick={handleSearch}>
                بحث
              </Button>
            </div>
          </div>
          
          <div>
            <label className={cn('block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300', theme.text.secondary)}>
              نوع المستخدم
            </label>
            <div className="relative">
              <Filter className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="w-full pl-10 rtl:pr-10 rtl:pl-4 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white appearance-none"
              >
                <option value="all">جميع المستخدمين</option>
                <option value="admin">المديرين</option>
                <option value="user">المستخدمين</option>
              </select>
            </div>
          </div>

          <div>
            <DateRangeFilter
              selectedRange={dateRange}
              onRangeChange={handleDateRangeChange}
            />
          </div>
        </div>
      </motion.div>

      {/* Users List */}
      <motion.div
        {...animations.slideIn}
        transition={{ delay: 0.2 }}
        className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg overflow-hidden"
      >
        {loading ? (
          <div className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex items-center space-x-4 rtl:space-x-reverse">
                    <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : error ? (
          <div className="p-6 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        ) : (
          <>
            <div className="p-6">
              <div className="space-y-4">
                {users.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                      لا توجد مستخدمين تطابق البحث
                    </p>
                  </div>
                ) : (
                  users.map((user, index) => (
                    <motion.div
                      key={user._id}
                      {...animations.scaleIn}
                      transition={{ delay: index * 0.02 }}
                      className="border border-gray-100 dark:border-gray-700 rounded-2xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer"
                      onClick={() => handleUserClick(user)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 rtl:space-x-reverse flex-1">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                              <User className="w-6 h-6 text-white" />
                            </div>
                            <span className={cn('absolute -bottom-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-xs font-bold text-white', roleColors[user.role])}>
                              {user.role === 'admin' ? <Shield className="w-2 h-2" /> : <User className="w-2 h-2" />}
                            </span>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center space-x-4 rtl:space-x-reverse mb-2">
                              <h3 className={cn('font-bold text-gray-900 dark:text-white', theme.text.primary)}>
                                {user.name}
                              </h3>
                              <span className={cn('px-2 py-1 rounded-lg text-xs font-medium text-white', roleColors[user.role])}>
                                {roleTranslations[user.role]}
                              </span>
                            </div>
                            
                            <div className="grid md:grid-cols-4 gap-4 text-sm">
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Mail className="w-4 h-4 text-gray-400" />
                                <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                  {user.email}
                                </span>
                              </div>
                              
                              {user.phone && (
                                <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                  <Phone className="w-4 h-4 text-gray-400" />
                                  <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                    {user.phone}
                                  </span>
                                </div>
                              )}
                              
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                  {user.addresses.length} عنوان
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-2 rtl:space-x-reverse">
                                <Calendar className="w-4 h-4 text-gray-400" />
                                <span className={cn('text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                                  {formatJordanTimeAgo(user.createdAt)}
                                </span>
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs">
                              <span className={cn('text-gray-500 dark:text-gray-500', theme.text.secondary)}>
                                {user.orders.length} طلب • {user.favorites.length} مفضل
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2 rtl:space-x-reverse">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleViewOrders(user, e)}
                          >
                            <ShoppingBag className="w-4 h-4 mr-2 rtl:ml-2" />
                            الطلبات
                          </Button>
                          <ChevronLeft className="w-5 h-5 text-gray-400 rtl:rotate-180" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="border-t border-gray-100 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between">
                  <p className={cn('text-sm text-gray-600 dark:text-gray-400', theme.text.secondary)}>
                    عرض {((currentPage - 1) * limit) + 1} إلى {Math.min(currentPage * limit, totalCount)} من {totalCount} مستخدم
                  </p>
                  
                  <div className="flex items-center space-x-2 rtl:space-x-reverse">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
                      السابق
                    </Button>
                    
                    <div className="flex items-center space-x-1 rtl:space-x-reverse">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = i + 1
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={cn(
                              'w-8 h-8 rounded-lg text-sm font-medium transition-colors',
                              page === currentPage
                                ? 'bg-blue-500 text-white'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                            )}
                          >
                            {page}
                          </button>
                        )
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                      <ChevronRight className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}