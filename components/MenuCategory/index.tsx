'use client';

import { motion } from 'framer-motion';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import { type FoodItem } from '../../funcs/utils';
import MenuItem from '../MenuItem';

interface MenuCategoryProps {
  title: string;
  description?: string;
  items: FoodItem[];
  onAddToCart?: (item: FoodItem) => void;
  onViewDetails?: (item: FoodItem) => void;
  onToggleFavorite?: (itemId: string) => void;
  favorites?: Set<string>;
}

export default function MenuCategory({
  title,
  description,
  items,
  onAddToCart,
  onViewDetails,
  onToggleFavorite,
  favorites = new Set()
}: MenuCategoryProps) {
  if (items.length === 0) return null;

  return (
    <section className="mb-12">
      {/* Category Header */}
      <motion.div
        {...animations.fadeIn}
        className="mb-8"
      >
        <h2 className={cn(
          'font-bold mb-2',
          'text-2xl md:text-3xl',
          theme.text.primary
        )}>
          {title}
        </h2>
        {description && (
          <p className={cn(
            responsive.fontSize.base,
            theme.text.secondary
          )}>
            {description}
          </p>
        )}
      </motion.div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <MenuItem
              item={item}
              onAddToCart={onAddToCart}
              onViewDetails={onViewDetails}
              onToggleFavorite={onToggleFavorite}
              isFavorite={favorites.has(item.id)}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
