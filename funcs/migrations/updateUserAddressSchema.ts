import { connectToDatabase, getModel } from '../database'
import { UserSchema } from '../collections/user'
import { Schema } from 'mongoose'

/**
 * Migration script to update user address schema from old format to new format
 * Run this once to migrate existing data
 */
export async function migrateUserAddressSchema() {
  try {
    console.log('Starting user address schema migration...')
    
    await connectToDatabase()
    
    // Create a temporary model to access the collection
    const tempSchema = new Schema({}, { strict: false, collection: 'users' })
    const UserModel = getModel('TempUser', tempSchema)
    
    // Find all users with old address format OR missing recipientName
    const usersWithOldAddresses = await UserModel.find({
      $or: [
        { 'addresses.street': { $exists: true } },
        { 'addresses.recipientName': { $exists: false }, 'addresses': { $ne: [] } }
      ]
    })
    
    console.log(`Found ${usersWithOldAddresses.length} users with addresses needing migration`)
    
    for (const user of usersWithOldAddresses) {
      const updatedAddresses = user.addresses?.map((addr: any) => {
        // Convert old format to new format
        if (addr.street || addr.zipCode) {
          return {
            name: addr.name || 'عنوان محفوظ',
            recipientName: user.name || 'مستلم غير محدد',
            city: addr.city || 'غير محدد',
            phone: addr.phone || '+966500000000',
            addressDetails: `${addr.street || ''} ${addr.zipCode || ''}`.trim() || 'غير محدد',
            isDefault: addr.isDefault || false
          }
        }
        // Add recipientName to existing addresses that don't have it
        if (!addr.recipientName) {
          return {
            ...addr,
            recipientName: user.name || 'مستلم غير محدد'
          }
        }
        return addr // Already in new format
      }) || []
      
      // Update the user with new address format
      await UserModel.updateOne(
        { _id: user._id },
        { $set: { addresses: updatedAddresses } }
      )
    }
    
    console.log('Migration completed successfully!')
    return { success: true, migratedUsers: usersWithOldAddresses.length }
    
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}

/**
 * Clean up any invalid address entries
 */
export async function cleanupInvalidAddresses() {
  try {
    console.log('Cleaning up invalid addresses...')
    
    await connectToDatabase()
    
    const tempSchema = new Schema({}, { strict: false, collection: 'users' })
    const UserModel = getModel('TempUserCleanup', tempSchema)
    
    // Remove addresses that don't have required fields
    const result = await UserModel.updateMany(
      {},
      {
        $pull: {
          addresses: {
            $or: [
              { name: { $exists: false } },
              { recipientName: { $exists: false } },
              { city: { $exists: false } },
              { phone: { $exists: false } },
              { addressDetails: { $exists: false } }
            ]
          }
        }
      }
    )
    
    console.log(`Cleaned up addresses for ${result.modifiedCount} users`)
    return { success: true, modifiedUsers: result.modifiedCount }
    
  } catch (error) {
    console.error('Cleanup failed:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
}