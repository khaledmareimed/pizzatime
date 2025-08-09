'use client';

import { motion } from 'framer-motion';
import { cn } from '../../funcs/utils';
import { theme, animations } from '../../funcs/responsive';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  fullWidth?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export default function Button({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  fullWidth = false,
  className,
  type = 'button',
}: ButtonProps) {
  const baseClasses = cn(
    'inline-flex items-center justify-center font-medium rounded-2xl',
    'transition-all duration-200 ease-in-out',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'active:scale-95',
    theme.shadow.button,
    {
      'w-full': fullWidth,
      'opacity-50 cursor-not-allowed': disabled,
    }
  );

  const variantClasses = {
    primary: cn(
      theme.colors.primary.light,
      theme.colors.primary.dark,
      'text-white focus:ring-blue-500'
    ),
    secondary: cn(
      theme.colors.secondary.light,
      theme.colors.secondary.dark,
      theme.text.primary,
      'focus:ring-gray-500'
    ),
    accent: cn(
      theme.colors.accent.light,
      theme.colors.accent.dark,
      'text-white focus:ring-orange-500'
    ),
    outline: cn(
      'border-2',
      theme.border.primary,
      theme.text.primary,
      'hover:bg-gray-50 dark:hover:bg-gray-800',
      'focus:ring-gray-500'
    ),
  };

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm min-h-[40px]',
    md: 'px-6 py-3 text-base min-h-[48px]',
    lg: 'px-8 py-4 text-lg min-h-[56px]',
  };

  return (
    <motion.button
      {...animations.scaleIn}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      type={type}
      onClick={disabled ? undefined : onClick}
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      disabled={disabled}
    >
      {children}
    </motion.button>
  );
}
