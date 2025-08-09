'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Heart, ShoppingCart, Star, Trash2 } from 'lucide-react';
import { cn } from '../../../funcs/utils';
import { theme, responsive } from '../../../funcs/responsive';
import Card from '../../../components/Card';
import Button from '../../../components/Button';

interface FavoriteItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  rating: number;
  category: string;
  addedAt: Date;
}

// Sample favorite items
const sampleFavorites: FavoriteItem[] = [
  {
    id: '1',
    name: 'Gourmet Burger',
    description: 'Premium beef patty with truffle aioli, arugula, and aged cheddar',
    price: 14.99,
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=400&fit=crop',
    rating: 4.8,
    category: 'Burgers',
    addedAt: new Date('2025-08-05')
  },
  {
    id: '2',
    name: 'Margherita Pizza',
    description: 'Fresh mozzarella, basil, tomato sauce on wood-fired crust',
    price: 16.50,
    image: 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=400&h=400&fit=crop',
    rating: 4.9,
    category: 'Pizza',
    addedAt: new Date('2025-08-04')
  },
  {
    id: '3',
    name: 'Chocolate Lava Cake',
    description: 'Warm chocolate cake with molten center, served with vanilla ice cream',
    price: 8.99,
    image: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=400&fit=crop',
    rating: 4.7,
    category: 'Desserts',
    addedAt: new Date('2025-08-03')
  },
  {
    id: '4',
    name: 'Caesar Salad',
    description: 'Crisp romaine lettuce, parmesan cheese, croutons, caesar dressing',
    price: 11.99,
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?w=400&h=400&fit=crop',
    rating: 4.5,
    category: 'Salads',
    addedAt: new Date('2025-08-02')
  },
  {
    id: '5',
    name: 'Pad Thai',
    description: 'Traditional Thai stir-fried noodles with shrimp, tofu, and peanuts',
    price: 13.50,
    image: 'https://images.unsplash.com/photo-1559314809-0f31657def5e?w=400&h=400&fit=crop',
    rating: 4.6,
    category: 'Asian',
    addedAt: new Date('2025-08-01')
  }
];

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>(sampleFavorites);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', ...Array.from(new Set(favorites.map(item => item.category)))];

  const filteredFavorites = selectedCategory === 'All' 
    ? favorites 
    : favorites.filter(item => item.category === selectedCategory);

  const removeFromFavorites = (itemId: string) => {
    setFavorites(prev => prev.filter(item => item.id !== itemId));
  };

  const addToCart = (item: FavoriteItem) => {
    // In a real app, this would add the item to cart state/context
    console.log('Added to cart:', item);
    // Show success feedback
    alert(`${item.name} added to cart!`);
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
            <div className="flex items-center justify-center mb-4">
              <Heart className="w-8 h-8 text-red-500 mr-3" />
              <h1 className={cn(
                'font-bold',
                responsive.fontSize['3xl'],
                theme.text.primary
              )}>
                Your Favorites
              </h1>
            </div>
            <p className={cn(
              'max-w-2xl mx-auto',
              responsive.fontSize.lg,
              theme.text.secondary
            )}>
              Your handpicked collection of delicious items you love
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
              No Favorites Yet
            </h2>
            <p className={cn(
              'max-w-md mx-auto mb-8',
              responsive.fontSize.base,
              theme.text.secondary
            )}>
              Start exploring our menu and save your favorite dishes by clicking the heart icon
            </p>
            <Button
              variant="accent"
              size="lg"
              onClick={() => window.location.href = '/user/menu'}
            >
              Browse Menu
            </Button>
          </motion.div>
        ) : (
          <>
            {/* Category Filter */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-8"
            >
              <div className="flex flex-wrap gap-3 justify-center">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={cn(
                      'px-6 py-3 rounded-2xl font-medium transition-all duration-300',
                      selectedCategory === category
                        ? 'bg-orange-500 text-white shadow-lg transform scale-105'
                        : cn(
                            'text-gray-600 dark:text-gray-400 hover:text-orange-500',
                            theme.background.card,
                            'hover:shadow-md'
                          )
                    )}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Favorites Grid */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filteredFavorites.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Card className="group hover:shadow-2xl transition-all duration-300 overflow-hidden">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      
                      {/* Remove from Favorites Button */}
                      <button
                        onClick={() => removeFromFavorites(item.id)}
                        className={cn(
                          'absolute top-3 right-3 w-10 h-10 rounded-full flex items-center justify-center',
                          'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm',
                          'text-red-500 hover:text-red-600 hover:bg-white dark:hover:bg-gray-800',
                          'transition-all duration-200 hover:scale-110'
                        )}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      {/* Category Badge */}
                      <div className="absolute top-3 left-3">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium',
                          'bg-orange-500 text-white'
                        )}>
                          {item.category}
                        </span>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className={cn(
                          'font-bold',
                          responsive.fontSize.lg,
                          theme.text.primary
                        )}>
                          {item.name}
                        </h3>
                        
                        {/* Rating */}
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-current" />
                          <span className={cn('text-sm font-medium', theme.text.primary)}>
                            {item.rating}
                          </span>
                        </div>
                      </div>

                      <p className={cn(
                        'text-sm mb-4 line-clamp-2',
                        theme.text.secondary
                      )}>
                        {item.description}
                      </p>

                      {/* Price and Actions */}
                      <div className="flex items-center justify-between">
                        <span className={cn(
                          'font-bold',
                          responsive.fontSize.lg,
                          'text-orange-600 dark:text-orange-400'
                        )}>
                          ${item.price.toFixed(2)}
                        </span>

                        <Button
                          variant="accent"
                          size="sm"
                          onClick={() => addToCart(item)}
                          className="group/btn"
                        >
                          <ShoppingCart className="w-4 h-4 mr-2 group-hover/btn:scale-110 transition-transform" />
                          Add to Cart
                        </Button>
                      </div>

                      {/* Added Date */}
                      <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
                        <p className={cn('text-xs', theme.text.secondary)}>
                          Added {item.addedAt.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
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
                  You have{' '}
                  <span className={cn('font-bold', theme.text.primary)}>
                    {filteredFavorites.length}
                  </span>
                  {selectedCategory !== 'All' && (
                    <>
                      {' '}
                      <span className="text-orange-500">{selectedCategory}</span>
                    </>
                  )}
                  {' '}favorite item{filteredFavorites.length !== 1 ? 's' : ''}
                </p>
              </Card>
            </motion.div>
          </>
        )}
      </div>
    </div>
  );
}
