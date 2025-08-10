/**
 * Migration script to fix user address schema
 * Run this script to migrate existing users from old address format to new format
 * 
 * Usage: node scripts/migrate-addresses.js
 */

const { connectToDatabase } = require('../funcs/database')
const mongoose = require('mongoose')

async function migrateAddresses() {
  try {
    console.log('🚀 Starting address schema migration...')
    
    // Connect to database
    await connectToDatabase()
    
    // Create a flexible schema to work with existing data
    const userSchema = new mongoose.Schema({}, { 
      strict: false, 
      collection: 'users' 
    })
    
    const User = mongoose.model('UserMigration', userSchema)
    
    // Find all users
    const users = await User.find({})
    console.log(`📊 Found ${users.length} users to check`)
    
    let migratedCount = 0
    let errorCount = 0
    
    for (const user of users) {
      try {
        let needsUpdate = false
        const updatedAddresses = []
        
        if (user.addresses && Array.isArray(user.addresses)) {
          for (const addr of user.addresses) {
            // Check if address has old format
            if (addr.street || addr.zipCode) {
              console.log(`🔄 Migrating address for user: ${user.email}`)
              
              // Convert to new format
              updatedAddresses.push({
                name: addr.name || 'عنوان محفوظ',
                city: addr.city || 'غير محدد',
                phone: addr.phone || '+966500000000',
                addressDetails: `${addr.street || ''} ${addr.zipCode || ''}`.trim() || 'غير محدد',
                isDefault: addr.isDefault || false
              })
              needsUpdate = true
            } else if (addr.name && addr.city && addr.phone && addr.addressDetails) {
              // Already in new format, keep it
              updatedAddresses.push({
                name: addr.name,
                city: addr.city,
                phone: addr.phone,
                addressDetails: addr.addressDetails,
                isDefault: addr.isDefault || false
              })
            }
            // Skip invalid addresses
          }
        }
        
        if (needsUpdate) {
          await User.updateOne(
            { _id: user._id },
            { $set: { addresses: updatedAddresses } }
          )
          migratedCount++
          console.log(`✅ Migrated user: ${user.email}`)
        }
        
      } catch (userError) {
        console.error(`❌ Error migrating user ${user.email}:`, userError.message)
        errorCount++
      }
    }
    
    console.log(`\n🎉 Migration completed!`)
    console.log(`📈 Users migrated: ${migratedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`✅ Total users processed: ${users.length}`)
    
    process.exit(0)
    
  } catch (error) {
    console.error('💥 Migration failed:', error)
    process.exit(1)
  }
}

// Run migration
migrateAddresses()