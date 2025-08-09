import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { initializeAppCollections } from '@/funcs/initializeApp'
import { useCollection } from '@/funcs/collections'
import { Category } from '@/funcs/collections/category'
import { Product } from '@/funcs/collections/product'

// GET /api/categories/[id] - Get a specific category
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    const category = await categoryCollection.model.findById(id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Failed to fetch category:', error)
    return NextResponse.json(
      { error: 'Failed to fetch category' },
      { status: 500 }
    )
  }
}

// PUT /api/categories/[id] - Update a category
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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

    const updateData = await request.json()
    
    const category = await categoryCollection.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ category })
  } catch (error) {
    console.error('Failed to update category:', error)
    
    // Handle duplicate key error
    if ((error as any).code === 11000) {
      return NextResponse.json(
        { error: 'Category name already exists' },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to update category' },
      { status: 400 }
    )
  }
}

// DELETE /api/categories/[id] - Delete a category
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
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
    const productCollection = useCollection<Product>('products')
    
    if (!categoryCollection || !productCollection) {
      return NextResponse.json(
        { error: 'Collections not available' },
        { status: 500 }
      )
    }

    // Check if category has products
    const productsInCategory = await productCollection.model.countDocuments({
      categoryId: id
    })
    
    if (productsInCategory > 0) {
      return NextResponse.json(
        { error: 'Cannot delete category that contains products. Please delete or move all products first.' },
        { status: 400 }
      )
    }

    const category = await categoryCollection.model.findByIdAndDelete(id)
    
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ message: 'Category deleted successfully' })
  } catch (error) {
    console.error('Failed to delete category:', error)
    return NextResponse.json(
      { error: 'Failed to delete category' },
      { status: 500 }
    )
  }
}
