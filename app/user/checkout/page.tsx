'use client';

import { useState, useMemo, useEffect } from 'react';
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
  const [currentDeliveryFee, setCurrentDeliveryFee] = useState<number>(3.0);
  const [loadingDeliveryFee, setLoadingDeliveryFee] = useState<boolean>(false);
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
    try {
      // Try the direct API first (bypasses schema validation)
      let response = await fetch('/api/users/addresses-direct');
      
      if (!response.ok) {
        // Fallback to regular API
        response = await fetch('/api/users/addresses');
      }
      
      if (response.ok) {
        const data = await response.json();
        setUserAddresses(data.data || []);
        
        // Set default address as selected and fetch its delivery cost
        const defaultAddress = data.data?.find((addr: UserAddress) => addr.isDefault);
        if (defaultAddress) {
          setSelectedAddressId(defaultAddress._id || null);
          // Fetch delivery cost for default address
          if (defaultAddress.cityId && defaultAddress.locationId) {
            await fetchDeliveryCostById(defaultAddress.cityId, defaultAddress.locationId);
          }
        }
      } else {
        console.error('Failed to fetch addresses:', response.status);
      }
    } catch (error) {
      console.error('Error fetching addresses:', error);
    } finally {
      setIsLoadingAddresses(false);
    }
  };

  const handleAddressSelect = async (addressId: string) => {
    setSelectedAddressId(addressId);
    
    // Get the selected address
    const selectedAddress = userAddresses.find(addr => addr._id === addressId);
    console.log('🏠 Selected address:', selectedAddress);
    
    if (selectedAddress && selectedAddress.cityId && selectedAddress.locationId) {
      console.log(`📍 Fetching delivery cost for IDs: cityId="${selectedAddress.cityId}" locationId="${selectedAddress.locationId}"`);
      await fetchDeliveryCostById(selectedAddress.cityId, selectedAddress.locationId);
    } else {
      console.warn('⚠️ Address missing city or location IDs:', {
        cityId: selectedAddress?.cityId,
        locationId: selectedAddress?.locationId,
        city: selectedAddress?.city,
        location: selectedAddress?.location
      });
      toast.warning('عنوان غير مكتمل', 'هذا العنوان لا يحتوي على معرفات المدينة والمنطقة');
      setCurrentDeliveryFee(0);
    }
  };

  const fetchDeliveryCostById = async (cityId: string, locationId: string) => {
    setLoadingDeliveryFee(true);
    const apiUrl = `/api/delivery-cost-by-id?cityId=${encodeURIComponent(cityId)}&locationId=${encodeURIComponent(locationId)}`;
    console.log(`📡 Making API call: ${apiUrl}`);
    
    try {
      const response = await fetch(apiUrl);
      const result = await response.json();
      
      console.log(`📊 API Response:`, { status: response.status, result });
      
      if (response.ok && result.success) {
        setCurrentDeliveryFee(result.deliveryCost);
        console.log(`✅ Delivery cost found: ${result.deliveryCost} JOD for cityId=${cityId} locationId=${locationId}`);
        toast.success(`تكلفة التوصيل: ${result.deliveryCost.toFixed(2)} د.أ`);
      } else {
        console.error(`❌ Delivery cost error: ${result.error} for cityId=${cityId} locationId=${locationId}`);
        toast.error('خطأ في تكلفة التوصيل', result.error);
        setCurrentDeliveryFee(0);
      }
    } catch (error) {
      console.error('❌ Network error fetching delivery cost:', error);
      toast.error('خطأ في الشبكة', 'تعذر الحصول على تكلفة التوصيل');
      setCurrentDeliveryFee(0);
    } finally {
      setLoadingDeliveryFee(false);
    }
  };

  const handleAddAddress = async (addressData: Omit<UserAddress, '_id'>) => {
    try {
      // Use the direct API that bypasses schema validation
      const response = await fetch('/api/users/addresses-direct', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(addressData),
      });

      if (response.ok) {
        const data = await response.json();
        setUserAddresses(data.data);
        
        // Select the new address if it's the default or first address
        const newAddress = data.data[data.data.length - 1];
        if (addressData.isDefault || data.data.length === 1) {
          setSelectedAddressId(newAddress._id);
        }
        
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

  const handleCouponChange = (coupon: {
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
  };


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
          location: selectedAddress.location || '',
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
                                
                                <p className={cn('text-sm font-medium', 'text-blue-600 dark:text-blue-400')}>
                                  تكلفة التوصيل: {selectedAddressId === address._id ? (
                                    loadingDeliveryFee ? 'جاري التحميل...' : `${currentDeliveryFee.toFixed(2)} د.أ`
                                  ) : `${(address.deliveryCost || 3.0).toFixed(2)} د.أ`}
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


                  {/* Checkout Form - Only show if address is selected */}
                  {selectedAddressId && (
                    <CheckoutForm 
                      onSubmit={handleFormSubmit}
                      isSubmitting={isSubmitting}
                      selectedAddress={userAddresses.find(addr => addr._id === selectedAddressId)}
                    />
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
