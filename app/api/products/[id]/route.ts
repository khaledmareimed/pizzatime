import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { initializeAppCollections } from '@/funcs/initializeApp'
import { useCollection } from '@/funcs/collections'
import { Category } from '@/funcs/collections/category'
import { Product } from '@/funcs/collections/product'

// GET /api/products/[id] - Get a specific product
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
    const productCollection = useCollection<Product>('products')
    
    if (!productCollection) {
      return NextResponse.json(
        { error: 'Products collection not available' },
        { status: 500 }
      )
    }

    const product = await productCollection.model.findById(id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Failed to fetch product:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

// PUT /api/products/[id] - Update a product
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
    const productCollection = useCollection<Product>('products')
    const categoryCollection = useCollection<Category>('categories')
    
    if (!productCollection || !categoryCollection) {
      return NextResponse.json(
        { error: 'Collections not available' },
        { status: 500 }
      )
    }

    const updateData = await request.json()
    
    // Get the current product to check if category is changing
    const currentProduct = await productCollection.model.findById(id)
    if (!currentProduct) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // If category is changing, verify new category exists
    if (updateData.categoryId && updateData.categoryId !== currentProduct.categoryId) {
      const newCategory = await categoryCollection.model.findById(updateData.categoryId)
      if (!newCategory) {
        return NextResponse.json(
          { error: 'New category not found' },
          { status: 400 }
        )
      }

      // Remove product from old category
      await categoryCollection.model.findByIdAndUpdate(
        currentProduct.categoryId,
        { $pull: { products: id } }
      )

      // Add product to new category
      await categoryCollection.model.findByIdAndUpdate(
        updateData.categoryId,
        { $addToSet: { products: id } }
      )
    }

    const product = await productCollection.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({ product })
  } catch (error) {
    console.error('Failed to update product:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 400 }
    )
  }
}

// DELETE /api/products/[id] - Delete a product
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
    const productCollection = useCollection<Product>('products')
    const categoryCollection = useCollection<Category>('categories')
    
    if (!productCollection || !categoryCollection) {
      return NextResponse.json(
        { error: 'Collections not available' },
        { status: 500 }
      )
    }

    const product = await productCollection.model.findByIdAndDelete(id)
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Remove product from category's products array
    await categoryCollection.model.findByIdAndUpdate(
      product.categoryId,
      { $pull: { products: id } }
    )

    return NextResponse.json({ message: 'Product deleted successfully' })
  } catch (error) {
    console.error('Failed to delete product:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}
