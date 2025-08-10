/**
 * Public Data Access Functions
 * 
 * Provides secure, read-only access to products and categories for non-admin users.
 * All functions implement proper filtering to show only visible/available content.
 */

import { initializeAppCollections } from './initializeApp'
import { useCollection } from './collections'
import { Product } from './collections/product'
import { Category } from './collections/category'

/**
 * Safely retrieves all visible categories with their visible products
 * Only returns categories that have at least one visible, available product
 */
export async function getPublicCategories(): Promise<Category[]> {
  try {
    await initializeAppCollections()
    const categoryCollection = useCollection<Category>('categories')
    
    if (!categoryCollection) {
      throw new Error('Categories collection not available')
    }

    // Get all categories, sorted by display order
    const categories = await categoryCollection.model
      .find({})
      .sort({ displayOrder: 1, name: 1 })
      .lean()

    // Filter categories to only include those with visible products
    const categoriesWithProducts = []
    
    for (const category of categories) {
      const hasVisibleProducts = await hasVisibleProductsInCategory(category._id.toString())
      if (hasVisibleProducts) {
        categoriesWithProducts.push(category)
      }
    }

    return categoriesWithProducts
  } catch (error) {
    console.error('Failed to fetch public categories:', error)
    throw new Error('Failed to retrieve categories')
  }
}

/**
 * Safely retrieves all visible and available products
 * Optionally filters by category ID
 */
export async function getPublicProducts(categoryId?: string): Promise<Product[]> {
  try {
    await initializeAppCollections()
    const productCollection = useCollection<Product>('products')
    
    if (!productCollection) {
      throw new Error('Products collection not available')
    }

    // Build secure query - only visible products (show both available and unavailable)
    const query: any = {
      visible: true
    }

    // Add category filter if provided
    if (categoryId) {
      // Validate categoryId format to prevent injection
      if (!/^[a-fA-F0-9]{24}$/.test(categoryId)) {
        throw new Error('Invalid category ID format')
      }
      query.categoryId = categoryId
    }

    const products = await productCollection.model
      .find(query)
      .sort({ productName: 1 })
      .lean()

    // Additional security: sanitize image URLs
    const sanitizedProducts = products.map(product => ({
      ...product,
      imagesUrl: product.imagesUrl.filter(url => 
        typeof url === 'string' && 
        /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)
      )
    }))

    return sanitizedProducts
  } catch (error) {
    console.error('Failed to fetch public products:', error)
    throw new Error('Failed to retrieve products')
  }
}

/**
 * Safely retrieves a single product by ID for non-admin users
 * Only returns visible and available products
 */
export async function getPublicProduct(productId: string): Promise<Product | null> {
  try {
    // Validate productId format to prevent injection
    if (!/^[a-fA-F0-9]{24}$/.test(productId)) {
      throw new Error('Invalid product ID format')
    }

    await initializeAppCollections()
    const productCollection = useCollection<Product>('products')
    
    if (!productCollection) {
      throw new Error('Products collection not available')
    }

    const product = await productCollection.model
      .findOne({
        _id: productId,
        visible: true
      })
      .lean()

    if (!product) {
      return null
    }

    // Sanitize image URLs
    const sanitizedProduct = {
      ...product,
      imagesUrl: product.imagesUrl.filter(url => 
        typeof url === 'string' && 
        /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)
      )
    }

    return sanitizedProduct
  } catch (error) {
    console.error('Failed to fetch public product:', error)
    throw new Error('Failed to retrieve product')
  }
}

/**
 * Gets products by category with additional security checks
 */
export async function getPublicProductsByCategory(categoryId: string): Promise<Product[]> {
  try {
    // Validate categoryId format
    if (!/^[a-fA-F0-9]{24}$/.test(categoryId)) {
      throw new Error('Invalid category ID format')
    }

    // Verify category exists and is accessible
    const category = await getPublicCategory(categoryId)
    if (!category) {
      return []
    }

    return await getPublicProducts(categoryId)
  } catch (error) {
    console.error('Failed to fetch products by category:', error)
    return []
  }
}

/**
 * Safely retrieves a single category by ID for non-admin users
 */
export async function getPublicCategory(categoryId: string): Promise<Category | null> {
  try {
    // Validate categoryId format to prevent injection
    if (!/^[a-fA-F0-9]{24}$/.test(categoryId)) {
      throw new Error('Invalid category ID format')
    }

    await initializeAppCollections()
    const categoryCollection = useCollection<Category>('categories')
    
    if (!categoryCollection) {
      throw new Error('Categories collection not available')
    }

    const category = await categoryCollection.model
      .findById(categoryId)
      .lean()

    if (!category) {
      return null
    }

    // Only return category if it has visible products
    const hasProducts = await hasVisibleProductsInCategory(categoryId)
    return hasProducts ? category : null
  } catch (error) {
    console.error('Failed to fetch public category:', error)
    return null
  }
}

/**
 * Helper function to check if a category has visible products
 */
async function hasVisibleProductsInCategory(categoryId: string): Promise<boolean> {
  try {
    const productCollection = useCollection<Product>('products')
    
    if (!productCollection) {
      return false
    }

    const count = await productCollection.model.countDocuments({
      categoryId,
      visible: true
    })

    return count > 0
  } catch (error) {
    console.error('Failed to check category products:', error)
    return false
  }
}

/**
 * Search products by name or description (for public users)
 */
export async function searchPublicProducts(searchTerm: string): Promise<Product[]> {
  try {
    if (!searchTerm || searchTerm.trim().length < 2) {
      return []
    }

    // Sanitize search term to prevent injection
    const sanitizedTerm = searchTerm.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    
    await initializeAppCollections()
    const productCollection = useCollection<Product>('products')
    
    if (!productCollection) {
      throw new Error('Products collection not available')
    }

    const products = await productCollection.model
      .find({
        visible: true,
        $or: [
          { productName: { $regex: sanitizedTerm, $options: 'i' } },
          { description: { $regex: sanitizedTerm, $options: 'i' } }
        ]
      })
      .sort({ productName: 1 })
      .limit(50) // Limit results for performance
      .lean()

    // Sanitize image URLs
    const sanitizedProducts = products.map(product => ({
      ...product,
      imagesUrl: product.imagesUrl.filter(url => 
        typeof url === 'string' && 
        /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(url)
      )
    }))

    return sanitizedProducts
  } catch (error) {
    console.error('Failed to search public products:', error)
    return []
  }
}
