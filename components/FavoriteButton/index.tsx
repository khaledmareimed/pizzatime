'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '../../funcs/utils';

interface FavoriteButtonProps {
  itemId: string;
  initialFavorited?: boolean;
  onToggle?: (itemId: string, isFavorited: boolean) => void;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FavoriteButton({
  itemId,
  initialFavorited = false,
  onToggle,
  size = 'md',
  className
}: FavoriteButtonProps) {
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [isAnimating, setIsAnimating] = useState(false);

  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const iconSizes = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const handleToggle = () => {
    setIsAnimating(true);
    setIsFavorited(!isFavorited);
    onToggle?.(itemId, !isFavorited);
    
    // Reset animation state
    setTimeout(() => setIsAnimating(false), 300);
  };

  return (
    <motion.button
      onClick={handleToggle}
      className={cn(
        'rounded-full flex items-center justify-center transition-all duration-200',
        'backdrop-blur-sm hover:scale-110 active:scale-95',
        isFavorited 
          ? 'bg-red-500 text-white shadow-lg' 
          : 'bg-white/90 dark:bg-gray-800/90 text-gray-600 dark:text-gray-400 hover:text-red-500',
        sizeClasses[size],
        className
      )}
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        animate={{
          scale: isAnimating ? [1, 1.3, 1] : 1,
        }}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={cn(
            iconSizes[size],
            isFavorited ? 'fill-current' : ''
          )}
        />
      </motion.div>
    </motion.button>
  );
}
