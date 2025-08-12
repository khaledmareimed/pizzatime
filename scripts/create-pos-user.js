// Script to create a dedicated POS user
const { MongoClient } = require('mongodb');

async function createPOSUser() {
  const client = new MongoClient(process.env.MONGODB_URI);
  
  try {
    await client.connect();
    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Check if POS user already exists
    const existingPOSUser = await usersCollection.findOne({ email: 'pos@system.internal' });
    
    if (existingPOSUser) {
      console.log('POS user already exists:', existingPOSUser._id);
      return existingPOSUser._id;
    }
    
    // Create POS user
    const posUser = {
      name: 'نظام نقاط البيع',
      email: 'pos@system.internal',
      role: 'customer', // Set as customer so it doesn't have admin privileges
      phone: '+962000000000',
      addresses: [{
        name: 'نظام نقاط البيع',
        recipientName: 'نظام نقاط البيع',
        city: 'عمان',
        phone: '+962000000000',
        addressDetails: 'نظام داخلي لنقاط البيع',
        isDefault: true
      }],
      favorites: [],
      orders: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      isSystemUser: true // Mark as system user
    };
    
    const result = await usersCollection.insertOne(posUser);
    console.log('POS user created successfully:', result.insertedId);
    return result.insertedId;
    
  } catch (error) {
    console.error('Error creating POS user:', error);
    throw error;
  } finally {
    await client.close();
  }
}

// Run if called directly
if (require.main === module) {
  createPOSUser()
    .then(id => {
      console.log('POS User ID:', id);
      process.exit(0);
    })
    .catch(error => {
      console.error('Failed to create POS user:', error);
      process.exit(1);
    });
}

module.exports = { createPOSUser };