'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, 
  Star, 
  Plus, 
  Minus, 
  ShoppingCart, 
  ArrowLeft, 
  Clock,
  Flame,
  Leaf,
  Camera,
  MessageSquare,
  Check,
  Loader
} from 'lucide-react';
import { cn } from '../../../../funcs/utils';
import { theme, responsive } from '../../../../funcs/responsive';
import { formatPrice } from '../../../../funcs/utils';
import { usePublicProduct } from '../../../../funcs/hooks/usePublicData';
import { useCartContext } from '../../../../funcs/contexts/CartContext';
import { Product } from '../../../../funcs/collections/product';
import { CartAddon } from '../../../../funcs/types/cart';
import Card from '../../../../components/Card';
import Button from '../../../../components/Button';
import FavoriteButton from '../../../../components/FavoriteButton';

interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

interface SelectedOption {
  optionTitle: string;
  choiceName: string;
  choicePrice: number;
}

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemid as string;
  const { addItem } = useCartContext();
  
  // Fetch product data from database
  const { data: product, loading, error } = usePublicProduct(itemId);
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [selectedOptions, setSelectedOptions] = useState<SelectedOption[]>([]);
  const [comments, setComments] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Loading state
  if (loading) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className={cn('text-lg', theme.text.secondary)}>تحميل المنتج...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <h1 className={cn('font-bold mb-4', responsive.fontSize['2xl'], theme.text.primary)}>
            خطأ في تحميل المنتج
          </h1>
          <p className={cn('mb-4', theme.text.secondary)}>
            {error}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={() => router.back()}>
              العودة
            </Button>
            <Button variant="outline" onClick={() => window.location.reload()}>
              إعادة تحميل
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Product not found state
  if (!product) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <h1 className={cn('font-bold mb-4', responsive.fontSize['2xl'], theme.text.primary)}>
            المنتج غير موجود
          </h1>
          <p className={cn('mb-4', theme.text.secondary)}>
            المنتج المطلوب غير متوفر أو تم حذفه
          </p>
          <Button onClick={() => router.back()}>
            العودة
          </Button>
        </div>
      </div>
    );
  }

  // Product not available state
  if (!product.available) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <h1 className={cn('font-bold mb-4', responsive.fontSize['2xl'], theme.text.primary)}>
            المنتج غير متوفر
          </h1>
          <p className={cn('mb-4', theme.text.secondary)}>
            هذا المنتج غير متوفر حالياً
          </p>
          <Button onClick={() => router.back()}>
            العودة
          </Button>
        </div>
      </div>
    );
  }

  // Prepare images (use database images or fallback)
  const productImages = product.imagesUrl && product.imagesUrl.length > 0 
    ? product.imagesUrl 
    : ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop'];

  // Calculate display price (use discount price if available)
  const displayPrice = product.productDiscountPrice || product.productPrice;
  const hasDiscount = product.productDiscountPrice && product.productDiscountPrice < product.productPrice;

  const toggleAddon = (addon: { id: string; name: string; price: number }) => {
    setSelectedAddons(prev => {
      const exists = prev.find(a => a.id === addon.id);
      if (exists) {
        return prev.filter(a => a.id !== addon.id);
      } else {
        return [...prev, addon];
      }
    });
  };

  const selectOption = (optionTitle: string, choiceName: string, choicePrice: number) => {
    setSelectedOptions(prev => {
      // Remove any existing selection for this option group
      const filtered = prev.filter(opt => opt.optionTitle !== optionTitle);
      // Add the new selection
      return [...filtered, { optionTitle, choiceName, choicePrice }];
    });
  };

  const calculateTotal = () => {
    const basePrice = displayPrice * quantity;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0) * quantity;
    const optionsPrice = selectedOptions.reduce((sum, option) => sum + option.choicePrice, 0) * quantity;
    return basePrice + addonsPrice + optionsPrice;
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    // Check if all required options are selected
    const requiredOptions = product.productOptions?.filter(opt => opt.isRequired) || [];
    const missingRequiredOptions = requiredOptions.filter(reqOpt => 
      !selectedOptions.some(selOpt => selOpt.optionTitle === reqOpt.optionTitle)
    );
    
    if (missingRequiredOptions.length > 0) {
      toast.error('يرجى اختيار الخيارات المطلوبة', `يرجى اختيار: ${missingRequiredOptions.map(opt => opt.optionTitle).join(', ')}`);
      return;
    }
    
    setIsAddingToCart(true);
    
    try {
      // Convert selected addons to CartAddon format
      const cartAddons: CartAddon[] = selectedAddons.map(addon => ({
        id: addon.id,
        name: addon.name,
        price: addon.price
      }));
      
      // Convert selected options to CartOption format
      const cartOptions = selectedOptions.map(option => ({
        optionTitle: option.optionTitle,
        choiceName: option.choiceName,
        choicePrice: option.choicePrice
      }));
      
      // Add item to cart with real localStorage persistence
      addItem(product, quantity, cartAddons, cartOptions, comments.trim() || undefined);
      
      // Show success feedback
      alert(`تم إضافة ${product.productName} إلى السلة!\nالكمية: ${quantity}\nالسعر الإجمالي: ${formatPrice(calculateTotal())}`);
      
      // Optionally navigate to checkout or reset form
      // router.push('/user/checkout');
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      alert('حدث خطأ في إضافة المنتج إلى السلة');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div className={cn('min-h-screen', theme.background.primary)}>
      {/* Header */}
      <div className={cn('sticky top-0 z-10 backdrop-blur-md', theme.background.primary, 'bg-white/80 dark:bg-gray-900/80')}>
        <div className={cn(responsive.container.lg, 'px-4 py-4')}>
          <div className="flex items-center justify-between">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => router.back()}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              العودة
            </Button>
            
            <FavoriteButton
              itemId={product._id.toString()}
              size="md"
            />
          </div>
        </div>
      </div>

      <div className={cn(responsive.container.lg, 'px-4 pb-8')}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Images Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {/* Main Image */}
            <div className="relative h-96 rounded-3xl overflow-hidden mb-4">
              <img
                src={productImages[selectedImage]}
                alt={product.productName}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to default image if loading fails
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop';
                }}
              />
              
              {/* Image Navigation */}
              {productImages.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-2">
                    {productImages.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedImage(index)}
                        className={cn(
                          'w-3 h-3 rounded-full transition-all',
                          selectedImage === index
                            ? 'bg-white'
                            : 'bg-white/50 hover:bg-white/70'
                        )}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Thumbnail Images */}
            {productImages.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {productImages.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={cn(
                      'relative h-24 rounded-xl overflow-hidden transition-all',
                      selectedImage === index
                        ? 'ring-2 ring-orange-500'
                        : 'hover:opacity-80'
                    )}
                  >
                    <img
                      src={image}
                      alt={`${product.productName} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // Fallback to default image if loading fails
                        const target = e.target as HTMLImageElement;
                        target.src = 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop';
                      }}
                    />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Details Section */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {/* Item Info */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                {/* Discount Badge */}
                {hasDiscount && (
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                  )}>
                    عرض خاص
                  </span>
                )}
                
                {/* Available Status */}
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  product.available
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                )}>
                  {product.available ? 'متوفر' : 'غير متوفر'}
                </span>
              </div>
              
              <h1 className={cn(
                'font-bold mb-3',
                responsive.fontSize['3xl'],
                theme.text.primary
              )}>
                {product.productName}
              </h1>
              
              {product.description && (
                <p className={cn(
                  'mb-4',
                  responsive.fontSize.base,
                  theme.text.secondary
                )}>
                  {product.description}
                </p>
              )}
              
              {/* Price */}
              <div className="mb-6">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    'text-2xl font-bold',
                    'text-orange-600 dark:text-orange-400'
                  )}>
                    {formatPrice(displayPrice)}
                  </span>
                  
                  {hasDiscount && (
                    <span className={cn(
                      'text-lg text-gray-500 line-through',
                      theme.text.secondary
                    )}>
                      {formatPrice(product.productPrice)}
                    </span>
                  )}
                </div>
                
                {hasDiscount && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                    توفير {formatPrice(product.productPrice - displayPrice)}
                  </p>
                )}
              </div>
            </div>

            {/* Product Options */}
            {product.productOptions && product.productOptions.length > 0 && (
              <div className="mb-6">
                <h3 className={cn(
                  'font-bold mb-4',
                  responsive.fontSize.lg,
                  theme.text.primary
                )}>
                  خيارات المنتج
                </h3>
                
                <div className="space-y-6">
                  {product.productOptions.map((option, optionIndex) => {
                    const selectedChoice = selectedOptions.find(sel => sel.optionTitle === option.optionTitle);
                    
                    return (
                      <div key={optionIndex} className={cn(
                        'p-4 rounded-xl border',
                        theme.border.primary,
                        theme.background.card
                      )}>
                        <div className="flex items-center gap-2 mb-3">
                          <h4 className={cn(
                            'font-medium',
                            responsive.fontSize.base,
                            theme.text.primary
                          )}>
                            {option.optionTitle}
                          </h4>
                          {option.isRequired && (
                            <span className="text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full">
                              مطلوب
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {option.choices.map((choice, choiceIndex) => {
                            const isSelected = selectedChoice?.choiceName === choice.choiceName;
                            
                            return (
                              <motion.button
                                key={choiceIndex}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => selectOption(option.optionTitle, choice.choiceName, choice.choicePrice)}
                                className={cn(
                                  'w-full p-3 rounded-lg border transition-all text-left flex items-center justify-between',
                                  isSelected
                                    ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                                    : cn(theme.border.primary, theme.background.card, 'hover:border-orange-300')
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={cn(
                                    'w-4 h-4 rounded-full border-2 flex items-center justify-center',
                                    isSelected 
                                      ? 'border-orange-500 bg-orange-500' 
                                      : 'border-gray-300 dark:border-gray-600'
                                  )}>
                                    {isSelected && (
                                      <div className="w-2 h-2 bg-white rounded-full" />
                                    )}
                                  </div>
                                  <span className={cn(
                                    'font-medium',
                                    theme.text.primary
                                  )}>
                                    {choice.choiceName}
                                  </span>
                                </div>
                                
                                <span className={cn(
                                  'font-medium text-sm',
                                  isSelected ? 'text-orange-600' : theme.text.primary
                                )}>
                                  {choice.choicePrice > 0 ? `+${formatPrice(choice.choicePrice)}` : 'مجاني'}
                                </span>
                              </motion.button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Addons */}
            {product.addonsAndToppings && product.addonsAndToppings.length > 0 && (
              <div className="mb-6">
                <h3 className={cn(
                  'font-bold mb-4',
                  responsive.fontSize.lg,
                  theme.text.primary
                )}>
                  خيارات إضافية
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                  {product.addonsAndToppings.map((addon, index) => {
                    const addonId = `${addon.toppingName}-${index}`;
                    const isSelected = selectedAddons.some(a => a.id === addonId);
                    
                    return (
                      <motion.button
                        key={addonId}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => toggleAddon({
                          id: addonId,
                          name: addon.toppingName,
                          price: addon.toppingPrice
                        })}
                        className={cn(
                          'w-full p-4 rounded-xl border transition-all text-left min-h-[80px] flex flex-col justify-between',
                          isSelected
                            ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                            : cn(theme.border.primary, theme.background.card, 'hover:border-orange-300')
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 mr-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn(
                                'font-medium',
                                theme.text.primary
                              )}>
                                {addon.toppingName}
                              </span>
                              
                              {isSelected && (
                                <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                              )}
                            </div>
                          </div>
                          
                          <span className={cn(
                            'font-medium text-sm flex-shrink-0',
                            isSelected ? 'text-orange-600' : theme.text.primary
                          )}>
                            {addon.toppingPrice > 0 ? `+${formatPrice(addon.toppingPrice)}` : 'مجاني'}
                          </span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h4 className={cn(
                  'font-medium',
                  responsive.fontSize.base,
                  theme.text.primary
                )}>
                  ملاحظات خاصة (اختياري)
                </h4>
              </div>
              
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="أي طلبات خاصة أو متطلبات غذائية..."
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors resize-none',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'placeholder-gray-400 dark:placeholder-gray-500'
                )}
                dir="rtl"
              />
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className={cn('font-medium', theme.text.primary)}>
                  الكمية
                </span>
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                      'transition-colors',
                      theme.text.primary
                    )}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <span className={cn(
                    'text-lg font-medium min-w-[40px] text-center',
                    theme.text.primary
                  )}>
                    {quantity}
                  </span>
                  
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center',
                      'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700',
                      'transition-colors',
                      theme.text.primary
                    )}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Total and Add to Cart */}
              <div className={cn(
                'p-4 rounded-xl',
                theme.background.secondary
              )}>
                <div className="flex items-center justify-between mb-4">
                  <span className={cn('font-medium', theme.text.primary)}>
                    المجموع
                  </span>
                  <span className={cn(
                    'text-xl font-bold',
                    'text-orange-600 dark:text-orange-400'
                  )}>
                    {formatPrice(calculateTotal())}
                  </span>
                </div>
                
                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || !product.available}
                  className="gap-2"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      جاري الإضافة...
                    </>
                  ) : !product.available ? (
                    <>
                      غير متوفر
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      أضف إلى السلة
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
