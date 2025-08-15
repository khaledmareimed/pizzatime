// Test ID-based delivery cost system
// Run this in browser console

async function testIdBasedDelivery() {
  console.log('🧪 Testing ID-based delivery cost system...');
  
  try {
    // 1. Get delivery areas to see IDs
    console.log('📍 Fetching delivery areas with IDs...');
    const areasResponse = await fetch('/api/public/delivery-areas');
    const areasData = await areasResponse.json();
    
    if (areasData.success && areasData.data.areas.length > 0) {
      console.log('✅ Available delivery areas with IDs:');
      areasData.data.areas.forEach((area, areaIndex) => {
        console.log(`City ${areaIndex + 1}: "${area.cityName}" (ID: ${area._id})`);
        area.locations.forEach((location, locIndex) => {
          console.log(`  Location ${locIndex + 1}: "${location.locationName}" (ID: ${location._id}) - ${location.customerCost} JOD`);
        });
      });
      
      // 2. Test the ID-based API
      const testArea = areasData.data.areas[0];
      const testLocation = testArea.locations[0];
      
      console.log(`\n🧪 Testing ID-based API:`);
      console.log(`City ID: ${testArea._id}`);
      console.log(`Location ID: ${testLocation._id}`);
      
      const testUrl = `/api/delivery-cost-by-id?cityId=${testArea._id}&locationId=${testLocation._id}`;
      console.log(`URL: ${testUrl}`);
      
      const testResponse = await fetch(testUrl);
      const testResult = await testResponse.json();
      
      console.log(`\n📡 API Response:`, testResult);
      console.log(`Status: ${testResponse.status}`);
      
      if (testResult.success) {
        console.log(`✅ SUCCESS! Cost: ${testResult.deliveryCost} JOD`);
        
        // 3. Create a test address with IDs
        console.log(`\n➕ Creating test address with IDs...`);
        const testAddress = {
          name: 'عنوان تجريبي بمعرفات',
          recipientName: 'مستلم تجريبي',
          city: testArea.cityName,
          cityId: testArea._id,
          location: testLocation.locationName,
          locationId: testLocation._id,
          deliveryCost: testLocation.customerCost,
          phone: '+962791234567',
          addressDetails: 'عنوان تجريبي لاختبار النظام الجديد',
          isDefault: true
        };
        
        console.log('Creating address:', testAddress);
        
        const createResponse = await fetch('/api/users/addresses-direct', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testAddress)
        });
        
        const createResult = await createResponse.json();
        
        if (createResult.success) {
          console.log('✅ Test address with IDs created successfully!');
          console.log(`💰 Expected delivery cost: ${testAddress.deliveryCost} JOD`);
          console.log('🔄 Reloading page to test the new system...');
          
          setTimeout(() => {
            window.location.reload();
          }, 2000);
        } else {
          console.error('❌ Failed to create test address:', createResult.error);
        }
        
      } else {
        console.log(`❌ API FAILED: ${testResult.error}`);
      }
      
    } else {
      console.error('❌ No delivery areas found');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
testIdBasedDelivery();