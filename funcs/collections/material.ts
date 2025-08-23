/**
 * Raw Materials Collection Schema
 * 
 * Manages raw materials inventory, purchases, usage tracking, and invoices
 */

import { Schema, Document } from 'mongoose'
import { BaseDocument } from '../collections'

// Material Purchase Interface
export interface MaterialPurchase {
  _id?: string
  supplierId?: string
  supplierName: string
  quantity: number
  unitPrice: number
  totalCost: number
  purchaseDate: Date
  invoiceNumber?: string
  invoiceImage?: string // imgbb URL
  notes?: string
  createdBy: string // admin user ID
  createdAt: Date
}

// Material Usage Interface
export interface MaterialUsage {
  _id?: string
  quantity: number
  usageDate: Date
  purpose: string // e.g., "Production", "Waste", "Sample"
  notes?: string
  usedBy: string // admin user ID
  createdAt: Date
}

// Raw Material Interface
export interface RawMaterial extends BaseDocument {
  name: string
  description?: string
  category: string // e.g., "Meat", "Vegetables", "Spices", "Packaging"
  unit: string // e.g., "kg", "liter", "piece", "box"
  currentStock: number
  minimumStock: number
  maximumStock?: number
  averageCost: number // calculated from purchases
  lastPurchasePrice?: number
  lastPurchaseDate?: Date
  status: 'active' | 'inactive' | 'discontinued'
  
  // Purchase and Usage History
  purchases: MaterialPurchase[]
  usages: MaterialUsage[]
  
  // Metadata
  createdBy: string
  updatedBy: string
  createdAt: Date
  updatedAt: Date
}

// Material Purchase Schema
const MaterialPurchaseSchema = new Schema({
  supplierId: { type: String },
  supplierName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number, required: true, min: 0 },
  totalCost: { type: Number, required: true, min: 0 },
  purchaseDate: { type: Date, required: true },
  invoiceNumber: { type: String },
  invoiceImage: { type: String }, // imgbb URL
  notes: { type: String },
  createdBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

// Material Usage Schema
const MaterialUsageSchema = new Schema({
  quantity: { type: Number, required: true }, // Removed min: 0 to allow negative quantities for restoration
  usageDate: { type: Date, required: true },
  purpose: { 
    type: String, 
    required: true,
    enum: ['Production', 'Waste', 'Sample', 'Transfer', 'Adjustment', 'Other']
  },
  notes: { type: String },
  usedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true })

// Raw Material Schema
export const RawMaterialSchema = new Schema({
  name: { 
    type: String, 
    required: true,
    trim: true,
    maxlength: 100
  },
  description: { 
    type: String,
    trim: true,
    maxlength: 500
  },
  category: {
    type: String,
    required: true,
    enum: ['Meat', 'Vegetables', 'Fruits', 'Dairy', 'Grains', 'Spices', 'Oils', 'Packaging', 'Cleaning', 'Other']
  },
  unit: {
    type: String,
    required: true,
    enum: ['kg', 'g', 'liter', 'ml', 'piece', 'box', 'pack', 'bottle', 'can']
  },
  currentStock: { 
    type: Number, 
    required: true, 
    default: 0
    // Removed min: 0 to allow negative stock in emergency situations
  },
  minimumStock: { 
    type: Number, 
    required: true, 
    default: 0,
    min: 0
  },
  maximumStock: { 
    type: Number,
    min: 0
  },
  averageCost: { 
    type: Number, 
    default: 0,
    min: 0
  },
  lastPurchasePrice: { 
    type: Number,
    min: 0
  },
  lastPurchaseDate: { type: Date },
  status: {
    type: String,
    enum: ['active', 'inactive', 'discontinued'],
    default: 'active'
  },
  
  // Purchase and Usage History
  purchases: [MaterialPurchaseSchema],
  usages: [MaterialUsageSchema],
  
  // Metadata
  createdBy: { type: String, required: true },
  updatedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true,
  collection: 'rawmaterials'
})

// Indexes for better performance
export const RawMaterialIndexes = [
  { fields: { name: 1 }, options: { unique: true } },
  { fields: { category: 1 } },
  { fields: { status: 1 } },
  { fields: { currentStock: 1 } },
  { fields: { createdAt: -1 } },
  { fields: { updatedAt: -1 } },
  { fields: { 'purchases.purchaseDate': -1 } },
  { fields: { 'usages.usageDate': -1 } }
]

// Pre-save middleware to update averageCost and lastPurchase info
RawMaterialSchema.pre('save', function(next) {
  if (this.isModified('purchases') && this.purchases.length > 0) {
    // Calculate average cost from all purchases
    const totalCost = this.purchases.reduce((sum: number, purchase: any) => sum + purchase.totalCost, 0)
    const totalQuantity = this.purchases.reduce((sum: number, purchase: any) => sum + purchase.quantity, 0)
    
    if (totalQuantity > 0) {
      this.averageCost = totalCost / totalQuantity
    }
    
    // Update last purchase info
    const lastPurchase = this.purchases[this.purchases.length - 1]
    this.lastPurchasePrice = lastPurchase.unitPrice
    this.lastPurchaseDate = lastPurchase.purchaseDate
  }
  
  this.updatedAt = new Date()
  next()
})

// Helper methods for stock calculations
RawMaterialSchema.methods.calculateCurrentStock = function() {
  const totalPurchased = this.purchases.reduce((sum: number, purchase: any) => sum + purchase.quantity, 0)
  const totalUsed = this.usages.reduce((sum: number, usage: any) => sum + usage.quantity, 0)
  return totalPurchased - totalUsed
}

RawMaterialSchema.methods.isLowStock = function() {
  return this.currentStock <= this.minimumStock
}

RawMaterialSchema.methods.addPurchase = function(purchaseData: Omit<MaterialPurchase, '_id' | 'createdAt'>) {
  this.purchases.push({
    ...purchaseData,
    createdAt: new Date()
  })
  
  // Directly add to current stock instead of recalculating
  this.currentStock += purchaseData.quantity
  this.updatedAt = new Date()
  return this.save()
}

RawMaterialSchema.methods.addUsage = function(usageData: Omit<MaterialUsage, '_id' | 'createdAt'>) {
  // Allow negative stock but warn about it (only for positive quantities)
  if (usageData.quantity > 0 && usageData.quantity > this.currentStock) {
    console.warn(`⚠️ Usage will result in negative stock for ${this.name}. Current: ${this.currentStock}, Usage: ${usageData.quantity}`)
  }
  
  this.usages.push({
    ...usageData,
    createdAt: new Date()
  })
  
  // Directly subtract from current stock (works for both positive and negative quantities)
  this.currentStock -= usageData.quantity
  this.updatedAt = new Date()
  return this.save()
}

// Method to sync currentStock with calculated stock from purchases/usages
RawMaterialSchema.methods.syncCurrentStock = function() {
  const calculatedStock = this.calculateCurrentStock()
  if (this.currentStock !== calculatedStock) {
    console.log(`🔄 Syncing stock for ${this.name}: ${this.currentStock} → ${calculatedStock}`)
    this.currentStock = calculatedStock
    this.updatedAt = new Date()
  }
  return this
}

// Method to validate and fix stock inconsistencies
RawMaterialSchema.methods.validateStock = function() {
  const calculatedStock = this.calculateCurrentStock()
  const isConsistent = this.currentStock === calculatedStock
  
  return {
    isConsistent,
    currentStock: this.currentStock,
    calculatedStock,
    difference: this.currentStock - calculatedStock
  }
}

// Export the schema as default and named export
export default RawMaterialSchema
