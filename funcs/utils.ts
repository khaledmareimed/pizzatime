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

// Format price utility - Updated to use Jordanian Dinar
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ar-JO', {
    style: 'currency',
    currency: 'JOD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  }).format(price);
};

// Simple price format for display (د.أ = Jordanian Dinar symbol)
export const formatSimplePrice = (price: number): string => {
  return `${price.toFixed(2)} د.أ`;
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
