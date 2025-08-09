import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { initializeAppCollections } from '@/funcs/initializeApp'
import { useCollection } from '@/funcs/collections'
import { Category } from '@/funcs/collections/category'
import { Product } from '@/funcs/collections/product'

// GET /api/categories - Get all categories
export async function GET() {
  try {
    // Check authentication
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    await initializeAppCollections()
    const categoryCollection = useCollection<Category>('categories')
    
    if (!categoryCollection) {
      return NextResponse.json(
        { error: 'Categories collection not available' },
        { status: 500 }
      )
    }

    const categories = await categoryCollection.model.find({}).sort({ displayOrder: 1 })
    return NextResponse.json({ categories })
  } catch (error) {
    console.error('Failed to fetch categories:', error)
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    )
  }
}

// POST /api/categories - Create a new category
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

    await initializeAppCollections()
    const categoryCollection = useCollection<Category>('categories')
    
    if (!categoryCollection) {
      return NextResponse.json(
        { error: 'Categories collection not available' },
        { status: 500 }
      )
    }

    const categoryData = await request.json()
    
    // Validate required fields
    if (!categoryData.name) {
      return NextResponse.json(
        { error: 'Category name is required' },
        { status: 400 }
      )
    }

    const category = new categoryCollection.model({
      ...categoryData,
      products: [] // Initialize empty products array
    })
    
    await category.save()
    return NextResponse.json({ category }, { status: 201 })
  } catch (error) {
    console.error('Failed to create category:', error)
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 400 }
    )
  }
}
