# Advanced Material Management System

## 🎯 Overview

I've implemented a comprehensive, enterprise-level material management system that automatically handles material usage tracking based on order status changes. This system provides real-time inventory management with full audit trails and advanced analytics.

## 🏗️ System Architecture

### Core Components

1. **Material-Order Management Engine** (`funcs/material-order-management.ts`)
2. **API Integration** (Order status change hooks)
3. **Analytics & Monitoring** (Usage analytics and health checks)
4. **Admin Tools** (Manual controls and debugging)

## 🔄 Automatic Material Processing

### Trigger Statuses
The system automatically processes materials when orders reach these statuses:
- ✅ **`ready`** (جاهز) - Materials are deducted from stock
- ✅ **`out-for-delivery`** (في الطريق) - Materials remain deducted
- ✅ **`delivered`** (تم التوصيل) - Materials remain deducted

### Reversal Statuses
Materials are automatically restored when orders move to:
- ↩️ **`pending`** (في الانتظار) - Materials restored to stock
- ↩️ **`confirmed`** (مؤكد) - Materials restored to stock
- ↩️ **`preparing`** (قيد التحضير) - Materials restored to stock
- ↩️ **`cancelled`** (ملغي) - Materials restored to stock

## 🧮 Material Calculation Logic

### Product Materials
- Base product materials are calculated: `material.quantity × order_item.quantity`
- Supports complex recipes with multiple materials per product

### Addon Materials
- Each addon can have its own material requirements
- Calculated as: `addon_material.quantity × order_item.quantity`

### Option Materials
- Product options (size, type, etc.) can require different materials
- Calculated based on selected choice: `choice_material.quantity × order_item.quantity`

### Example Calculation
```
Pizza Margherita (Quantity: 2)
├── Base Materials:
│   ├── Dough: 0.3kg × 2 = 0.6kg
│   ├── Tomato Sauce: 0.1kg × 2 = 0.2kg
│   └── Mozzarella: 0.15kg × 2 = 0.3kg
├── Addon: Extra Cheese (Quantity: 2)
│   └── Mozzarella: 0.05kg × 2 = 0.1kg
└── Option: Large Size (Quantity: 2)
    ├── Dough: +0.1kg × 2 = 0.2kg
    └── Tomato Sauce: +0.05kg × 2 = 0.1kg

Total Materials Used:
├── Dough: 0.6kg + 0.2kg = 0.8kg
├── Tomato Sauce: 0.2kg + 0.1kg = 0.3kg
└── Mozzarella: 0.3kg + 0.1kg = 0.4kg
```

## 🔧 API Endpoints

### Order Status Management
- **`PATCH /api/admin/orders/[id]`** - Automatically handles material usage on status change
- **`PUT /api/admin/orders/[id]/edit`** - Handles material adjustments on order edits

### Material Analytics
- **`GET /api/admin/orders/[id]/materials`** - Get material usage for specific order
- **`POST /api/admin/orders/[id]/materials`** - Manual material operations (recalculate, force-apply, force-reverse)

### System Analytics
- **`GET /api/admin/materials/usage-analytics`** - Comprehensive usage analytics
- **`GET /api/admin/materials/system-health`** - System health monitoring
- **`POST /api/admin/materials/system-health/repair`** - Automated system repairs

## 📊 Features Implemented

### ✅ Automatic Processing
- **Status Change Detection** - Monitors order status transitions
- **Smart Material Deduction** - Only processes when necessary
- **Automatic Reversal** - Restores materials when orders are cancelled
- **Edit Handling** - Recalculates materials when orders are modified

### ✅ Transaction Tracking
- **Audit Trail** - Every material transaction is logged
- **Transaction IDs** - Unique identifiers for each operation
- **Purpose Tracking** - Reason for each material usage
- **User Attribution** - Tracks who performed each action

### ✅ Error Handling
- **Stock Validation** - Prevents negative stock situations
- **Graceful Failures** - Order updates continue even if material processing fails
- **Detailed Logging** - Comprehensive error reporting
- **Recovery Mechanisms** - Manual tools to fix inconsistencies

### ✅ Analytics & Monitoring
- **Usage Analytics** - Track material consumption patterns
- **Stock Alerts** - Low stock and out-of-stock notifications
- **Performance Metrics** - System health monitoring
- **Trend Analysis** - Historical usage patterns

## 🛠️ Admin Tools

