'use client';

import { motion } from 'framer-motion';
import { cn } from '../../funcs/utils';
import { theme, animations } from '../../funcs/responsive';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  padding?: 'sm' | 'md' | 'lg';
  rounded?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function Card({
  children,
  className,
  hoverable = false,
  padding = 'md',
  rounded = 'lg',
}: CardProps) {
  const baseClasses = cn(
    theme.background.card,
    theme.border.primary,
    'border backdrop-blur-sm',
    theme.shadow.card,
    {
      'hover:shadow-xl hover:scale-[1.02] cursor-pointer transition-all duration-300': hoverable,
    }
  );

  const paddingClasses = {
    sm: 'p-3 md:p-4',
    md: 'p-4 md:p-6',
    lg: 'p-6 md:p-8',
  };

  const roundedClasses = {
    sm: 'rounded-lg',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
  };

  return (
    <motion.div
      {...animations.fadeIn}
      whileHover={hoverable ? { y: -4 } : undefined}
      className={cn(
        baseClasses,
        paddingClasses[padding],
        roundedClasses[rounded],
        className
      )}
    >
      {children}
    </motion.div>
  );
}
