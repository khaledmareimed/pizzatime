'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Star, Plus, Loader } from 'lucide-react';
import { useToastContext } from '../../../funcs/contexts/ToastContext';
import { cn } from '../../../funcs/utils';
import { theme, responsive, animations } from '../../../funcs/responsive';
import { formatPrice } from '../../../funcs/utils';
import { usePublicCategories, usePublicProducts } from '../../../funcs/hooks/usePublicData';
import { useCartContext } from '../../../funcs/contexts/CartContext';
import { Product } from '../../../funcs/collections/product';
import { Category } from '../../../funcs/collections/category';
import Card from '../../../components/Card';
import Button from '../../../components/Button';

export default function MenuPage() {
  const router = useRouter();
  const { addItem } = useCartContext();
  const toast = useToastContext();
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  
  // Fetch categories and products from database
  const { data: categories, loading: categoriesLoading, error: categoriesError } = usePublicCategories();
  const { data: products, loading: productsLoading, error: productsError } = usePublicProducts(selectedCategoryId || undefined);

  // Create menu categories with "All Items" option
  const menuCategories = useMemo(() => {
    const allCategory = { id: null, name: 'جميع الأصناف' };
    const dbCategories = categories?.map(cat => ({ id: cat._id.toString(), name: cat.name })) || [];
    return [allCategory, ...dbCategories];
  }, [categories]);

  // Filter products based on selected category
  const filteredItems = useMemo(() => {
    if (!products) return [];
    if (!selectedCategoryId) return products;
    return products.filter(product => product.categoryId === selectedCategoryId);
  }, [products, selectedCategoryId]);

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
اكتشف مجموعتنا اللذيذة من الأطباق الطازجة            </p>
          </motion.div>
        </div>
      </section>

      <div className={cn(responsive.container.xl, 'px-4 py-8')}>
        {/* Loading State for Categories */}
        {categoriesLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center mb-8"
          >
            <Loader className="w-6 h-6 animate-spin text-orange-500" />
          </motion.div>
        )}

        {/* Category Filter */}
        {!categoriesLoading && menuCategories.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex overflow-x-auto pb-2 mb-8 gap-2 md:justify-center"
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

        {/* Error States */}
        {(categoriesError || productsError) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg"
          >
            <p>خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
              className="mt-2"
            >
              إعادة تحميل
            </Button>
          </motion.div>
        )}

        {/* Loading State for Products */}
        {productsLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-12"
          >
            <Loader className="w-8 h-8 animate-spin text-orange-500 mr-2" />
            <span className={cn('text-lg', theme.text.secondary)}>تحميل المنتجات...</span>
          </motion.div>
        )}

        {/* Results Count */}
        {!productsLoading && filteredItems && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-center mb-6"
          >
            <p className={cn('text-sm', theme.text.secondary)}>
              عرض {filteredItems.length} منتج{filteredItems.length !== 1 ? '' : ''}
              {selectedCategoryId && menuCategories.find(cat => cat.id === selectedCategoryId) && 
                ` في ${menuCategories.find(cat => cat.id === selectedCategoryId)?.name}`}
            </p>
          </motion.div>
        )}

        {/* Menu Items Grid */}
        {!productsLoading && filteredItems && filteredItems.length > 0 && (
          <div className={cn(
            'grid gap-6',
            responsive.grid.desktop
          )}>
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
                  transition={{ delay: index * 0.05 }}
                >
                  <Card
                    hoverable
                    className="relative overflow-hidden group h-full cursor-pointer"
                    onClick={() => handleViewDetails(item)}
                  >
                    {/* Discount Badge */}
                    {hasDiscount && (
                      <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        عرض خاص
                      </div>
                    )}

                    {/* Food Image */}
                    <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                      {/* Use regular img tag for external images to avoid Next.js hostname restrictions */}
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
                    <div className="space-y-3 flex-1 flex flex-col">
                      <div>
                        <h3 className={cn(
                          'font-bold mb-2',
                          responsive.fontSize.lg,
                          theme.text.primary
                        )}>
                          {item.productName}
                        </h3>
                        
                        {item.description && (
                          <p className={cn(
                            'line-clamp-2 mb-3',
                            responsive.fontSize.sm,
                            theme.text.secondary
                          )}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Addons/Toppings Info */}
                      {item.addonsAndToppings && item.addonsAndToppings.length > 0 && (
                        <div className="mb-3">
                          <span className="text-xs bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 px-2 py-1 rounded-full">
                            خيارات إضافية متاحة
                          </span>
                        </div>
                      )}

                      {/* Availability Status */}
                      {!item.available && (
                        <div className="mb-3">
                          <span className="text-xs bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400 px-2 py-1 rounded-full">
                            غير متوفر حالياً
                          </span>
                        </div>
                      )}

                      {/* Price and Add to Cart */}
                      <div className="flex items-center justify-between pt-2 mt-auto">
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
                          <Plus className="w-4 h-4 mr-2 group-hover:rotate-90 transition-transform" />
                          {item.available ? 'أضف للسلة' : 'غير متوفر'}
                        </Button>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
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
              لم يتم العثور على منتجات
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

        {/* No Categories State */}
        {!categoriesLoading && !productsLoading && (!categories || categories.length === 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <div className="text-6xl mb-4">📋</div>
            <h3 className={cn(
              'font-bold mb-2',
              responsive.fontSize.lg,
              theme.text.primary
            )}>
              لا توجد فئات متاحة
            </h3>
            <p className={cn(theme.text.secondary)}>
              يبدو أن القائمة فارغة حالياً. يرجى المحاولة مرة أخرى لاحقاً.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
