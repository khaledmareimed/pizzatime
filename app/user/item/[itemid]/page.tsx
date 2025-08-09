'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
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
  Check
} from 'lucide-react';
import { cn } from '../../../../funcs/utils';
import { theme, responsive } from '../../../../funcs/responsive';
import Card from '../../../../components/Card';
import Button from '../../../../components/Button';
import FavoriteButton from '../../../../components/FavoriteButton';

interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  category: string;
  rating: number;
  reviewsCount: number;
  prepTime: string;
  calories: number;
  isVegetarian: boolean;
  isSpicy: boolean;
  addons: {
    category: string;
    options: {
      id: string;
      name: string;
      price: number;
      description?: string;
    }[];
  }[];
}

interface SelectedAddon {
  id: string;
  name: string;
  price: number;
}

// Sample food items data
const foodItems: Record<string, FoodItem> = {
  '1': {
    id: '1',
    name: 'Gourmet Beef Burger',
    description: 'Premium grass-fed beef patty with truffle aioli, aged cheddar, caramelized onions, and fresh arugula on a brioche bun',
    price: 14.99,
    images: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1586816001966-79b736744398?w=800&h=600&fit=crop'
    ],
    category: 'Burgers',
    rating: 4.8,
    reviewsCount: 152,
    prepTime: '15-20 min',
    calories: 650,
    isVegetarian: false,
    isSpicy: false,
    addons: [
      {
        category: 'Extra Toppings',
        options: [
          { id: 'cheese', name: 'Extra Cheese', price: 2.00, description: 'Aged cheddar slice' },
          { id: 'bacon', name: 'Crispy Bacon', price: 3.50, description: 'Smoked bacon strips' },
          { id: 'avocado', name: 'Fresh Avocado', price: 2.50, description: 'Sliced avocado' },
          { id: 'mushrooms', name: 'Sautéed Mushrooms', price: 2.00, description: 'Button mushrooms' }
        ]
      },
      {
        category: 'Sides',
        options: [
          { id: 'fries', name: 'French Fries', price: 4.99, description: 'Crispy golden fries' },
          { id: 'truffle-fries', name: 'Truffle Fries', price: 7.99, description: 'Fries with truffle oil' },
          { id: 'onion-rings', name: 'Onion Rings', price: 5.99, description: 'Beer-battered rings' }
        ]
      },
      {
        category: 'Drinks',
        options: [
          { id: 'coke', name: 'Coca Cola', price: 2.99, description: '16oz fountain drink' },
          { id: 'milkshake', name: 'Chocolate Milkshake', price: 5.99, description: 'Premium vanilla ice cream' }
        ]
      }
    ]
  },
  '2': {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, basil, and tomato sauce on a wood-fired crust with premium San Marzano tomatoes',
    price: 16.50,
    images: [
      'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop'
    ],
    category: 'Pizza',
    rating: 4.9,
    reviewsCount: 203,
    prepTime: '12-15 min',
    calories: 520,
    isVegetarian: true,
    isSpicy: false,
    addons: [
      {
        category: 'Extra Toppings',
        options: [
          { id: 'extra-cheese', name: 'Extra Mozzarella', price: 3.00, description: 'Fresh mozzarella' },
          { id: 'pepperoni', name: 'Pepperoni', price: 4.00, description: 'Spicy pepperoni slices' },
          { id: 'olives', name: 'Black Olives', price: 2.50, description: 'Kalamata olives' },
          { id: 'arugula', name: 'Fresh Arugula', price: 2.00, description: 'Peppery arugula leaves' }
        ]
      },
      {
        category: 'Crust Options',
        options: [
          { id: 'thick-crust', name: 'Thick Crust', price: 2.00, description: 'Deep dish style' },
          { id: 'gluten-free', name: 'Gluten-Free Crust', price: 4.00, description: 'Cauliflower base' }
        ]
      }
    ]
  },
  '3': {
    id: '3',
    name: 'Pad Thai',
    description: 'Traditional Thai stir-fried rice noodles with shrimp, tofu, bean sprouts, and crushed peanuts in tamarind sauce',
    price: 13.50,
    images: [
      'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1617093727343-374698b1b08d?w=800&h=600&fit=crop'
    ],
    category: 'Asian',
    rating: 4.6,
    reviewsCount: 89,
    prepTime: '18-22 min',
    calories: 480,
    isVegetarian: false,
    isSpicy: true,
    addons: [
      {
        category: 'Protein Options',
        options: [
          { id: 'extra-shrimp', name: 'Extra Shrimp', price: 5.00, description: 'Fresh jumbo shrimp' },
          { id: 'chicken', name: 'Grilled Chicken', price: 4.00, description: 'Tender chicken breast' },
          { id: 'beef', name: 'Beef Strips', price: 6.00, description: 'Marinated beef' }
        ]
      },
      {
        category: 'Spice Level',
        options: [
          { id: 'mild', name: 'Mild', price: 0.00, description: 'Less spicy' },
          { id: 'extra-spicy', name: 'Extra Spicy', price: 0.00, description: 'Thai hot level' }
        ]
      }
    ]
  }
};

