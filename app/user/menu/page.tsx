'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useToastContext } from '../../../funcs/contexts/ToastContext';
import { cn } from '../../../funcs/utils';
import { theme, responsive, animations } from '../../../funcs/responsive';
import { useCartContext } from '../../../funcs/contexts/CartContext';
import { Product } from '../../../funcs/collections/product';
import Products from '../../../components/Products';

export default function MenuPage() {
  const router = useRouter();
  const { addItem } = useCartContext();
  const toast = useToastContext();

  const handleAddToCart = (item: Product) => {
    // Add item to real cart with localStorage persistence
    addItem(item, 1, [], undefined);
    
    // Show success feedback
    toast.success(`تم إضافة ${item.productName} إلى السلة!`);
  };

  const handleViewDetails = (item: Product) => {
    // Navigate to item detail page
    router.push(`/user/item/${item._id}`);
  };

  return (
    <div className={cn('min-h-screen', theme.background.primary)}>
      {/* Page Header */}
      <section className={cn('py-8 md:py-12', theme.background.secondary)}>
        <div className={cn(responsive.container.xl, 'px-4')}>
          <motion.div
            {...animations.fadeIn}
            className="text-center"
          >
            <h1 className={cn(
              'font-bold mb-4',
              'text-3xl md:text-4xl lg:text-5xl',
              theme.text.primary
            )}>
              قائمة <span className="text-orange-500">الطعام</span>
            </h1>
            <p className={cn(
              'max-w-2xl mx-auto',
              responsive.fontSize.lg,
              theme.text.secondary
            )}>
              اكتشف مجموعتنا اللذيذة من الأطباق الطازجة
            </p>
          </motion.div>
        </div>
      </section>

      {/* Products Component with all the fixed logic */}
      <Products
        onAddToCart={handleAddToCart}
        onViewDetails={handleViewDetails}
      />
    </div>
  );
}
