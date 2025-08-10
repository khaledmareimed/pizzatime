import { NextRequest, NextResponse } from 'next/server'
import { getPublicProductsByCategory, getPublicCategory } from '@/funcs/publicData'

/**
 * GET /api/public/categories/[id]/products - Get all products in a specific category for public users
 * 
 * This endpoint provides read-only access to products within a category for non-admin users.
 * Returns only products that are visible and available within an accessible category.
 * 
 * Security measures:
 * - No authentication required (public endpoint)
 * - Only returns visible and available products
 * - Validates category existence and accessibility
 * - Input validation for category ID format
 * - No sensitive admin data exposed
 * - Image URLs are sanitized for XSS prevention
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: categoryId } = await params
  try {

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Category ID is required' },
        { status: 400 }
      )
    }

    // First verify the category exists and is accessible
    const category = await getPublicCategory(categoryId)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found or not available' },
        { status: 404 }
      )
    }

    // Get products for this category
    const products = await getPublicProductsByCategory(categoryId)
    
    return NextResponse.json({ 
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        displayOrder: category.displayOrder,
        imageUrl: category.imageUrl,
        color: category.color
      },
      products,
      count: products.length
    })
  } catch (error) {
    console.error('Public category products API error:', error)
    
    // Handle specific validation errors
    if (error instanceof Error && error.message.includes('Invalid category ID format')) {
      return NextResponse.json(
        { error: 'Invalid category ID format' },
        { status: 400 }
      )
    }
    
    // Return generic error to avoid exposing system details
    return NextResponse.json(
      { 
        error: 'Unable to retrieve category products at this time',
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
