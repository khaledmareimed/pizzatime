import { auth } from '../../auth'
import { createCollection, User, UserSchema, UserIndexes } from '../collections'

/**
 * Middleware to ensure user exists in database after authentication
 * This will be called when user signs in for the first time or returns
 */
export async function ensureUserExists() {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return null
    }

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Check if user exists
    let user = await userCollection.model.findOne({ 
      email: session.user.email 
    })

    if (!user) {
      // Create new user on first login with correct schema
      user = new userCollection.model({
        email: session.user.email,
        name: session.user.name || 'مستخدم جديد',
        profileImage: session.user.image,
        googleId: session.user.id,
        role: session.user.role || 'user',
        orders: [],
        favorites: [],
        addresses: [], // Empty array - no validation issues
        dateJoined: new Date(),
        lastLogin: new Date(),
        isActive: true
      })
      
      await user.save()
      console.log(`New user created: ${user.email}`)
    } else {
      // Check if user has addresses that need migration for new schema fields
      if (user.addresses && user.addresses.length > 0) {
        let needsMigration = false
        
        user.addresses = user.addresses.map((addr: any) => {
          const updatedAddr = { ...addr }
          
          // Add missing recipientName
          if (!updatedAddr.recipientName) {
            updatedAddr.recipientName = user?.name || 'مستلم غير محدد'
            needsMigration = true
          }
          
          // Add missing location fields with defaults
          if (!updatedAddr.location) {
            updatedAddr.location = 'منطقة افتراضية'
            needsMigration = true
          }
          
          // Clean up mock IDs and set to empty for migration
          if (!updatedAddr.locationId || updatedAddr.locationId === 'default-location-id') {
            updatedAddr.locationId = ''
            needsMigration = true
          }
          
          if (!updatedAddr.cityId || updatedAddr.cityId === 'default-city-id') {
            updatedAddr.cityId = ''
            needsMigration = true
          }
          
          if (updatedAddr.deliveryCost === undefined || updatedAddr.deliveryCost === null) {
            updatedAddr.deliveryCost = 3.0 // Default delivery cost
            needsMigration = true
          }
          
          return updatedAddr
        })
        
        if (needsMigration) {
          console.log(`Migrating addresses for user: ${user.email}`)
        }
      }
      
      // Update existing user's last login and profile info
      user.lastLogin = new Date()
      user.name = session.user.name || user.name
      user.profileImage = session.user.image || user.profileImage
      
      await user.save()
      console.log(`User updated: ${user.email}`)
    }

    return user

  } catch (error) {
    console.error('Error ensuring user exists:', error)
    return null
  }
}

/**
 * Get current authenticated user from database
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return null
    }

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Find user by email
    const user = await userCollection.model.findOne({ 
      email: session.user.email 
    }).populate('orders').populate('favorites')

    return user

  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Add product to user's favorites
 */
export async function addToFavorites(productId: string): Promise<boolean> {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return false
    }

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Add to favorites if not already there
    const result = await userCollection.model.updateOne(
      { 
        email: session.user.email,
        favorites: { $ne: productId }
      },
      { 
        $push: { favorites: productId }
      }
    )

    return result.modifiedCount > 0

  } catch (error) {
    console.error('Error adding to favorites:', error)
    return false
  }
}

/**
 * Remove product from user's favorites
 */
export async function removeFromFavorites(productId: string): Promise<boolean> {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return false
    }

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Remove from favorites
    const result = await userCollection.model.updateOne(
      { email: session.user.email },
      { 
        $pull: { favorites: productId }
      }
    )

    return result.modifiedCount > 0

  } catch (error) {
    console.error('Error removing from favorites:', error)
    return false
  }
}

/**
 * Add order to user's order history
 */
export async function addOrderToUser(orderId: string): Promise<boolean> {
  try {
    const session = await auth()
    
    if (!session?.user?.email) {
      return false
    }

    // Get user collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Add order to user's orders array
    const result = await userCollection.model.updateOne(
      { email: session.user.email },
      { 
        $push: { orders: orderId }
      }
    )

    return result.modifiedCount > 0

  } catch (error) {
    console.error('Error adding order to user:', error)
    return false
  }
}