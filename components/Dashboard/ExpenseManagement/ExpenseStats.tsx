'use client'

import { motion } from 'framer-motion'
import { DollarSign, TrendingUp, TrendingDown, Calendar, PieChart, BarChart3 } from 'lucide-react'
import { formatJordanCurrency } from '@/funcs/jordanLocale'

interface ExpenseStatsProps {
  summary: {
    totalExpenses: number
    categoryBreakdown: Array<{
      _id: string
      total: number
      count: number
      averageAmount: number
    }>
    monthlyTrends: Array<{
      _id: { year: number; month: number }
      total: number
      count: number
    }>
  }
}

export default function ExpenseStats({ summary }: ExpenseStatsProps) {
  const getCategoryName = (categoryId: string) => {
    const categoryNames: { [key: string]: string } = {
      'rent': 'إيجار',
      'utilities': 'المرافق',
      'salaries': 'الرواتب',
      'marketing': 'التسويق والإعلان',
      'maintenance': 'الصيانة والإصلاح',
      'equipment': 'المعدات والأجهزة',
      'insurance': 'التأمين',
      'licenses': 'التراخيص والرسوم',
      'transportation': 'النقل والمواصلات',
      'packaging': 'التعبئة والتغليف',
      'cleaning': 'النظافة والتعقيم',
      'professional_services': 'الخدمات المهنية',
      'training': 'التدريب والتطوير',
      'software': 'البرمجيات والتطبيقات',
      'bank_fees': 'رسوم بنكية',
      'office_supplies': 'مستلزمات المكتب',
      'security': 'الأمن والحراسة',
      'waste_management': 'إدارة النفايات',
      'other': 'أخرى'
    }
    return categoryNames[categoryId] || categoryId
  }

  const getMonthName = (month: number) => {
    const monthNames = [
      'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
      'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
    ]
    return monthNames[month - 1] || month.toString()
  }

  const calculateMonthlyGrowth = () => {
    if (!summary.monthlyTrends || summary.monthlyTrends.length < 2) return 0
    
    const currentMonth = summary.monthlyTrends[0]?.total || 0
    const previousMonth = summary.monthlyTrends[1]?.total || 0
    
    if (previousMonth === 0) return 0
    return ((currentMonth - previousMonth) / previousMonth) * 100
  }

  const monthlyGrowth = calculateMonthlyGrowth()
  const topCategory = summary.categoryBreakdown?.[0]
  const totalTransactions = summary.categoryBreakdown?.reduce((sum, cat) => sum + cat.count, 0) || 0
  const averageExpense = totalTransactions > 0 ? summary.totalExpenses / totalTransactions : 0

  const stats = [
    {
      title: 'إجمالي المصروفات',
      value: formatJordanCurrency(summary.totalExpenses || 0),
      icon: DollarSign,
      color: 'red',
      change: monthlyGrowth,
      changeType: monthlyGrowth > 0 ? 'increase' : monthlyGrowth < 0 ? 'decrease' : 'neutral'
    },
    {
      title: 'عدد المعاملات',
      value: totalTransactions.toLocaleString('ar-JO'),
      icon: BarChart3,
      color: 'blue',
      description: 'إجمالي عدد المصروفات'
    },
    {
      title: 'متوسط المصروف',
      value: formatJordanCurrency(averageExpense),
      icon: TrendingUp,
      color: 'purple',
      description: 'متوسط قيمة المصروف الواحد'
    },
    {
      title: 'أكبر فئة مصروفات',
      value: topCategory ? getCategoryName(topCategory._id) : 'لا توجد بيانات',
      icon: PieChart,
      color: 'orange',
      description: topCategory ? formatJordanCurrency(topCategory.total) : ''
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className={`p-3 rounded-lg bg-${stat.color}-50 dark:bg-${stat.color}-900/20`}>
              <stat.icon className={`w-6 h-6 text-${stat.color}-600 dark:text-${stat.color}-400`} />
            </div>
            
            {stat.change !== undefined && (
              <div className={`flex items-center space-x-1 rtl:space-x-reverse text-sm ${
                stat.changeType === 'increase' 
                  ? 'text-red-600 dark:text-red-400' 
                  : stat.changeType === 'decrease'
                  ? 'text-green-600 dark:text-green-400'
                  : 'text-gray-600 dark:text-gray-400'
              }`}>
                {stat.changeType === 'increase' ? (
                  <TrendingUp className="w-4 h-4" />
                ) : stat.changeType === 'decrease' ? (
                  <TrendingDown className="w-4 h-4" />
                ) : (
                  <Calendar className="w-4 h-4" />
                )}
                <span>{Math.abs(stat.change).toFixed(1)}%</span>
              </div>
            )}
          </div>
          
          <div>
            <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
              {stat.title}
            </h3>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {stat.value}
            </p>
            {stat.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {stat.description}
              </p>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  )
}