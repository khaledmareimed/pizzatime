import { connectToDatabase } from './database'
import { initializeAppCollections } from './initializeApp'

/**
 * Application Startup Initialization
 * 
 * Connects to database and initializes collections when the app starts.
 * This ensures the database is ready before any requests are processed.
 */

let isInitialized = false
let initializationPromise: Promise<void> | null = null

export async function initializeApplication(): Promise<void> {
  // Prevent multiple initializations
  if (isInitialized) {
    return
  }

  // Return existing promise if initialization is in progress
  if (initializationPromise) {
    return initializationPromise
  }

  initializationPromise = async function() {
    try {
      console.log('🚀 Starting application initialization...')
      
      // Connect to database first
      console.log('📊 Connecting to MongoDB...')
      await connectToDatabase()
      console.log('✅ Database connected successfully')
      
      // Initialize all collections
      console.log('📋 Initializing collections...')
      await initializeAppCollections()
      console.log('✅ Collections initialized successfully')
      
      isInitialized = true
      console.log('🎉 Application initialization completed')
      
    } catch (error) {
      console.error('❌ Application initialization failed:', error)
      initializationPromise = null // Allow retry
      throw error
    }
  }()

  return initializationPromise
}

/**
 * Check if the application has been initialized
 */
export function isApplicationInitialized(): boolean {
  return isInitialized
}

/**
 * Reset initialization state (useful for testing)
 */
export function resetInitialization(): void {
  isInitialized = false
  initializationPromise = null
}

