import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'

/**
 * Expense Categories API
 * Provides predefined and custom expense categories for better organization
 */

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Predefined expense categories with Arabic names
    const expenseCategories = [
      {
        id: 'rent',
        name: 'إيجار',
        nameEn: 'Rent',
        description: 'إيجار المحل أو المكتب',
        icon: 'building',
        color: '#EF4444',
        isRecurring: true,
        defaultRecurringPeriod: 'monthly'
      },
      {
        id: 'utilities',
        name: 'المرافق',
        nameEn: 'Utilities',
        description: 'كهرباء، ماء، غاز، إنترنت',
        icon: 'zap',
        color: '#F59E0B',
        isRecurring: true,
        defaultRecurringPeriod: 'monthly'
      },
      {
        id: 'salaries',
        name: 'الرواتب',
        nameEn: 'Salaries',
        description: 'رواتب الموظفين',
        icon: 'users',
        color: '#10B981',
        isRecurring: true,
        defaultRecurringPeriod: 'monthly'
      },
      {
        id: 'marketing',
        name: 'التسويق والإعلان',
        nameEn: 'Marketing & Advertising',
        description: 'إعلانات، تسويق، ترويج',
        icon: 'megaphone',
        color: '#8B5CF6',
        isRecurring: false
      },
      {
        id: 'maintenance',
        name: 'الصيانة والإصلاح',
        nameEn: 'Maintenance & Repairs',
        description: 'صيانة المعدات والأجهزة',
        icon: 'wrench',
        color: '#06B6D4',
        isRecurring: false
      },
      {
        id: 'equipment',
        name: 'المعدات والأجهزة',
        nameEn: 'Equipment & Devices',
        description: 'شراء معدات جديدة',
        icon: 'monitor',
        color: '#84CC16',
        isRecurring: false
      },
      {
        id: 'insurance',
        name: 'التأمين',
        nameEn: 'Insurance',
        description: 'تأمين المحل والمعدات',
        icon: 'shield',
        color: '#F97316',
        isRecurring: true,
        defaultRecurringPeriod: 'yearly'
      },
      {
        id: 'licenses',
        name: 'التراخيص والرسوم',
        nameEn: 'Licenses & Fees',
        description: 'رسوم حكومية وتراخيص',
        icon: 'file-text',
        color: '#EC4899',
        isRecurring: true,
        defaultRecurringPeriod: 'yearly'
      },
      {
        id: 'transportation',
        name: 'النقل والمواصلات',
        nameEn: 'Transportation',
        description: 'وقود، صيانة سيارات التوصيل',
        icon: 'truck',
        color: '#6366F1',
        isRecurring: false
      },
      {
        id: 'packaging',
        name: 'التعبئة والتغليف',
        nameEn: 'Packaging',
        description: 'أكياس، علب، مواد تغليف',
        icon: 'package',
        color: '#14B8A6',
        isRecurring: false
      },
      {
        id: 'cleaning',
        name: 'النظافة والتعقيم',
        nameEn: 'Cleaning & Sanitization',
        description: 'مواد تنظيف ومعقمات',
        icon: 'spray-can',
        color: '#F59E0B',
        isRecurring: false
      },
      {
        id: 'professional_services',
        name: 'الخدمات المهنية',
        nameEn: 'Professional Services',
        description: 'محاسب، محامي، استشارات',
        icon: 'briefcase',
        color: '#8B5CF6',
        isRecurring: false
      },
      {
        id: 'training',
        name: 'التدريب والتطوير',
        nameEn: 'Training & Development',
        description: 'دورات تدريبية للموظفين',
        icon: 'graduation-cap',
        color: '#10B981',
        isRecurring: false
      },
      {
        id: 'software',
        name: 'البرمجيات والتطبيقات',
        nameEn: 'Software & Applications',
        description: 'اشتراكات برمجيات وتطبيقات',
        icon: 'smartphone',
        color: '#3B82F6',
        isRecurring: true,
        defaultRecurringPeriod: 'monthly'
      },
      {
        id: 'bank_fees',
        name: 'رسوم بنكية',
        nameEn: 'Bank Fees',
        description: 'رسوم تحويلات ومعاملات بنكية',
        icon: 'credit-card',
        color: '#EF4444',
        isRecurring: false
      },
      {
        id: 'office_supplies',
        name: 'مستلزمات المكتب',
        nameEn: 'Office Supplies',
        description: 'أوراق، أقلام، مستلزمات إدارية',
        icon: 'pen-tool',
        color: '#6B7280',
        isRecurring: false
      },
      {
        id: 'security',
        name: 'الأمن والحراسة',
        nameEn: 'Security',
        description: 'كاميرات مراقبة، أنظمة أمان',
        icon: 'eye',
        color: '#DC2626',
        isRecurring: false
      },
      {
        id: 'waste_management',
        name: 'إدارة النفايات',
        nameEn: 'Waste Management',
        description: 'جمع ومعالجة النفايات',
        icon: 'trash-2',
        color: '#059669',
        isRecurring: true,
        defaultRecurringPeriod: 'monthly'
      },
      {
        id: 'other',
        name: 'أخرى',
        nameEn: 'Other',
        description: 'مصروفات أخرى غير مصنفة',
        icon: 'more-horizontal',
        color: '#6B7280',
        isRecurring: false
      }
    ]

    // Get expense statistics for each category
    const categoriesWithStats = expenseCategories.map(category => ({
      ...category,
      stats: {
        totalExpenses: 0,
        monthlyAverage: 0,
        lastExpenseDate: null,
        expenseCount: 0
      }
    }))

    return NextResponse.json({
      success: true,
      categories: categoriesWithStats,
      recurringPeriods: [
        { value: 'weekly', label: 'أسبوعياً' },
        { value: 'monthly', label: 'شهرياً' },
        { value: 'quarterly', label: 'ربع سنوي' },
        { value: 'yearly', label: 'سنوياً' }
      ]
    })

  } catch (error) {
    console.error('Error fetching expense categories:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}