import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { createCollection, User, UserSchema, UserIndexes } from '../../../funcs/collections'

/**
 * POST /api/fix-user-schema - Fix current user's schema issues
 * This endpoint fixes schema conflicts for the current user
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

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Find the user with flexible schema
    const user = await userCollection.model.findOne({ 
      email: session.user.email 
    }).lean()

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Check if user has old address format
    const hasOldFormat = user.addresses?.some((addr: any) => 
      addr.street || addr.zipCode
    )

    if (hasOldFormat) {
      console.log(`Fixing schema for user: ${session.user.email}`)
      
      // Convert old addresses to new format
      const updatedAddresses = (user.addresses || []).map((addr: any) => {
        if (addr.street || addr.zipCode) {
          return {
            name: addr.name || 'عنوان محفوظ',
            city: addr.city || 'غير محدد',
            phone: addr.phone || '+966500000000',
            addressDetails: `${addr.street || ''} ${addr.zipCode || ''}`.trim() || 'غير محدد',
            isDefault: addr.isDefault || false
          }
        }
        return {
          name: addr.name || 'عنوان محفوظ',
          city: addr.city || 'غير محدد',
          phone: addr.phone || '+966500000000',
          addressDetails: addr.addressDetails || 'غير محدد',
          isDefault: addr.isDefault || false
        }
      }).filter(addr => addr.name && addr.city && addr.phone && addr.addressDetails)

      // Update user with new format
      await userCollection.model.updateOne(
        { email: session.user.email },
        { 
          $set: { 
            addresses: updatedAddresses,
            // Ensure all required fields exist
            orders: user.orders || [],
            favorites: user.favorites || [],
            dateJoined: user.dateJoined || new Date(),
            lastLogin: new Date(),
            isActive: user.isActive !== false
          }
        }
      )

      return NextResponse.json({
        success: true,
        message: 'User schema fixed successfully',
        addressesUpdated: updatedAddresses.length,
        oldFormat: true
      })
    }

    // User already has correct format
    return NextResponse.json({
      success: true,
      message: 'User schema is already correct',
      addressesCount: user.addresses?.length || 0,
      oldFormat: false
    })

  } catch (error) {
    console.error('Error fixing user schema:', error)
    return NextResponse.json(
      { error: 'Failed to fix user schema' },
      { status: 500 }
    )
  }
}