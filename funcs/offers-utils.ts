/**
 * Offers Management Utilities
 * 
 * Handles the creation and management of the special "Offers" category
 * and provides functions to retrieve offer products for display.
 */

import { initializeAppCollections } from './initializeApp'
import { useCollection } from './collections'
import { Category } from './collections/category'
import { Product } from './collections/product'

export const OFFERS_CATEGORY_NAME = 'عروض خاصة'

/**
 * Ensures the "Offers" category exists in the database
 * This function should be called during app initialization
 */
export async function ensureOffersCategory(): Promise<string> {
  try {
    await initializeAppCollections()
    const categoryCollection = useCollection<Category>('categories')
    
    if (!categoryCollection) {
      throw new Error('Categories collection not available')
    }

    // Check if offers category already exists
    let offersCategory = await categoryCollection.model.findOne({ 
      name: OFFERS_CATEGORY_NAME 
    })

    if (!offersCategory) {
      // Create the offers category
      offersCategory = new categoryCollection.model({
        name: OFFERS_CATEGORY_NAME,
        description: 'عروض خاصة ووجبات مميزة بأسعار مخفضة',
        products: [],
        displayOrder: 0, // Set to 0 instead of -1 to comply with validation
        imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591.jpg', // Add .jpg extension
        color: '#f97316' // Orange color for offers
      })
      
      await offersCategory.save()
      console.log('✅ Offers category created successfully')
    }

    return offersCategory._id.toString()
  } catch (error) {
    console.error('❌ Failed to ensure offers category:', error)
    throw error
  }
}

/**
 * Get all products from the offers category
 * Returns products with their pricing information for display
 */
export async function getOfferProducts(): Promise<Product[]> {
  try {
    await initializeAppCollections()
    const productCollection = useCollection<Product>('products')
    
    if (!productCollection) {
      throw new Error('Products collection not available')
    }

    // Ensure offers category exists first
    const offersCategoryId = await ensureOffersCategory()

    // Get all products from the offers category that are visible and available
    const offerProducts = await productCollection.model.find({
      categoryId: offersCategoryId,
      visible: true,
      available: true
    }).sort({ createdAt: -1 }) // Show newest offers first

    return offerProducts
  } catch (error) {
    console.error('❌ Failed to get offer products:', error)
    return []
  }
}

/**
 * Add a product to the offers category
 * This can be used when creating/editing products in the admin panel
 */
export async function addProductToOffers(productId: string): Promise<void> {
  try {
    await initializeAppCollections()
    const categoryCollection = useCollection<Category>('categories')
    const productCollection = useCollection<Product>('products')
    
    if (!categoryCollection || !productCollection) {
      throw new Error('Collections not available')
    }

    const offersCategoryId = await ensureOffersCategory()

    // Update the product's category to offers
    await productCollection.model.findByIdAndUpdate(
      productId,
      { categoryId: offersCategoryId }
    )

    // Add product to offers category's products array
    await categoryCollection.model.findByIdAndUpdate(
      offersCategoryId,
      { $addToSet: { products: productId } }
    )

    console.log(`✅ Product ${productId} added to offers category`)
  } catch (error) {
    console.error('❌ Failed to add product to offers:', error)
    throw error
  }
}

/**
 * Remove a product from the offers category
 */
export async function removeProductFromOffers(productId: string): Promise<void> {
  try {
    await initializeAppCollections()
    const categoryCollection = useCollection<Category>('categories')
    
    if (!categoryCollection) {
      throw new Error('Categories collection not available')
    }

    const offersCategory = await categoryCollection.model.findOne({
      name: OFFERS_CATEGORY_NAME
    })

    if (offersCategory) {
      // Remove product from offers category's products array
      await categoryCollection.model.findByIdAndUpdate(
        offersCategory._id,
        { $pull: { products: productId } }
      )
    }

    console.log(`✅ Product ${productId} removed from offers category`)
  } catch (error) {
    console.error('❌ Failed to remove product from offers:', error)
    throw error
  }
}

/**
 * Convert a Product to OfferItem format for the Offers component
 */
export function productToOfferItem(product: Product): {
  id: string
  title: string
  description: string
  price: string
  image: string
  validUntil: string
  code?: string
} {
  return {
    id: product._id.toString(),
    title: product.productName,
    description: product.description || 'عرض خاص لفترة محدودة',
    price: product.productDiscountPrice 
      ? product.productDiscountPrice.toFixed(2)
      : product.productPrice.toFixed(2),
    image: product.imagesUrl[0] || 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&crop=center',
    validUntil: '2025-12-31', // Default validity
    code: `OFFER${product._id.toString().slice(-6).toUpperCase()}`
  }
}