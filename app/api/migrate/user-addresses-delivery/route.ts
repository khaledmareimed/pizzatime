import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection } from '@/funcs/collections'
import { UserSchema, UserIndexes } from '@/funcs/collections/user'
import { SettingsSchema, SettingsIndexes } from '@/funcs/collections/settings'
import type { User } from '@/funcs/collections/user'
import type { Settings } from '@/funcs/collections/settings'

/**
 * POST /api/migrate/user-addresses-delivery
 * Migrate existing user addresses to include location and delivery cost
 * Admin only
 */
export async function POST() {
  try {
    const session = await auth()
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    // Get collections
    const usersCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })
    
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })

    // Get settings for default delivery costs
    const settings = await settingsCollection.model.findOne({})
    
    if (!settings || !settings.deliveryAreas.length) {
      return NextResponse.json({
        success: false,
        error: 'لا توجد مناطق توصيل في الإعدادات'
      })
    }

    // Get all users with addresses that need migration
    const users = await usersCollection.model.find({
      'addresses.0': { $exists: true },
      $or: [
        { 'addresses.location': { $exists: false } },
        { 'addresses.deliveryCost': { $exists: false } }
      ]
    })

    let migratedCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const user of users) {
      try {
        let userUpdated = false

        for (let i = 0; i < user.addresses.length; i++) {
          const address = user.addresses[i]
          
          // Skip if already migrated
          if (address.location && address.deliveryCost !== undefined) {
            continue
          }

          // Find matching delivery area
          const deliveryArea = settings.deliveryAreas.find(area => 
            area.isActive && 
            area.cityName.toLowerCase() === address.city.toLowerCase()
          )

          if (deliveryArea && deliveryArea.locations.length > 0) {
            // Use the first active location as default
            const defaultLocation = deliveryArea.locations.find(loc => loc.isActive) || deliveryArea.locations[0]
            
            if (defaultLocation) {
              user.addresses[i].location = defaultLocation.locationName
              user.addresses[i].deliveryCost = defaultLocation.customerCost
              userUpdated = true
            }
          } else {
            // Set default values for cities not in delivery areas
            user.addresses[i].location = 'منطقة افتراضية'
            user.addresses[i].deliveryCost = 3.0 // Default delivery cost
            userUpdated = true
            
            errors.push(`المدينة "${address.city}" غير موجودة في مناطق التوصيل للمستخدم ${user.email}`)
          }
        }

        if (userUpdated) {
          await user.save()
          migratedCount++
        }

      } catch (error) {
        console.error(`Error migrating user ${user.email}:`, error)
        errorCount++
        errors.push(`خطأ في ترحيل عناوين المستخدم ${user.email}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: 'تم ترحيل العناوين بنجاح',
      data: {
        totalUsers: users.length,
        migratedUsers: migratedCount,
        errorCount,
        errors: errors.slice(0, 10) // Limit errors shown
      }
    })

  } catch (error) {
    console.error('Address migration error:', error)
    return NextResponse.json(
      { error: 'خطأ في الخادم' },
      { status: 500 }
    )
  }
}