'use client'

import { useState, useEffect } from 'react'
import { Session } from 'next-auth'
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Eye,
  Edit,
  Trash2,
  ShoppingCart,
  Minus,
  History,
  ArrowLeft,
  Users
} from 'lucide-react'
import { cn } from '../../../funcs/utils'
import { theme } from '../../../funcs/responsive'
import { formatJordanCurrency } from '../../../funcs/jordanLocale'
import Card from '../../Card'
import Button from '../../Button'
import { useToastContext } from '../../../funcs/contexts/ToastContext'
import MaterialModal from './MaterialModal'
import MaterialDetailsModal from './MaterialDetailsModal'
import DeleteConfirmModal from './DeleteConfirmModal'
import BulkPurchaseModal from './BulkPurchaseModal'
import BulkUsageModal from './BulkUsageModal'
import TransactionHistory from './TransactionHistory'

interface RawMaterial {
  _id: string
  name: string
  description?: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock?: number
  averageCost: number
  lastPurchasePrice?: number
  lastPurchaseDate?: string
  status: 'active' | 'inactive' | 'discontinued'
  purchases: any[]
  usages: any[]
  createdAt: string
  updatedAt: string
}

interface MaterialsManagementProps {
  session: Session
}

const CATEGORIES = [
  'Meat', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 
  'Spices', 'Oils', 'Packaging', 'Cleaning', 'Other'
]

const CATEGORY_LABELS: Record<string, string> = {
  'Meat': 'لحوم',
  'Vegetables': 'خضروات',
  'Fruits': 'فواكه',
  'Dairy': 'ألبان',
  'Grains': 'حبوب',
  'Spices': 'توابل',
  'Oils': 'زيوت',
  'Packaging': 'تعبئة',
  'Cleaning': 'تنظيف',
  'Other': 'أخرى'
}

const UNITS = ['kg', 'g', 'liter', 'ml', 'piece', 'box', 'pack', 'bottle', 'can']

const UNIT_LABELS: Record<string, string> = {
  'kg': 'كيلو',
  'g': 'جرام',
  'liter': 'لتر',
  'ml': 'مل',
  'piece': 'قطعة',
  'box': 'صندوق',
  'pack': 'عبوة',
  'bottle': 'زجاجة',
  'can': 'علبة'
}

