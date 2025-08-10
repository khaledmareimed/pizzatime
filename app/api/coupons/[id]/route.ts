import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { connectToDatabase } from '@/funcs/database'
import { Coupon } from '@/funcs/collections/coupon'
import { rateLimit } from '@/funcs/middleware/rateLimit'
import { ObjectId } from 'mongodb'
import mongoose from 'mongoose'

// GET /api/coupons/[id] - Get single coupon (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params
    
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
    
    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'معرف القسيمة غير صحيح' },
        { status: 400 }
      )
    }

    const coupon = await db.collection('coupons').findOne({ 
      _id: new ObjectId(id) 
    })

    if (!coupon) {
      return NextResponse.json(
        { error: 'القسيمة غير موجودة' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: coupon
    })

  } catch (error) {
    console.error('Error fetching coupon:', error)
    return NextResponse.json(
      { error: 'خطأ في جلب القسيمة' },
      { status: 500 }
    )
  }
}

// PUT /api/coupons/[id] - Update coupon (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params
    
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 50, window: 60 * 1000 }) // 50 requests per minute for updates
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
        { error: 'يجب أن تكون مديراً لتعديل القسائم' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { db } = await connectToDatabase()

    if (!db) {
      return NextResponse.json(
        { error: 'خطأ في الاتصال بقاعدة البيانات' },
        { status: 500 }
      )
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'معرف القسيمة غير صحيح' },
        { status: 400 }
      )
    }

    // Check if coupon exists
    const existingCoupon = await db.collection('coupons').findOne({ 
      _id: new ObjectId(id) 
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { error: 'القسيمة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if code is being changed and if new code already exists
    if (body.code && body.code.toUpperCase() !== existingCoupon.code) {
      const codeExists = await db.collection('coupons').findOne({ 
        code: body.code.toUpperCase(),
        _id: { $ne: new ObjectId(id) }
      })
      if (codeExists) {
        return NextResponse.json(
          { error: 'رمز القسيمة موجود بالفعل' },
          { status: 400 }
        )
      }
    }

    // Validate dates if provided
    if (body.startDate && body.endDate) {
      const startDate = new Date(body.startDate)
      const endDate = new Date(body.endDate)
      if (endDate <= startDate) {
        return NextResponse.json(
          { error: 'تاريخ الانتهاء يجب أن يكون بعد تاريخ البداية' },
          { status: 400 }
        )
      }
    }

    // Validate discount value if provided
    if (body.discountType && body.discountValue !== undefined) {
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
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date()
    }

    // Only update provided fields
    const allowedFields = [
      'code', 'name', 'description', 'discountType', 'discountValue',
      'minimumOrderAmount', 'maximumDiscountAmount', 'usageLimit', 
      'userUsageLimit', 'startDate', 'endDate', 'isActive',
      'applicableCategories', 'excludedCategories', 
      'applicableProducts', 'excludedProducts'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        if (field === 'code') {
          updateData[field] = body[field].toUpperCase()
        } else if (field === 'name' || field === 'description') {
          updateData[field] = body[field].trim()
        } else if (field === 'startDate' || field === 'endDate') {
          updateData[field] = new Date(body[field])
        } else if (typeof body[field] === 'string' && ['discountValue', 'minimumOrderAmount', 'maximumDiscountAmount'].includes(field)) {
          updateData[field] = parseFloat(body[field])
        } else if (typeof body[field] === 'string' && ['usageLimit', 'userUsageLimit'].includes(field)) {
          updateData[field] = parseInt(body[field])
        } else {
          updateData[field] = body[field]
        }
      }
    }

    // Update coupon
    const result = await db.collection('coupons').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'القسيمة غير موجودة' },
        { status: 404 }
      )
    }

    // Fetch updated coupon
    const updatedCoupon = await db.collection('coupons').findOne({ 
      _id: new ObjectId(id) 
    })

    return NextResponse.json({
      success: true,
      data: updatedCoupon,
      message: 'تم تحديث القسيمة بنجاح'
    })

  } catch (error) {
    console.error('Error updating coupon:', error)
    return NextResponse.json(
      { error: 'خطأ في تحديث القسيمة' },
      { status: 500 }
    )
  }
}

// DELETE /api/coupons/[id] - Delete coupon (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Await params
    const { id } = await params
    
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 30, window: 60 * 1000 }) // 30 requests per minute for deletions
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
        { error: 'يجب أن تكون مديراً لحذف القسائم' },
        { status: 403 }
      )
    }

    const { db } = await connectToDatabase()

    if (!db) {
      return NextResponse.json(
        { error: 'خطأ في الاتصال بقاعدة البيانات' },
        { status: 500 }
      )
    }

    // Validate ObjectId
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: 'معرف القسيمة غير صحيح' },
        { status: 400 }
      )
    }

    // Check if coupon exists
    const existingCoupon = await db.collection('coupons').findOne({ 
      _id: new ObjectId(id) 
    })

    if (!existingCoupon) {
      return NextResponse.json(
        { error: 'القسيمة غير موجودة' },
        { status: 404 }
      )
    }

    // Check if coupon has been used
    if (existingCoupon.usageCount > 0) {
      return NextResponse.json(
        { error: 'لا يمكن حذف قسيمة تم استخدامها. يمكنك إلغاء تفعيلها بدلاً من ذلك.' },
        { status: 400 }
      )
    }

    // Delete coupon
    const result = await db.collection('coupons').deleteOne({ 
      _id: new ObjectId(id) 
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: 'فشل في حذف القسيمة' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'تم حذف القسيمة بنجاح'
    })

  } catch (error) {
    console.error('Error deleting coupon:', error)
    return NextResponse.json(
      { error: 'خطأ في حذف القسيمة' },
      { status: 500 }
    )
  }
}