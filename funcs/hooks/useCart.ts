/**
 * useCart Hook
 * 
 * Provides cart management functionality with localStorage persistence.
 * Handles adding, removing, updating cart items and managing cart state.
 */

import { useState, useEffect, useCallback } from 'react'
import { 
  CartItem, 
  CartState, 
  CartSummary, 
  CartAddon,
  CartOption,
  calculateCartSummary,
  createCartItemFromProduct 
} from '../types/cart'
import { Product } from '../collections/product'

const CART_STORAGE_KEY = 'pizzatime_cart'

interface UseCartReturn {
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

export function useCart(): UseCartReturn {
  const [cartState, setCartState] = useState<CartState>({
    items: [],
    summary: { totalItems: 0, totalQuantity: 0, subtotal: 0, addonsTotal: 0, optionsTotal: 0, total: 0 },
    lastUpdated: new Date().toISOString()
  })
  const [isLoading, setIsLoading] = useState(true)

  // Load cart from localStorage on mount
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(CART_STORAGE_KEY)
        console.log('📱 Loading cart from localStorage:', savedCart)
        
        if (savedCart) {
          const parsedCart: CartState = JSON.parse(savedCart)
          console.log('📦 Parsed cart data:', parsedCart)
          
          // Recalculate summary to ensure accuracy
          const summary = calculateCartSummary(parsedCart.items)
          const updatedCart = {
            ...parsedCart,
            summary
          }
          
          console.log('✅ Setting cart state:', updatedCart)
          setCartState(updatedCart)
        } else {
          console.log('📭 No cart data found in localStorage')
        }
      } catch (error) {
        console.error('❌ Failed to load cart from localStorage:', error)
        // If there's an error, start with empty cart
        localStorage.removeItem(CART_STORAGE_KEY)
      } finally {
        setIsLoading(false)
      }
    }

    // Add a small delay to ensure localStorage is available
    const timer = setTimeout(loadCart, 100)
    return () => clearTimeout(timer)
  }, [])

  // Save cart to localStorage whenever cart state changes
  const saveCartToStorage = useCallback((newState: CartState) => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newState))
    } catch (error) {
      console.error('Failed to save cart to localStorage:', error)
    }
  }, [])

  // Update cart state and save to localStorage
  const updateCartState = useCallback((items: CartItem[]) => {
    const summary = calculateCartSummary(items)
    const newState: CartState = {
      items,
      summary,
      lastUpdated: new Date().toISOString()
    }
    
    setCartState(newState)
    saveCartToStorage(newState)
  }, [saveCartToStorage])

  // Add item to cart
  const addItem = useCallback((
    product: Product, 
    quantity: number = 1, 
    addons: CartAddon[] = [], 
    options: CartOption[] = [],
    comments?: string
  ) => {
    if (!product.available) {
      console.warn('Cannot add unavailable product to cart')
      return
    }

    if (quantity <= 0) {
      console.warn('Quantity must be greater than 0')
      return
    }

    setCartState(currentState => {
      const existingItemIndex = currentState.items.findIndex(item => item.productId === product._id.toString())
      let newItems: CartItem[]

      if (existingItemIndex >= 0) {
        // Update existing item
        newItems = [...currentState.items]
        const existingItem = newItems[existingItemIndex]
        newItems[existingItemIndex] = {
          ...existingItem,
          quantity: existingItem.quantity + quantity,
          addons: [...addons], // Replace addons with new ones
          options: [...options], // Replace options with new ones
          comments: comments || existingItem.comments,
          addedAt: new Date().toISOString() // Update timestamp
        }
      } else {
        // Add new item
        const newItem = createCartItemFromProduct(product, quantity, addons, options, comments)
        newItems = [...currentState.items, newItem]
      }

      const summary = calculateCartSummary(newItems)
      const newState = {
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString()
      }

      saveCartToStorage(newState)
      return newState
    })
  }, [saveCartToStorage])

  // Remove item from cart
  const removeItem = useCallback((productId: string) => {
    setCartState(currentState => {
      const newItems = currentState.items.filter(item => item.productId !== productId)
      const summary = calculateCartSummary(newItems)
      const newState = {
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString()
      }

      saveCartToStorage(newState)
      return newState
    })
  }, [saveCartToStorage])

  // Update item quantity
  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }

    setCartState(currentState => {
      const newItems = currentState.items.map(item => 
        item.productId === productId 
          ? { ...item, quantity, addedAt: new Date().toISOString() }
          : item
      )

      const summary = calculateCartSummary(newItems)
      const newState = {
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString()
      }

      saveCartToStorage(newState)
      return newState
    })
  }, [removeItem, saveCartToStorage])

  // Update item addons
  const updateItemAddons = useCallback((productId: string, addons: CartAddon[]) => {
    setCartState(currentState => {
      const newItems = currentState.items.map(item => 
        item.productId === productId 
          ? { ...item, addons, addedAt: new Date().toISOString() }
          : item
      )

      const summary = calculateCartSummary(newItems)
      const newState = {
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString()
      }

      saveCartToStorage(newState)
      return newState
    })
  }, [saveCartToStorage])

  // Update item options
  const updateItemOptions = useCallback((productId: string, options: CartOption[]) => {
    setCartState(currentState => {
      const newItems = currentState.items.map(item => 
        item.productId === productId 
          ? { ...item, options, addedAt: new Date().toISOString() }
          : item
      )

      const summary = calculateCartSummary(newItems)
      const newState = {
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString()
      }

      saveCartToStorage(newState)
      return newState
    })
  }, [saveCartToStorage])

  // Update item comments
  const updateItemComments = useCallback((productId: string, comments: string) => {
    setCartState(currentState => {
      const newItems = currentState.items.map(item => 
        item.productId === productId 
          ? { ...item, comments, addedAt: new Date().toISOString() }
          : item
      )

      const summary = calculateCartSummary(newItems)
      const newState = {
        items: newItems,
        summary,
        lastUpdated: new Date().toISOString()
      }

      saveCartToStorage(newState)
      return newState
    })
  }, [saveCartToStorage])

  // Clear entire cart
  const clearCart = useCallback(() => {
    const newState: CartState = {
      items: [],
      summary: { totalItems: 0, totalQuantity: 0, subtotal: 0, addonsTotal: 0, optionsTotal: 0, total: 0 },
      lastUpdated: new Date().toISOString()
    }
    
    setCartState(newState)
    saveCartToStorage(newState)
  }, [saveCartToStorage])

  // Get specific item
  const getItem = useCallback((productId: string): CartItem | undefined => {
    return cartState.items.find(item => item.productId === productId)
  }, [cartState.items])

  // Check if item exists in cart
  const hasItem = useCallback((productId: string): boolean => {
    return cartState.items.some(item => item.productId === productId)
  }, [cartState.items])

  // Get item quantity
  const getItemQuantity = useCallback((productId: string): number => {
    const item = getItem(productId)
    return item ? item.quantity : 0
  }, [getItem])

  // Get total price
  const getTotalPrice = useCallback((): number => {
    return cartState.summary.total
  }, [cartState.summary.total])

  // Get total items count
  const getTotalItems = useCallback((): number => {
    return cartState.summary.totalQuantity
  }, [cartState.summary.totalQuantity])

  return {
    // State
    items: cartState.items,
    summary: cartState.summary,
    isLoading,
    
    // Actions
    addItem,
    removeItem,
    updateQuantity,
    updateItemAddons,
    updateItemOptions,
    updateItemComments,
    clearCart,
    
    // Utilities
    getItem,
    hasItem,
    getItemQuantity,
    getTotalPrice,
    getTotalItems
  }
}
