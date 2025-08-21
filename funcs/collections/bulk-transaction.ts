/**
 * Bulk Transactions Collection Schema
 * 
 * Manages bulk purchase and usage transactions as single entities
 */

import { Schema, Document } from 'mongoose'
import { BaseDocument } from '../collections'

// Bulk Transaction Item Interface
export interface BulkTransactionItem {
  materialId: string
  materialName: string
  quantity: number
  unitPrice?: number // Only for purchases
  totalCost?: number // Only for purchases
  unit: string
}

// Bulk Transaction Interface
export interface BulkTransaction extends BaseDocument {
  type: 'purchase' | 'usage'
  transactionDate: Date
  
  // Purchase-specific fields
  supplierName?: string
  supplierId?: string
  invoiceNumber?: string
  invoiceImage?: string
  
  // Usage-specific fields
  purpose?: string
  
  // Common fields
  notes?: string
  items: BulkTransactionItem[]
  totalAmount?: number // Total cost for purchases, total quantity for usage
  
  // Metadata
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

// Bulk Transaction Item Schema
const BulkTransactionItemSchema = new Schema({
  materialId: { type: String, required: true },
  materialName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, min: 0 }, // Only for purchases
  totalCost: { type: Number, min: 0 }, // Only for purchases
  unit: { type: String, required: true }
}, { _id: false })

// Bulk Transaction Schema
export const BulkTransactionSchema = new Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['purchase', 'usage']
  },
  transactionDate: { type: Date, required: true },
  
  // Purchase-specific fields
  supplierName: { type: String },
  supplierId: { type: String },
  invoiceNumber: { type: String },
  invoiceImage: { type: String }, // imgbb URL
  
  // Usage-specific fields
  purpose: { type: String },
  
  // Common fields
  notes: { type: String },
  items: [BulkTransactionItemSchema],
  totalAmount: { type: Number, min: 0 },
  
  // Metadata
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// Indexes for better query performance
export const BulkTransactionIndexes = [
  { fields: { type: 1 } },
  { fields: { transactionDate: -1 } },
  { fields: { createdBy: 1 } },
  { fields: { 'items.materialId': 1 } },
  { fields: { supplierName: 1 } },
  { fields: { purpose: 1 } }
]

