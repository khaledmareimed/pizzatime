import { Schema, Document, Model } from 'mongoose'
import { connectToDatabase, getModel } from './database'

/**
 * Collection Manager for Multiple MongoDB Collections
 * 
 * Provides a clean interface for working with multiple collections in the same database.
 * Includes type safety, validation, and security best practices.
 */

// Base interface for all documents
export interface BaseDocument extends Document {
  _id: string
  createdAt?: Date
  updatedAt?: Date
}

// Common schema options for security and consistency
const commonSchemaOptions = {
  timestamps: true, // Automatically add createdAt and updatedAt
  versionKey: false, // Remove __v field
  minimize: false, // Keep empty objects
  strict: true, // Only allow fields defined in schema
  strictQuery: true, // Apply strict option to queries
  toJSON: {
    transform: function(doc: any, ret: any) {
      // Remove sensitive fields from JSON output
      delete ret.__v
      return ret
    }
  }
}

/**
 * Collection interface for type-safe collection operations
 */
export interface Collection<T extends BaseDocument> {
  name: string
  model: Model<T>
  schema: Schema<T>
}

/**
 * Collection manager class for handling multiple collections
 */
export class CollectionManager {
  private collections: Map<string, Collection<any>> = new Map()
  private isConnected: boolean = false

  /**
   * Ensures database connection is established
   */
  private async ensureConnection(): Promise<void> {
    if (!this.isConnected) {
      await connectToDatabase()
      this.isConnected = true
    }
  }

  /**
   * Registers a new collection with the manager
   */
  async registerCollection<T extends BaseDocument>(
    name: string,
    schemaDefinition: any,
    options?: {
      indexes?: Array<{ fields: any; options?: any }>
      customValidators?: Array<(doc: T) => boolean | Promise<boolean>>
    }
  ): Promise<Collection<T>> {
    await this.ensureConnection()

    if (this.collections.has(name)) {
      return this.collections.get(name)! as Collection<T>
    }

    // Create schema with security options
    const schema = new Schema<T>(schemaDefinition, {
      ...commonSchemaOptions,
      collection: name
    })

    // Add custom indexes for performance and uniqueness
    if (options?.indexes) {
      options.indexes.forEach(index => {
        schema.index(index.fields, index.options)
      })
    }

    // Add custom validators for business logic
    if (options?.customValidators) {
      options.customValidators.forEach(validator => {
        schema.pre('save', async function() {
          const isValid = await validator(this as T)
          if (!isValid) {
            throw new Error(`Custom validation failed for ${name}`)
          }
        })
      })
    }

    // Add instance method for input sanitization
    schema.methods.sanitizeInput = function() {
      // Remove any potentially dangerous properties
      const dangerousProps = ['__proto__', 'constructor', 'prototype']
      dangerousProps.forEach(prop => {
        if ((this as any)[prop]) {
          delete (this as any)[prop]
        }
      })
    }

    // Add security middleware
    schema.pre('save', function() {
      // Sanitize data before saving
      ;(this as any).sanitizeInput()
    })

    const model = getModel<T>(name, schema, { strict: true })
    
    const collection: Collection<T> = {
      name,
      model,
      schema
    }

    this.collections.set(name, collection)
    return collection
  }

  /**
   * Gets an existing collection
   */
  getCollection<T extends BaseDocument>(name: string): Collection<T> | null {
    return this.collections.get(name) as Collection<T> || null
  }

  /**
   * Lists all registered collections
   */
  listCollections(): string[] {
    return Array.from(this.collections.keys())
  }

  /**
   * Removes a collection from the manager
   */
  unregisterCollection(name: string): boolean {
    return this.collections.delete(name)
  }
}

// Singleton instance for global use
export const collectionManager = new CollectionManager()

/**
 * Convenience function to register a collection
 */
export async function createCollection<T extends BaseDocument>(
  name: string,
  schemaDefinition: any,
  options?: {
    indexes?: Array<{ fields: any; options?: any }>
    customValidators?: Array<(doc: T) => boolean | Promise<boolean>>
  }
): Promise<Collection<T>> {
  return collectionManager.registerCollection<T>(name, schemaDefinition, options)
}

/**
 * Convenience function to get a collection
 */
export function useCollection<T extends BaseDocument>(name: string): Collection<T> | null {
  return collectionManager.getCollection<T>(name)
}

// Import collection schemas and interfaces from separate files
export { UserSchema, UserIndexes } from './collections/user'
export type { User } from './collections/user'

export { CategorySchema, CategoryIndexes } from './collections/category'
export type { Category } from './collections/category'

export { ProductSchema, ProductIndexes } from './collections/product'
export type { Product } from './collections/product'

export { OrderSchema, OrderIndexes } from './collections/order'
export type { Order } from './collections/order'

export { SystemLogSchema, SystemLogIndexes } from './collections/systemlog'
export type { SystemLog } from './collections/systemlog'

export { FinancialSchema, FinancialIndexes, FinancialHelpers } from './collections/financial'
export type { Financial } from './collections/financial'

export { CouponSchema, CouponIndexes } from './collections/coupon'
export type { Coupon, OrderValidationData } from './collections/coupon'
