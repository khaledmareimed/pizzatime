import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/funcs/database'
import { Coupon, validateCouponForOrder, OrderValidationData } from '@/funcs/collections/coupon'
import { rateLimit } from '@/funcs/middleware/rateLimit'
import mongoose from 'mongoose'

// POST /api/coupons/validate - Validate coupon for checkout
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 60, window: 60 * 1000 }) // 60 requests per minute for validation
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
        { error: 'يجب تسجيل الدخول لاستخدام القسائم' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { couponCode, orderData } = body

    // Debug logging
    console.log('Coupon validation request:', {
      couponCode,
      orderData,
      userId: session.user.id
    })

    // Validate required fields
    if (!couponCode || !orderData) {
      return NextResponse.json(
        { error: 'رمز القسيمة وبيانات الطلب مطلوبة' },
        { status: 400 }
      )
    }

    // More detailed validation with better error messages
    if (typeof orderData.orderTotal !== 'number' || orderData.orderTotal <= 0) {
      return NextResponse.json(
        { error: 'إجمالي الطلب غير صحيح' },
        { status: 400 }
      )
    }

    if (!Array.isArray(orderData.categoryIds)) {
      return NextResponse.json(
        { error: 'معرفات الفئات غير صحيحة' },
        { status: 400 }
      )
    }

    if (!Array.isArray(orderData.productIds) || orderData.productIds.length === 0) {
      return NextResponse.json(
        { error: 'معرفات المنتجات غير صحيحة أو فارغة' },
        { status: 400 }
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

    // Find coupon by code
    const coupon = await db.collection('coupons').findOne({ 
      code: couponCode.toUpperCase() 
    }) as Coupon | null

    if (!coupon) {
      return NextResponse.json(
        { error: 'رمز القسيمة غير صحيح' },
        { status: 404 }
      )
    }

    // Prepare validation data
    const validationData: OrderValidationData = {
      userId: session.user.id,
      orderTotal: parseFloat(orderData.orderTotal),
      categoryIds: orderData.categoryIds,
      productIds: orderData.productIds
    }

    // Validate coupon
    const validationResult = validateCouponForOrder(coupon, validationData)

    if (!validationResult.isValid) {
      return NextResponse.json(
        { error: validationResult.error },
        { status: 400 }
      )
    }

    // Return success with discount information
    return NextResponse.json({
      success: true,
      data: {
        couponId: coupon._id,
        code: coupon.code,
        name: coupon.name,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount: validationResult.discountAmount,
        minimumOrderAmount: coupon.minimumOrderAmount,
        maximumDiscountAmount: coupon.maximumDiscountAmount
      },
      message: 'تم تطبيق القسيمة بنجاح'
    })

  } catch (error) {
    console.error('Error validating coupon:', error)
    return NextResponse.json(
      { error: 'خطأ في التحقق من القسيمة' },
      { status: 500 }
    )
  }
}