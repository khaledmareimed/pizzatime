import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { createCollection } from '../../../../funcs/collections'
import { RawMaterial, RawMaterialSchema, RawMaterialIndexes } from '../../../../funcs/collections/material'

/**
 * GET /api/materials/[id] - Get specific material
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = await params

    const materialCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema, {
      indexes: RawMaterialIndexes
    })

    const material = await materialCollection.model.findById(id)

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: material
    })

  } catch (error) {
    console.error('Error fetching material:', error)
    return NextResponse.json(
      { error: 'Failed to fetch material' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/materials/[id] - Update material
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await request.json()
    const {
      name,
      description,
      category,
      unit,
      minimumStock,
      maximumStock,
      status
    } = body

    const materialCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema, {
      indexes: RawMaterialIndexes
    })

    const material = await materialCollection.model.findById(id)

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    // Check if name already exists (excluding current material)
    if (name && name !== material.name) {
      const existingMaterial = await materialCollection.model.findOne({
        _id: { $ne: id },
        name: { $regex: new RegExp(`^${name}$`, 'i') }
      })

      if (existingMaterial) {
        return NextResponse.json(
          { error: 'Material with this name already exists' },
          { status: 400 }
        )
      }
    }

    // Update material
    const updateData: any = {
      updatedBy: session.user.id || session.user.email,
      updatedAt: new Date()
    }

    if (name) updateData.name = name.trim()
    if (description !== undefined) updateData.description = description?.trim()
    if (category) updateData.category = category
    if (unit) updateData.unit = unit
    if (minimumStock !== undefined) updateData.minimumStock = Number(minimumStock)
    if (maximumStock !== undefined) updateData.maximumStock = maximumStock ? Number(maximumStock) : undefined
    if (status) updateData.status = status

    const updatedMaterial = await materialCollection.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )

    return NextResponse.json({
      success: true,
      data: updatedMaterial,
      message: 'Material updated successfully'
    })

  } catch (error) {
    console.error('Error updating material:', error)
    return NextResponse.json(
      { error: 'Failed to update material' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/materials/[id] - Delete material
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.email || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized. Admin access required.' },
        { status: 401 }
      )
    }

    const { id } = await params

    const materialCollection = await createCollection<RawMaterial>('rawmaterials', RawMaterialSchema, {
      indexes: RawMaterialIndexes
    })

    const material = await materialCollection.model.findById(id)

    if (!material) {
      return NextResponse.json(
        { error: 'Material not found' },
        { status: 404 }
      )
    }

    // Check if material has any purchases or usages
    if (material.purchases.length > 0 || material.usages.length > 0) {
      return NextResponse.json(
        { error: 'Cannot delete material with purchase or usage history. Consider marking it as inactive instead.' },
        { status: 400 }
      )
    }

    await materialCollection.model.findByIdAndDelete(id)

    return NextResponse.json({
      success: true,
      message: 'Material deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting material:', error)
    return NextResponse.json(
      { error: 'Failed to delete material' },
      { status: 500 }
    )
  }
}