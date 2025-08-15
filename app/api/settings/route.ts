import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection } from '@/funcs/collections'
import { SettingsSchema, SettingsIndexes, getDefaultSettings } from '@/funcs/collections/settings'
import type { Settings } from '@/funcs/collections/settings'

/**
 * GET /api/settings
 * Get restaurant settings (admin only)
 */
export async function GET() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    // Create/get settings collection
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })
    
    // Get settings - there should only be one document
    let settings = await settingsCollection.model.findOne({})
    
    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = getDefaultSettings(session.user.email || session.user.name || 'admin')
      settings = await settingsCollection.model.create(defaultSettings)
    }

    return NextResponse.json({
      success: true,
      data: settings
    })

  } catch (error) {
    console.error('Settings GET error:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/settings
 * Update restaurant settings (admin only)
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Create/get settings collection
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })
    
    // Validate required fields based on update type
    if (body.deliverySchedule) {
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
      for (const day of days) {
        if (body.deliverySchedule[day]) {
          const schedule = body.deliverySchedule[day]
          if (schedule.isOpen && (!schedule.openTime || !schedule.closeTime)) {
            return NextResponse.json(
              { error: `أوقات العمل مطلوبة لـ ${day}` },
              { status: 400 }
            )
          }
          
          // Validate time format (HH:MM)
          const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/
          if (schedule.openTime && !timeRegex.test(schedule.openTime)) {
            return NextResponse.json(
              { error: 'صيغة وقت الفتح غير صحيحة' },
              { status: 400 }
            )
          }
          if (schedule.closeTime && !timeRegex.test(schedule.closeTime)) {
            return NextResponse.json(
              { error: 'صيغة وقت الإغلاق غير صحيحة' },
              { status: 400 }
            )
          }
        }
      }
    }

    // Validate delivery areas
    if (body.deliveryAreas) {
      for (const area of body.deliveryAreas) {
        if (!area.cityName || area.cityName.trim().length === 0) {
          return NextResponse.json(
            { error: 'اسم المدينة مطلوب' },
            { status: 400 }
          )
        }
        
        if (area.locations) {
          for (const location of area.locations) {
            if (!location.locationName || location.locationName.trim().length === 0) {
              return NextResponse.json(
                { error: 'اسم المنطقة مطلوب' },
                { status: 400 }
              )
            }
            
            if (typeof location.restaurantCost !== 'number' || location.restaurantCost < 0) {
              return NextResponse.json(
                { error: 'تكلفة المطعم يجب أن تكون رقم موجب' },
                { status: 400 }
              )
            }
            
            if (typeof location.customerCost !== 'number' || location.customerCost < 0) {
              return NextResponse.json(
                { error: 'تكلفة العميل يجب أن تكون رقم موجب' },
                { status: 400 }
              )
            }
          }
        }
      }
    }

    // Validate banners
    if (body.banners) {
      for (const banner of body.banners) {
        if (!banner.title || banner.title.trim().length === 0) {
          return NextResponse.json(
            { error: 'عنوان البانر مطلوب' },
            { status: 400 }
          )
        }
        
        if (!banner.imageUrl || !banner.imageUrl.match(/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i)) {
          return NextResponse.json(
            { error: 'رابط صورة البانر غير صحيح' },
            { status: 400 }
          )
        }
        
        if (banner.linkUrl && !banner.linkUrl.match(/^https?:\/\/.+/)) {
          return NextResponse.json(
            { error: 'رابط البانر غير صحيح' },
            { status: 400 }
          )
        }
      }
    }

    // Prepare update data
    const updateData = {
      ...body,
      lastUpdated: new Date(),
      updatedBy: session.user.email || session.user.name || 'admin'
    }

    // Update or create settings
    let settings = await settingsCollection.model.findOne({})
    
    if (settings) {
      settings = await settingsCollection.model.findOneAndUpdate(
        { _id: settings._id },
        { $set: updateData },
        { new: true, runValidators: true }
      )
    } else {
      // Create new settings if none exist
      const defaultSettings = getDefaultSettings(updateData.updatedBy)
      settings = await settingsCollection.model.create({
        ...defaultSettings,
        ...updateData
      })
    }

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الإعدادات بنجاح',
      data: settings
    })

  } catch (error) {
    console.error('Settings PUT error:', error)
    
    // Handle validation errors
    if (error instanceof Error && error.message.includes('validation')) {
      return NextResponse.json(
        { error: 'بيانات غير صحيحة' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}