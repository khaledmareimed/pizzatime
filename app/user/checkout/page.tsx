'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../../funcs/utils';
import { theme, responsive, animations } from '../../../funcs/responsive';
import OrderDetails, { OrderItem } from '../../../components/OrderDetails';
import CheckoutForm from '../../../components/CheckoutForm';
import PaymentInfo from '../../../components/PaymentInfo';
import DeliveryInfo from '../../../components/DeliveryInfo';

// Sample order data
const sampleOrderItems: OrderItem[] = [
  {
    id: '1',
    name: 'Gourmet Burger',
    price: 14.99,
    quantity: 2,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    addons: [
      { id: 'addon1', name: 'Extra Cheese', price: 2.00 },
      { id: 'addon2', name: 'Bacon', price: 3.50 }
    ],
    comments: 'Medium rare, no pickles please'
  },
  {
    id: '2',
    name: 'Truffle Fries',
    price: 8.99,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&h=400&fit=crop',
    addons: [
      { id: 'addon3', name: 'Extra Truffle Oil', price: 1.50 }
    ]
  },
  {
    id: '3',
    name: 'Chocolate Milkshake',
    price: 6.50,
    quantity: 1,
    image: 'https://images.unsplash.com/photo-1572490122747-3968b75cc699?w=400&h=400&fit=crop',
    comments: 'Extra whipped cream and cherry on top'
  }
];

export default function CheckoutPage() {
  const [orderItems, setOrderItems] = useState<OrderItem[]>(sampleOrderItems);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateQuantity = (itemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    
    setOrderItems(prev => 
      prev.map(item => 
        item.id === itemId 
          ? { ...item, quantity: newQuantity }
          : item
      )
    );
  };

  const removeItem = (itemId: string) => {
    setOrderItems(prev => prev.filter(item => item.id !== itemId));
  };

  const handleFormSubmit = async (formData: any) => {
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Here you would typically send the order to your backend
      console.log('Order submitted:', { formData, orderItems });
      
      // Show success message or redirect
      alert('Order submitted successfully! We will call you to confirm.');
      
    } catch (error) {
      console.error('Error submitting order:', error);
      alert('Error submitting order. Please try again.');
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
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
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
                Your cart is empty
              </h3>
              <p className={cn('mb-6', theme.text.secondary)}>
                Add some delicious items to get started
              </p>
              <button
                onClick={() => window.location.href = '/user/menu'}
                className={cn(
                  'px-6 py-3 rounded-2xl font-medium transition-all',
                  'bg-orange-500 hover:bg-orange-600 text-white'
                )}
              >
                Browse Menu
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
