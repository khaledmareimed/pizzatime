import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/funcs/database'
import { Coupon, validateCouponForOrder, OrderValidationData } from '@/funcs/collections/coupon'
import { rateLimit } from '@/funcs/middleware/rateLimit'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

// POST /api/coupons/apply - Apply coupon to order (increment usage)
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 30, window: 60 * 1000 }) // 30 requests per minute for applying coupons
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
    const { couponCode, orderData, orderId } = body

    // Validate required fields
    if (!couponCode || !orderData || !orderId) {
      return NextResponse.json(
        { error: 'رمز القسيمة وبيانات الطلب ومعرف الطلب مطلوبة' },
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

    // Start a transaction to ensure data consistency
    const session_db = mongoose.connection.getClient().startSession()
    
    try {
      await session_db.withTransaction(async () => {
        // Find coupon by code
        const coupon = await db.collection('coupons').findOne({ 
          code: couponCode.toUpperCase() 
        }, { session: session_db }) as Coupon | null

        if (!coupon) {
          throw new Error('رمز القسيمة غير صحيح')
        }

        // Prepare validation data
        const validationData: OrderValidationData = {
          userId: session.user.id,
          userEmail: session.user.email || '',
          orderTotal: parseFloat(orderData.orderTotal),
          categoryIds: orderData.categoryIds,
          productIds: orderData.productIds
        }

        // Re-validate coupon (security check)
        const validationResult = validateCouponForOrder(coupon, validationData)

        if (!validationResult.isValid) {
          throw new Error(validationResult.error || 'القسيمة غير صالحة')
        }

        // Check if user has already used this coupon (check both userId and email)
        const existingUsage = coupon.usedBy.find(usage => 
          usage.userId === session.user.id || usage.userEmail === (session.user.email || '')
        )
        
        // Update coupon usage
        const updateQuery: any = {
          $inc: { usageCount: 1 },
          $set: { updatedAt: new Date() }
        }

        if (existingUsage) {
          // Increment existing user usage
          updateQuery.$inc['usedBy.$.usageCount'] = 1
          updateQuery.$set['usedBy.$.lastUsed'] = new Date()
          updateQuery.$set['usedBy.$.userEmail'] = session.user.email || '' // Update email if needed
          
          await db.collection('coupons').updateOne(
            { 
              _id: new ObjectId(coupon._id),
              $or: [
                { 'usedBy.userId': session.user.id },
                { 'usedBy.userEmail': session.user.email || '' }
              ]
            },
            updateQuery,
            { session: session_db }
          )
        } else {
          // Add new user usage
          updateQuery.$push = {
            usedBy: {
              userId: session.user.id,
              userEmail: session.user.email || '',
              usageCount: 1,
              lastUsed: new Date()
            }
          }
          
          await db.collection('coupons').updateOne(
            { _id: new ObjectId(coupon._id) },
            updateQuery,
            { session: session_db }
          )
        }

        // Log coupon usage for audit trail
        await db.collection('coupon_usage_logs').insertOne({
          couponId: new ObjectId(coupon._id),
          couponCode: coupon.code,
          userId: session.user.id,
          orderId: orderId,
          discountAmount: validationResult.discountAmount,
          orderTotal: validationData.orderTotal,
          appliedAt: new Date(),
          userEmail: session.user.email || ''
        }, { session: session_db })

        return {
          couponId: coupon._id,
          code: coupon.code,
          name: coupon.name,
          discountAmount: validationResult.discountAmount
        }
      })

      return NextResponse.json({
        success: true,
        message: 'تم تطبيق القسيمة بنجاح على الطلب'
      })

    } finally {
      await session_db.endSession()
    }

  } catch (error) {
    console.error('Error applying coupon:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'خطأ في تطبيق القسيمة' },
      { status: 500 }
    )
  }
}