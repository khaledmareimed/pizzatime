'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, Heart, User, LogOut, Settings } from 'lucide-react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { cn } from '../../funcs/utils';
import { theme, responsive, animations } from '../../funcs/responsive';
import { useFavorites } from '../../funcs/contexts/FavoritesContext';
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
  const { favoritesCount: contextFavoritesCount } = useFavorites();
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const router = useRouter();
  const { data: session, status } = useSession();

  const handleCartClick = () => {
    router.push('/user/checkout');
    onCartClick?.();
  };

  const handleFavoritesClick = () => {
    router.push('/user/favorites');
    onFavoritesClick?.();
  };

  const handleProfileClick = () => {
    if (session) {
      router.push('/user/profile');
    } else {
      signIn('google');
    }
    setIsProfileMenuOpen(false);
  };

  const handleSignOut = () => {
    signOut();
    setIsProfileMenuOpen(false);
  };

  const toggleProfileMenu = () => {
    setIsProfileMenuOpen(!isProfileMenuOpen);
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
                {contextFavoritesCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -left-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
                  >
                    {contextFavoritesCount > 99 ? '99+' : contextFavoritesCount}
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

              {/* User Profile / Login */}
              <div className="relative">
                {status === 'loading' ? (
                  <div className={cn(
                    'p-2 rounded-xl',
                    theme.colors.secondary.light,
                    theme.colors.secondary.dark
                  )}>
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-orange-500 rounded-full animate-spin" />
                  </div>
                ) : session ? (
                  <>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={toggleProfileMenu}
                      className={cn(
                        'relative p-1 rounded-xl transition-colors',
                        theme.colors.secondary.light,
                        theme.colors.secondary.dark
                      )}
                    >
                      {session.user?.image ? (
                        <img
                          src={session.user.image}
                          alt={session.user.name || 'المستخدم'}
                          className="w-8 h-8 rounded-lg object-cover"
                        />
                      ) : (
                        <div className={cn(
                          'w-8 h-8 rounded-lg flex items-center justify-center',
                          'bg-orange-500 text-white'
                        )}>
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </motion.button>

                    {/* Profile Dropdown */}
                    <AnimatePresence>
                      {isProfileMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95, y: -10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.95, y: -10 }}
                          className={cn(
                            'absolute left-0 mt-2 w-48 rounded-2xl shadow-lg border z-50',
                            theme.background.card,
                            theme.border.primary
                          )}
                        >
                          <div className="p-3 border-b border-gray-100 dark:border-gray-700">
                            <p className={cn('font-medium text-sm', theme.text.primary)}>
                              {session.user?.name || 'المستخدم'}
                            </p>
                            <p className={cn('text-xs', theme.text.secondary)}>
                              {session.user?.email}
                            </p>
                          </div>
                          
                          <div className="p-2">
                            {session.user?.role === 'admin' && (
                              <button
                                onClick={() => {
                                  router.push('/dash');
                                  setIsProfileMenuOpen(false);
                                }}
                                className={cn(
                                  'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                                  'hover:bg-gray-100 dark:hover:bg-gray-800',
                                  theme.text.primary
                                )}
                              >
                                <Settings className="w-4 h-4" />
                                لوحة التحكم
                              </button>
                            )}
                            
                            <button
                              onClick={handleProfileClick}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                                'hover:bg-gray-100 dark:hover:bg-gray-800',
                                theme.text.primary
                              )}
                            >
                              <User className="w-4 h-4" />
                              الملف الشخصي
                            </button>
                            
                            <button
                              onClick={handleSignOut}
                              className={cn(
                                'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm transition-colors',
                                'hover:bg-gray-100 dark:hover:bg-gray-800 text-red-600 dark:text-red-400'
                              )}
                            >
                              <LogOut className="w-4 h-4" />
                              تسجيل الخروج
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                ) : (
                  <Button
                    onClick={() => signIn('google')}
                    variant="accent"
                    size="sm"
                    className="text-xs md:text-sm"
                  >
                    تسجيل الدخول
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.header>
    </>
  );
}
