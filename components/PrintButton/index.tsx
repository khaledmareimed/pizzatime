'use client'

import { useState } from 'react'
import { 
  Printer, 
  ChevronDown, 
  Receipt, 
  ChefHat, 
  Truck, 
  CreditCard, 
  BarChart3, 
  FileText,
  Copy,
  Zap
} from 'lucide-react'
import Button from '@/components/Button'
import { 
  printReceipt, 
  printMultipleReceipts, 
  getRecommendedReceiptTypes,
  validateOrderForPrinting,
  type ReceiptType 
} from '@/funcs/print-utils'
import { getRestaurantInfo, getPrinterConfig } from '@/funcs/restaurant-settings'

interface PrintButtonProps {
  order: any
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
  className?: string
  showDropdown?: boolean
  defaultType?: ReceiptType
}

const receiptTypeConfig = {
  customer: {
    label: 'فاتورة العميل',
    icon: Receipt,
    description: 'فاتورة كاملة للعميل',
    color: 'text-blue-600'
  },
  kitchen: {
    label: 'تذكرة المطبخ',
    icon: ChefHat,
    description: 'للمطبخ وتحضير الطعام',
    color: 'text-orange-600'
  },
  delivery: {
    label: 'قسيمة التوصيل',
    icon: Truck,
    description: 'لسائق التوصيل',
    color: 'text-green-600'
  },
  cashier: {
    label: 'نسخة الكاشير',
    icon: CreditCard,
    description: 'للكاشير والمحاسبة',
    color: 'text-purple-600'
  },
  manager: {
    label: 'تقرير إداري',
    icon: BarChart3,
    description: 'تقرير بالتكاليف والأرباح',
    color: 'text-red-600'
  },
  invoice: {
    label: 'فاتورة ضريبية',
    icon: FileText,
    description: 'فاتورة رسمية للشركات',
    color: 'text-gray-600'
  }
}

export default function PrintButton({ 
  order, 
  size = 'sm', 
  variant = 'outline',
  className = '',
  showDropdown = true,
  defaultType = 'customer'
}: PrintButtonProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Validate order data
  if (!validateOrderForPrinting(order)) {
    console.error('Invalid order data for printing:', order)
    return null
  }

  const handlePrint = async (type: ReceiptType) => {
    try {
      setIsLoading(true)
      
      // Load restaurant settings and printer config
      const [restaurantInfo, printerConfig] = await Promise.all([
        getRestaurantInfo(),
        getPrinterConfig()
      ])
      
      await printReceipt(order, type, restaurantInfo, printerConfig)
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Error printing receipt:', error)
      alert('حدث خطأ أثناء طباعة الفاتورة')
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrintMultiple = async () => {
    try {
      setIsLoading(true)
      
      // Load restaurant settings and printer config
      const [restaurantInfo, printerConfig] = await Promise.all([
        getRestaurantInfo(),
        getPrinterConfig()
      ])
      
      const recommendedTypes = getRecommendedReceiptTypes(order)
      await printMultipleReceipts(order, recommendedTypes, restaurantInfo, printerConfig)
      setIsDropdownOpen(false)
    } catch (error) {
      console.error('Error printing multiple receipts:', error)
      alert('حدث خطأ أثناء طباعة الفواتير')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickPrint = () => {
    handlePrint(defaultType)
  }

  if (!showDropdown) {
    return (
      <Button
        onClick={handleQuickPrint}
        size={size}
        variant={variant}
        className={`flex items-center gap-2 ${className}`}
        disabled={isLoading}
      >
        <Printer className="w-4 h-4" />
        {isLoading ? 'جاري الطباعة...' : 'طباعة الفاتورة'}
      </Button>
    )
  }

  return (
    <div className="relative">
      {/* Main Print Button */}
      <div className="flex">
        <Button
          onClick={handleQuickPrint}
          size={size}
          variant={variant}
          className={`flex items-center gap-2 rounded-l-xl rounded-r-none ${className}`}
          disabled={isLoading}
        >
          <Printer className="w-4 h-4" />
          {isLoading ? 'جاري الطباعة...' : 'طباعة'}
        </Button>
        
        {/* Dropdown Toggle */}
        <Button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          size={size}
          variant={variant}
          className="px-2 rounded-r-xl rounded-l-none border-l border-gray-300 dark:border-gray-600"
          disabled={isLoading}
        >
          <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </Button>
      </div>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute top-full left-0 mt-2 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              طباعة الفواتير
            </h3>
            
            {/* Quick Actions */}
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    إجراءات سريعة
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={handlePrintMultiple}
                  disabled={isLoading}
                  className="w-full text-left px-3 py-2 text-sm text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Copy className="w-4 h-4" />
                    <div>
                      <div className="font-medium">طباعة الكل المُوصى</div>
                      <div className="text-xs text-blue-600 dark:text-blue-400">
                        طباعة جميع الفواتير المناسبة للطلب
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Individual Receipt Types */}
            <div className="space-y-1">
              {Object.entries(receiptTypeConfig).map(([type, config]) => {
                const Icon = config.icon
                return (
                  <button
                    key={type}
                    onClick={() => handlePrint(type as ReceiptType)}
                    disabled={isLoading}
                    className="w-full text-left px-3 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 ${config.color}`} />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400">
                          {config.label}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {config.description}
                        </div>
                      </div>
                      <Printer className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                    </div>
                  </button>
                )
              })}
            </div>

            {/* Order Info */}
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>طلب #{order.posOrderId ? order.posOrderId.slice(-6) : (order.orderId || order._id || 'غير محدد').toString().slice(-6)}</div>
                <div>المبلغ: {order.orderSummary?.total ? `${order.orderSummary.total} د.أ` : 'غير محدد'}</div>
                <div>النوع: {order.deliveryMethod === 'pickup' ? 'استلام' : 'توصيل'}</div>
                {order.priority && order.priority !== 'normal' && (
                  <div className="text-orange-600 dark:text-orange-400">
                    أولوية: {order.priority === 'high' ? 'عالية' : order.priority === 'urgent' ? 'عاجلة' : order.priority}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
}