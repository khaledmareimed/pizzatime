'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import { CartProvider, useCartContext } from '../../funcs/contexts/CartContext';
import { useToastContext } from '../../funcs/contexts/ToastContext';
import { SessionProvider } from '../../components/Auth/SessionProvider';

function AppLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { getTotalItems } = useCartContext();
  const [favoritesCount, setFavoritesCount] = useState(5);
  const [activeNavItem, setActiveNavItem] = useState('home');

  const handleCartClick = () => {
    // Navigate to checkout page
    router.push('/user/checkout');
  };

  const handleFavoritesClick = () => {
    router.push('/user/favorites');
  };

  const handleSearchFocus = () => {
    // This will be called when search is focused from navigation
    console.log('Search focused from navigation');
  };

  const handleNavigationClick = (item: any) => {
    setActiveNavItem(item.id);
    // Handle navigation
    router.push(item.href);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <Header
        cartCount={getTotalItems()}
        favoritesCount={favoritesCount}
        onCartClick={handleCartClick}
        onFavoritesClick={handleFavoritesClick}
        onSearchFocus={handleSearchFocus}
      />

      {/* Main Content */}
      <div className="lg:mr-24"> {/* Offset for desktop navigation - RTL */}
        {children}
      </div>

      {/* Navigation */}
      <Navigation
        activeItem={activeNavItem}
        onItemClick={handleNavigationClick}
        cartCount={getTotalItems()}
        onSearchClick={handleSearchFocus}
      />
    </div>
  );
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <CartProvider>
        <AppLayoutContent>
          {children}
        </AppLayoutContent>
      </CartProvider>
    </SessionProvider>
  );
}
