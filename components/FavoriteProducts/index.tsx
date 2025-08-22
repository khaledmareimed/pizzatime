'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Clock, Trash2, Filter, Loader } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import { formatPrice } from '../../funcs/utils';
import { useFavorites } from '../../funcs/contexts/FavoritesContext';
import { useToastContext } from '../../funcs/contexts/ToastContext';
import { Product } from '../../funcs/collections/product';
import Card from '../Card';
import Button from '../Button';

interface FavoriteProductsProps {
  onViewDetails?: (item: Product) => void;
  onRemoveFromFavorites?: (productId: string) => void;
}

export default function FavoriteProducts({ onViewDetails, onRemoveFromFavorites }: FavoriteProductsProps) {
  const { favorites, removeFromFavorites } = useFavorites();
  const toast = useToastContext();

  // Handle remove from favorites - instant UI update
  const handleRemoveFromFavorites = async (productId: string) => {
    if (onRemoveFromFavorites) {
      onRemoveFromFavorites(productId);
    } else {
      // Remove from favorites silently in background
      try {
        await removeFromFavorites(productId);
        // No toast notifications - silent removal
      } catch (err) {
        console.error('Error removing from favorites:', err);
        // Optionally show error toast only on failure
        toast.error('خطأ في الإزالة', 'حدث خطأ في إزالة المنتج من المفضلة');
      }
    }
  };

  return (
    <section className={cn(
      'py-12 md:py-20',
      theme.background.primary
    )}>
      <div className={cn(responsive.container.xl, 'px-4')}>
        {/* Section Header */}
      

        {/* Products Grid */}
        {favorites && favorites.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'grid gap-6',
                responsive.grid.desktop
              )}
            >
              {favorites.map((item, index) => {
                // Get the primary image URL (first image or placeholder)
                const primaryImage = item.imagesUrl && item.imagesUrl.length > 0 
                  ? item.imagesUrl[0] 
                  : 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop';
                
                // Calculate display price (use discount price if available)
                const originalPrice = item.productPrice || 0;
                const discountPrice = item.productDiscountPrice || 0;
                
                // Determine which price to display
                const displayPrice = (discountPrice > 0 && discountPrice < originalPrice) ? discountPrice : originalPrice;
                
                // Check if there's a valid discount
                const hasDiscount = discountPrice > 0 && 
                                  originalPrice > 0 && 
                                  discountPrice < originalPrice;
                                  
                // Check if we have a valid price to display
                const hasValidPrice = displayPrice > 0;

                return (
                  <motion.div
                    key={item._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      hoverable
                      className="relative overflow-hidden group cursor-pointer"
                      onClick={() => onViewDetails?.(item)}
                    >
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                          عرض خاص
                        </div>
                      )}

                      {/* Remove from Favorites Button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        whileHover={{ scale: 1.1 }}
                        onClick={async (e: React.MouseEvent) => {
                          e.stopPropagation(); // Prevent card click
                          await handleRemoveFromFavorites(item._id);
                        }}
                        className={cn(
                          'absolute top-4 right-4 z-10 p-2 rounded-full transition-all duration-200',
                          'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm',
                          'text-red-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-800',
                          'shadow-lg hover:shadow-xl'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>

                      {/* Product Image */}
                      <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                        <img
                          src={primaryImage}
                          alt={item.productName}
                          className="w-full h-full object-cover rounded-2xl"
                          onError={(e) => {
                            // Fallback to default image if loading fails
                            const target = e.target as HTMLImageElement;
                            target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop';
                          }}
                        />
                      </div>

                      {/* Content */}
                      <div className="space-y-3">
                        <div className="flex items-start justify-between">
                          <h3 className={cn(
                            'font-bold',
                            responsive.fontSize.lg,
                            theme.text.primary
                          )}>
                            {item.productName}
                          </h3>
                          <div className="flex items-center space-x-1">
                            {!item.available && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs rounded-full font-medium">
                                غير متوفر
                              </span>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className={cn(
                            'line-clamp-2',
                            responsive.fontSize.sm,
                            theme.text.secondary
                          )}>
                            {item.description}
                          </p>
                        )}

                        {/* Addons Info */}
                        {item.addonsAndToppings && item.addonsAndToppings.length > 0 && (
                          <div className="flex items-center justify-between">
                            <span className={cn('text-xs', theme.text.secondary)}>
                              {item.addonsAndToppings.length} خيارات إضافية
                            </span>
                          </div>
                        )}

                        {/* Price and Actions */}
                        <div className="flex items-center justify-between pt-2">
                          {hasValidPrice && (
                            <div className="flex flex-col">
                              <span className={cn(
                                'font-bold text-xl',
                                'text-orange-500'
                              )}>
                                {formatPrice(displayPrice)}
                              </span>
                              {hasDiscount && (
                                <span className="text-sm text-gray-500 line-through">
                                  {formatPrice(originalPrice)}
                                </span>
                              )}
                            </div>
                          )}

                          {/* View Details Button */}
                          <Button
                            onClick={(e) => {
                              e?.stopPropagation(); // Prevent card click
                              onViewDetails?.(item);
                            }}
                            variant={item.available ? "accent" : "outline"}
                            size="sm"
                            disabled={!item.available}
                            className={!item.available ? "text-red-500 border-red-300 cursor-not-allowed" : ""}
                          >
                            {item.available ? "عرض" : "غير متوفر"}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty State */}
        {(!favorites || favorites.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">❤️</div>
            <h3 className={cn(
              'font-bold mb-2',
              responsive.fontSize.lg,
              theme.text.primary
            )}>
              لا توجد مفضلة بعد
            </h3>
            <p className={cn(theme.text.secondary)}>
              ابدأ في استكشاف قائمتنا واحفظ أطباقك المفضلة
            </p>
            <Button
              onClick={() => window.location.href = '/user/menu'}
              variant="accent"
              className="mt-4"
            >
              تصفح القائمة
            </Button>
          </motion.div>
        )}

        {/* Summary */}
        {favorites && favorites.length > 0 && (
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
        )}
      </div>
    </section>
  );
}