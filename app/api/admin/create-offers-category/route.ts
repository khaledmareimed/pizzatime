import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureOffersCategory } from '@/funcs/offers-utils'

/**
 * POST /api/admin/create-offers-category - Manually create the offers category
 * This is a fallback endpoint to ensure the offers category exists
 */
export async function POST() {
  try {
    // Check authentication
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const offersCategoryId = await ensureOffersCategory()
    
    return NextResponse.json({ 
      success: true,
      message: 'Offers category created/verified successfully',
      categoryId: offersCategoryId
    })
  } catch (error) {
    console.error('Failed to create offers category:', error)
    return NextResponse.json(
      { error: 'Failed to create offers category' },
      { status: 500 }
    )
  }
}