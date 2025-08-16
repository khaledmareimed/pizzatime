import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { createCollection, User, UserSchema, UserIndexes, Settings, SettingsSchema, SettingsIndexes } from '../../../funcs/collections'

/**
 * POST /api/fix-user-schema - Fix user schema issues for all users (admin) or current user
 * This endpoint fixes schema conflicts including missing address fields
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { fixAll } = await request.json().catch(() => ({ fixAll: false }))
    
    // Check if admin wants to fix all users
    if (fixAll && session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Admin access required to fix all users' },
        { status: 403 }
      )
    }

    // Get collections
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })
    
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })

    // Get settings for delivery areas
    const settings = await settingsCollection.model.findOne({})

    let users: any[]
    if (fixAll) {
      // Admin fixing all users
      users = await userCollection.model.find({
        'addresses.0': { $exists: true }
      })
    } else {
      // Fix current user only
      const user = await userCollection.model.findOne({ 
        email: session.user.email 
      })
      users = user ? [user] : []
    }

    if (users.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No users found to fix',
        fixedUsers: 0
      })
    }

    let fixedCount = 0
    let errorCount = 0
    const errors: string[] = []

    for (const user of users) {
      try {
        let userUpdated = false

        for (let i = 0; i < user.addresses.length; i++) {
          const address = user.addresses[i]
          let addressUpdated = false
          
          // Fix missing recipientName
          if (!address.recipientName) {
            user.addresses[i].recipientName = user.name || 'مستلم غير محدد'
            addressUpdated = true
          }
          
          // Fix missing location
          if (!address.location) {
            if (settings?.deliveryAreas?.length) {
              const deliveryArea = settings.deliveryAreas.find(area => 
                area.isActive && 
                area.cityName.toLowerCase() === address.city.toLowerCase()
              )
              
              if (deliveryArea && deliveryArea.locations.length > 0) {
                const defaultLocation = deliveryArea.locations.find(loc => loc.isActive) || deliveryArea.locations[0]
                user.addresses[i].location = defaultLocation.locationName
                user.addresses[i].locationId = defaultLocation._id?.toString() || ''
              } else {
                user.addresses[i].location = 'منطقة افتراضية'
                user.addresses[i].locationId = ''
              }
            } else {
              user.addresses[i].location = 'منطقة افتراضية'
              user.addresses[i].locationId = ''
            }
            addressUpdated = true
          }
          
          // Fix missing locationId
          if (!address.locationId) {
            user.addresses[i].locationId = ''
            addressUpdated = true
          }
          
          // Fix missing cityId
          if (!address.cityId) {
            if (settings?.deliveryAreas?.length) {
              const deliveryArea = settings.deliveryAreas.find(area => 
                area.isActive && 
                area.cityName.toLowerCase() === address.city.toLowerCase()
              )
              
              if (deliveryArea) {
                user.addresses[i].cityId = deliveryArea._id?.toString() || ''
              } else {
                user.addresses[i].cityId = ''
              }
            } else {
              user.addresses[i].cityId = ''
            }
            addressUpdated = true
          }
          
          // Fix missing deliveryCost
          if (address.deliveryCost === undefined || address.deliveryCost === null) {
            if (settings?.deliveryAreas?.length) {
              const deliveryArea = settings.deliveryAreas.find(area => 
                area.isActive && 
                area.cityName.toLowerCase() === address.city.toLowerCase()
              )
              
              if (deliveryArea && deliveryArea.locations.length > 0) {
                const defaultLocation = deliveryArea.locations.find(loc => loc.isActive) || deliveryArea.locations[0]
                user.addresses[i].deliveryCost = defaultLocation.customerCost || 3.0
              } else {
                user.addresses[i].deliveryCost = 3.0
              }
            } else {
              user.addresses[i].deliveryCost = 3.0
            }
            addressUpdated = true
          }
          
          // Handle old address format (street/zipCode)
          if (address.street || address.zipCode) {
            user.addresses[i] = {
              name: address.name || 'عنوان محفوظ',
              recipientName: address.recipientName || user.name || 'مستلم غير محدد',
              city: address.city || 'غير محدد',
              cityId: address.cityId || '',
              location: address.location || 'منطقة افتراضية',
              locationId: address.locationId || '',
              deliveryCost: address.deliveryCost || 3.0,
              phone: address.phone || '+966500000000',
              addressDetails: `${address.street || ''} ${address.zipCode || ''}`.trim() || address.addressDetails || 'غير محدد',
              isDefault: address.isDefault || false
            }
            addressUpdated = true
          }
          
          if (addressUpdated) {
            userUpdated = true
          }
        }

        if (userUpdated) {
          await user.save()
          fixedCount++
          console.log(`Fixed user: ${user.email}`)
        }

      } catch (error) {
        console.error(`Error fixing user ${user.email}:`, error)
        errorCount++
        errors.push(`خطأ في إصلاح المستخدم ${user.email}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: fixAll ? 'تم إصلاح جميع المستخدمين بنجاح' : 'تم إصلاح المستخدم بنجاح',
      data: {
        totalUsers: users.length,
        fixedUsers: fixedCount,
        errorCount,
        errors: errors.slice(0, 5)
      }
    })

  } catch (error) {
    console.error('Error fixing user schema:', error)
    return NextResponse.json(
      { error: 'Failed to fix user schema' },
      { status: 500 }
    )
  }
}