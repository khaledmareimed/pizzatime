import { createCollection } from './collections'
import { 
  UserSchema, 
  User, 
  UserIndexes,
  CategorySchema,
  Category,
  CategoryIndexes,
  ProductSchema,
  Product,
  ProductIndexes,
  OrderSchema,
  Order,
  OrderIndexes
} from './collections'

/**
 * Initialize all collections for the application
 * Call this once during application startup or when needed
 */
export async function initializeAppCollections() {
  try {
    console.log('Initializing application collections...')
    
    // Register User collection with indexes
    await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Register Category collection with indexes
    await createCollection<Category>('categories', CategorySchema, {
      indexes: CategoryIndexes
    })

    // Register Product collection with indexes
    await createCollection<Product>('products', ProductSchema, {
      indexes: ProductIndexes
    })

    // Register Order collection with indexes
    await createCollection<Order>('orders', OrderSchema, {
      indexes: OrderIndexes
    })

    console.log('All collections initialized successfully')
    return {
      success: true,
      collections: ['users', 'categories', 'products', 'orders']
    }
  } catch (error) {
    console.error('Error initializing collections:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      collections: []
    }
  }
}

