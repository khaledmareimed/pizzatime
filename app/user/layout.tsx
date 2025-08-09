'use client';

import { useState, useRef } from 'react';
import Header from '../../components/Header';
import Navigation from '../../components/Navigation';
import type { FoodItem } from '../../funcs/utils';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cartItems, setCartItems] = useState<FoodItem[]>([]);
  const [favoritesCount, setFavoritesCount] = useState(5);
  const [activeNavItem, setActiveNavItem] = useState('home');
  const [headerRef, setHeaderRef] = useState<any>(null);

  const handleCartClick = () => {
    // Navigate to cart
    console.log('Navigate to cart');
  };

  const handleFavoritesClick = () => {
    console.log('Navigate to favorites');
  };

  const handleSearchFocus = () => {
    // This will be called when search is focused from navigation
    console.log('Search focused from navigation');
  };

  const handleNavigationClick = (item: any) => {
    setActiveNavItem(item.id);
    // Handle navigation
    console.log(`Navigate to: ${item.href}`);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900" dir="rtl">
      {/* Header */}
      <Header
        cartCount={cartItems.length}
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
        cartCount={cartItems.length}
        onSearchClick={handleSearchFocus}
      />
    </div>
  );
}
