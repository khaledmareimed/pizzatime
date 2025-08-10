/**
 * React hooks for fetching public data from secure API endpoints
 * 
 * These hooks provide a clean interface for components to fetch
 * products and categories from the database in a secure way.
 */

import { useState, useEffect, useCallback } from 'react'
import { Product } from '../collections/product'
import { Category } from '../collections/category'

interface ApiResponse<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => void
}

interface ProductsResponse {
  products: Product[]
  count: number
  filters?: {
    categoryId: string | null
    search: string | null
  }
  error?: string
}

interface CategoriesResponse {
  categories: Category[]
  count: number
  error?: string
}

interface CategoryProductsResponse {
  category: {
    id: string
    name: string
    description?: string
    displayOrder: number
    imageUrl?: string
    color?: string
  }
  products: Product[]
  count: number
  error?: string
}

/**
 * Hook to fetch all public categories
 */
export function usePublicCategories(): ApiResponse<Category[]> {
  const [data, setData] = useState<Category[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/public/categories')
      const result: CategoriesResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch categories')
      }
      
      setData(result.categories)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  return { data, loading, error, refetch: fetchCategories }
}

/**
 * Hook to fetch public products with optional filtering
 */
export function usePublicProducts(categoryId?: string, searchTerm?: string): ApiResponse<Product[]> {
  const [data, setData] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (categoryId) params.append('categoryId', categoryId)
      if (searchTerm) params.append('search', searchTerm)
      
      const url = `/api/public/products${params.toString() ? '?' + params.toString() : ''}`
      const response = await fetch(url)
      const result: ProductsResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch products')
      }
      
      setData(result.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [categoryId, searchTerm])

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return { data, loading, error, refetch: fetchProducts }
}

/**
 * Hook to fetch a single public product by ID
 */
export function usePublicProduct(productId: string): ApiResponse<Product> {
  const [data, setData] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = useCallback(async () => {
    if (!productId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/public/products/${productId}`)
      const result = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch product')
      }
      
      setData(result.product)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchProduct()
  }, [fetchProduct])

  return { data, loading, error, refetch: fetchProduct }
}

/**
 * Hook to fetch products by category with category details
 */
export function usePublicCategoryProducts(categoryId: string): ApiResponse<CategoryProductsResponse> {
  const [data, setData] = useState<CategoryProductsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCategoryProducts = useCallback(async () => {
    if (!categoryId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/public/categories/${categoryId}/products`)
      const result: CategoryProductsResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch category products')
      }
      
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [categoryId])

  useEffect(() => {
    fetchCategoryProducts()
  }, [fetchCategoryProducts])

  return { data, loading, error, refetch: fetchCategoryProducts }
}

/**
 * Hook for searching products with debouncing
 */
export function usePublicProductSearch(searchTerm: string, debounceMs: number = 300): ApiResponse<Product[]> {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm)
  const [data, setData] = useState<Product[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [searchTerm, debounceMs])

  const searchProducts = useCallback(async () => {
    if (!debouncedSearchTerm || debouncedSearchTerm.trim().length < 2) {
      setData([])
      setLoading(false)
      setError(null)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams({ search: debouncedSearchTerm.trim() })
      const response = await fetch(`/api/public/products?${params.toString()}`)
      const result: ProductsResponse = await response.json()
      
      if (!response.ok) {
        throw new Error(result.error || 'Failed to search products')
      }
      
      setData(result.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setData(null)
    } finally {
      setLoading(false)
    }
  }, [debouncedSearchTerm])

  useEffect(() => {
    searchProducts()
  }, [searchProducts])

  const refetch = useCallback(() => {
    if (debouncedSearchTerm) {
      searchProducts()
    }
  }, [searchProducts, debouncedSearchTerm])

  return { data, loading, error, refetch }
}
