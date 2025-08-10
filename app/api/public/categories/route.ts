import { NextResponse } from 'next/server'
import { getPublicCategories } from '@/funcs/publicData'

/**
 * GET /api/public/categories - Get all visible categories for public users
 * 
 * This endpoint provides read-only access to categories for non-admin users.
 * Returns only categories that have visible, available products.
 * 
 * Security measures:
 * - No authentication required (public endpoint)
 * - Only returns visible categories with available products
 * - No sensitive admin data exposed
 * - Input validation and sanitization handled in publicData functions
 */
export async function GET() {
  try {
    const categories = await getPublicCategories()
    
    return NextResponse.json({ 
      categories,
      count: categories.length 
    })
  } catch (error) {
    console.error('Public categories API error:', error)
    
    // Return generic error to avoid exposing system details
    return NextResponse.json(
      { 
        error: 'Unable to retrieve categories at this time',
        categories: [],
        count: 0
      },
      { status: 500 }
    )
  }
}

// Explicitly disable other HTTP methods
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
