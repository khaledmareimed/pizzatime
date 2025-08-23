/**
 * Enterprise Inventory Management System
 * 
 * Built from scratch with accounting principles and enterprise-grade precision.
 * Implements proper debit/credit inventory tracking with full audit trails.
 * 
 * Core Principles:
 * - DEDUCT CASES: Reduce inventory when materials are consumed
 * - RESTORE CASES: Increase inventory when materials are returned
 * - Proper state transitions with accurate material tracking
 * - Complete audit trail for compliance and accountability
 * - Fail-safe error handling and validation
 */

import { createCollection } from './collections'
import { Order, OrderItem, OrderSchema } from './collections/order'
import { Product, MaterialUsed, ProductSchema } from './collections/product'
import { RawMaterial, MaterialUsage, RawMaterialSchema } from './collections/material'

import { 
  OrderStatus,
  MATERIAL_USAGE_STATUSES,
  NON_USAGE_STATUSES,
  ORDER_STATUS_TRANSLATIONS,
  shouldProcessMaterialUsage as shouldProcessMaterialUsageHelper,
  shouldReverseMaterialUsage as shouldReverseMaterialUsageHelper,
  getOrderStatusTranslation
} from './types/order-status'

// Re-export the helper function for external use
export const shouldProcessMaterialUsage = shouldProcessMaterialUsageHelper

/**
 * Calculate material usage for an order (alias for calculateMaterialRequirements)
 * This function provides the same functionality as calculateMaterialRequirements
 * but with a name that matches the expected API usage
 */
export async function calculateOrderMaterialUsage(order: Order): Promise<MaterialRequirement[]> {
  return await calculateMaterialRequirements(order)
}

/**
 * Process material usage for an order (force apply materials)
 * This function forces the application of material usage regardless of order status
 */
export async function processOrderMaterialUsage(
  order: Order,
  userId: string,
  reason: string
): Promise<InventoryTransaction> {
  console.log(`🔄 PROCESSING MATERIAL USAGE FOR ORDER: ${order.orderId}`)
  
  const requirements = await calculateMaterialRequirements(order)
  
  return await executeInventoryTransaction(
    order.orderId,
    requirements,
    InventoryTransactionType.DEDUCT,
    userId,
    reason
  )
}

/**
 * Reverse material usage for an order (force restore materials)
 * This function forces the restoration of material usage regardless of order status
 */
export async function reverseOrderMaterialUsage(
  order: Order,
  userId: string,
  reason: string
): Promise<InventoryTransaction> {
  console.log(`🔄 REVERSING MATERIAL USAGE FOR ORDER: ${order.orderId}`)
  
  const requirements = await calculateMaterialRequirements(order)
  
  return await executeInventoryTransaction(
    order.orderId,
    requirements,
    InventoryTransactionType.RESTORE,
    userId,
    reason
  )
}

/**
 * Enterprise Inventory Transaction Types
 */
enum InventoryTransactionType {
  DEDUCT = 'DEDUCT',    // Reduce inventory (materials consumed)
  RESTORE = 'RESTORE'   // Increase inventory (materials returned)
}

/**
 * Order Status Categories for Inventory Management
 */
enum InventoryStatusCategory {
  DEDUCT_CASE = 'DEDUCT_CASE',     // Statuses that require material deduction
  RESTORE_CASE = 'RESTORE_CASE'    // Statuses that require material restoration
}

/**
 * Material Requirement Calculation
 */
interface MaterialRequirement {
  materialId: string
  materialName: string
  requiredQuantity: number
  unit: string
  source: {
    baseProduct: number
    addons: Record<string, number>
    options: Record<string, number>
  }
}

/**
 * Inventory Transaction Record
 */
interface InventoryTransaction {
  transactionId: string
  orderId: string
  type: InventoryTransactionType
  timestamp: Date
  userId: string
  reason: string
  materials: {
    materialId: string
    materialName: string
    quantity: number
    unit: string
    stockBefore: number
    stockAfter: number
  }[]
  success: boolean
  errors: string[]
  warnings: string[]
}

/**
 * CORE FUNCTION 1: Calculate Material Requirements for an Order
 * 
 * Calculates exactly what materials are needed for an order.
 * This is pure calculation - no inventory changes are made here.
 */