### Material Management Dashboard
```typescript
// Get comprehensive analytics
GET /api/admin/materials/usage-analytics?days=30

// Response includes:
{
  summary: { totalOrders, materialsTracked, totalUsageTransactions },
  materialUsage: [{ materialId, totalUsed, averagePerOrder, peakUsageDay }],
  stockAlerts: { lowStock: [], outOfStock: [], overStock: [] },
  orderAnalytics: { byStatus, byDate, topMaterialConsumers }
}
```

### Order Material Debugging
```typescript
// Get material info for specific order
GET /api/admin/orders/ORDER_ID/materials

// Manual material operations
POST /api/admin/orders/ORDER_ID/materials
{
  "action": "recalculate" | "force-apply" | "force-reverse"
}
```

### System Health Monitoring
```typescript
// Check system health
GET /api/admin/materials/system-health

// Response includes:
{
  overall: "healthy" | "warning" | "critical",
  checks: {
    database: { status, details },
    materialDefinitions: { status, stats },
    orderIntegration: { status, stats },
    stockLevels: { status, stats },
    dataConsistency: { status, issues }
  },
  recommendations: ["Action items to improve system health"]
}
```

## 🔒 Security & Reliability

### Data Integrity
- **Atomic Operations** - Material transactions are atomic
- **Validation Checks** - Stock levels validated before processing
- **Rollback Capability** - Failed operations don't leave partial state

### Access Control
- **Admin Only** - All material management APIs require admin role
- **Rate Limiting** - Prevents abuse of material operations
- **Audit Logging** - All actions logged with user attribution

### Error Recovery
- **Non-Blocking** - Material errors don't prevent order processing
- **Manual Override** - Admins can manually fix material issues
- **Health Monitoring** - Proactive issue detection

## 📈 Performance Optimizations

### Efficient Calculations
- **Batch Processing** - Multiple materials calculated in single operation
- **Caching** - Product material definitions cached for performance
- **Lazy Loading** - Only calculates materials when needed

### Database Optimization
- **Indexed Queries** - Optimized database queries for material lookups
- **Minimal Updates** - Only updates changed fields
- **Connection Pooling** - Efficient database connection management

## 🚀 Usage Examples

### Automatic Status Change
```typescript
// When admin changes order status from "preparing" to "ready"
PATCH /api/admin/orders/ORDER_ID
{
  "status": "ready"
}

// System automatically:
// 1. Detects status change (preparing → ready)
// 2. Calculates required materials for the order
// 3. Validates stock availability
// 4. Deducts materials from inventory
// 5. Creates usage transactions with audit trail
// 6. Logs the operation
```

### Order Edit Handling
```typescript
// When admin edits order items
PUT /api/admin/orders/ORDER_ID/edit
{
  "items": [/* updated items */]
}

// System automatically:
// 1. Checks if order status uses materials (ready/out-for-delivery/delivered)
// 2. Reverses original material usage
// 3. Calculates new material requirements
// 4. Applies new material usage
// 5. Creates transaction records for both operations
```

### Manual Material Operations
```typescript
// Force recalculate materials for an order
POST /api/admin/orders/ORDER_ID/materials
{
  "action": "recalculate"
}

// System will:
// 1. Reverse any existing material usage
// 2. Recalculate based on current order and status
// 3. Apply correct material usage
// 4. Return detailed transaction results
```

## 🎯 Benefits Achieved

### ✅ **Automated Inventory Management**
- No manual material tracking required
- Real-time stock updates
- Prevents overselling

### ✅ **Complete Audit Trail**
- Every material movement tracked
- Full transaction history
- Compliance-ready reporting

### ✅ **Error Prevention**
- Stock validation prevents negative inventory
- Graceful error handling
- Automatic recovery mechanisms

### ✅ **Business Intelligence**
- Usage pattern analysis
- Cost tracking capabilities
- Predictive stock management

### ✅ **Operational Efficiency**
- Reduces manual work
- Prevents human errors
- Streamlines operations

## 🔧 Maintenance & Monitoring

### Daily Operations
- Monitor system health dashboard
- Review stock alerts
- Check for any failed transactions

### Weekly Analysis
- Review usage analytics
- Analyze consumption patterns
- Plan material restocking

### Monthly Optimization
- Review system performance
- Optimize material definitions
- Update stock level thresholds

---

## 🎉 **System Status: FULLY OPERATIONAL**

The material management system is now fully integrated and operational. It will automatically handle all material usage based on order status changes, providing enterprise-level inventory management with complete audit trails and advanced analytics.

**Key Achievement:** Orders with status `ready`, `out-for-delivery`, or `delivered` will automatically deduct materials, while orders moved to `pending`, `confirmed`, `preparing`, or `cancelled` will automatically restore materials to stock. Order edits are handled intelligently with proper material recalculation.