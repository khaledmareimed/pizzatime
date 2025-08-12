/**
 * Financial utilities for creating and managing financial transactions
 * from order data and other business operations
 */

import { createCollection, Financial, FinancialSchema, FinancialIndexes, FinancialHelpers, Order } from './collections'

export interface CreateFinancialTransactionParams {
  orderId?: string
  userId?: string
  type: Financial['type']
  category: Financial['category']
  amount: number
  description: string
  paymentMethod?: Financial['paymentMethod']
  notes?: string
  metadata?: any
}

/**
 * Create a financial transaction record
 */
export async function createFinancialTransaction(params: CreateFinancialTransactionParams): Promise<Financial | null> {
  try {
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    const transaction = new financialCollection.model({
      transactionId: FinancialHelpers.generateTransactionId(),
      orderId: params.orderId,
      userId: params.userId,
      type: params.type,
      category: params.category,
      amount: params.amount,
      description: params.description,
      paymentMethod: params.paymentMethod,
      notes: params.notes,
      metadata: params.metadata || {},
      transactionDate: new Date(),
      isVerified: true,
      verifiedAt: new Date()
    })

    const savedTransaction = await transaction.save()
    return savedTransaction.toObject() as Financial
  } catch (error) {
    console.error('Error creating financial transaction:', error)
    return null
  }
}

/**
 * Create financial records from order data
 */
export async function createOrderFinancialRecords(order: Order): Promise<void> {
  try {
    // Main revenue transaction
    await createFinancialTransaction({
      orderId: order.orderId,
      userId: order.userId,
      type: 'revenue',
      category: 'food_sales',
      amount: order.orderSummary.subtotal + order.orderSummary.addonsTotal + order.orderSummary.optionsTotal,
      description: `إيرادات من الطلب #${order.orderId.slice(-6)}`,
      paymentMethod: order.paymentMethod,
      metadata: {
        itemsCount: order.items.length,
        orderDate: order.orderDate
      }
    })

    // Delivery fee if applicable
    if (order.orderSummary.deliveryFee > 0) {
      await createFinancialTransaction({
        orderId: order.orderId,
        userId: order.userId,
        type: 'delivery_fee',
        category: 'delivery',
        amount: order.orderSummary.deliveryFee,
        description: `رسوم توصيل للطلب #${order.orderId.slice(-6)}`,
        paymentMethod: order.paymentMethod
      })
    }

    // Coupon discount if applicable
    if (order.orderSummary.couponDiscount > 0) {
      await createFinancialTransaction({
        orderId: order.orderId,
        userId: order.userId,
        type: 'discount',
        category: 'discounts',
        amount: order.orderSummary.couponDiscount,
        description: `خصم كوبون ${order.coupon?.code || ''} للطلب #${order.orderId.slice(-6)}`,
        metadata: {
          couponCode: order.coupon?.code,
          couponName: order.coupon?.name
        }
      })
    }

  } catch (error) {
    console.error('Error creating order financial records:', error)
  }
}

/**
 * Create refund transaction
 */
export async function createRefundTransaction(
  orderId: string, 
  userId: string, 
  amount: number, 
  reason: string
): Promise<Financial | null> {
  return createFinancialTransaction({
    orderId,
    userId,
    type: 'refund',
    category: 'refunds',
    amount,
    description: `استرداد للطلب #${orderId.slice(-6)} - ${reason}`,
    notes: reason
  })
}

/**
 * Create expense transaction
 */
export async function createExpenseTransaction(
  category: Financial['category'],
  amount: number,
  description: string,
  notes?: string
): Promise<Financial | null> {
  return createFinancialTransaction({
    type: 'expense',
    category,
    amount,
    description,
    notes
  })
}

/**
 * Get financial summary for a date range
 */
export async function getFinancialSummary(startDate: Date, endDate: Date) {
  try {
    const financialCollection = await createCollection<Financial>('financial', FinancialSchema, {
      indexes: FinancialIndexes
    })

    const transactions = await financialCollection.model
      .find({
        transactionDate: {
          $gte: startDate,
          $lte: endDate
        }
      })
      .lean()

    return {
      revenue: FinancialHelpers.calculateNetRevenue(transactions),
      expenses: FinancialHelpers.calculateTotalExpenses(transactions),
      profit: FinancialHelpers.calculateProfit(transactions),
      taxes: FinancialHelpers.calculateTaxes(transactions),
      refunds: FinancialHelpers.calculateRefunds(transactions),
      discounts: FinancialHelpers.calculateDiscounts(transactions),
      transactionCount: transactions.length
    }
  } catch (error) {
    console.error('Error getting financial summary:', error)
    return null
  }
}