'use client';

import { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Menu, X, ShoppingCart, Heart } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import Button from '../Button';

interface HeaderProps {
  cartCount?: number;
  favoritesCount?: number;
  onCartClick?: () => void;
  onFavoritesClick?: () => void;
  onSearchFocus?: () => void;
}

export default function Header({
  cartCount = 0,
  favoritesCount = 0,
  onCartClick,
  onFavoritesClick,
  onSearchFocus,
}: HeaderProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const focusSearch = () => {
    searchInputRef.current?.focus();
    onSearchFocus?.();
  };

  const handleCartClick = () => {
    router.push('/user/checkout');
    onCartClick?.();
  };

  const handleFavoritesClick = () => {
    router.push('/user/favorites');
    onFavoritesClick?.();
  };

  return (
    <>
      <motion.header
        {...animations.slideIn}
        className={cn(
          'sticky top-0 z-50 w-full backdrop-blur-md border-b',
          theme.background.primary,
          theme.border.primary,
          'bg-white/80 dark:bg-gray-900/80'
        )}
      >
        <div className={cn(responsive.container.xl, 'px-4')}>
          <div className="flex items-center justify-between h-14 md:h-16 lg:h-20 gap-4">
            {/* Logo */}
            <Link href="/user" className="block flex-shrink-0">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center space-x-2 rtl:space-x-reverse cursor-pointer"
              >
                <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-2xl flex items-center justify-center">
                  <span className="text-white font-bold text-sm md:text-lg lg:text-xl">F</span>
                </div>
                <span className={cn(
                  'font-bold hidden sm:block',
                  responsive.fontSize.base,
                  'md:text-lg',
                  theme.text.primary
                )}>
                  بيتزا تايم
                </span>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8 rtl:space-x-reverse">
              <a href="#" className={cn(
                'font-medium transition-colors hover:text-orange-500',
                theme.text.primary
              )}>
                الرئيسية
              </a>
              <a href="#" className={cn(
                'font-medium transition-colors hover:text-orange-500',
                theme.text.secondary
              )}>
                القائمة
              </a>
              <a href="#" className={cn(
                'font-medium transition-colors hover:text-orange-500',
                theme.text.secondary
              )}>
                العروض
              </a>
              <a href="#" className={cn(
                'font-medium transition-colors hover:text-orange-500',
                theme.text.secondary
              )}>
                حولنا
              </a>
            </nav>

            {/* Search Bar - Always Visible */}
            <div className="flex items-center flex-1 max-w-xs md:max-w-md mx-2 md:mx-4 lg:mx-8">
              <div className={cn(
                'relative w-full',
                theme.background.secondary,
                'rounded-xl md:rounded-2xl'
              )}>
                <Search className={cn(
                  'absolute right-2 md:right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 md:w-5 md:h-5 rtl:scale-x-[-1]',
                  theme.text.secondary
                )} />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="بحث..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pr-7 md:pr-10 pl-3 md:pl-4 py-2 md:py-3 text-sm md:text-base rounded-xl md:rounded-2xl border-0 focus:ring-2 focus:ring-orange-500 text-right',
                    theme.background.secondary,
                    theme.text.primary,
                    'placeholder-gray-400 dark:placeholder-gray-500'
                  )}
                />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center space-x-2 md:space-x-3 rtl:space-x-reverse">
              {/* Favorites */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleFavoritesClick}
                className={cn(
                  'relative p-2 rounded-xl transition-colors',
                  theme.colors.secondary.light,
                  theme.colors.secondary.dark
                )}
              >
                <Heart className={cn('w-5 h-5', theme.text.primary)} />
                {favoritesCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {favoritesCount > 99 ? '99+' : favoritesCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Cart */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCartClick}
                className={cn(
                  'relative p-2 rounded-xl transition-colors',
                  theme.colors.secondary.light,
                  theme.colors.secondary.dark
                )}
              >
                <ShoppingCart className={cn('w-5 h-5', theme.text.primary)} />
                {cartCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -left-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {cartCount > 99 ? '99+' : cartCount}
                  </motion.span>
                )}
              </motion.button>

              {/* Mobile Menu Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={toggleMobileMenu}
                className={cn(
                  'md:hidden p-2 rounded-xl transition-colors',
                  theme.colors.secondary.light,
                  theme.colors.secondary.dark
                )}
              >
                {isMobileMenuOpen ? (
                  <X className={cn('w-5 h-5', theme.text.primary)} />
                ) : (
                  <Menu className={cn('w-5 h-5', theme.text.primary)} />
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              'md:hidden fixed top-16 left-0 right-0 z-40 border-b backdrop-blur-md',
              theme.background.primary,
              theme.border.primary,
              'bg-white/95 dark:bg-gray-900/95'
            )}
          >
            <div className="px-4 py-4 space-y-4">
              {/* Mobile Search */}
              <div className={cn(
                'relative',
                theme.background.secondary,
                'rounded-2xl'
              )}>
                <Search className={cn(
                  'absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5',
                  theme.text.secondary
                )} />
                <input
                  type="text"
                  placeholder="البحث عن طبق شهي ...."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={cn(
                    'w-full pl-10 pr-4 py-3 rounded-2xl border-0',
                    theme.background.secondary,
                    theme.text.primary,
                    'placeholder-gray-400 dark:placeholder-gray-500'
                  )}
                />
              </div>

              {/* Mobile Navigation */}
              <nav className="space-y-2">
                <a href="#" className={cn(
                  'block py-3 px-4 rounded-xl font-medium transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  theme.text.primary
                )}>
                  الرئيسية
                </a>
                <a href="#" className={cn(
                  'block py-3 px-4 rounded-xl font-medium transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  theme.text.secondary
                )}>
                القائمة
                </a>
                <a href="#" className={cn(
                  'block py-3 px-4 rounded-xl font-medium transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  theme.text.secondary
                )}>
                  عروض الطعام
                </a>
                <a href="#" className={cn(
                  'block py-3 px-4 rounded-xl font-medium transition-colors',
                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                  theme.text.secondary
                )}>
                  معلومات عنا
                </a>
              </nav>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
