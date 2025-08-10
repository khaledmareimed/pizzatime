import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/funcs/database'
import { CouponSchema, Coupon } from '@/funcs/collections/coupon'
import { rateLimit } from '@/funcs/middleware/rateLimit'
import mongoose from 'mongoose'

// GET /api/coupons - Get all coupons (admin only)
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 100, window: 60 * 1000 }) // 100 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    // Admin authorization check
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'يجب أن تكون مديراً للوصول لهذه الصفحة' },
        { status: 403 }
      )
    }

    await connectToDatabase()
    const db = mongoose.connection.db
    
    if (!db) {
      return NextResponse.json(
        { error: 'خطأ في الاتصال بقاعدة البيانات' },
        { status: 500 }
      )
    }
    
    // Get query parameters
    const url = new URL(request.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50)
    const search = url.searchParams.get('search') || ''
    const status = url.searchParams.get('status') // 'active', 'inactive', 'expired'
    const sortBy = url.searchParams.get('sortBy') || 'createdAt'
    const sortOrder = url.searchParams.get('sortOrder') === 'asc' ? 1 : -1

    // Build query
    const query: any = {}
    
    if (search) {
      query.$or = [
        { code: { $regex: search, $options: 'i' } },
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    const now = new Date()
    if (status === 'active') {
      query.isActive = true
      query.startDate = { $lte: now }
      query.endDate = { $gte: now }
    } else if (status === 'inactive') {
      query.isActive = false
    } else if (status === 'expired') {
      query.endDate = { $lt: now }
    }

    // Get total count
    const total = await db.collection('coupons').countDocuments(query)

    // Get coupons with pagination
    const coupons = await db.collection('coupons')
      .find(query)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()

    return NextResponse.json({
      success: true,
      data: coupons,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })

  } catch (error) {
    console.error('Error fetching coupons:', error)
    return NextResponse.json(
      { error: 'خطأ في جلب القسائم' },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Create new coupon (admin only)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 20, window: 60 * 1000 }) // 20 requests per minute for creation
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة لاحقاً.' },
        { status: 429 }
      )
    }

    // Authentication check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    // Admin authorization check
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'يجب أن تكون مديراً لإنشاء القسائم' },
        { status: 403 }
      )
    }

    const body = await request.json()
    await connectToDatabase()
    const db = mongoose.connection.db

    if (!db) {
      return NextResponse.json(
        { error: 'خطأ في الاتصال بقاعدة البيانات' },
        { status: 500 }
      )
    }

    // Validate required fields
    const requiredFields = ['code', 'name', 'discountType', 'discountValue', 'startDate', 'endDate']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `الحقل ${field} مطلوب` },
          { status: 400 }
        )
      }
    }

    // Validate coupon code uniqueness
    const existingCoupon = await db.collection('coupons').findOne({ 
      code: body.code.toUpperCase() 
    })
    if (existingCoupon) {
      return NextResponse.json(
        { error: 'رمز القسيمة موجود بالفعل' },
        { status: 400 }
      )
    }

    // Validate dates
    const startDate = new Date(body.startDate)
    const endDate = new Date(body.endDate)
    if (endDate <= startDate) {
      return NextResponse.json(
        { error: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' },
        { status: 400 }
      )
    }

    // Validate discount value
    if (body.discountType === 'percentage' && (body.discountValue <= 0 || body.discountValue > 100)) {
      return NextResponse.json(
        { error: 'نسبة الخصم يجب أن تكون بين 1 و 100' },
        { status: 400 }
      )
    }

    if (body.discountType === 'fixed' && body.discountValue <= 0) {
      return NextResponse.json(
        { error: 'قيمة الخصم يجب أن تكون أكبر من صفر' },
        { status: 400 }
      )
    }

    // Prepare coupon data
    const couponData = {
      code: body.code.toUpperCase(),
      name: body.name.trim(),
      description: body.description?.trim() || '',
      discountType: body.discountType,
      discountValue: parseFloat(body.discountValue),
      minimumOrderAmount: parseFloat(body.minimumOrderAmount) || 0,
      maximumDiscountAmount: body.maximumDiscountAmount ? parseFloat(body.maximumDiscountAmount) : undefined,
      usageLimit: body.usageLimit ? parseInt(body.usageLimit) : undefined,
      usageCount: 0,
      userUsageLimit: parseInt(body.userUsageLimit) || 1,
      startDate,
      endDate,
      isActive: body.isActive !== false,
      applicableCategories: body.applicableCategories || [],
      excludedCategories: body.excludedCategories || [],
      applicableProducts: body.applicableProducts || [],
      excludedProducts: body.excludedProducts || [],
      createdBy: session.user.id,
      usedBy: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Insert coupon
    const result = await db.collection('coupons').insertOne(couponData)
    
    // Fetch the created coupon
    const createdCoupon = await db.collection('coupons').findOne({ _id: result.insertedId })

    return NextResponse.json({
      success: true,
      data: createdCoupon,
      message: 'تم إنشاء القسيمة بنجاح'
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating coupon:', error)
    return NextResponse.json(
      { error: 'خطأ في إنشاء القسيمة' },
      { status: 500 }
    )
  }
}