export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemid as string;
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedAddons, setSelectedAddons] = useState<SelectedAddon[]>([]);
  const [comments, setComments] = useState('');
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  
  const item = foodItems[itemId];
  
  if (!item) {
    return (
      <div className={cn('min-h-screen flex items-center justify-center', theme.background.primary)}>
        <div className="text-center">
          <h1 className={cn('font-bold mb-4', responsive.fontSize['2xl'], theme.text.primary)}>
            Item Not Found
          </h1>
          <Button onClick={() => router.back()}>
            Go Back
          </Button>
        </div>
      </div>
    );
  }

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

  const calculateTotal = () => {
    const basePrice = item.price * quantity;
    const addonsPrice = selectedAddons.reduce((sum, addon) => sum + addon.price, 0) * quantity;
    return basePrice + addonsPrice;
  };

  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const cartItem = {
      id: item.id,
      name: item.name,
      price: item.price,
      quantity,
      image: item.images[0],
      addons: selectedAddons,
      comments: comments.trim() || undefined
    };
    
    console.log('Adding to cart:', cartItem);
    
    // Show success feedback
    setIsAddingToCart(false);
    
    // In a real app, you would update cart state/context here
    alert('Item added to cart!');
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
              Back
            </Button>
            
            <FavoriteButton
              itemId={item.id}
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
              <Image
                src={item.images[selectedImage]}
                alt={item.name}
                fill
                className="object-cover"
                priority
              />
              
              {/* Image Navigation */}
              {item.images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                  <div className="flex gap-2">
                    {item.images.map((_, index) => (
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
            {item.images.length > 1 && (
              <div className="grid grid-cols-3 gap-3">
                {item.images.map((image, index) => (
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
                    <Image
                      src={image}
                      alt={`${item.name} ${index + 1}`}
                      fill
                      className="object-cover"
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
                <span className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium',
                  'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                )}>
                  {item.category}
                </span>
                
                {item.isVegetarian && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Leaf className="w-4 h-4" />
                    <span className="text-xs">Vegetarian</span>
                  </div>
                )}
                
                {item.isSpicy && (
                  <div className="flex items-center gap-1 text-red-500">
                    <Flame className="w-4 h-4" />
                    <span className="text-xs">Spicy</span>
                  </div>
                )}
              </div>
              
              <h1 className={cn(
                'font-bold mb-3',
                responsive.fontSize['3xl'],
                theme.text.primary
              )}>
                {item.name}
              </h1>
              
              <p className={cn(
                'mb-4',
                responsive.fontSize.base,
                theme.text.secondary
              )}>
                {item.description}
              </p>
              
              {/* Rating and Info */}
              <div className="flex items-center gap-6 mb-4">
                <div className="flex items-center gap-1">
                  <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  <span className={cn('font-medium', theme.text.primary)}>
                    {item.rating}
                  </span>
                  <span className={cn('text-sm', theme.text.secondary)}>
                    ({item.reviewsCount} reviews)
                  </span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className={cn('text-sm', theme.text.secondary)}>
                    {item.prepTime}
                  </span>
                </div>
                
                <span className={cn('text-sm', theme.text.secondary)}>
                  {item.calories} cal
                </span>
              </div>
              
              <div className={cn(
                'text-2xl font-bold mb-6',
                'text-orange-600 dark:text-orange-400'
              )}>
                ${item.price.toFixed(2)}
              </div>
            </div>

            {/* Addons */}
            <div className="mb-6">
              <h3 className={cn(
                'font-bold mb-4',
                responsive.fontSize.lg,
                theme.text.primary
              )}>
                Customize Your Order
              </h3>
              
              <div className="space-y-6">
                {item.addons.map((addonCategory) => (
                  <div key={addonCategory.category}>
                    <h4 className={cn(
                      'font-medium mb-3',
                      responsive.fontSize.base,
                      theme.text.primary
                    )}>
                      {addonCategory.category}
                    </h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-3">
                      {addonCategory.options.map((addon) => {
                        const isSelected = selectedAddons.some(a => a.id === addon.id);
                        
                        return (
                          <motion.button
                            key={addon.id}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => toggleAddon(addon)}
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
                                    {addon.name}
                                  </span>
                                  
                                  {isSelected && (
                                    <Check className="w-4 h-4 text-orange-500 flex-shrink-0" />
                                  )}
                                </div>
                                
                                {addon.description && (
                                  <p className={cn('text-sm line-clamp-2', theme.text.secondary)}>
                                    {addon.description}
                                  </p>
                                )}
                              </div>
                              
                              <span className={cn(
                                'font-medium text-sm flex-shrink-0',
                                isSelected ? 'text-orange-600' : theme.text.primary
                              )}>
                                {addon.price > 0 ? `+$${addon.price.toFixed(2)}` : 'Free'}
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Comments */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-5 h-5 text-gray-400" />
                <h4 className={cn(
                  'font-medium',
                  responsive.fontSize.base,
                  theme.text.primary
                )}>
                  Special Instructions (Optional)
                </h4>
              </div>
              
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Any special requests or dietary requirements..."
                rows={3}
                className={cn(
                  'w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-orange-500 transition-colors resize-none',
                  theme.background.card,
                  theme.border.primary,
                  theme.text.primary,
                  'placeholder-gray-400 dark:placeholder-gray-500'
                )}
              />
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4">
              {/* Quantity Selector */}
              <div className="flex items-center justify-between">
                <span className={cn('font-medium', theme.text.primary)}>
                  Quantity
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
                    Total
                  </span>
                  <span className={cn(
                    'text-xl font-bold',
                    'text-orange-600 dark:text-orange-400'
                  )}>
                    ${calculateTotal().toFixed(2)}
                  </span>
                </div>
                
                <Button
                  variant="accent"
                  size="lg"
                  fullWidth
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="gap-2"
                >
                  {isAddingToCart ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Adding to Cart...
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5" />
                      Add to Cart
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
