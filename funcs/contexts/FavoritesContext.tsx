'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { Product } from '../collections/product';

interface FavoritesContextType {
  favorites: Product[];
  favoritesCount: number;
  isLoading: boolean;
  isFavorite: (productId: string) => boolean;
  addToFavorites: (productId: string) => Promise<boolean>;
  removeFromFavorites: (productId: string) => Promise<boolean>;
  toggleFavorite: (productId: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

interface FavoritesProviderProps {
  children: ReactNode;
}

export function FavoritesProvider({ children }: FavoritesProviderProps) {
  const { data: session } = useSession();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch favorites when user is authenticated
  useEffect(() => {
    if (session?.user?.email) {
      refreshFavorites();
    } else {
      setFavorites([]);
    }
  }, [session]);

  const refreshFavorites = async () => {
    if (!session?.user?.email) {
      setFavorites([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/users/favorites');
      if (response.ok) {
        const data = await response.json();
        setFavorites(data.data || []);
      } else {
        console.error('Failed to fetch favorites');
        setFavorites([]);
      }
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavorites([]);
    } finally {
      setIsLoading(false);
    }
  };

  const isFavorite = (productId: string): boolean => {
    return favorites.some(fav => fav._id === productId);
  };

  const addToFavorites = async (productId: string): Promise<boolean> => {
    if (!session?.user?.email) {
      alert('يجب تسجيل الدخول لإضافة المنتجات للمفضلة');
      return false;
    }

    try {
      const response = await fetch('/api/users/favorites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId }),
      });

      if (response.ok) {
        await refreshFavorites(); // Refresh to get updated list
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to add to favorites:', errorData.error);
        
        // Show user-friendly error messages
        if (response.status === 400 && errorData.error === 'Product already in favorites') {
          alert('هذا المنتج موجود بالفعل في المفضلة');
        } else if (response.status === 404) {
          alert('المنتج غير موجود');
        } else {
          alert('حدث خطأ في إضافة المنتج للمفضلة');
        }
        return false;
      }
    } catch (error) {
      console.error('Error adding to favorites:', error);
      alert('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى');
      return false;
    }
  };

  const removeFromFavorites = async (productId: string): Promise<boolean> => {
    if (!session?.user?.email) {
      return false;
    }

    try {
      const response = await fetch(`/api/users/favorites?productId=${productId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await refreshFavorites(); // Refresh to get updated list
        return true;
      } else {
        const errorData = await response.json();
        console.error('Failed to remove from favorites:', errorData.error);
        
        // Show user-friendly error messages
        if (response.status === 400 && errorData.error === 'Product not in favorites') {
          alert('هذا المنتج غير موجود في المفضلة');
        } else {
          alert('حدث خطأ في إزالة المنتج من المفضلة');
        }
        return false;
      }
    } catch (error) {
      console.error('Error removing from favorites:', error);
      alert('حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى');
      return false;
    }
  };

  const toggleFavorite = async (productId: string): Promise<boolean> => {
    if (isFavorite(productId)) {
      return await removeFromFavorites(productId);
    } else {
      return await addToFavorites(productId);
    }
  };

  const value: FavoritesContextType = {
    favorites,
    favoritesCount: favorites.length,
    isLoading,
    isFavorite,
    addToFavorites,
    removeFromFavorites,
    toggleFavorite,
    refreshFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites(): FavoritesContextType {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}