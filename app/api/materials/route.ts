import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { createCollection } from '../../../funcs/collections'
import { RawMaterial, RawMaterialSchema, RawMaterialIndexes } from '../../../funcs/collections/material'

/**
 * GET /api/materials - Get all raw materials
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const status = searchParams.get('status')
    const lowStock = searchParams.get('lowStock')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const search = searchParams.get('search')

    const materialCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema, {
      indexes: RawMaterialIndexes
    })

    // Build filter query
    const filter: any = {}
    
    if (category && category !== 'all') {
      filter.category = category
    }
    
    if (status && status !== 'all') {
      filter.status = status
    }
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ]
    }

    // Get materials with pagination
    const skip = (page - 1) * limit
    let query = materialCollection.model.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit)

    const materials = await query.exec()
    const total = await materialCollection.model.countDocuments(filter)

    // Filter low stock items if requested
    let filteredMaterials = materials
    if (lowStock === 'true') {
      filteredMaterials = materials.filter(material => material.currentStock <= material.minimumStock)
    }

    // Calculate summary statistics
    const totalMaterials = await materialCollection.model.countDocuments({ status: 'active' })
    const lowStockCount = await materialCollection.model.countDocuments({
      status: 'active',
      $expr: { $lte: ['$currentStock', '$minimumStock'] }
    })
    const totalValue = await materialCollection.model.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: null, total: { $sum: { $multiply: ['$currentStock', '$averageCost'] } } } }
    ])

    return NextResponse.json({
      success: true,
      data: {
        materials: filteredMaterials,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        },
        summary: {
          totalMaterials,
          lowStockCount,
          totalValue: totalValue[0]?.total || 0
        }
      }
    })

  } catch (error) {
    console.error('Error fetching materials:', error)
    return NextResponse.json(
      { error: 'Failed to fetch materials' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/materials - Create new raw material
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const {
      name,
      description,
      category,
      unit,
      minimumStock,
      maximumStock,
      status = 'active'
    } = body

    // Validate required fields
    if (!name || !category || !unit || minimumStock === undefined) {
      return NextResponse.json(
        { error: 'Name, category, unit, and minimum stock are required' },
        { status: 400 }
      )
    }

    const materialCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema, {
      indexes: RawMaterialIndexes
    })

    // Check if material already exists
    const existingMaterial = await materialCollection.model.findOne({
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    })

    if (existingMaterial) {
      return NextResponse.json(
        { error: 'Material with this name already exists' },
        { status: 400 }
      )
    }

    // Create new material
    const newMaterial = new materialCollection.model({
      name: name.trim(),
      description: description?.trim(),
      category,
      unit,
      currentStock: 0,
      minimumStock: Number(minimumStock),
      maximumStock: maximumStock ? Number(maximumStock) : undefined,
      averageCost: 0,
      status,
      purchases: [],
      usages: [],
      createdBy: session.user.id || session.user.email,
      updatedBy: session.user.id || session.user.email
    })

    await newMaterial.save()

    return NextResponse.json({
      success: true,
      data: newMaterial,
      message: 'Material created successfully'
    })

  } catch (error) {
    console.error('Error creating material:', error)
    return NextResponse.json(
      { error: 'Failed to create material' },
      { status: 500 }
    )
  }
}