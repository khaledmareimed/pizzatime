'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Trash2, Loader } from 'lucide-react';
import { cn } from '../../../funcs/utils';
import { theme, responsive } from '../../../funcs/responsive';
import { Product } from '../../../funcs/collections/product';
import { useCartContext } from '../../../funcs/contexts/CartContext';
import { useFavorites } from '../../../funcs/contexts/FavoritesContext';
import Card from '../../../components/Card';
import Button from '../../../components/Button';

export default function FavoritesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { addItem } = useCartContext();
  const { favorites, isLoading, removeFromFavorites } = useFavorites();
  const [isRemoving, setIsRemoving] = useState<string | null>(null);

  // No need to fetch favorites manually - context handles it

  const handleRemoveFromFavorites = async (productId: string) => {
    if (!session?.user?.email) return;
    
    setIsRemoving(productId);
    try {
      const success = await removeFromFavorites(productId);
      if (success) {
        alert('تم إزالة المنتج من المفضلة!');
      } else {
        alert('حدث خطأ في إزالة المنتج من المفضلة');
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      alert('حدث خطأ في إزالة المنتج من المفضلة');
    } finally {
      setIsRemoving(null);
    }
  };

  const addToCart = (item: Product) => {
    // Add item to real cart with localStorage persistence
    addItem(item, 1, [], undefined);
    
    // Show success feedback
    alert(`تم إضافة ${item.productName} إلى السلة!`);
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

      {/* Main Content */}
      <div className={cn(responsive.container.lg, 'px-4 py-8')}>
        {favorites.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center py-16"
          >
            <Heart className="w-24 h-24 text-gray-300 dark:text-gray-600 mx-auto mb-6" />
            <h2 className={cn(
              'font-bold mb-4',
              responsive.fontSize['2xl'],
              theme.text.primary
            )}>
              لا توجد مفضلة بعد
            </h2>
            <p className={cn(
              'max-w-md mx-auto mb-8',
              responsive.fontSize.base,
              theme.text.secondary
            )}>
              ابدأ في استكشاف قائمتنا واحفظ أطباقك المفضلة بالنقر على أيقونة القلب
            </p>
            <Button
              variant="accent"
              size="lg"
              onClick={() => router.push('/user/menu')}
            >
              تصفح القائمة
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Favorites Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {favorites.map((item, index) => {
                // Get the primary image URL (first image or placeholder)
                const primaryImage = item.imagesUrl && item.imagesUrl.length > 0 
                  ? item.imagesUrl[0] 
                  : 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop';
                
                // Calculate display price (use discount price if available)
                const displayPrice = item.productDiscountPrice || item.productPrice;
                const hasDiscount = item.productDiscountPrice && item.productDiscountPrice < item.productPrice;

                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden">
                      {/* Image */}
                      <div className="relative h-48 overflow-hidden cursor-pointer" onClick={() => handleViewDetails(item)}>
                        <img
                          src={primaryImage}
                          alt={item.productName}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop';
                          }}
                        />
                        
                        {/* Discount Badge */}
                        {hasDiscount && (
                          <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                            عرض خاص
                          </div>
                        )}
                        
                        {/* Remove from Favorites Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromFavorites(item._id);
                          }}
                          disabled={isRemoving === item._id}
                          className={cn(
                            'absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center',
                            'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm',
                            'text-red-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-800',
                            'transition-all duration-200 hover:scale-110',
                            isRemoving === item._id && 'opacity-50 cursor-not-allowed'
                          )}
                        >
                          {isRemoving === item._id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>

                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className={cn(
                            'font-bold cursor-pointer',
                            responsive.fontSize.lg,
                            theme.text.primary
                          )}
                          onClick={() => handleViewDetails(item)}
                          >
                            {item.productName}
                          </h3>
                        </div>

                        {item.description && (
                          <p className={cn(
                            'text-sm mb-4 line-clamp-2',
                            theme.text.secondary
                          )}>
                            {item.description}
                          </p>
                        )}

                        {/* Availability Status */}
                        {!item.available && (
                          <div className="mb-3">
                            <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 px-2 py-1 rounded-full">
                              غير متوفر حالياً
                            </span>
                          </div>
                        )}

                        {/* Price and Actions */}
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col">
                            <span className={cn(
                              'font-bold',
                              responsive.fontSize.lg,
                              'text-orange-600 dark:text-orange-400'
                            )}>
                              {displayPrice} ر.س
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-gray-500 line-through">
                                {item.productPrice} ر.س
                              </span>
                            )}
                          </div>

                          <Button
                            variant="accent"
                            size="sm"
                            onClick={() => addToCart(item)}
                            disabled={!item.available}
                            className="group/btn"
                          >
                            <ShoppingCart className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                            {item.available ? 'أضف للسلة' : 'غير متوفر'}
                          </Button>
                        </div>

                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>

            {/* Summary */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="mt-12 text-center"
            >
              <Card className="inline-block px-8 py-4">
                <p className={cn('text-sm', theme.text.secondary)}>
                  لديك{' '}
                  <span className={cn('font-bold', theme.text.primary)}>
                    {favorites.length}
                  </span>
                  {' '}منتج في المفضلة
                </p>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
