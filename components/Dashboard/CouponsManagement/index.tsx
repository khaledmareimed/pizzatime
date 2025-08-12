'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye, 
  EyeOff,
  Calendar,
  Percent,
  DollarSign,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { cn } from '../../../funcs/utils'
import { theme, responsive } from '../../../funcs/responsive'
import Button from '../../Button'
import Card from '../../Card'
import CouponModal from './CouponModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import { Coupon, CouponForm } from './types'

export default function CouponsManagement() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'expired'>('all')
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [couponForm, setCouponForm] = useState<CouponForm>({
    code: '',
    name: '',
    description: '',
    discountType: 'percentage',
    discountValue: 0,
    minimumOrderAmount: 0,
    maximumDiscountAmount: 0,
    usageLimit: undefined,
    userUsageLimit: 1,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    isActive: true,
    applicableCategories: [],
    excludedCategories: [],
    applicableProducts: [],
    excludedProducts: []
  })

  // Statistics
  const stats = {
    total: coupons.length,
    active: coupons.filter(c => c.isActive && new Date() >= new Date(c.startDate) && new Date() <= new Date(c.endDate)).length,
    expired: coupons.filter(c => new Date() > new Date(c.endDate)).length,
    totalUsage: coupons.reduce((sum, c) => sum + c.usageCount, 0)
  }

  useEffect(() => {
    fetchCoupons()
  }, [statusFilter])

  const fetchCoupons = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      
      const response = await fetch(`/api/coupons?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setCoupons(data.data)
      } else {
        console.error('Failed to fetch coupons:', data.error)
      }
    } catch (error) {
      console.error('Error fetching coupons:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCoupon = () => {
    setSelectedCoupon(null)
    setIsEditing(false)
    setCouponForm({
      code: '',
      name: '',
      description: '',
      discountType: 'percentage',
      discountValue: 0,
      minimumOrderAmount: 0,
      maximumDiscountAmount: 0,
      usageLimit: undefined,
      userUsageLimit: 1,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      isActive: true,
      applicableCategories: [],
      excludedCategories: [],
      applicableProducts: [],
      excludedProducts: []
    })
    setShowCouponModal(true)
  }

  const handleEditCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setIsEditing(true)
    setCouponForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || '',
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      minimumOrderAmount: coupon.minimumOrderAmount,
      maximumDiscountAmount: coupon.maximumDiscountAmount || 0,
      usageLimit: coupon.usageLimit,
      userUsageLimit: coupon.userUsageLimit,
      startDate: new Date(coupon.startDate).toISOString().split('T')[0],
      endDate: new Date(coupon.endDate).toISOString().split('T')[0],
      isActive: coupon.isActive,
      applicableCategories: coupon.applicableCategories || [],
      excludedCategories: coupon.excludedCategories || [],
      applicableProducts: coupon.applicableProducts || [],
      excludedProducts: coupon.excludedProducts || []
    })
    setShowCouponModal(true)
  }

  const handleDeleteCoupon = (coupon: Coupon) => {
    setSelectedCoupon(coupon)
    setShowDeleteModal(true)
  }

  const handleSaveCoupon = async () => {
    try {
      const url = isEditing ? `/api/coupons/${selectedCoupon?._id}` : '/api/coupons'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(couponForm),
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchCoupons()
        setShowCouponModal(false)
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error saving coupon:', error)
      alert('حدث خطأ في حفظ القسيمة')
    }
  }

  const handleConfirmDelete = async () => {
    if (!selectedCoupon) return

    try {
      const response = await fetch(`/api/coupons/${selectedCoupon._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchCoupons()
        setShowDeleteModal(false)
        alert(data.message)
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error deleting coupon:', error)
      alert('حدث خطأ في حذف القسيمة')
    }
  }

  const toggleCouponStatus = async (coupon: Coupon) => {
    try {
      const response = await fetch(`/api/coupons/${coupon._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      })

      const data = await response.json()
      
      if (data.success) {
        await fetchCoupons()
      } else {
        alert(data.error)
      }
    } catch (error) {
      console.error('Error toggling coupon status:', error)
      alert('حدث خطأ في تغيير حالة القسيمة')
    }
  }

  const getCouponStatus = (coupon: Coupon) => {
    const now = new Date()
    const startDate = new Date(coupon.startDate)
    const endDate = new Date(coupon.endDate)
    
    if (!coupon.isActive) return 'inactive'
    if (now < startDate) return 'scheduled'
    if (now > endDate) return 'expired'
    if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) return 'exhausted'
    return 'active'
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'inactive': return <XCircle className="w-4 h-4 text-gray-500" />
      case 'expired': return <Clock className="w-4 h-4 text-red-500" />
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-500" />
      case 'exhausted': return <AlertCircle className="w-4 h-4 text-orange-500" />
      default: return null
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return 'نشط'
      case 'inactive': return 'غير نشط'
      case 'expired': return 'منتهي الصلاحية'
      case 'scheduled': return 'مجدول'
      case 'exhausted': return 'مستنفد'
      default: return 'غير معروف'
    }
  }

  const filteredCoupons = coupons.filter(coupon => {
    const matchesSearch = coupon.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         coupon.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    if (statusFilter === 'all') return matchesSearch
    
    const status = getCouponStatus(coupon)
    if (statusFilter === 'active') return matchesSearch && status === 'active'
    if (statusFilter === 'inactive') return matchesSearch && (status === 'inactive' || status === 'scheduled')
    if (statusFilter === 'expired') return matchesSearch && (status === 'expired' || status === 'exhausted')
    
    return matchesSearch
  })

  return (
    <div className={cn('min-h-screen', theme.background.primary)}>
      {/* Header */}
      <div className={cn('border-b', theme.border.primary, theme.background.card)}>
        <div className={cn(responsive.container.lg, 'px-4 py-6')}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-4 rtl:space-x-reverse">
              <Link href="/dash">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2 rtl:ml-2 rtl:rotate-180" />
                  العودة للوحة التحكم
                </Button>
              </Link>
              <div>
                <h1 className={cn(
                  'font-bold',
                  responsive.fontSize['2xl'],
                  theme.text.primary
                )}>
                  إدارة القسائم
                </h1>
                <p className={cn('mt-1', theme.text.secondary)}>
                  إنشاء وإدارة قسائم الخصم للمتجر
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleCreateCoupon}
              variant="accent"
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              إضافة قسيمة جديدة
            </Button>
          </div>
        </div>
      </div>

      <div className={cn(responsive.container.lg, 'px-4 py-8')}>
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', theme.text.secondary)}>إجمالي القسائم</p>
                <p className={cn('text-2xl font-bold', theme.text.primary)}>{stats.total}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', 'bg-blue-100 dark:bg-blue-900/30')}>
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', theme.text.secondary)}>القسائم النشطة</p>
                <p className={cn('text-2xl font-bold', theme.text.primary)}>{stats.active}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', 'bg-green-100 dark:bg-green-900/30')}>
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', theme.text.secondary)}>القسائم المنتهية</p>
                <p className={cn('text-2xl font-bold', theme.text.primary)}>{stats.expired}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', 'bg-red-100 dark:bg-red-900/30')}>
                <Clock className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className={cn('text-sm', theme.text.secondary)}>إجمالي الاستخدامات</p>
                <p className={cn('text-2xl font-bold', theme.text.primary)}>{stats.totalUsage}</p>
              </div>
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center', 'bg-purple-100 dark:bg-purple-900/30')}>
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="البحث في القسائم..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'w-full pl-10 pr-4 py-2 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'placeholder-gray-400 dark:placeholder-gray-500'
                )}
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className={cn(
                'px-4 py-2 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors',
                theme.background.card,
                theme.border.primary,
                theme.text.primary
              )}
            >
              <option value="all">جميع القسائم</option>
              <option value="active">النشطة</option>
              <option value="inactive">غير النشطة</option>
              <option value="expired">المنتهية الصلاحية</option>
            </select>
          </div>
        </Card>

        {/* Coupons List */}
        <Card>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filteredCoupons.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <h3 className={cn('font-medium mb-2', theme.text.primary)}>
                لا توجد قسائم
              </h3>
              <p className={cn('text-sm', theme.text.secondary)}>
                {searchTerm ? 'لم يتم العثور على قسائم تطابق البحث' : 'ابدأ بإنشاء قسيمة جديدة'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className={cn('border-b', theme.border.primary)}>
                    <th className={cn('text-right p-4 font-medium', theme.text.primary)}>الرمز</th>
                    <th className={cn('text-right p-4 font-medium', theme.text.primary)}>الاسم</th>
                    <th className={cn('text-right p-4 font-medium', theme.text.primary)}>الخصم</th>
                    <th className={cn('text-right p-4 font-medium', theme.text.primary)}>الاستخدام</th>
                    <th className={cn('text-right p-4 font-medium', theme.text.primary)}>الحالة</th>
                    <th className={cn('text-right p-4 font-medium', theme.text.primary)}>تاريخ الانتهاء</th>
                    <th className={cn('text-right p-4 font-medium', theme.text.primary)}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCoupons.map((coupon) => {
                    const status = getCouponStatus(coupon)
                    return (
                      <motion.tr
                        key={coupon._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn('border-b hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors', theme.border.primary)}
                      >
                        <td className="p-4">
                          <code className={cn('px-2 py-1 rounded text-sm font-mono', 'bg-gray-100 dark:bg-gray-800', theme.text.primary)}>
                            {coupon.code}
                          </code>
                        </td>
                        <td className={cn('p-4', theme.text.primary)}>
                          <div>
                            <div className="font-medium">{coupon.name}</div>
                            {coupon.description && (
                              <div className={cn('text-sm', theme.text.secondary)}>{coupon.description}</div>
                            )}
                          </div>
                        </td>
                        <td className={cn('p-4', theme.text.primary)}>
                          <div className="flex items-center gap-1">
                            {coupon.discountType === 'percentage' ? (
                              <>
                                <Percent className="w-4 h-4" />
                                {coupon.discountValue}%
                              </>
                            ) : (
                              <>
                                <DollarSign className="w-4 h-4" />
                                {coupon.discountValue} د.أ
                              </>
                            )}
                          </div>
                        </td>
                        <td className={cn('p-4', theme.text.primary)}>
                          <div className="text-sm">
                            <div>{coupon.usageCount} / {coupon.usageLimit || '∞'}</div>
                            <div className={cn('text-xs', theme.text.secondary)}>
                              {coupon.usedBy.length} مستخدم
                            </div>
                          </div>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(status)}
                            <span className={cn('text-sm', theme.text.primary)}>
                              {getStatusText(status)}
                            </span>
                          </div>
                        </td>
                        <td className={cn('p-4 text-sm', theme.text.secondary)}>
                          {new Date(coupon.endDate).toLocaleDateString('ar-SA')}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => toggleCouponStatus(coupon)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                coupon.isActive
                                  ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20'
                                  : 'text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                              )}
                              title={coupon.isActive ? 'إلغاء التفعيل' : 'تفعيل'}
                            >
                              {coupon.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </button>
                            
                            <button
                              onClick={() => handleEditCoupon(coupon)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                              )}
                              title="تعديل"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDeleteCoupon(coupon)}
                              className={cn(
                                'p-2 rounded-lg transition-colors',
                                'text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20'
                              )}
                              title="حذف"
                              disabled={coupon.usageCount > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {showCouponModal && (
          <CouponModal
            show={showCouponModal}
            onClose={() => setShowCouponModal(false)}
            couponForm={couponForm}
            setCouponForm={setCouponForm}
            onSave={handleSaveCoupon}
            isEditing={isEditing}
          />
        )}
        
        {showDeleteModal && selectedCoupon && (
          <DeleteConfirmModal
            show={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleConfirmDelete}
            itemName={selectedCoupon.name}
            itemType="coupon"
          />
        )}
      </AnimatePresence>
    </div>
  )
}