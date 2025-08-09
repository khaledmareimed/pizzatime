'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Clock, Heart, Filter } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import { formatPrice, generateStars, type FoodItem } from '../../funcs/utils';
import Card from '../Card';
import Button from '../Button';

const categories = ['الجميع', 'بيتزا', 'برجر', 'آسيوي', 'حلويات', 'مشروبات'];

const foodItems: FoodItem[] = [
  {
    id: '1',
    name: 'بيتزا مرجريتا',
    description: 'طماطم طازجة, موتزاريلا, وريحان',
    price: 18.99,
    image: '🍕',
    category: 'بيتزا',
    rating: 4.8,
    prepTime: '20-30 دقيقة',
    isPopular: true,
    isVegetarian: true
  },
  {
    id: '2',
    name: 'برجر كلاسيك',
    description: 'لحم بقر، خس، طماطم، وجبنة',
    price: 15.99,
    image: '🍔',
    category: 'برجر',
    rating: 4.6,
    prepTime: '15-25 دقيقة',
    isPopular: true
  },
  {
    id: '3',
    name: 'رامن الدجاج',
    description: 'مرق غني مع دجاج طري ونودلز',
    price: 22.99,
    image: '🍜',
    category: 'آسيوي',
    rating: 4.9,
    prepTime: '25-35 دقيقة',
    isSpicy: true
  },
  {
    id: '4',
    name: 'كيكة الشوكولاتة',
    description: 'كيكة الشوكولاتة الفاخرة مع كريمة غنية',
    price: 8.99,
    image: '🍰',
    category: 'حلويات',
    rating: 4.7,
    prepTime: '5-10 دقيقة',
    isVegetarian: true
  },
  {
    id: '5',
    name: 'سموذي فواكه طازجة',
    description: 'سموذي بالتوت والموز',
    price: 6.99,
    image: '🥤',
    category: 'مشروبات',
    rating: 4.5,
    prepTime: '5 دقيقة',
    isVegetarian: true
  },
  {
    id: '6',
    name: 'بيتزا بيبروني',
    description: 'بيتزا بيبروني كلاسيكية مع جبنة موتزاريلا',
    price: 21.99,
    image: '🍕',
    category: 'بيتزا',
    rating: 4.8,
    prepTime: '20-30 دقيقة',
    isPopular: true
  }
];

interface ProductsProps {
  onAddToCart?: (item: FoodItem) => void;
  onViewDetails?: (item: FoodItem) => void;
}

export default function Products({ onAddToCart, onViewDetails }: ProductsProps) {
  const [selectedCategory, setSelectedCategory] = useState('الجميع');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());

  const filteredItems = selectedCategory === 'الجميع'
    ? foodItems
    : foodItems.filter(item => item.category === selectedCategory);

  const toggleFavorite = (itemId: string) => {
    const newFavorites = new Set(favorites);
    if (newFavorites.has(itemId)) {
      newFavorites.delete(itemId);
    } else {
      newFavorites.add(itemId);
    }
    setFavorites(newFavorites);
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

        {/* Category Filter */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex overflow-x-auto pb-2 mb-12 gap-2 md:justify-center"
        >
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={cn(
                'px-6 py-3 rounded-2xl font-medium whitespace-nowrap transition-all duration-200',
                selectedCategory === category
                  ? 'bg-orange-500 text-white shadow-lg'
                  : cn(
                      theme.colors.secondary.light,
                      theme.colors.secondary.dark,
                      theme.text.primary,
                      'hover:shadow-md'
                    )
              )}
            >
              {category}
            </button>
          ))}
        </motion.div>

        {/* Products Grid */}
        <AnimatePresence mode="wait">
          <motion.div
            key={selectedCategory}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={cn(
              'grid gap-6',
              responsive.grid.desktop
            )}
          >
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
              <Card
                hoverable
                className="relative overflow-hidden group"
              >
                {/* Popular Badge */}
                {item.isPopular && (
                  <div className="absolute top-4 left-4 z-10 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    Popular
                  </div>
                )}

                {/* Favorite Button */}
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => toggleFavorite(item.id)}
                  className={cn(
                    'absolute top-4 right-4 z-10 p-2 rounded-full transition-colors',
                    favorites.has(item.id)
                      ? 'bg-red-500 text-white'
                      : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400'
                  )}
                >
                  <Heart className={cn(
                    'w-4 h-4',
                    favorites.has(item.id) ? 'fill-current' : ''
                  )} />
                </motion.button>

                {/* Food Image */}
                <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
                  <div className="text-6xl">{item.image}</div>
                </div>

                {/* Content */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h3 className={cn(
                      'font-bold',
                      responsive.fontSize.lg,
                      theme.text.primary
                    )}>
                      {item.name}
                    </h3>
                    <div className="flex items-center space-x-1">
                      {item.isVegetarian && <span title="Vegetarian">🌱</span>}
                      {item.isSpicy && <span title="Spicy">🌶️</span>}
                    </div>
                  </div>

                  <p className={cn(
                    'line-clamp-2',
                    responsive.fontSize.sm,
                    theme.text.secondary
                  )}>
                    {item.description}
                  </p>

                  {/* Rating and Prep Time */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className={cn(
                          'text-sm font-medium',
                          theme.text.primary
                        )}>
                          {item.rating}
                        </span>
                      </div>
                      <span className={cn('text-xs', theme.text.secondary)}>
                        ({Math.floor(Math.random() * 100) + 50} reviews)
                      </span>
                    </div>

                    <div className="flex items-center space-x-1">
                      <Clock className={cn('w-4 h-4', theme.text.secondary)} />
                      <span className={cn('text-sm', theme.text.secondary)}>
                        {item.prepTime}
                      </span>
                    </div>
                  </div>

                  {/* Price and Add to Cart */}
                  <div className="flex items-center justify-between pt-2">
                    <span className={cn(
                      'font-bold text-xl',
                      'text-orange-500'
                    )}>
                      {formatPrice(item.price)}
                    </span>

                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => onViewDetails?.(item)}
                        variant="outline"
                        size="sm"
                      >
                        View
                      </Button>
                      
                      <Button
                        onClick={() => onAddToCart?.(item)}
                        variant="accent"
                        size="sm"
                        className="group"
                      >
                        <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
          </motion.div>
        </AnimatePresence>

        {/* Load More */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-12"
        >
          <Button variant="outline" size="lg">
            Load More Items
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
