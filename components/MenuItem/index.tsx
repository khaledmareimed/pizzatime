'use client';

import { motion } from 'framer-motion';
import { Plus, Star, Clock, Heart } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import { formatPrice, type FoodItem } from '../../funcs/utils';
import Card from '../Card';
import Button from '../Button';

interface MenuItemProps {
  item: FoodItem;
  onAddToCart?: (item: FoodItem) => void;
  onViewDetails?: (item: FoodItem) => void;
  onToggleFavorite?: (itemId: string) => void;
  isFavorite?: boolean;
}

export default function MenuItem({
  item,
  onAddToCart,
  onViewDetails,
  onToggleFavorite,
  isFavorite = false
}: MenuItemProps) {
  return (
    <motion.div
      {...animations.fadeIn}
      whileHover={{ y: -4 }}
    >
      <Card
        hoverable
        className="relative overflow-hidden group h-full"
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
          onClick={() => onToggleFavorite?.(item.id)}
          className={cn(
            'absolute top-4 right-4 z-10 p-2 rounded-full transition-colors',
            isFavorite
              ? 'bg-red-500 text-white'
              : 'bg-white/80 dark:bg-gray-800/80 text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'
          )}
        >
          <Heart className={cn(
            'w-4 h-4',
            isFavorite ? 'fill-current' : ''
          )} />
        </motion.button>

        {/* Food Image */}
        <div className="aspect-square bg-gradient-to-br from-orange-100 to-red-100 dark:from-orange-900/30 dark:to-red-900/30 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300">
          <div className="text-6xl md:text-7xl">{item.image}</div>
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

          {/* Price and Actions */}
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
                Details
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
  );
}