export async function calculateMaterialRequirements(order: Order): Promise<MaterialRequirement[]> {
  console.log(`📊 CALCULATING MATERIAL REQUIREMENTS FOR ORDER: ${order.orderId}`)
  
  const requirements = new Map<string, MaterialRequirement>()
  
  try {
    const productsCollection = await createCollection<Product>('products', ProductSchema)
    
    for (const item of order.items) {
      console.log(`📦 Processing item: ${item.productId} (qty: ${item.quantity})`)
      
      // Input validation
      if (!item.quantity || item.quantity <= 0) {
        throw new Error(`Invalid item quantity: ${item.quantity}`)
      }
      
      const product = await productsCollection.model.findOne({ _id: item.productId }) as Product
      if (!product) {
        console.warn(`⚠️ Product not found: ${item.productId}`)
        continue
      }
      
      // Process base product materials
      if (product.materialsUsed && product.materialsUsed.length > 0) {
        for (const material of product.materialsUsed) {
          const quantity = material.quantity * item.quantity
          addMaterialRequirement(requirements, material, quantity, 'baseProduct')
        }
      }
      
      // Process addon materials
      if (item.addons?.length > 0) {
        for (const addon of item.addons) {
          const productAddon = product.addonsAndToppings?.find(a => a.toppingName === addon.name)
          if (productAddon?.materialsUsed) {
            for (const material of productAddon.materialsUsed) {
              const quantity = material.quantity * item.quantity
              addMaterialRequirement(requirements, material, quantity, 'addons', addon.name)
            }
          }
        }
      }
      
      // Process option materials
      if (item.options?.length > 0) {
        for (const option of item.options) {
          const productOption = product.productOptions?.find(o => o.optionTitle === option.optionTitle)
          const choice = productOption?.choices?.find(c => c.choiceName === option.choiceName)
          if (choice?.materialsUsed) {
            for (const material of choice.materialsUsed) {
              const quantity = material.quantity * item.quantity
              addMaterialRequirement(requirements, material, quantity, 'options', option.choiceName)
            }
          }
        }
      }
    }
    
    const result = Array.from(requirements.values())
    console.log(`✅ Calculated ${result.length} material requirements`)
    return result
    
  } catch (error) {
    console.error(`❌ Error calculating material requirements:`, error)
    throw error
  }
}

/**
 * Helper function to accumulate material requirements
 */
function addMaterialRequirement(
  requirements: Map<string, MaterialRequirement>,
  material: MaterialUsed,
  quantity: number,
  sourceType: 'baseProduct' | 'addons' | 'options',
  sourceName?: string
) {
  const key = material.materialId
  
  if (!requirements.has(key)) {
    requirements.set(key, {
      materialId: material.materialId,
      materialName: material.materialName,
      requiredQuantity: 0,
      unit: material.unit,
      source: {
        baseProduct: 0,
        addons: {},
        options: {}
      }
    })
  }
  
  const requirement = requirements.get(key)!
  requirement.requiredQuantity += quantity
  
  if (sourceType === 'baseProduct') {
    requirement.source.baseProduct += quantity
  } else if (sourceType === 'addons' && sourceName) {
    requirement.source.addons[sourceName] = (requirement.source.addons[sourceName] || 0) + quantity
  } else if (sourceType === 'options' && sourceName) {
    requirement.source.options[sourceName] = (requirement.source.options[sourceName] || 0) + quantity
  }
}

/**
 * CORE FUNCTION 2: Determine Order Status Category
 * 
 * Classifies order status as either DEDUCT_CASE or RESTORE_CASE
 */
function getStatusCategory(status: string): InventoryStatusCategory {
  // DEDUCT_CASE: Statuses where materials are consumed (inventory reduced)
  const deductStatuses = ['ready', 'out-for-delivery', 'delivered']
  
  // RESTORE_CASE: Statuses where materials are not consumed (inventory restored/maintained)
  const restoreStatuses = ['pending', 'confirmed', 'preparing', 'cancelled']
  
  if (deductStatuses.includes(status)) {
    return InventoryStatusCategory.DEDUCT_CASE
  } else if (restoreStatuses.includes(status)) {
    return InventoryStatusCategory.RESTORE_CASE
  } else {
    throw new Error(`Unknown order status: ${status}`)
  }
}

/**
 * CORE FUNCTION 3: Execute Inventory Transaction
 * 
 * Performs the actual inventory changes (DEDUCT or RESTORE)
 */
