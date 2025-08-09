// Utility functions for className management
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Food data utilities
export interface FoodItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  rating: number;
  prepTime: string;
  isPopular?: boolean;
  isSpicy?: boolean;
  isVegetarian?: boolean;
}

export interface OfferItem {
  id: string;
  title: string;
  description: string;
  discount: string;
  image: string;
  validUntil: string;
  code?: string;
}

// Format price utility
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

// Generate star rating
export const generateStars = (rating: number): string => {
  return '★'.repeat(Math.floor(rating)) + '☆'.repeat(5 - Math.floor(rating));
};

// Security utilities
export const sanitizeInput = (input: string): string => {
  return input.replace(/[<>'"]/g, '');
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};
