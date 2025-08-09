# MongoDB Database Setup Guide

This guide explains how to set up and use the MongoDB connection with multiple collections in your Pizza Time application.

## Required Environment Variables

Add these environment variables to your `.env.local` file:

### MongoDB Configuration (Required)

```bash
# MongoDB connection URI
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net

# Database name (optional, defaults to 'pizzatime')
MONGODB_DB_NAME=pizzatime
```

### Existing Configuration (Already Present)

```bash
# Google OAuth (existing)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# NextAuth secret (existing)
AUTH_SECRET=your_nextauth_secret

# Admin emails (existing)
ADMIN_EMAILS=admin@example.com;another_admin@example.com

# Environment
NODE_ENV=development
```

## MongoDB Setup Options

### Option 1: MongoDB Atlas (Recommended for Production)

1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address or use 0.0.0.0/0 for development
5. Get connection string and add to `MONGODB_URI`

Example Atlas URI:
```
mongodb+srv://username:password@cluster0.abc123.mongodb.net
```

### Option 2: Local MongoDB (Development)

1. Install MongoDB locally
2. Start MongoDB service
3. Use local connection string

Example local URI:
```
mongodb://localhost:27017
```

## Installation

Install the required dependencies:

```bash
npm install
# The mongoose dependency has already been added to package.json
```

## Basic Usage

### 1. Initialize Collections (Required)

Call this once during application startup, typically in an API route or server component:

```typescript
import { initializeCollections } from '@/funcs/db-usage-example'

// In your API route or server component
await initializeCollections()
```

### 2. Use Services for Database Operations

```typescript
import { userService, productService, orderService } from '@/funcs/db-usage-example'

// Create a new user
const user = await userService.createUser({
  email: 'user@example.com',
  name: 'John Doe',
  role: 'user'
})

// Get products by category
const pizzas = await productService.getProductsByCategory('pizza')

// Create an order
const order = await orderService.createOrder({
  userId: user._id,
  items: [
    {
      productId: 'product_id',
      quantity: 2,
      unitPrice: 15.99
    }
  ],
  totalAmount: 31.98,
  deliveryAddress: {
    street: '123 Main St',
    city: 'Pizza City',
    zipCode: '12345'
  }
})
```

### 3. Example API Route

```typescript
// app/api/products/route.ts
import { NextRequest } from 'next/server'
import { initializeCollections, productService } from '@/funcs/db-usage-example'

export async function GET() {
  try {
    await initializeCollections()
    const products = await productService.getProductsByCategory('pizza')
    return Response.json({ products })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return Response.json(
      { error: 'Failed to fetch products' }, 
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    await initializeCollections()
    const productData = await request.json()
    const product = await productService.createProduct(productData)
    return Response.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Failed to create product:', error)
    return Response.json(
      { error: 'Failed to create product' }, 
      { status: 400 }
    )
  }
}
```

## Available Collections

The system comes with four pre-configured collections:

### 1. Users Collection
- Stores user account information
- Includes authentication, preferences, and addresses
- Supports role-based access (user/admin)

### 2. Categories Collection
- Stores product categories for menu organization
- Maintains product IDs array for each category
- Includes display order, colors, and images for category management
- Simple category structure without hierarchy or status controls

### 3. Products Collection
- Stores menu items with category references
- Includes pricing, discount pricing, and addons/toppings
- Links to categories via `categoryId` field
- Supports availability and visibility controls
- Multiple image URLs support

### 4. Orders Collection
- Stores customer orders with items and delivery info
- Tracks order status and payment status
- Includes delivery time estimates

## Security Features

- **Input Validation**: All schemas include comprehensive validation
- **SQL Injection Prevention**: Uses Mongoose ODM with parameterized queries
- **XSS Prevention**: Input sanitization and output encoding
- **Connection Security**: Secure connection pooling and timeout handling
- **Environment Separation**: Different configurations for dev/staging/prod

## Performance Optimizations

- **Connection Pooling**: Reuses database connections efficiently
- **Indexes**: Pre-configured indexes for common queries
- **Pagination**: Built-in support for paginated queries
- **Caching**: Connection singleton pattern for serverless environments

## Health Checks

Monitor database health with the built-in health check:

```typescript
import { checkDatabaseHealth } from '@/funcs/db-usage-example'

const health = await checkDatabaseHealth()
console.log(health)
// {
//   status: 'healthy',
//   connection: true,
//   collections: ['users', 'products', 'orders'],
//   timestamp: '2024-01-15T10:30:00.000Z'
// }
```

## Error Handling

The system includes comprehensive error handling:

- **Connection Errors**: Automatic retry with exponential backoff
- **Validation Errors**: Clear error messages for invalid data
- **Duplicate Key Errors**: Friendly messages for unique constraint violations
- **Timeout Errors**: Configurable timeouts to prevent hanging requests

## Troubleshooting

### Common Issues

1. **Connection Timeout**
   - Check your internet connection
   - Verify MongoDB Atlas IP whitelist
   - Ensure correct URI format

2. **Authentication Failed**
   - Verify username/password in connection string
   - Check database user permissions
   - Ensure database user exists

3. **Collection Not Found**
   - Make sure `initializeCollections()` is called before using services
   - Check that the collection name matches the schema

### Debug Mode

Enable debug logging in development:

```typescript
// Add to your environment variables
NODE_ENV=development

// Mongoose will log all database operations
```

## Best Practices

1. **Initialize Once**: Call `initializeCollections()` once per application lifecycle
2. **Use Services**: Always use the provided service classes for database operations
3. **Handle Errors**: Wrap database calls in try-catch blocks
4. **Validate Input**: Use schema validation for all user input
5. **Monitor Performance**: Use indexes and limit query results
6. **Secure Credentials**: Never commit real database credentials to version control

## Adding New Collections

To add a new collection:

1. Define the schema in `funcs/collections.ts`
2. Add TypeScript interface
3. Register the collection in `initializeCollections()`
4. Create a service class in `funcs/db-usage-example.ts`

Example:

```typescript
// 1. Define schema
export const ReviewSchema = {
  productId: { type: String, required: true, ref: 'Product' },
  userId: { type: String, required: true, ref: 'User' },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, maxlength: 500 },
  isVerified: { type: Boolean, default: false }
}

// 2. Define interface
export interface Review extends BaseDocument {
  productId: string
  userId: string
  rating: number
  comment?: string
  isVerified: boolean
}

// 3. Register in initializeCollections()
await createCollection<Review>('reviews', ReviewSchema, {
  indexes: [
    { fields: { productId: 1 } },
    { fields: { userId: 1 } },
    { fields: { rating: 1 } }
  ]
})

// 4. Create service class
export class ReviewService {
  // Implementation here
}
```
