/**
 * Material Usage Controller - Enterprise-Grade Inventory Management
 * 
 * This module provides the main interface for handling material usage based on order status changes.
 * Built following enterprise patterns with MongoDB transactions and comprehensive error handling.
 * 
 * @author Senior Principal Engineer
 * @version 2.0.0
 */

import { startSession } from 'mongoose'
import { createCollection, Order, OrderSchema } from './collections'
import { handleOrderStatusChange } from './material-order-management'
import { 
  OrderStatus, 
  NON_USAGE_STATUSES, 
  MATERIAL_USAGE_STATUSES,
  isValidOrderStatus,
  getOrderStatusTranslation 
} from './types/order-status'

/**
 * Material Usage Transaction Result
 */
export interface MaterialUsageResult {
  success: boolean
  transactionId?: string
  materialsProcessed: number
  action: 'DEDUCT' | 'RESTORE' | 'NO_CHANGE'
  message: string
  errors: string[]
  warnings: string[]
  details?: {
    oldStatus: string
    newStatus: string
    oldStatusTranslation: string
    newStatusTranslation: string
    orderId: string
  }
}

/**
 * CORE FUNCTION: Update Material Usage on Order Status Change
 * 
 * This is the main function that handles material inventory adjustments when order status changes.
 * It implements the business logic for the two status arrays:
 * 
 * Array 1 (restore group): CANCELLED, PENDING, CONFIRMED, PREPARING
 * Array 2 (deduct group): READY, ON_THE_WAY, DELIVERED
 * 
 * Rules:
 * 1. Array 1 → Array 2: DEDUCT materials from inventory
 * 2. Array 2 → Array 1: RESTORE materials to inventory  
 * 3. Same array transitions: NO CHANGE
 * 
 * @param orderId - The unique order identifier
 * @param oldStatus - Previous order status
 * @param newStatus - New order status
 * @param userId - User making the change (for audit trail)
 * @returns Promise<MaterialUsageResult> - Transaction result with full details
 */
