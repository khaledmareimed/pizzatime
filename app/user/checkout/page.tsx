'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../funcs/utils';
import { theme, responsive, animations } from '../../../funcs/responsive';
import { useCartContext } from '../../../funcs/contexts/CartContext';
import OrderDetails, { OrderItem } from '../../../components/OrderDetails';
import CheckoutForm from '../../../components/CheckoutForm';
import PaymentInfo from '../../../components/PaymentInfo';
import DeliveryInfo from '../../../components/DeliveryInfo';

export default function CheckoutPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { items: cartItems, updateQuantity, removeItem, clearCart } = useCartContext();

  // Convert CartItems to OrderItems for the OrderDetails component
  const orderItems: OrderItem[] = useMemo(() => {
    return cartItems.map(cartItem => ({
      id: cartItem.id,
      name: cartItem.name,
      price: cartItem.price,
      quantity: cartItem.quantity,
      image: cartItem.image,
      addons: cartItem.addons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      })),
      comments: cartItem.comments
    }));
  }, [cartItems]);

  const handleUpdateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    removeItem(itemId);
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the order to your backend
      console.log('Order submitted:', { formData, orderItems });
      
      // Show success message or redirect
      alert('تم تقديم الطلب بنجاح! سنتصل بك لتأكيد الطلب.');
      
      // Clear cart after successful order
      clearCart();
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('خطأ في تقديم الطلب. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsSubmitting(false);
    }
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
              items={orderItems}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Checkout Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <CheckoutForm 
              onSubmit={handleFormSubmit}
              isSubmitting={isSubmitting}
            />
          </motion.div>

          {/* Payment & Delivery Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="lg:col-span-1 space-y-6"
          >
            <PaymentInfo />
            <DeliveryInfo />
          </motion.div>
        </div>
        )}
      </div>
    </div>
  );
}
