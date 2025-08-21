'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSession, signIn } from 'next-auth/react';
import { LogIn, MapPin, Plus } from 'lucide-react';
import { cn } from '../../../funcs/utils';
import { theme, responsive, animations } from '../../../funcs/responsive';
import { useCartContext } from '../../../funcs/contexts/CartContext';
import { useToastContext } from '../../../funcs/contexts/ToastContext';
import { UserAddress } from '../../../funcs/collections/user';
import OrderDetails, { OrderItem } from '../../../components/OrderDetails';
import CheckoutForm from '../../../components/CheckoutForm';
import PaymentInfo from '../../../components/PaymentInfo';
import Button from '../../../components/Button';
import Card from '../../../components/Card';
import AddressForm from '../../../components/AddressForm';

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userAddresses, setUserAddresses] = useState<UserAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    name: string;
    discountAmount: number;
    couponId: string;
  } | null>(null);
  const [orderTotals, setOrderTotals] = useState<{
    subtotal: number;
    couponDiscount: number;
    deliveryFee: number;
    total: number;
  } | null>(null);
  const [currentDeliveryFee, setCurrentDeliveryFee] = useState<number>(0);
  const { items: cartItems, updateQuantity, removeItem, clearCart } = useCartContext();
  const { data: session, status } = useSession();
  const toast = useToastContext();

  // Convert CartItems to OrderItems for the OrderDetails component
  const orderItems: OrderItem[] = useMemo(() => {
    return cartItems.map(cartItem => ({
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price,
      quantity: cartItem.quantity,
      image: cartItem.image,
      categoryId: cartItem.categoryId,
      addons: cartItem.addons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      })),
      options: cartItem.options.map(option => ({
        optionTitle: option.optionTitle,
        choiceName: option.choiceName,
        choicePrice: option.choicePrice
      })),
      comments: cartItem.comments
    }));
  }, [cartItems]);

  // Fetch user addresses when authenticated
  useEffect(() => {
    if (session?.user?.email) {
      fetchUserAddresses();
    }
  }, [session]);


  const fetchUserAddresses = async () => {
    setIsLoadingAddresses(true);
    console.log('🔄 Fetching user addresses with real IDs...');
    
    try {
      // Step 1: Get delivery areas to know what real IDs look like
      console.log('📍 Step 1: Getting delivery areas...');
      const areasResponse = await fetch('/api/public/delivery-areas');
      const areasData = await areasResponse.json();
      
      if (!areasData.success || !areasData.data.areas.length) {
        console.error('❌ No delivery areas found!');
        toast.error('خطأ', 'لا توجد مناطق توصيل متاحة');
        return;
      }
      
      console.log('✅ Found delivery areas:', areasData.data.areas.length);
      const deliveryAreas = areasData.data.areas;
      
      // Step 2: Get user addresses from database
      console.log('📋 Step 2: Getting user addresses...');
      const response = await fetch('/api/users/addresses-direct');
      
      if (!response.ok) {
        console.error('❌ Failed to fetch addresses:', response.status);
        return;
      }
      
      const data = await response.json();
      if (!data.success || !data.data) {
        console.error('❌ No address data received');
        return;
      }
      
      console.log('📦 Raw addresses from database:', data.data);
      
      // Debug: Check what's actually in the database
      console.log('\n🔍 DETAILED DATABASE CONTENT ANALYSIS:');
      data.data.forEach((addr: any, index: number) => {
        console.log(`\n📋 Address ${index + 1}: "${addr.name}"`);
        console.log(`   Raw city: "${addr.city}"`);
        console.log(`   Raw location: "${addr.location}"`);
        console.log(`   Raw cityId: "${addr.cityId}"`);
        console.log(`   Raw locationId: "${addr.locationId}"`);
        console.log(`   Location type: ${typeof addr.location}`);
        console.log(`   Location length: ${addr.location?.length || 0}`);
        console.log(`   Location includes 'default': ${addr.location?.toLowerCase().includes('default')}`);
        console.log(`   Location includes 'افتراض': ${addr.location?.toLowerCase().includes('افتراض')}`);
      });
      
      // Step 3: Process each address to assign correct unique IDs
      const processedAddresses = await Promise.all(data.data.map(async (address: any, index: number) => {
        console.log(`\n🏠 [${index + 1}] Processing address: "${address.name}"`);
        console.log(`   📍 Address location: "${address.city}" - "${address.location}"`);
        console.log(`   🔍 Current stored IDs: cityId="${address.cityId || 'EMPTY'}", locationId="${address.locationId || 'EMPTY'}"`);
        
        // Always search for fresh IDs to ensure accuracy
        let assignedCityId = '';
        let assignedLocationId = '';
        
        // Step 1: Find the correct city
        console.log(`   🔍 Searching for city: "${address.city}"`);
        const matchingCity = deliveryAreas.find((area: any) => {
          const cityMatch = area.cityName.toLowerCase().trim() === address.city.toLowerCase().trim();
          console.log(`     City comparison: "${area.cityName}" === "${address.city}" → ${cityMatch}`);
          return cityMatch;
        });
        
        if (!matchingCity) {
          console.log(`   ❌ City "${address.city}" not found in delivery areas`);
          console.log(`   📋 Available cities:`, deliveryAreas.map((area: any) => area.cityName));
          return {
            ...address,
            cityId: '',
            locationId: ''
          };
        }
        
        assignedCityId = matchingCity._id;
        console.log(`   ✅ City found: "${matchingCity.cityName}" → cityId: ${assignedCityId}`);
        
        // Step 2: Find the correct location within this city
        console.log(`   🔍 Searching for location: "${address.location}" in city "${matchingCity.cityName}"`);
        console.log(`   📋 Available locations in ${matchingCity.cityName}:`);
        
        matchingCity.locations.forEach((loc: any, locIndex: number) => {
          console.log(`     ${locIndex + 1}. "${loc.locationName}" (ID: ${loc._id})`);
        });
        
        // Clean and prepare location for matching
        let locationToMatch = address.location;
        
        // Handle "default area" or corrupted location data
        if (!locationToMatch || 
            locationToMatch.toLowerCase().includes('default') || 
            locationToMatch.toLowerCase().includes('افتراض') ||
            locationToMatch.toLowerCase().includes('منطقة افتراضية')) {
          
          console.log(`   🔧 FIXING CORRUPTED LOCATION: "${locationToMatch}"`);
          
          // Try to use the first available location in this city as fallback
          if (matchingCity.locations.length > 0) {
            const firstLocation = matchingCity.locations[0];
            assignedLocationId = firstLocation._id;
            console.log(`   ✅ FIXED: Using first available location "${firstLocation.locationName}" → ID: ${assignedLocationId}`);
            
            // Update the address location name to the correct one
            return {
              ...address,
              cityId: assignedCityId,
              locationId: assignedLocationId,
              location: firstLocation.locationName // Fix the location name too
            };
          } else {
            console.log(`   ❌ No locations available in city "${matchingCity.cityName}"`);
            return {
              ...address,
              cityId: assignedCityId,
              locationId: ''
            };
          }
        }
        
        // Normal matching for clean location data
        console.log(`   🔍 Address location to match: "${locationToMatch}" (length: ${locationToMatch.length})`);
        console.log(`   🔍 Address location trimmed: "${locationToMatch.toLowerCase().trim()}"`);
        
        const matchingLocation = matchingCity.locations.find((loc: any) => {
          const addressLoc = locationToMatch.toLowerCase().trim();
          const dbLoc = loc.locationName.toLowerCase().trim();
          const locationMatch = addressLoc === dbLoc;
          
          console.log(`     📍 Comparing DB: "${loc.locationName}" (${dbLoc}) === Address: "${locationToMatch}" (${addressLoc}) → ${locationMatch}`);
          return locationMatch;
        });
        
        if (!matchingLocation) {
          console.log(`   ❌ NO EXACT MATCH: Location "${locationToMatch}" not found`);
          console.log(`   🔧 TRYING FALLBACK: Using first available location`);
          
          if (matchingCity.locations.length > 0) {
            const fallbackLocation = matchingCity.locations[0];
            assignedLocationId = fallbackLocation._id;
            console.log(`   ✅ FALLBACK: Using "${fallbackLocation.locationName}" → ID: ${assignedLocationId}`);
            
            return {
              ...address,
              cityId: assignedCityId,
              locationId: assignedLocationId,
              location: fallbackLocation.locationName // Update location name
            };
          } else {
            return {
              ...address,
              cityId: assignedCityId,
              locationId: ''
            };
          }
        }
        
        assignedLocationId = matchingLocation._id;
        console.log(`   ✅ PERFECT MATCH: "${matchingLocation.locationName}" → locationId: ${assignedLocationId}`);
        
        // Final result for this address
        console.log(`   🎯 Final IDs for "${address.name}": cityId=${assignedCityId}, locationId=${assignedLocationId}`);
        
        return {
          ...address,
          cityId: assignedCityId,
          locationId: assignedLocationId
        };
      }));
      
      console.log('\n🎯 Final processed addresses:', processedAddresses);
      setUserAddresses(processedAddresses);
      
      // Set default address as selected and get its delivery price
      const defaultAddress = processedAddresses.find((addr: UserAddress) => addr.isDefault);
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress._id || null);
        console.log('🏠 Default address selected:', defaultAddress.name);
        
        // Automatically get delivery price for default address
        if (defaultAddress.cityId && defaultAddress.locationId) {
          console.log('📡 Auto-loading delivery price for default address...');
          await getDeliveryPrice(defaultAddress.cityId, defaultAddress.locationId, defaultAddress.name);
        }
      }
      
    } catch (error) {
      console.error('❌ Error in fetchUserAddresses:', error);
      toast.error('خطأ', 'فشل في تحميل العناوين');
    } finally {
      setIsLoadingAddresses(false);
    }
  };


  // Separate function to get delivery price
  const getDeliveryPrice = async (cityId: string, locationId: string, addressName: string) => {
    console.log(`📡 Getting delivery price for ${addressName}...`);
    
    try {
      const response = await fetch(`/api/get-delivery-price?cityId=${cityId}&locationId=${locationId}`);
      const result = await response.json();
      
      console.log('📊 Delivery price API response:', result);
      
      if (response.ok && result.success) {
        setCurrentDeliveryFee(result.deliveryPrice);
        console.log(`✅ Delivery price: ${result.deliveryPrice} JOD`);
        toast.success(`تكلفة التوصيل: ${result.deliveryPrice.toFixed(2)} د.أ`);
        return result.deliveryPrice;
      } else {
        console.error(`❌ Failed to get delivery price: ${result.error}`);
        setCurrentDeliveryFee(0);
        toast.error('خطأ في تكلفة التوصيل', result.error || 'فشل في الحصول على السعر');
        return 0;
      }
    } catch (error) {
      console.error('❌ Network error getting delivery price:', error);
      setCurrentDeliveryFee(0);
      toast.error('خطأ في الشبكة', 'تعذر الحصول على تكلفة التوصيل');
      return 0;
    }
  };

  const handleAddressSelect = async (addressId: string) => {
    setSelectedAddressId(addressId);
    
    // Get the selected address
    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
    console.log('🏠 Selected address:', selectedAddress);
    console.log('🔍 Address IDs:', {
      cityId: selectedAddress?.cityId,
      locationId: selectedAddress?.locationId
    });
    
    // Get delivery price using real IDs
    if (selectedAddress?.cityId && selectedAddress?.locationId) {
      await getDeliveryPrice(selectedAddress.cityId, selectedAddress.locationId, selectedAddress.name);
    } else {
      console.log('❌ Address missing cityId or locationId');
      setCurrentDeliveryFee(0);
      toast.warning('عنوان غير مكتمل', 'هذا العنوان لا يحتوي على معرفات صحيحة');
    }
  };

  // Debug function to check address data quality
  const debugAddressData = () => {
    console.log('\n🔍 === ADDRESS DATA DEBUG ===');
    console.log('📊 Current state:');
    console.log('  - userAddresses.length:', userAddresses.length);
    console.log('  - selectedAddressId:', selectedAddressId);
    console.log('  - currentDeliveryFee:', currentDeliveryFee);
    // addressDeliveryCosts removed - using deliveryCost from address object directly
    
    console.log('\n📋 Address details:');
    userAddresses.forEach((addr, index) => {
      console.log(`  ${index + 1}. ${addr.name}:`);
      console.log(`     _id: "${addr._id}"`);
      console.log(`     city: "${addr.city}"`);
      console.log(`     cityId: "${addr.cityId}"`);
      console.log(`     location: "${addr.location}"`);
      console.log(`     locationId: "${addr.locationId}"`);
      console.log(`     deliveryCost: ${addr.deliveryCost}`);
      console.log(`     isDefault: ${addr.isDefault}`);
      
      // Check if IDs are valid
      const hasValidIds = addr.cityId && addr.locationId && 
                         addr.cityId.trim() !== '' && addr.locationId.trim() !== '' &&
                         addr.cityId !== 'default-city-id' && addr.locationId !== 'default-location-id';
      console.log(`     hasValidIds: ${hasValidIds}`);
      
      // Check loaded cost (using deliveryCost from address object)
      const loadedCost = addr.deliveryCost;
      console.log(`     loadedCost: ${loadedCost}`);
    });
    console.log('🔍 === END DEBUG ===\n');
  };

  const handleAddAddress = async (addressData: Omit<UserAddress, '_id'>) => {
    try {
      console.log('🏠 Adding new address:', addressData);
      
      // Get delivery areas to find real IDs for the new address
      const areasResponse = await fetch('/api/public/delivery-areas');
      const areasData = await areasResponse.json();
      
      if (!areasData.success || !areasData.data.areas.length) {
        toast.error('خطأ', 'لا توجد مناطق توصيل متاحة');
        return;
      }
      
      const deliveryAreas = areasData.data.areas;
      
      // Find real cityId and locationId for the new address
      let finalCityId = addressData.cityId || '';
      let finalLocationId = addressData.locationId || '';
      
      console.log(`🔍 Looking for real IDs for: ${addressData.city} - ${addressData.location}`);
      
      // Find matching city
      const matchingCity = deliveryAreas.find((area: any) => 
        area.cityName.toLowerCase().trim() === addressData.city.toLowerCase().trim()
      );
      
      if (matchingCity) {
        finalCityId = matchingCity._id;
        console.log(`✅ Found cityId: ${finalCityId}`);
        
        // Find matching location
        const matchingLocation = matchingCity.locations.find((loc: any) =>
          loc.locationName.toLowerCase().trim() === addressData.location.toLowerCase().trim()
        );
        
        if (matchingLocation) {
          finalLocationId = matchingLocation._id;
          console.log(`✅ Found locationId: ${finalLocationId}`);
        } else {
          console.log(`❌ No matching location found for "${addressData.location}"`);
        }
      } else {
        console.log(`❌ No matching city found for "${addressData.city}"`);
      }
      
      // Create address data with real IDs
      const addressWithRealIds = {
        ...addressData,
        cityId: finalCityId,
        locationId: finalLocationId
      };
      
      console.log('💾 Saving address with real IDs:', addressWithRealIds);
      
      // Use the direct API that bypasses schema validation
      const response = await fetch('/api/users/addresses-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressWithRealIds),
      });

      if (response.ok) {
        console.log('✅ Address saved successfully, reloading addresses section...');
        
        // Reload the entire addresses section to get fresh data with real IDs
        await fetchUserAddresses();
        
        toast.success('تم إضافة العنوان بنجاح!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add address');
      }
    } catch (error) {
      console.error('Error adding address:', error);
      toast.error('خطأ في إضافة العنوان', error instanceof Error ? error.message : 'خطأ غير معروف');
    }
  };

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleCouponChange = useCallback((coupon: {
    code: string;
    name: string;
    discountAmount: number;
    couponId: string;
  } | null, totals: {
    subtotal: number;
    couponDiscount: number;
    deliveryFee: number;
    total: number;
  }) => {
    setAppliedCoupon(coupon);
    setOrderTotals(totals);
  }, []);


  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      // Check for unavailable items before submitting
      const unavailableItems = await checkItemsAvailability();
      
      if (unavailableItems.length > 0) {
        const itemNames = unavailableItems.map(item => item.name).join('، ');
        toast.warning('عناصر غير متوفرة', `العناصر التالية غير متوفرة حالياً: ${itemNames}. يرجى إزالتها من السلة للمتابعة.`);
        setIsSubmitting(false);
        return;
      }

      // Get selected address
      const selectedAddress = userAddresses.find(addr => addr._id === selectedAddressId);
      if (!selectedAddress) {
        toast.error('عنوان التوصيل مطلوب', 'يرجى اختيار عنوان التوصيل');
        setIsSubmitting(false);
        return;
      }

      // Validate delivery price is loaded
      if (!currentDeliveryFee || currentDeliveryFee <= 0) {
        toast.error('تكلفة التوصيل مطلوبة', 'يرجى اختيار عنوان صحيح مع تكلفة توصيل محددة');
        setIsSubmitting(false);
        return;
      }

      console.log(`✅ Order validation passed - Delivery fee: ${currentDeliveryFee} JOD`);

      const orderData = {
        items: cartItems.map(item => ({
          id: item.id,
          productId: item.productId,
          name: item.name,
          quantity: item.quantity,
          price: item.price,
          originalPrice: item.originalPrice,
          image: item.image,
          categoryId: item.categoryId,
          addons: item.addons,
          options: item.options,
          comments: item.comments
        })),
        deliveryAddress: {
          name: selectedAddress.name,
          recipientName: selectedAddress.recipientName,
          city: selectedAddress.city,
          cityId: selectedAddress.cityId || '',
          location: selectedAddress.location || '',
          locationId: selectedAddress.locationId || '',
          deliveryCost: currentDeliveryFee,
          phone: selectedAddress.phone,
          addressDetails: selectedAddress.addressDetails
        },
        notes: formData.notes,
        paymentMethod: 'cash', // Default to cash for now
        deliveryMethod: 'delivery',
        // Include coupon data if applied
        ...(appliedCoupon && {
          coupon: {
            code: appliedCoupon.code,
            name: appliedCoupon.name,
            discountAmount: appliedCoupon.discountAmount,
            couponId: appliedCoupon.couponId
          }
        }),
        // Include order totals
        ...(orderTotals && {
          totals: {
            subtotal: orderTotals.subtotal,
            couponDiscount: orderTotals.couponDiscount,
            deliveryFee: orderTotals.deliveryFee,
            total: orderTotals.total
          }
        })
      };

      // Debug order data being sent
      if (process.env.NODE_ENV === 'development') {
        console.log('🔍 Order data being sent:', JSON.stringify(orderData.deliveryAddress, null, 2));
      }

      // Submit order to API
      const response = await fetch('/api/users/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Show success message
        toast.success('تم تقديم الطلب بنجاح!', `رقم الطلب: ${result.data.orderId}. سنتصل بك لتأكيد الطلب.`);
        
        // Clear cart after successful order
        clearCart();
        
        // Redirect to order details page
        setTimeout(() => {
          window.location.href = `/user/order/${result.data.orderId}`;
        }, 2000); // Give time to show the toast
      } else {
        throw new Error(result.error || 'فشل في إنشاء الطلب');
      }
      
    } catch (error) {
      console.error('Error submitting order:', error);
      toast.error('خطأ في تقديم الطلب', `${error instanceof Error ? error.message : 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Function to check if cart items are still available
  const checkItemsAvailability = async () => {
    const unavailableItems = [];
    
    for (const item of cartItems) {
      try {
        const response = await fetch(`/api/public/products/${item.productId}`);
        if (response.ok) {
          const data = await response.json();
          const product = data.product;
          
          if (!product || !product.available) {
            unavailableItems.push(item);
          }
        } else {
          // If product not found, consider it unavailable
          unavailableItems.push(item);
        }
      } catch (error) {
        console.error('Error checking product availability:', error);
        // On error, assume item is unavailable to be safe
        unavailableItems.push(item);
      }
    }
    
    return unavailableItems;
  };

  return (
    <div className={cn('min-h-screen', theme.background.primary)}>
      {/* Header Section */}
      <section className={cn(
        'relative py-16',
        theme.background.secondary
      )}>
        <div className={cn(responsive.container.lg, 'px-4 text-center')}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className={cn(
              'font-bold mb-4',
              responsive.fontSize['3xl'],
              theme.text.primary
            )}>
أكمل طلبك            </h1>
            <p className={cn(
              'max-w-2xl mx-auto',
              responsive.fontSize.lg,
              theme.text.secondary
            )}>
راجع العناصر الخاصة بك وقدم تفاصيل التوصيل لإكمال طلبك اللذيذ            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <div className={cn(responsive.container.lg, 'px-4 py-8')}>
        {/* Order Details - Top Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          {orderItems.length > 0 ? (
            <OrderDetails 
              key={`order-details-${selectedAddressId}-${currentDeliveryFee}`}
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              deliveryFee={currentDeliveryFee}
              onCouponChange={handleCouponChange}
            />
          ) : (
            <div className={cn(
              'text-center py-16 rounded-3xl',
              theme.background.card
            )}>
              <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                <span className="text-4xl">🛒</span>
              </div>
              <h3 className={cn(
                'font-bold mb-4',
                responsive.fontSize.xl,
                theme.text.primary
              )}>
                السلة فارغة
              </h3>
              <p className={cn('mb-6', theme.text.secondary)}>
                أضف بعض العناصر اللذيذة للبدء
              </p>
              <button
                onClick={() => window.location.href = '/user/menu'}
                className={cn(
                  'px-6 py-3 rounded-2xl font-medium transition-all',
                  'bg-orange-500 hover:bg-orange-600 text-white'
                )}
              >
                تصفح القائمة
              </button>
            </div>
          )}
        </motion.div>

        {/* Form and Payment Section */}
        {orderItems.length > 0 && (
          <>
            {/* Not Authenticated - Show Login Required */}
            {!session && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.2 }}
              >
                <Card className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                    <LogIn className="w-8 h-8 text-orange-500" />
                  </div>
                  
                  <h3 className={cn(
                    'font-bold mb-4',
                    responsive.fontSize.xl,
                    theme.text.primary
                  )}>
                    تسجيل الدخول مطلوب
                  </h3>
                  
                  <p className={cn('mb-6', theme.text.secondary)}>
                    يجب تسجيل الدخول لإكمال عملية الطلب وحفظ عنوان التوصيل
                  </p>
                  
                  <Button
                    onClick={() => signIn('google')}
                    variant="accent"
                    size="lg"
                    className="gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    تسجيل الدخول بـ Google
                  </Button>
                </Card>
              </motion.div>
            )}

            {/* Authenticated - Show Checkout Form */}
            {session && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Address Selection & Checkout Form */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className="lg:col-span-2 space-y-6"
                >
                  {/* User Addresses */}
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className={cn(
                        'font-bold',
                        responsive.fontSize.lg,
                        theme.text.primary
                      )}>
                        عنوان التوصيل
                      </h3>
                      
                      <Button
                        onClick={() => setShowAddressForm(true)}
                        variant="outline"
                        size="sm"
                        className="gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        إضافة عنوان
                      </Button>
                    </div>

                    {isLoadingAddresses ? (
                      <div className="flex justify-center py-8">
                        <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                      </div>
                    ) : userAddresses.length === 0 ? (
                      <div className="text-center py-8">
                        <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className={cn('mb-4', theme.text.secondary)}>
                          لا توجد عناوين محفوظة
                        </p>
                        <Button
                          onClick={() => setShowAddressForm(true)}
                          variant="accent"
                          size="sm"
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          إضافة عنوان جديد
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {userAddresses.map((address) => (
                          <motion.div
                            key={address._id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleAddressSelect(address._id!)}
                            className={cn(
                              'p-4 rounded-xl border cursor-pointer transition-all',
                              selectedAddressId === address._id
                                ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                : cn(theme.border.primary, theme.background.card, 'hover:border-orange-300')
                            )}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h4 className={cn('font-medium', theme.text.primary)}>
                                    {address.name}
                                  </h4>
                                  {address.isDefault && (
                                    <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full">
                                      افتراضي
                                    </span>
                                  )}
                                </div>
                                
                                <p className={cn('text-sm mb-1 font-medium', theme.text.primary)}>
                                  المستلم: {address.recipientName || 'غير محدد'}
                                </p>
                                
                                <p className={cn('text-sm mb-1', theme.text.secondary)}>
                                  {address.city}{address.location ? ` - ${address.location}` : ''}
                                </p>
                                
                                <p className={cn('text-sm mb-1', theme.text.secondary)}>
                                  {address.addressDetails}
                                </p>
                                
                                <p className={cn('text-sm mb-1', theme.text.secondary)}>
                                  {address.phone}
                                </p>
                                
                              </div>
                              
                              <div className={cn(
                                'w-5 h-5 rounded-full border-2 flex items-center justify-center',
                                selectedAddressId === address._id
                                  ? 'border-orange-500 bg-orange-500'
                                  : 'border-gray-300 dark:border-gray-600'
                              )}>
                                {selectedAddressId === address._id && (
                                  <div className="w-2 h-2 bg-white rounded-full" />
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    )}
                  </Card>


                  {/* Checkout Form - Only show if address is selected and has delivery price */}
                  {selectedAddressId && currentDeliveryFee > 0 && (
                    <CheckoutForm 
                      onSubmit={handleFormSubmit}
                      isSubmitting={isSubmitting}
                      selectedAddress={userAddresses.find(addr => addr._id === selectedAddressId)}
                    />
                  )}
                  
                  {/* Show message if address selected but no delivery price */}
                  {selectedAddressId && currentDeliveryFee <= 0 && (
                    <div className={cn(
                      'p-6 rounded-2xl border-2 border-dashed border-orange-300 dark:border-orange-700',
                      theme.background.card
                    )}>
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
                          <span className="text-2xl">⏳</span>
                        </div>
                        <h3 className={cn('font-bold mb-2', theme.text.primary)}>
                          جاري تحميل تكلفة التوصيل
                        </h3>
                        <p className={cn('text-sm', theme.text.secondary)}>
                          يرجى انتظار تحميل تكلفة التوصيل للعنوان المحدد
                        </p>
                      </div>
                    </div>
                  )}
                </motion.div>

                {/* Payment Info */}
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 }}
                  className="lg:col-span-1 space-y-6"
                >
                  <PaymentInfo />
                </motion.div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Address Form Modal */}
      <AddressForm
        isOpen={showAddressForm}
        onClose={() => setShowAddressForm(false)}
        onSave={handleAddAddress}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
