import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { addProductToOffers, removeProductFromOffers } from '@/funcs/offers-utils'

/**
 * POST /api/admin/products/move-to-offers - Move a product to/from offers category
 * 
 * Body: { productId: string, moveToOffers: boolean }
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { productId, moveToOffers } = await request.json()
    
    if (!productId || typeof moveToOffers !== 'boolean') {
      return NextResponse.json(
        { error: 'Product ID and moveToOffers flag are required' },
        { status: 400 }
      )
    }

    if (moveToOffers) {
      await addProductToOffers(productId)
      return NextResponse.json({ 
        message: 'Product moved to offers category successfully',
        action: 'added_to_offers'
      })
    } else {
      await removeProductFromOffers(productId)
      return NextResponse.json({ 
        message: 'Product removed from offers category successfully',
        action: 'removed_from_offers'
      })
    }
  } catch (error) {
    console.error('Failed to move product to/from offers:', error)
    return NextResponse.json(
      { error: 'Failed to update product offer status' },
      { status: 500 }
    )
  }
}