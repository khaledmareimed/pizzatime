import { NextResponse } from 'next/server'
import { getOfferProducts, productToOfferItem } from '@/funcs/offers-utils'

/**
 * GET /api/public/offers - Get all current offers for public users
 * 
 * This endpoint provides read-only access to offer products for non-admin users.
 * Returns only products from the special "Offers" category that are visible and available.
 * 
 * Security measures:
 * - No authentication required (public endpoint)
 * - Only returns visible and available offer products
 * - No sensitive admin data exposed
 * - Image URLs are sanitized for XSS prevention
 */
export async function GET() {
  try {
    // Get all offer products from the special offers category
    const offerProducts = await getOfferProducts()
    
    // Convert products to offer format for the frontend
    const offers = offerProducts.map(productToOfferItem)
    
    return NextResponse.json({ 
      offers,
      count: offers.length
    })
  } catch (error) {
    console.error('Public offers API error:', error)
    
    // Return generic error to avoid exposing system details
    return NextResponse.json(
      { 
        error: 'Unable to retrieve offers at this time',
        offers: [],
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