export default function MaterialsManagement({ session }: MaterialsManagementProps) {
  const { success, error } = useToastContext()
  
  // State
  const [materials, setMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [showLowStockOnly, setShowLowStockOnly] = useState(false)
  const [summary, setSummary] = useState({
    totalMaterials: 0,
    lowStockCount: 0,
    totalValue: 0
  })

  // Modal states
  const [showMaterialModal, setShowMaterialModal] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showBulkPurchaseModal, setShowBulkPurchaseModal] = useState(false)
  const [showBulkUsageModal, setShowBulkUsageModal] = useState(false)
  const [showTransactionHistory, setShowTransactionHistory] = useState(false)
  const [activeView, setActiveView] = useState<'materials' | 'transactions'>('materials')
  const [selectedMaterial, setSelectedMaterial] = useState<RawMaterial | null>(null)
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null)

  // Fetch materials
  const fetchMaterials = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        category: selectedCategory,
        status: selectedStatus,
        lowStock: showLowStockOnly.toString(),
        search: searchTerm
      })

      const response = await fetch(`/api/materials?${params}`)
      const data = await response.json()

      if (data.success) {
        setMaterials(data.data.materials)
        setSummary(data.data.summary)
      } else {
        error('خطأ', data.error || 'فشل في تحميل المواد')
      }
    } catch (err) {
      console.error('Error fetching materials:', err)
      error('خطأ', 'فشل في تحميل المواد')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMaterials()
  }, [selectedCategory, selectedStatus, showLowStockOnly, searchTerm])

  // Handle material operations
  const handleCreateMaterial = () => {
    setEditingMaterial(null)
    setShowMaterialModal(true)
  }

  const handleEditMaterial = (material: RawMaterial) => {
    setEditingMaterial(material)
    setShowMaterialModal(true)
  }

  const handleDeleteMaterial = (material: RawMaterial) => {
    setSelectedMaterial(material)
    setShowDeleteModal(true)
  }

  const handleViewDetails = (material: RawMaterial) => {
    setSelectedMaterial(material)
    setShowDetailsModal(true)
  }


  const handleModalClose = () => {
    setShowMaterialModal(false)
    setShowDetailsModal(false)
    setShowDeleteModal(false)
    setShowBulkPurchaseModal(false)
    setShowBulkUsageModal(false)
    setShowTransactionHistory(false)
    setSelectedMaterial(null)
    setEditingMaterial(null)
    fetchMaterials() // Refresh data
  }

  // Handle bulk operations
  const handleBulkPurchase = () => {
    setShowBulkPurchaseModal(true)
  }

  const handleBulkUsage = () => {
    setShowBulkUsageModal(true)
  }

  const handleShowTransactionHistory = () => {
    setActiveView(activeView === 'transactions' ? 'materials' : 'transactions')
  }

  const handleBackToDashboard = () => {
    // This would typically use router.push('/dash') or similar navigation
    window.location.href = '/dash'
  }

  // Filter materials based on search and filters
  const filteredMaterials = materials.filter(material => {
    const matchesSearch = !searchTerm || 
      material.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    return matchesSearch
  })

  return (
    <div className="space-y-6">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4 space-x-reverse">
          <Button
            onClick={handleBackToDashboard}
            variant="outline"
            className="flex items-center space-x-2 space-x-reverse"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>العودة للوحة التحكم</span>
          </Button>
          
          <h1 className={cn('text-2xl font-bold', theme.text.primary)}>
            إدارة المواد الخام
          </h1>
        </div>
        
        <Button
          onClick={handleShowTransactionHistory}
          variant="outline"
          className={cn(
            "flex items-center space-x-2 space-x-reverse",
            "bg-purple-50 hover:bg-purple-100 text-purple-700 border-purple-200 hover:border-purple-300",
            "dark:bg-purple-900/20 dark:hover:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800 dark:hover:border-purple-700"
          )}
        >
          <History className="h-4 w-4" />
          <span>{activeView === 'transactions' ? 'عرض المواد' : 'عرض المعاملات'}</span>
        </Button>
      </div>

      {/* Content Area */}
      {activeView === 'materials' ? (
        <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Package className="h-8 w-8 text-blue-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                إجمالي المواد
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {summary.totalMaterials}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                مواد منخفضة المخزون
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {summary.lowStockCount}
              </p>
            </div>
          </div>
        </Card>

        <Card>
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <div className="mr-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                قيمة المخزون
              </p>
              <p className="text-2xl font-bold text-green-600">
                {formatJordanCurrency(summary.totalValue)}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Controls */}
      <Card>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 sm:space-x-reverse">
            {/* Search */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="البحث في المواد..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={cn(
                  'pr-10 pl-4 py-2 border rounded-lg w-full sm:w-64',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary
                )}
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className={cn(
                'px-4 py-2 border rounded-lg',
                theme.background.card,
                theme.border.primary,
                theme.text.primary
              )}
            >
              <option value="all">جميع الفئات</option>
              {CATEGORIES.map(category => (
                <option key={category} value={category}>
                  {CATEGORY_LABELS[category]}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className={cn(
                'px-4 py-2 border rounded-lg',
                theme.background.card,
                theme.border.primary,
                theme.text.primary
              )}
            >
              <option value="all">جميع الحالات</option>
              <option value="active">نشط</option>
              <option value="inactive">غير نشط</option>
              <option value="discontinued">متوقف</option>
            </select>

            {/* Low Stock Toggle */}
            <label className="flex items-center space-x-2 space-x-reverse">
              <input
                type="checkbox"
                checked={showLowStockOnly}
                onChange={(e) => setShowLowStockOnly(e.target.checked)}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className={cn('text-sm', theme.text.secondary)}>
                المخزون المنخفض فقط
              </span>
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={handleCreateMaterial}
              variant="primary"
              className="flex items-center space-x-2 space-x-reverse"
            >
              <Plus className="h-4 w-4" />
              <span>إضافة مادة جديدة</span>
            </Button>
            
            <Button
              onClick={handleBulkPurchase}
              variant="outline"
              className={cn(
                "flex items-center space-x-2 space-x-reverse",
                "bg-green-50 hover:bg-green-100 text-green-700 border-green-200 hover:border-green-300",
                "dark:bg-green-900/20 dark:hover:bg-green-900/30 dark:text-green-400 dark:border-green-800 dark:hover:border-green-700"
              )}
            >
              <ShoppingCart className="h-4 w-4" />
              <span>شراء مجمع</span>
            </Button>
            
            <Button
              onClick={handleBulkUsage}
              variant="outline"
              className={cn(
                "flex items-center space-x-2 space-x-reverse",
                "bg-orange-50 hover:bg-orange-100 text-orange-700 border-orange-200 hover:border-orange-300",
                "dark:bg-orange-900/20 dark:hover:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800 dark:hover:border-orange-700"
              )}
            >
              <Minus className="h-4 w-4" />
              <span>استخدام مجمع</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Materials Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : filteredMaterials.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className={cn('mt-2 text-sm font-medium', theme.text.primary)}>
              لا توجد مواد
            </h3>
            <p className={cn('mt-1 text-sm', theme.text.secondary)}>
              ابدأ بإضافة مادة خام جديدة
            </p>
            <div className="mt-6">
              <Button
                onClick={handleCreateMaterial}
                variant="primary"
                className="flex items-center space-x-2 space-x-reverse mx-auto"
              >
                <Plus className="h-4 w-4" />
                <span>إضافة مادة جديدة</span>
              </Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMaterials.map((material) => (
            <MaterialCard
              key={material._id}
              material={material}
              onView={() => handleViewDetails(material)}
              onEdit={() => handleEditMaterial(material)}
              onDelete={() => handleDeleteMaterial(material)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showMaterialModal && (
        <MaterialModal
          material={editingMaterial}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}


      {showDetailsModal && selectedMaterial && (
        <MaterialDetailsModal
          material={selectedMaterial}
          onClose={handleModalClose}
        />
      )}

      {showDeleteModal && selectedMaterial && (
        <DeleteConfirmModal
          material={selectedMaterial}
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}

      {showBulkPurchaseModal && (
        <BulkPurchaseModal
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}

      {showBulkUsageModal && (
        <BulkUsageModal
          onClose={handleModalClose}
          onSuccess={handleModalClose}
        />
      )}

      {showTransactionHistory && (
        <TransactionHistory
          onClose={handleModalClose}
        />
      )}
        </div>
      ) : (
        <TransactionHistory
          onClose={() => setActiveView('materials')}
          isSlidePanel={false}
        />
      )}
    </div>
  )
}

// Material Card Component
interface MaterialCardProps {
  material: RawMaterial
  onView: () => void
  onEdit: () => void
  onDelete: () => void
}

function MaterialCard({ 
  material, 
  onView, 
  onEdit, 
  onDelete
}: MaterialCardProps) {
  const isLowStock = material.currentStock <= material.minimumStock
  const stockPercentage = material.maximumStock 
    ? (material.currentStock / material.maximumStock) * 100 
    : (material.currentStock / (material.minimumStock * 2)) * 100

  return (
    <Card className={cn(
      'relative overflow-hidden transition-all duration-200 hover:shadow-lg',
      isLowStock && 'ring-2 ring-orange-500 ring-opacity-50'
    )}>
      {/* Status Badge */}
      <div className="absolute top-4 left-4">
        <span className={cn(
          'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
          material.status === 'active' 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
            : material.status === 'inactive'
            ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        )}>
          {material.status === 'active' ? 'نشط' : 
           material.status === 'inactive' ? 'غير نشط' : 'متوقف'}
        </span>
      </div>

      {/* Low Stock Warning */}
      {isLowStock && (
        <div className="absolute top-4 right-4">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
        </div>
      )}

      <div className="pt-8">
        {/* Material Info */}
        <div className="mb-4">
          <h3 className={cn('text-lg font-semibold', theme.text.primary)}>
            {material.name}
          </h3>
          <p className={cn('text-xs mt-1', theme.text.secondary)}>
            {CATEGORY_LABELS[material.category]} • {UNIT_LABELS[material.unit]}
          </p>
        </div>

        {/* Stock Info */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className={cn('text-sm font-medium', theme.text.secondary)}>
              المخزون الحالي
            </span>
            <span className={cn(
              'text-lg font-bold',
              isLowStock ? 'text-orange-600' : 'text-green-600'
            )}>
              {material.currentStock} {UNIT_LABELS[material.unit]}
            </span>
          </div>
          
          {/* Stock Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className={cn(
                'h-2 rounded-full transition-all duration-300',
                stockPercentage > 50 ? 'bg-green-500' :
                stockPercentage > 25 ? 'bg-yellow-500' : 'bg-red-500'
              )}
              style={{ width: `${Math.min(stockPercentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>الحد الأدنى: {material.minimumStock}</span>
            {material.maximumStock && (
              <span>الحد الأقصى: {material.maximumStock}</span>
            )}
          </div>
        </div>

        {/* Cost Info */}
        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className={theme.text.secondary}>متوسط التكلفة:</span>
            <span className={cn('font-medium', theme.text.primary)}>
              {formatJordanCurrency(material.averageCost)}
            </span>
          </div>
          {material.lastPurchasePrice && (
            <div className="flex justify-between text-sm mt-1">
              <span className={theme.text.secondary}>آخر سعر شراء:</span>
              <span className={cn('font-medium', theme.text.primary)}>
                {formatJordanCurrency(material.lastPurchasePrice)}
              </span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <Button
            onClick={onView}
            variant="outline"
            size="sm"
            className="flex items-center justify-center"
          >
            <Eye className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={onEdit}
            variant="outline"
            size="sm"
            className="flex items-center justify-center"
          >
            <Edit className="h-4 w-4" />
          </Button>
          
          <Button
            onClick={onDelete}
            variant="outline"
            size="sm"
            className="flex items-center justify-center text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  )
}

export { CATEGORIES, CATEGORY_LABELS, UNITS, UNIT_LABELS }