import { NextRequest, NextResponse } from 'next/server'
import { getPublicProducts, searchPublicProducts } from '@/funcs/publicData'

/**
 * GET /api/public/products - Get all visible and available products for public users
 * 
 * Query parameters:
 * - categoryId: Filter products by category ID (optional)
 * - search: Search products by name or description (optional)
 * 
 * This endpoint provides read-only access to products for non-admin users.
 * Returns only products that are visible and available.
 * 
 * Security measures:
 * - No authentication required (public endpoint)
 * - Only returns visible and available products
 * - Input validation and sanitization handled in publicData functions
 * - No sensitive admin data exposed
 * - Image URLs are sanitized for XSS prevention
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')
    const searchTerm = searchParams.get('search')

    let products

    if (searchTerm) {
      // Handle search query
      products = await searchPublicProducts(searchTerm)
    } else {
      // Handle category filter or get all products
      products = await getPublicProducts(categoryId || undefined)
    }
    
    return NextResponse.json({ 
      products,
      count: products.length,
      filters: {
        categoryId: categoryId || null,
        search: searchTerm || null
      }
    })
  } catch (error) {
    console.error('Public products API error:', error)
    
    // Return generic error to avoid exposing system details
    return NextResponse.json(
      { 
        error: 'Unable to retrieve products at this time',
        products: [],
        count: 0
      },
      { status: 500 }
    )
  }
}

// Explicitly disable other HTTP methods to prevent unauthorized modifications
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. This is a read-only endpoint.' },
    { status: 405 }
  )
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. This is a read-only endpoint.' },
    { status: 405 }
  )
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. This is a read-only endpoint.' },
    { status: 405 }
  )
}

export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed. This is a read-only endpoint.' },
    { status: 405 }
  )
}
