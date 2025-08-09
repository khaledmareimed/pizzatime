import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { initializeAppCollections } from '@/funcs/initializeApp'
import { useCollection } from '@/funcs/collections'
import { Category } from '@/funcs/collections/category'
import { Product } from '@/funcs/collections/product'

// GET /api/products - Get all products
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const categoryId = searchParams.get('categoryId')

    let query = {}
    if (categoryId) {
      query = { categoryId }
    }

    const products = await productCollection.model.find(query).sort({ productName: 1 })
    return NextResponse.json({ products })
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    )
  }
}

// POST /api/products - Create a new product
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
    const productCollection = useCollection<Product>('products')
    const categoryCollection = useCollection<Category>('categories')
    
    if (!productCollection || !categoryCollection) {
      return NextResponse.json(
        { error: 'Collections not available' },
        { status: 500 }
      )
    }

    const productData = await request.json()
    
    // Validate required fields
    if (!productData.productName || !productData.categoryId || !productData.productPrice) {
      return NextResponse.json(
        { error: 'Product name, category, and price are required' },
        { status: 400 }
      )
    }

    // Verify category exists
    const category = await categoryCollection.model.findById(productData.categoryId)
    if (!category) {
      return NextResponse.json(
        { error: 'Category not found' },
        { status: 400 }
      )
    }

    // Create the product
    const product = new productCollection.model({
      ...productData,
      addonsAndToppings: productData.addonsAndToppings || [],
      imagesUrl: productData.imagesUrl || [],
      available: productData.available !== undefined ? productData.available : true,
      visible: productData.visible !== undefined ? productData.visible : true
    })
    
    await product.save()

    // Add product ID to category's products array
    await categoryCollection.model.findByIdAndUpdate(
      productData.categoryId,
      { $addToSet: { products: product._id.toString() } }
    )

    return NextResponse.json({ product }, { status: 201 })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 400 }
    )
  }
}
