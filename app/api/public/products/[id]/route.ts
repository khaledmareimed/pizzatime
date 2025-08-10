import { NextRequest, NextResponse } from 'next/server'
import { getPublicProduct } from '@/funcs/publicData'

/**
 * GET /api/public/products/[id] - Get a single product by ID for public users
 * 
 * This endpoint provides read-only access to individual products for non-admin users.
 * Returns only products that are visible and available.
 * 
 * Security measures:
 * - No authentication required (public endpoint)
 * - Only returns visible and available products
 * - Input validation for product ID format
 * - No sensitive admin data exposed
 * - Image URLs are sanitized for XSS prevention
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: productId } = await params
  try {

    if (!productId) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      )
    }

    const product = await getPublicProduct(productId)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found or not available' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({ product })
  } catch (error) {
    console.error('Public product API error:', error)
    
    // Handle specific validation errors
    if (error instanceof Error && error.message.includes('Invalid product ID format')) {
      return NextResponse.json(
        { error: 'Invalid product ID format' },
        { status: 400 }
      )
    }
    
    // Return generic error to avoid exposing system details
    return NextResponse.json(
      { error: 'Unable to retrieve product at this time' },
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
