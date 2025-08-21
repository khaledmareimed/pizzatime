/**
 * Collections Index File
 * 
 * Central export point for all collection schemas and interfaces.
 * This provides a clean way to import any collection from a single location.
 */

// Re-export everything from individual collection files
export { UserSchema, UserIndexes } from './user'
export type { User } from './user'

export { CategorySchema, CategoryIndexes } from './category'
export type { Category } from './category'

export { ProductSchema, ProductIndexes } from './product'
export type { Product } from './product'

export { OrderSchema, OrderIndexes } from './order'
export type { Order, OrderItem } from './order'

export { SystemLogSchema, SystemLogIndexes } from './systemlog'
export type { SystemLog } from './systemlog'

export { FinancialSchema, FinancialIndexes, FinancialHelpers } from './financial'
export type { Financial } from './financial'

export { SettingsSchema, SettingsIndexes, getDefaultSettings } from './settings'
export type { Settings, DeliverySchedule, DeliveryArea, DeliveryLocation, Banner, RestaurantInfo, SystemSettings, DaySchedule } from './settings'

export { RawMaterialSchema, RawMaterialIndexes } from './material'
export type { RawMaterial, MaterialPurchase, MaterialUsage } from './material'

// Re-export base interfaces and manager from main collections file
export { 
  CollectionManager, 
  collectionManager,
  createCollection,
  useCollection 
} from '../collections'

export type {
  BaseDocument,
  Collection
} from '../collections'
