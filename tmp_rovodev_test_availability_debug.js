// Debug script to test delivery availability
const { getJordanTime } = require('./funcs/jordanLocale');

console.log('🔍 Testing Delivery Availability System');

// Test Jordan time
try {
  const now = getJordanTime();
  console.log('✅ Jordan Time:', now.toISOString());
  console.log('✅ Local Time String:', now.toLocaleString('en-US', { timeZone: 'Asia/Amman' }));
  
  const currentTime = now.toLocaleTimeString('en-US', { 
    hour12: false, 
    timeZone: 'Asia/Amman',
    hour: '2-digit',
    minute: '2-digit'
  });
  console.log('✅ Current Time (HH:MM):', currentTime);
  
  const currentDayName = now.toLocaleDateString('en-US', { 
    weekday: 'long',
    timeZone: 'Asia/Amman'
  }).toLowerCase();
  console.log('✅ Current Day:', currentDayName);
  
} catch (error) {
  console.error('❌ Error with Jordan time:', error);
}

console.log('\n📋 Checking for potential issues:');
console.log('1. Check if jordanLocale.ts exports getJordanTime correctly');
console.log('2. Check if settings collection exists in database');
console.log('3. Check if delivery schedule is properly configured');
console.log('4. Check if user role detection is working');
console.log('5. Check API endpoint integration');

console.log('\n🚀 Run this in browser console to test API:');
console.log(`
fetch('/api/users/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    items: [{ productId: 'test', name: 'Test', quantity: 1, price: 10 }],
    deliveryAddress: { name: 'Test', recipientName: 'Test', city: 'Test', phone: '123', addressDetails: 'Test' }
  })
}).then(r => r.json()).then(console.log);
`);