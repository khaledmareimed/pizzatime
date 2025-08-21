/**
 * OrderEditor Component - Refactored to Component-First Architecture
 * 
 * This component has been completely refactored following the main rule:
 * "Build with Components First" - breaking down the monolithic structure
 * into reusable, independent components.
 * 
 * Components Created:
 * - CustomerInfoSection: Handles customer information editing
 * - DeliveryInfoSection: Manages delivery details and method selection
 * - OrderItemsSection: Displays and manages order items
 * - OrderSummarySection: Shows totals and payment method
 * - ProductSelectionModal: Modal for adding new products
 * - OrderEditorMain: Main orchestrator component
 * 
 * Benefits:
 * ✅ Reusable components following design system
 * ✅ Separation of concerns
 * ✅ Easier testing and maintenance
 * ✅ Better code organization
 * ✅ Follows Apple-inspired design principles
 */

import OrderEditorMain from './OrderEditorMain'
import { OrderEditorProps } from './types'

export default function OrderEditor({ order, onSave, onCancel }: OrderEditorProps) {
  return <OrderEditorMain order={order} onSave={onSave} onCancel={onCancel} />
}