export async function updateMaterialUsageOnStatusChange(
  orderId: string,
  oldStatus: string,
  newStatus: string,
  userId: string = 'system'
): Promise<MaterialUsageResult> {
  
  console.log(`🔄 MATERIAL USAGE CONTROLLER: Processing status change for order ${orderId}`)
  console.log(`   Status transition: ${oldStatus} → ${newStatus}`)
  console.log(`   User: ${userId}`)
  
  // Input validation
  if (!orderId || !oldStatus || !newStatus) {
    const error = 'Missing required parameters: orderId, oldStatus, newStatus'
    console.error(`❌ ${error}`)
    return {
      success: false,
      materialsProcessed: 0,
      action: 'NO_CHANGE',
      message: error,
      errors: [error],
      warnings: []
    }
  }

  // Validate status values
  if (!isValidOrderStatus(oldStatus)) {
    const error = `Invalid old status: ${oldStatus}`
    console.error(`❌ ${error}`)
    return {
      success: false,
      materialsProcessed: 0,
      action: 'NO_CHANGE',
      message: error,
      errors: [error],
      warnings: []
    }
  }

  if (!isValidOrderStatus(newStatus)) {
    const error = `Invalid new status: ${newStatus}`
    console.error(`❌ ${error}`)
    return {
      success: false,
      materialsProcessed: 0,
      action: 'NO_CHANGE',
      message: error,
      errors: [error],
      warnings: []
    }
  }

  // No change needed if statuses are the same
  if (oldStatus === newStatus) {
    console.log(`ℹ️ No status change detected - skipping material usage update`)
    return {
      success: true,
      materialsProcessed: 0,
      action: 'NO_CHANGE',
      message: 'No status change detected',
      errors: [],
      warnings: []
    }
  }

  try {
    // Determine status categories using the defined arrays
    const oldIsRestoreGroup = NON_USAGE_STATUSES.includes(oldStatus as OrderStatus)
    const newIsRestoreGroup = NON_USAGE_STATUSES.includes(newStatus as OrderStatus)
    const oldIsDeductGroup = MATERIAL_USAGE_STATUSES.includes(oldStatus as OrderStatus)
    const newIsDeductGroup = MATERIAL_USAGE_STATUSES.includes(newStatus as OrderStatus)

    console.log(`📊 Status Analysis:`)
    console.log(`   Old Status: ${oldStatus} (${getOrderStatusTranslation(oldStatus as OrderStatus)})`)
    console.log(`   New Status: ${newStatus} (${getOrderStatusTranslation(newStatus as OrderStatus)})`)
    console.log(`   Old Group: ${oldIsRestoreGroup ? 'RESTORE' : oldIsDeductGroup ? 'DEDUCT' : 'UNKNOWN'}`)
    console.log(`   New Group: ${newIsRestoreGroup ? 'RESTORE' : newIsDeductGroup ? 'DEDUCT' : 'UNKNOWN'}`)

    // Determine action based on business rules
    let action: 'DEDUCT' | 'RESTORE' | 'NO_CHANGE' = 'NO_CHANGE'
    let actionDescription = ''

    if (oldIsRestoreGroup && newIsDeductGroup) {
      // Rule 1: Array 1 → Array 2 = DEDUCT materials
      action = 'DEDUCT'
      actionDescription = 'Moving from restore group to deduct group - materials will be consumed'
    } else if (oldIsDeductGroup && newIsRestoreGroup) {
      // Rule 2: Array 2 → Array 1 = RESTORE materials
      action = 'RESTORE'
      actionDescription = 'Moving from deduct group to restore group - materials will be restored'
    } else if ((oldIsRestoreGroup && newIsRestoreGroup) || (oldIsDeductGroup && newIsDeductGroup)) {
      // Rule 3: Same array = NO CHANGE
      action = 'NO_CHANGE'
      actionDescription = 'Status change within same group - no material adjustment needed'
    } else {
      // This shouldn't happen with valid statuses, but handle gracefully
      console.warn(`⚠️ Unexpected status transition pattern`)
      action = 'NO_CHANGE'
      actionDescription = 'Unexpected status transition - no material adjustment applied'
    }

    console.log(`🎯 Action Determined: ${action}`)
    console.log(`📝 Description: ${actionDescription}`)

    // If no material change is needed, return early
    if (action === 'NO_CHANGE') {
      return {
        success: true,
        materialsProcessed: 0,
        action,
        message: actionDescription,
        errors: [],
        warnings: [],
        details: {
          oldStatus,
          newStatus,
          oldStatusTranslation: getOrderStatusTranslation(oldStatus as OrderStatus),
          newStatusTranslation: getOrderStatusTranslation(newStatus as OrderStatus),
          orderId
        }
      }
    }

    // Fetch the order from database
    const orderCollection = await createCollection<Order>('orders', OrderSchema)
    const order = await orderCollection.model.findOne({ orderId }).lean() as Order

    if (!order) {
      const error = `Order not found: ${orderId}`
      console.error(`❌ ${error}`)
      return {
        success: false,
        materialsProcessed: 0,
        action: 'NO_CHANGE',
        message: error,
        errors: [error],
        warnings: []
      }
    }

    // Execute material usage transaction using MongoDB session for atomicity
    const session = await startSession()
    let result: MaterialUsageResult

    try {
      await session.withTransaction(async () => {
        console.log(`🔄 Executing material usage transaction with MongoDB session`)
        
        // Call the existing material management function
        const transaction = await handleOrderStatusChange(
          order,
          oldStatus,
          newStatus,
          userId
        )

        if (transaction) {
          console.log(`✅ Material transaction completed:`, {
            transactionId: transaction.transactionId,
            type: transaction.type,
            success: transaction.success,
            materialsCount: transaction.materials.length,
            errors: transaction.errors.length,
            warnings: transaction.warnings.length
          })

          result = {
            success: transaction.success,
            transactionId: transaction.transactionId,
            materialsProcessed: transaction.materials.length,
            action: transaction.type === 'DEDUCT' ? 'DEDUCT' : 'RESTORE',
            message: transaction.success 
              ? `Material ${action.toLowerCase()} completed successfully`
              : `Material ${action.toLowerCase()} completed with errors`,
            errors: transaction.errors,
            warnings: transaction.warnings,
            details: {
              oldStatus,
              newStatus,
              oldStatusTranslation: getOrderStatusTranslation(oldStatus as OrderStatus),
              newStatusTranslation: getOrderStatusTranslation(newStatus as OrderStatus),
              orderId
            }
          }
        } else {
          // No transaction was needed (e.g., no materials defined for order)
          result = {
            success: true,
            materialsProcessed: 0,
            action,
            message: 'No materials defined for this order - no inventory adjustment needed',
            errors: [],
            warnings: ['Order has no materials defined'],
            details: {
              oldStatus,
              newStatus,
              oldStatusTranslation: getOrderStatusTranslation(oldStatus as OrderStatus),
              newStatusTranslation: getOrderStatusTranslation(newStatus as OrderStatus),
              orderId
            }
          }
        }
      })
    } catch (transactionError) {
      console.error(`❌ MongoDB transaction failed:`, transactionError)
      result = {
        success: false,
        materialsProcessed: 0,
        action: 'NO_CHANGE',
        message: `Transaction failed: ${transactionError instanceof Error ? transactionError.message : 'Unknown error'}`,
        errors: [transactionError instanceof Error ? transactionError.message : 'Unknown transaction error'],
        warnings: []
      }
    } finally {
      await session.endSession()
    }

    console.log(`📊 MATERIAL USAGE CONTROLLER RESULT:`)
    console.log(`   Success: ${result.success}`)
    console.log(`   Action: ${result.action}`)
    console.log(`   Materials Processed: ${result.materialsProcessed}`)
    console.log(`   Errors: ${result.errors.length}`)
    console.log(`   Warnings: ${result.warnings.length}`)

    return result

  } catch (error) {
    console.error(`❌ Material usage controller error:`, error)
    return {
      success: false,
      materialsProcessed: 0,
      action: 'NO_CHANGE',
      message: `System error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      errors: [error instanceof Error ? error.message : 'Unknown system error'],
      warnings: []
    }
  }
}

/**
 * Utility function to get status group information
 */
export function getStatusGroupInfo() {
  return {
    restoreGroup: {
      name: 'Array 1 (Restore Group)',
      description: 'Statuses where materials are not consumed (restored to inventory)',
      statuses: NON_USAGE_STATUSES.map(status => ({
        value: status,
        label: getOrderStatusTranslation(status),
        description: 'Materials restored to inventory'
      }))
    },
    deductGroup: {
      name: 'Array 2 (Deduct Group)', 
      description: 'Statuses where materials are consumed (deducted from inventory)',
      statuses: MATERIAL_USAGE_STATUSES.map(status => ({
        value: status,
        label: getOrderStatusTranslation(status),
        description: 'Materials deducted from inventory'
      }))
    },
    transitions: {
      deduct: 'Array 1 → Array 2: DEDUCT materials from inventory',
      restore: 'Array 2 → Array 1: RESTORE materials to inventory',
      noChange: 'Same array transitions: NO CHANGE to inventory'
    }
  }
}

/**
 * Validate if a status transition requires material usage update
 */
export function shouldUpdateMaterialUsage(oldStatus: string, newStatus: string): boolean {
  if (!isValidOrderStatus(oldStatus) || !isValidOrderStatus(newStatus)) {
    return false
  }

  if (oldStatus === newStatus) {
    return false
  }

  const oldIsRestoreGroup = NON_USAGE_STATUSES.includes(oldStatus as OrderStatus)
  const newIsRestoreGroup = NON_USAGE_STATUSES.includes(newStatus as OrderStatus)
  const oldIsDeductGroup = MATERIAL_USAGE_STATUSES.includes(oldStatus as OrderStatus)
  const newIsDeductGroup = MATERIAL_USAGE_STATUSES.includes(newStatus as OrderStatus)

  // Only update if transitioning between different groups
  return (oldIsRestoreGroup && newIsDeductGroup) || (oldIsDeductGroup && newIsRestoreGroup)
}

// Export the main function and utilities
export default {
  updateMaterialUsageOnStatusChange,
  getStatusGroupInfo,
  shouldUpdateMaterialUsage
}