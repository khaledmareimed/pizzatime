/**
 * Cart Context Provider
 * 
 * Provides global cart state management throughout the application.
 * Wraps the useCart hook to make cart functionality available to all components.
 */

'use client'

import React, { createContext, useContext } from 'react'
import { useCart } from '../hooks/useCart'
import { CartItem, CartSummary, CartAddon, CartOption } from '../types/cart'
import { Product } from '../collections/product'

interface CartContextType {
  // Cart state
  items: CartItem[]
  summary: CartSummary
  isLoading: boolean
  
  // Cart actions
  addItem: (product: Product, quantity?: number, addons?: CartAddon[], options?: CartOption[], comments?: string) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  updateItemAddons: (productId: string, addons: CartAddon[]) => void
  updateItemOptions: (productId: string, options: CartOption[]) => void
  updateItemComments: (productId: string, comments: string) => void
  clearCart: () => void
  
  // Cart utilities
  getItem: (productId: string) => CartItem | undefined
  hasItem: (productId: string) => boolean
  getItemQuantity: (productId: string) => number
  getTotalPrice: () => number
  getTotalItems: () => number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

interface CartProviderProps {
  children: React.ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const cart = useCart()

  return (
    <CartContext.Provider value={cart}>
      {children}
    </CartContext.Provider>
  )
}

export function useCartContext(): CartContextType {
  const context = useContext(CartContext)
  
  if (context === undefined) {
    throw new Error('useCartContext must be used within a CartProvider')
  }
  
  return context
}

// Export the context for testing purposes
export { CartContext }
