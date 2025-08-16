// Test script to verify user schema fix
// Run this to test the fix: node tmp_rovodev_test_user_fix.js

const { auth } = require('./auth')

async function testUserFix() {
  try {
    console.log('Testing user schema fix...')
    
    // Test the fix endpoint
    const response = await fetch('http://localhost:3000/api/fix-user-schema', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fixAll: false })
    })
    
    const result = await response.json()
    console.log('Fix result:', result)
    
    // Test user init endpoint
    const initResponse = await fetch('http://localhost:3000/api/users/init', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    
    const initResult = await initResponse.json()
    console.log('Init result:', initResult)
    
  } catch (error) {
    console.error('Test error:', error)
  }
}

// Run if called directly
if (require.main === module) {
  testUserFix()
}

module.exports = { testUserFix }