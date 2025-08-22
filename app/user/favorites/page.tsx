'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Heart, Loader } from 'lucide-react';
import { cn } from '../../../funcs/utils';
import { theme, responsive } from '../../../funcs/responsive';
import { Product } from '../../../funcs/collections/product';
import { useCartContext } from '../../../funcs/contexts/CartContext';
import { useFavorites } from '../../../funcs/contexts/FavoritesContext';
import { useToastContext } from '../../../funcs/contexts/ToastContext';
import Button from '../../../components/Button';
import FavoriteProducts from '../../../components/FavoriteProducts';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCartContext();
  const { favorites, isLoading, removeFromFavorites } = useFavorites();
  const { success, error } = useToastContext();

  // Handle remove from favorites - instant UI update
  const handleRemoveFromFavorites = async (productId: string) => {
    if (!session?.user?.email) return;
    
    try {
      // Remove silently in background - UI updates instantly via context
      await removeFromFavorites(productId);
    } catch (err) {
      console.error('Error removing from favorites:', err);
      // Only show error toast on failure
      error('خطأ في الإزالة', 'حدث خطأ في إزالة المنتج من المفضلة');
    }
  };


  const handleViewDetails = (item: Product) => {
    router.push(`/user/item/${item._id}`);
  };

  // Redirect if not authenticated
  if (status === 'loading' || isLoading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className={cn('text-lg', theme.text.secondary)}>تحميل المفضلة...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <Heart className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h2 className={cn('font-bold mb-4', responsive.fontSize['2xl'], theme.text.primary)}>
            تسجيل الدخول مطلوب
          </h2>
          <p className={cn('mb-6', theme.text.secondary)}>
            يجب تسجيل الدخول لعرض المفضلة
          </p>
          <Button
            onClick={() => router.push('/auth/signin')}
            variant="accent"
            size="lg"
          >
            تسجيل الدخول
          </Button>
        </div>
      </div>
    );
  }

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
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              <h1 className={cn(
                'font-bold',
                responsive.fontSize['3xl'],
                theme.text.primary
              )}>
                المفضلة
              </h1>
            </div>
            <p className={cn(
              'max-w-2xl mx-auto',
              responsive.fontSize.lg,
              theme.text.secondary
            )}>
              مجموعتك المختارة من الأطباق اللذيذة المفضلة لديك
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content - Using FavoriteProducts Component */}
      <FavoriteProducts
        onViewDetails={handleViewDetails}
        onRemoveFromFavorites={handleRemoveFromFavorites}
      />
    </div>
  );
}
