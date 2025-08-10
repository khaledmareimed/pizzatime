'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Clock, Heart, Filter, Loader } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import { formatPrice } from '../../funcs/utils';
import { usePublicCategories, usePublicProducts } from '../../funcs/hooks/usePublicData';
import { useCartContext } from '../../funcs/contexts/CartContext';
import { Product } from '../../funcs/collections/product';
import { Category } from '../../funcs/collections/category';
import Card from '../Card';
import Button from '../Button';

interface ProductsProps {
  onAddToCart?: (item: Product) => void;
  onViewDetails?: (item: Product) => void;
  limit?: number; // Optional limit for featured products
}

export default function Products({ onAddToCart, onViewDetails, limit }: ProductsProps) {
  const { addItem } = useCartContext();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  // Fetch categories and products from database
  const { data: categories, loading: categoriesLoading, error: categoriesError } = usePublicCategories();
  const { data: products, loading: productsLoading, error: productsError } = usePublicProducts(selectedCategoryId || undefined);

  // Create menu categories with "All" option
  const menuCategories = useMemo(() => {
    const allCategory = { id: null, name: 'الجميع' };
    const dbCategories = categories?.map(cat => ({ id: cat._id.toString(), name: cat.name })) || [];
    return [allCategory, ...dbCategories];
  }, [categories]);

  // Filter and limit products
  const filteredItems = useMemo(() => {
    if (!products) return [];
    
    let filtered = products;
    if (selectedCategoryId) {
      filtered = products.filter(product => product.categoryId === selectedCategoryId);
    }
    
    // Apply limit if specified (for featured products sections)
    if (limit && limit > 0) {
      filtered = filtered.slice(0, limit);
    }
    
    return filtered;
  }, [products, selectedCategoryId, limit]);

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
  };

  // Handle add to cart - use provided handler or default behavior
  const handleAddToCart = (item: Product) => {
    if (onAddToCart) {
      onAddToCart(item);
    } else {
      // Default behavior: add to cart directly
      addItem(item, 1, [], undefined);
      alert(`تم إضافة ${item.productName} إلى السلة!`);
    }
  };

  return (
    <section className={cn(
      'py-12 md:py-20',
      theme.background.primary
    )}>
      <div className={cn(responsive.container.xl, 'px-4')}>
        {/* Section Header */}
        <motion.div
          {...animations.fadeIn}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Filter className="w-4 h-4" />
            <span>قائمة الطعام</span>
          </div>
          
          <h2 className={cn(
            'font-bold mb-4',
            'text-3xl md:text-4xl lg:text-5xl',
            theme.text.primary
          )}>
            اطباقنا <span className="text-orange-500">المشهورة</span>
          </h2>
          
          <p className={cn(
            'max-w-2xl mx-auto',
            responsive.fontSize.lg,
            theme.text.secondary
          )}>
            اكتشف اطباقنا الأكثر شعبية، والتي تم إعدادها بعناية من قبل طهاتنا الخبراء.
          </p>
        </motion.div>

        {/* Loading State */}
        {(categoriesLoading || productsLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-8"
          >
            <Loader className="w-6 h-6 animate-spin text-orange-500 mr-2" />
            <span className={cn('text-lg', theme.text.secondary)}>تحميل المنتجات...</span>
          </motion.div>
        )}

        {/* Error State */}
        {(categoriesError || productsError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
          >
            <p>خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.</p>
          </motion.div>
        )}

        {/* Category Filter - only show if not limiting products and categories are loaded */}
        {!limit && !categoriesLoading && menuCategories.length > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex overflow-x-auto pb-2 mb-12 gap-2 md:justify-center"
          >
            {menuCategories.map((category) => (
              <button
                key={category.id || 'all'}
                onClick={() => setSelectedCategoryId(category.id)}
                className={cn(
                  'px-6 py-3 rounded-2xl font-medium whitespace-nowrap transition-all duration-200',
                  selectedCategoryId === category.id
                    ? 'bg-orange-500 text-white shadow-lg'
                    : cn(
                        theme.colors.secondary.light,
                        theme.colors.secondary.dark,
                        theme.text.primary,
                        'hover:shadow-md'
                      )
                )}
              >
                {category.name}
              </button>
            ))}
          </motion.div>
        )}

        {/* Products Grid */}
        {!productsLoading && filteredItems && filteredItems.length > 0 && (
          <AnimatePresence mode="wait">
            <motion.div
              key={selectedCategoryId || 'all'}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                'grid gap-6',
                responsive.grid.desktop
              )}
            >
              {filteredItems.map((item, index) => {
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

                      {/* Favorite Button */}
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation(); // Prevent card click
                          toggleFavorite(item._id.toString());
                        }}
                        className={cn(
                          'absolute top-4 right-4 z-10 p-2 rounded-full transition-colors',
                          favorites.has(item._id.toString())
                            ? 'bg-red-500 text-white'
                            : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400'
                        )}
                      >
                        <Heart className={cn(
                          'w-4 h-4',
                          favorites.has(item._id.toString()) ? 'fill-current' : ''
                        )} />
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
                            {item.addonsAndToppings && item.addonsAndToppings.length > 0 && (
                              <span title="خيارات إضافية">🍕</span>
                            )}
                            {!item.available && (
                              <span title="غير متوفر">❌</span>
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

                        {/* Price and Add to Cart */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex flex-col">
                            <span className={cn(
                              'font-bold text-xl',
                              'text-orange-500'
                            )}>
                              {formatPrice(displayPrice)}
                            </span>
                            {hasDiscount && (
                              <span className="text-sm text-gray-500 line-through">
                                {formatPrice(item.productPrice)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center space-x-2">
                            <Button
                              onClick={(e) => {
                                e?.stopPropagation(); // Prevent card click
                                onViewDetails?.(item);
                              }}
                              variant="outline"
                              size="sm"
                            >
                              عرض
                            </Button>
                            
                            <Button
                              onClick={(e) => {
                                e?.stopPropagation(); // Prevent card click
                                handleAddToCart(item);
                              }}
                              variant="accent"
                              size="sm"
                              className="group"
                              disabled={!item.available}
                            >
                              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                            </Button>
                          </div>
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
        {!productsLoading && filteredItems && filteredItems.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className={cn(
              'font-bold mb-2',
              responsive.fontSize.lg,
              theme.text.primary
            )}>
              لا توجد منتجات متاحة
            </h3>
            <p className={cn(theme.text.secondary)}>
              {selectedCategoryId 
                ? 'لا توجد منتجات متاحة في هذه الفئة حالياً' 
                : 'لا توجد منتجات متاحة حالياً'
              }
            </p>
            {selectedCategoryId && (
              <Button
                onClick={() => setSelectedCategoryId(null)}
                variant="outline"
                className="mt-4"
              >
                إظهار جميع المنتجات
              </Button>
            )}
          </motion.div>
        )}

        {/* Load More - only show if not limiting products and there might be more */}
        {!limit && !productsLoading && filteredItems && filteredItems.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-12"
          >
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => {
                // Could implement pagination here
                console.log('Load more products...');
              }}
            >
              تحميل المزيد من المنتجات
            </Button>
          </motion.div>
        )}
      </div>
    </section>
  );
}
