import mongoose, { Connection, Model, Schema } from 'mongoose'

/**
 * MongoDB Database Connection Manager
 * 
 * Provides a secure, reusable connection to MongoDB with support for multiple collections.
 * Implements connection pooling, error handling, and security best practices.
 */

interface DatabaseConfig {
  uri: string
  dbName: string
  options?: mongoose.ConnectOptions
}

interface ConnectionManager {
  connection: Connection | null
  promise: Promise<Connection> | null
}

// Global connection manager to prevent multiple connections in serverless environments
const connectionManager: ConnectionManager = {
  connection: null,
  promise: null
}

/**
 * Validates and sanitizes the MongoDB URI
 * Prevents injection attacks and ensures proper format
 */
function validateMongoURI(uri: string): boolean {
  if (!uri || typeof uri !== 'string') {
    return false
  }

  // Check for basic MongoDB URI format
  const mongoURIPattern = /^mongodb(\+srv)?:\/\/.+/
  if (!mongoURIPattern.test(uri)) {
    return false
  }

  // Prevent injection by checking for dangerous patterns
  const dangerousPatterns = [
    /javascript:/i,
    /data:/i,
    /vbscript:/i,
    /<script/i,
    /eval\(/i,
    /expression\(/i
  ]

  return !dangerousPatterns.some(pattern => pattern.test(uri))
}

/**
 * Gets database configuration from environment variables
 * Validates all required variables are present and secure
 */
function getDatabaseConfig(): DatabaseConfig {
  const uri = process.env.MONGODB_URI
  const dbName = process.env.MONGODB_DB_NAME || 'pizzatime'

  if (!uri) {
    throw new Error('MONGODB_URI environment variable is required')
  }

  if (!validateMongoURI(uri)) {
    throw new Error('Invalid MongoDB URI format or potentially unsafe URI detected')
  }

  // Security-focused connection options
  const options: mongoose.ConnectOptions = {
    // Connection pool settings for production efficiency
    maxPoolSize: 10, // Maintain up to 10 socket connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close connections after 45 seconds of inactivity
    family: 4, // Use IPv4, skip trying IPv6
    
    // Security settings
    retryWrites: true, // Automatically retry certain write operations
    w: 'majority', // Acknowledge writes when they reach majority of replica set members
    
    // Buffer settings
    bufferCommands: false, // Disable mongoose buffering
  }

  return {
    uri,
    dbName,
    options
  }
}

/**
 * Establishes a secure connection to MongoDB
 * Implements singleton pattern for connection reuse in serverless environments
 */
export async function connectToDatabase(): Promise<Connection> {
  try {
    // Check if mongoose global connection is already active (connected)
    if (mongoose.connection.readyState === 1) {
      connectionManager.connection = mongoose.connection
      connectionManager.promise = null
      return mongoose.connection
    }

    // If connection is in progress (connecting), wait for existing promise
    if (mongoose.connection.readyState === 2 && connectionManager.promise) {
      return connectionManager.promise
    }

    // Return existing promise if one exists and we're not disconnected
    if (connectionManager.promise && mongoose.connection.readyState !== 0) {
      return connectionManager.promise
    }

    // Create new connection
    const config = getDatabaseConfig()
    
    connectionManager.promise = new Promise(async (resolve, reject) => {
      try {
        // Set up connection event handlers only once
        if (!connectionManager.connection) {
          mongoose.connection.once('connected', () => {
            console.log('MongoDB connected successfully')
          })

          mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error.message)
            // Clear the connection manager on error
            connectionManager.connection = null
            connectionManager.promise = null
          })

          mongoose.connection.once('disconnected', () => {
            console.log('MongoDB disconnected')
            connectionManager.connection = null
            connectionManager.promise = null
          })
        }

        // Connect to MongoDB
        await mongoose.connect(config.uri, config.options)
        
        connectionManager.connection = mongoose.connection
        connectionManager.promise = null
        resolve(mongoose.connection)
      } catch (error) {
        connectionManager.connection = null
        connectionManager.promise = null
        reject(error)
      }
    })

    return connectionManager.promise
  } catch (error) {
    connectionManager.connection = null
    connectionManager.promise = null
    throw new Error(`Database connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Gracefully closes the database connection
 * Use this in cleanup or shutdown procedures
 */
export async function disconnectFromDatabase(): Promise<void> {
  try {
    if (connectionManager.connection) {
      await mongoose.disconnect()
      connectionManager.connection = null
      connectionManager.promise = null
      console.log('Database connection closed')
    }
  } catch (error) {
    console.error('Error closing database connection:', error)
    throw error
  }
}

/**
 * Gets or creates a Mongoose model for a collection
 * Provides type-safe access to collections with reusable schemas
 */
export function getModel<T>(
  collectionName: string, 
  schema: Schema<T>, 
  options?: { strict?: boolean }
): Model<T> {
  try {
    // Return existing model if already compiled
    if (mongoose.models[collectionName]) {
      return mongoose.models[collectionName] as Model<T>
    }

    // Set schema options for security
    if (options?.strict !== undefined) {
      schema.set('strict', options.strict)
    }
    
    // Set collection name
    schema.set('collection', collectionName)

    return mongoose.model<T>(collectionName, schema)
  } catch (error) {
    throw new Error(`Failed to create model for ${collectionName}: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Checks if the database connection is healthy
 * Useful for health checks and monitoring
 */
export async function isDatabaseConnected(): Promise<boolean> {
  try {
    return mongoose.connection.readyState === 1
  } catch {
    return false
  }
}

/**
 * Gets database connection status information
 * Useful for debugging and monitoring
 */
export function getConnectionStatus(): {
  isConnected: boolean
  readyState: number | null
  host: string | null
  name: string | null
} {
  const connection = connectionManager.connection
  
  return {
    isConnected: connection?.readyState === 1,
    readyState: connection?.readyState ?? null,
    host: connection?.host ?? null,
    name: connection?.name ?? null
  }
}

// Export types for use in other modules
export type { DatabaseConfig, ConnectionManager }
