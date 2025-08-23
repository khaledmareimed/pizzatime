import { BaseDocument } from '../collections'

/**
 * Financial Collection Schema and Interface
 * 
 * Tracks all financial transactions, revenue, expenses, and financial metrics
 * for comprehensive business analytics and reporting.
 */

export const FinancialSchema = {
  // Transaction Details
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  orderId: {
    type: String,
    ref: 'Order'
  },
  userId: {
    type: String,
    ref: 'User'
  },
  
  // Transaction Type and Category
  type: {
    type: String,
    required: true,
    enum: [
      'revenue',           // Order revenue
      'refund',           // Order refunds
      'expense',          // Business expenses
      'discount',         // Coupon discounts given
      'delivery_fee',     // Delivery fees collected
      'tax',              // Tax collected
      'commission',       // Platform/payment commissions
      'adjustment'        // Manual adjustments
    ]
  },
  category: {
    type: String,
    required: true,
    enum: [
      // Revenue categories
      'food_sales',              // Food item sales
      'delivery',                // Delivery services
      
      // Expense categories - Operational
      'rent',                    // Rent expenses
      'utilities',               // Utilities (electricity, water, internet)
      'salaries',                // Employee salaries
      'marketing',               // Marketing and advertising
      'maintenance',             // Maintenance and repairs
      'equipment',               // Equipment and devices
      'insurance',               // Insurance
      'licenses',                // Licenses and fees
      'transportation',          // Transportation
      'packaging',               // Packaging materials
      'cleaning',                // Cleaning and sanitization
      'professional_services',   // Professional services
      'training',                // Training and development
      'software',                // Software and applications
      'bank_fees',               // Bank fees
      'office_supplies',         // Office supplies
      'security',                // Security
      'waste_management',        // Waste management
      
      // Expense categories - Business
      'materials',               // Material purchases (from inventory)
      'operations',              // General operational costs
      'supplies',                // General supplies
      'staff',                   // Staff payments (legacy)
      'taxes',                   // Tax payments
      'fees',                    // Payment processing fees
      
      // Transaction categories
      'refunds',                 // Customer refunds
      'discounts',               // Promotional discounts
      'other'                    // Other transactions
    ]
  },
  
  // Financial Amounts
  amount: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'JOD',
    enum: ['JOD', 'USD', 'EUR']
  },
  
  // Tax Information
  taxAmount: {
    type: Number,
    default: 0
  },
  taxRate: {
    type: Number,
    default: 0
  },
  
  // Payment Information
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'online', 'bank_transfer', 'other']
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'cancelled', 'refunded'],
    default: 'completed'
  },
  
  // Description and Notes
  description: {
    type: String,
    required: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  notes: {
    type: String,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  
  // Reference Information
  referenceNumber: {
    type: String
  },
  invoiceNumber: {
    type: String
  },
  
  // Metadata
  metadata: {
    type: Object,
    default: {}
  },
  
  // Date Information
  transactionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  dueDate: {
    type: Date
  },
  
  // Status and Flags
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPeriod: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly']
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verifiedBy: {
    type: String,
    ref: 'User'
  },
  verifiedAt: {
    type: Date
  }
}

export interface Financial extends BaseDocument {
  transactionId: string
  orderId?: string
  userId?: string
  type: 'revenue' | 'refund' | 'expense' | 'discount' | 'delivery_fee' | 'tax' | 'commission' | 'adjustment'
  category: 'food_sales' | 'delivery' | 'marketing' | 'operations' | 'supplies' | 'utilities' | 'staff' | 'taxes' | 'refunds' | 'discounts' | 'fees' | 'other'
  amount: number
  currency: 'JOD' | 'USD' | 'EUR'
  taxAmount: number
  taxRate: number
  paymentMethod?: 'cash' | 'card' | 'online' | 'bank_transfer' | 'other'
  paymentStatus: 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded'
  description: string
  notes?: string
  referenceNumber?: string
  invoiceNumber?: string
  metadata?: any
  transactionDate: Date
  dueDate?: Date
  isRecurring: boolean
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly'
  isVerified: boolean
  verifiedBy?: string
  verifiedAt?: Date
}

// Default indexes for Financial collection
export const FinancialIndexes = [
  { fields: { transactionId: 1 }, options: { unique: true } },
  { fields: { orderId: 1 } },
  { fields: { userId: 1 } },
  { fields: { type: 1 } },
  { fields: { category: 1 } },
  { fields: { transactionDate: -1 } },
  { fields: { createdAt: -1 } },
  { fields: { paymentStatus: 1 } },
  { fields: { isVerified: 1 } },
  { fields: { type: 1, transactionDate: -1 } },
  { fields: { category: 1, transactionDate: -1 } },
  { fields: { transactionDate: -1, amount: 1 } }
]

// Helper functions for financial calculations
export const FinancialHelpers = {
  generateTransactionId: () => {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substr(2, 5)
    return `TXN_${timestamp}_${random}`.toUpperCase()
  },
  
  calculateNetRevenue: (transactions: Financial[]) => {
    return transactions
      .filter(t => t.type === 'revenue')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  calculateTotalExpenses: (transactions: Financial[]) => {
    return transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  calculateProfit: (transactions: Financial[]) => {
    const revenue = FinancialHelpers.calculateNetRevenue(transactions)
    const expenses = FinancialHelpers.calculateTotalExpenses(transactions)
    return revenue - expenses
  },
  
  calculateTaxes: (transactions: Financial[]) => {
    return transactions
      .filter(t => t.type === 'tax')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  calculateRefunds: (transactions: Financial[]) => {
    return transactions
      .filter(t => t.type === 'refund')
      .reduce((sum, t) => sum + t.amount, 0)
  },
  
  calculateDiscounts: (transactions: Financial[]) => {
    return transactions
      .filter(t => t.type === 'discount')
      .reduce((sum, t) => sum + t.amount, 0)
  }
}