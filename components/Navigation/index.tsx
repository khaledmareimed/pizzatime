'use client';

import { useRouter, usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, Heart, Menu, User } from 'lucide-react';
import { cn } from '../../funcs/utils';
import { theme, animations } from '../../funcs/responsive';
import { useFavorites } from '../../funcs/contexts/FavoritesContext';

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  badge?: number;
}

const navigationItems: NavigationItem[] = [
  {
    id: 'home',
    label: 'الرئيسية',
    icon: Home,
    href: '/user'
  },
  {
    id: 'menu',
    label: 'القائمة',
    icon: Menu,
    href: '/user/menu'
  },
  {
    id: 'cart',
    label: 'السلة',
    icon: ShoppingCart,
    href: '/user/checkout',
    badge: 3
  },
  {
    id: 'favorites',
    label: 'المفضلة',
    icon: Heart,
    href: '/user/favorites'
  },
  {
    id: 'profile',
    label: 'الملف الشخصي',
    icon: User,
    href: '/user/profile'
  }
];

interface NavigationProps {
  activeItem?: string;
  onItemClick?: (item: NavigationItem) => void;
  cartCount?: number;
  onSearchClick?: () => void;
}

export default function Navigation({
  activeItem = 'home',
  onItemClick,
  cartCount = 0,
  onSearchClick
}: NavigationProps) {
  const { favoritesCount } = useFavorites();
  const router = useRouter();
  const pathname = usePathname();

  // Update cart and favorites badges
  const items = navigationItems.map(item => {
    if (item.id === 'cart') {
      return { ...item, badge: cartCount };
    } else if (item.id === 'favorites') {
      return { ...item, badge: favoritesCount };
    }
    return item;
  });

  const handleItemClick = (item: NavigationItem) => {
    if (item.id === 'search') {
      onSearchClick?.();
    } else if (item.id === 'cart') {
      router.push('/user/checkout');
    } else {
      router.push(item.href);
    }
    onItemClick?.(item);
  };

  // Determine active item from pathname
  const getActiveItem = () => {
    if (pathname === '/user') return 'home';
    if (pathname === '/user/menu') return 'menu';
    if (pathname === '/user/favorites') return 'favorites';
    if (pathname === '/user/checkout') return 'cart';
    if (pathname === '/user/profile') return 'profile';
    return activeItem;
  };

  return (
    <>
      {/* Desktop Navigation - Hidden on mobile */}
      <nav className="hidden lg:block fixed right-6 top-1/2 transform -translate-y-1/2 z-50">
        <motion.div
          {...animations.slideIn}
          className={cn(
            'flex flex-col space-y-4 p-4 rounded-3xl backdrop-blur-md border',
            theme.background.card,
            theme.border.primary,
            theme.shadow.card,
            'bg-white/80 dark:bg-gray-900/80'
          )}
        >
          {items.map((item) => {
            const Icon = item.icon;
            const currentActive = getActiveItem();
            const isActive = currentActive === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'relative p-3 rounded-2xl transition-all duration-200',
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : cn(
                        'hover:bg-gray-100 dark:hover:bg-gray-800',
                        theme.text.secondary
                      )
                )}
                title={item.label}
              >
                <Icon className="w-6 h-6" />
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </nav>

      {/* Mobile Bottom Navigation */}
      <motion.nav
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        className={cn(
          'lg:hidden fixed bottom-0 left-0 right-0 z-50 border-t backdrop-blur-md',
          theme.background.primary,
          theme.border.primary,
          'bg-white/95 dark:bg-gray-900/95'
        )}
      >
        <div className="flex items-center justify-around px-4 py-2 safe-area-bottom">
          {items.map((item) => {
            const Icon = item.icon;
            const currentActive = getActiveItem();
            const isActive = currentActive === item.id;
            
            return (
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleItemClick(item)}
                className={cn(
                  'relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all duration-200',
                  'min-w-[64px] min-h-[64px]',
                  isActive
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : theme.text.secondary
                )}
              >
                <Icon className="w-6 h-6 mb-1" />
                <span className={cn(
                  'text-xs font-medium',
                  isActive ? 'text-white' : theme.text.secondary
                )}>
                  {item.label}
                </span>
                
                {/* Badge */}
                {item.badge && item.badge > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </motion.span>
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.nav>

      {/* Mobile Navigation Spacer */}
      <div className="lg:hidden h-20" />
    </>
  );
}