async function executeInventoryTransaction(
  orderId: string,
  requirements: MaterialRequirement[],
  transactionType: InventoryTransactionType,
  userId: string,
  reason: string
): Promise<InventoryTransaction> {
  
  const transaction: InventoryTransaction = {
    transactionId: generateTransactionId(orderId, transactionType),
    orderId,
    type: transactionType,
    timestamp: new Date(),
    userId,
    reason,
    materials: [],
    success: false,
    errors: [],
    warnings: []
  }
  
  console.log(`🔄 EXECUTING ${transactionType} TRANSACTION: ${transaction.transactionId}`)
  console.log(`📦 Order: ${orderId} | User: ${userId}`)
  console.log(`📝 Reason: ${reason}`)
  
  if (requirements.length === 0) {
    console.log(`ℹ️ No materials to process`)
    transaction.success = true
    transaction.warnings.push('No materials defined for this order')
    return transaction
  }
  
  try {
    const materialsCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema)
    
    for (const requirement of requirements) {
      console.log(`📋 Processing: ${requirement.materialName} (${requirement.requiredQuantity} ${requirement.unit})`)
      
      const material = await materialsCollection.model.findOne({ _id: requirement.materialId }) as RawMaterial
      
      if (!material) {
        const error = `Material not found: ${requirement.materialName}`
        console.error(`❌ ${error}`)
        transaction.errors.push(error)
        continue
      }
      
      const stockBefore = material.currentStock
      let stockAfter: number
      let usageQuantity: number
      
      if (transactionType === InventoryTransactionType.DEDUCT) {
        // DEDUCT: Reduce inventory (positive usage quantity)
        usageQuantity = requirement.requiredQuantity
        stockAfter = stockBefore - requirement.requiredQuantity
        
        // Check for insufficient stock (warning, not error)
        if (stockBefore < requirement.requiredQuantity) {
          const warning = `Insufficient stock for ${requirement.materialName}. Required: ${requirement.requiredQuantity}, Available: ${stockBefore}`
          console.warn(`⚠️ ${warning}`)
          transaction.warnings.push(warning)
        }
        
      } else {
        // RESTORE: Increase inventory (negative usage quantity for audit trail)
        usageQuantity = -requirement.requiredQuantity
        stockAfter = stockBefore + requirement.requiredQuantity
      }
      
      // Create usage record for audit trail
      const usageRecord: Omit<MaterialUsage, '_id' | 'createdAt'> = {
        quantity: usageQuantity,
        usageDate: new Date(),
        purpose: transactionType === InventoryTransactionType.DEDUCT ? 'Production' : 'Adjustment',
        notes: `${reason} - Order: ${orderId} (${transactionType})`,
        usedBy: userId
      }
      
      // Execute the inventory change
      await (material as any).addUsage(usageRecord)
      
      console.log(`✅ ${requirement.materialName}: ${stockBefore} → ${material.currentStock} ${requirement.unit}`)
      
      // Record the material transaction
      transaction.materials.push({
        materialId: requirement.materialId,
        materialName: requirement.materialName,
        quantity: requirement.requiredQuantity,
        unit: requirement.unit,
        stockBefore,
        stockAfter: material.currentStock
      })
    }
    
    transaction.success = transaction.errors.length === 0
    
    console.log(`📊 TRANSACTION SUMMARY:`)
    console.log(`   ID: ${transaction.transactionId}`)
    console.log(`   Type: ${transactionType}`)
    console.log(`   Success: ${transaction.success}`)
    console.log(`   Materials: ${transaction.materials.length}`)
    console.log(`   Errors: ${transaction.errors.length}`)
    console.log(`   Warnings: ${transaction.warnings.length}`)
    
    return transaction
    
  } catch (error) {
    console.error(`❌ Transaction execution failed:`, error)
    transaction.errors.push(`System error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return transaction
  }
}

/**
 * CORE FUNCTION 4: Main Inventory Management Handler
 * 
 * Handles order status changes and executes appropriate inventory transactions
 */
export async function handleOrderStatusChange(
  order: Order,
  oldStatus: string,
  newStatus: string,
  userId: string
): Promise<InventoryTransaction | null> {
  
  console.log(`🔄 ORDER STATUS CHANGE: ${order.orderId}`)
  console.log(`   ${oldStatus} → ${newStatus}`)
  
  try {
    // Determine status categories
    const oldCategory = getStatusCategory(oldStatus)
    const newCategory = getStatusCategory(newStatus)
    
    console.log(`📊 Status Categories: ${oldCategory} → ${newCategory}`)
    
    // No inventory change needed if both statuses are in the same category
    if (oldCategory === newCategory) {
      console.log(`ℹ️ No inventory change needed - same category`)
      return null
    }
    
    // Calculate material requirements for this order
    const requirements = await calculateMaterialRequirements(order)
    
    if (requirements.length === 0) {
      console.log(`ℹ️ No materials defined for this order`)
      return null
    }
    
    // Determine transaction type and execute
    let transactionType: InventoryTransactionType
    let reason: string
    
    if (oldCategory === InventoryStatusCategory.RESTORE_CASE && newCategory === InventoryStatusCategory.DEDUCT_CASE) {
      // Moving from restore case to deduct case = DEDUCT materials
      transactionType = InventoryTransactionType.DEDUCT
      reason = `Order status changed to ${newStatus} - materials consumed`
      
    } else if (oldCategory === InventoryStatusCategory.DEDUCT_CASE && newCategory === InventoryStatusCategory.RESTORE_CASE) {
      // Moving from deduct case to restore case = RESTORE materials
      transactionType = InventoryTransactionType.RESTORE
      reason = `Order status changed to ${newStatus} - materials restored`
      
    } else {
      console.log(`⚠️ Unexpected status transition: ${oldCategory} → ${newCategory}`)
      return null
    }
    
    console.log(`🎯 Executing ${transactionType} transaction`)
    
    // Execute the inventory transaction
    const transaction = await executeInventoryTransaction(
      order.orderId,
      requirements,
      transactionType,
      userId,
      reason
    )
    
    return transaction
    
  } catch (error) {
    console.error(`❌ Error handling order status change:`, error)
    throw error
  }
}

/**
 * Utility function to generate unique transaction IDs
 */
function generateTransactionId(orderId: string, type: InventoryTransactionType): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  return `${type}_${orderId}_${timestamp}_${random}`.toUpperCase()
}

/**
 * ADDITIONAL UTILITY FUNCTIONS
 */

/**
 * Handle order edit and adjust inventory accordingly
 */
export async function handleOrderEdit(
  originalOrder: Order,
  updatedOrder: Order,
  userId: string
): Promise<InventoryTransaction[]> {
  console.log(`📝 HANDLING ORDER EDIT: ${originalOrder.orderId}`)
  
  const transactions: InventoryTransaction[] = []
  
  try {
    const currentCategory = getStatusCategory(originalOrder.status)
    
    // Only process if order is currently in a DEDUCT_CASE (materials are consumed)
    if (currentCategory !== InventoryStatusCategory.DEDUCT_CASE) {
      console.log(`ℹ️ Order not in deduct case - no inventory adjustment needed`)
      return transactions
    }
    
    // Calculate original and new requirements
    const originalRequirements = await calculateMaterialRequirements(originalOrder)
    const newRequirements = await calculateMaterialRequirements(updatedOrder)
    
    if (originalRequirements.length === 0 && newRequirements.length === 0) {
      console.log(`ℹ️ No materials in original or updated order`)
      return transactions
    }
    
    // First, restore the original materials
    if (originalRequirements.length > 0) {
      const restoreTransaction = await executeInventoryTransaction(
        originalOrder.orderId,
        originalRequirements,
        InventoryTransactionType.RESTORE,
        userId,
        'Order edit - restoring original materials'
      )
      transactions.push(restoreTransaction)
    }
    
    // Then, deduct the new materials
    if (newRequirements.length > 0) {
      const deductTransaction = await executeInventoryTransaction(
        updatedOrder.orderId,
        newRequirements,
        InventoryTransactionType.DEDUCT,
        userId,
        'Order edit - applying new materials'
      )
      transactions.push(deductTransaction)
    }
    
    return transactions
    
  } catch (error) {
    console.error(`❌ Error handling order edit:`, error)
    throw error
  }
}

/**
 * Get material transaction history for an order
 */
export async function getOrderMaterialHistory(orderId: string): Promise<{
  requirements: MaterialRequirement[]
  transactions: any[]
}> {
  try {
    const ordersCollection = await createCollection<Order>('orders', OrderSchema)
    const order = await ordersCollection.model.findOne({ orderId }) as Order
    
    if (!order) {
      throw new Error('Order not found')
    }
    
    const requirements = await calculateMaterialRequirements(order)
    
    // Get transaction history from materials
    const materialsCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema)
    const transactions = []
    
    for (const requirement of requirements) {
      const material = await materialsCollection.model.findOne({ _id: requirement.materialId }) as RawMaterial
      if (material) {
        const orderTransactions = material.usages.filter(usage => 
          usage.notes?.includes(orderId)
        )
        transactions.push(...orderTransactions)
      }
    }
    
    return {
      requirements,
      transactions: transactions.sort((a, b) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    }
    
  } catch (error) {
    console.error('Error getting order material history:', error)
    throw error
  }
}

/**
 * Get status information
 */
export function getStatusInfo() {
  const deductStatuses = ['ready', 'out-for-delivery', 'delivered']
  const restoreStatuses = ['pending', 'confirmed', 'preparing', 'cancelled']
  
  return {
    deductCases: deductStatuses.map(status => ({
      value: status,
      label: ORDER_STATUS_TRANSLATIONS[status as OrderStatus],
      description: 'Materials are consumed (inventory reduced)'
    })),
    restoreCases: restoreStatuses.map(status => ({
      value: status,
      label: ORDER_STATUS_TRANSLATIONS[status as OrderStatus],
      description: 'Materials are not consumed (inventory maintained)'
    })),
    allStatuses: [...deductStatuses, ...restoreStatuses].map(status => ({
      value: status,
      label: ORDER_STATUS_TRANSLATIONS[status as OrderStatus],
      category: deductStatuses.includes(status) ? 'DEDUCT_CASE' : 'RESTORE_CASE'
    }))
  }
}

// Export the main functions
export default {
  calculateMaterialRequirements,
  handleOrderStatusChange,
  handleOrderEdit,
  getOrderMaterialHistory,
  getStatusInfo
}