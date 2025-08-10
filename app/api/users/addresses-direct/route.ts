import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../auth'
import { connectToDatabase } from '../../../../funcs/database'
import { rateLimit } from '../../../../funcs/middleware/rateLimit'
import mongoose from 'mongoose'

// Input validation and sanitization (same as before)
function sanitizeString(input: string): string {
  if (typeof input !== 'string') return ''
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .substring(0, 200) // Limit length
}

function validatePhoneNumber(phone: string): boolean {
  const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,15}$/
  return phoneRegex.test(phone)
}

function validateAddressInput(data: any, isPartialUpdate: boolean = false): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  // For partial updates, only validate provided fields
  if (!isPartialUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      errors.push('Address name must be at least 2 characters')
    }
    if (data.name && data.name.length > 50) {
      errors.push('Address name cannot exceed 50 characters')
    }
  }
  
  if (!isPartialUpdate || data.recipientName !== undefined) {
    if (!data.recipientName || typeof data.recipientName !== 'string' || data.recipientName.trim().length < 2) {
      errors.push('Recipient name must be at least 2 characters')
    }
    if (data.recipientName && data.recipientName.length > 50) {
      errors.push('Recipient name cannot exceed 50 characters')
    }
  }
  
  if (!isPartialUpdate || data.city !== undefined) {
    if (!data.city || typeof data.city !== 'string' || data.city.trim().length < 2) {
      errors.push('City name must be at least 2 characters')
    }
    if (data.city && data.city.length > 50) {
      errors.push('City name cannot exceed 50 characters')
    }
  }
  
  if (!isPartialUpdate || data.phone !== undefined) {
    if (!data.phone || typeof data.phone !== 'string' || !validatePhoneNumber(data.phone.trim())) {
      errors.push('Valid phone number is required')
    }
  }
  
  if (!isPartialUpdate || data.addressDetails !== undefined) {
    if (!data.addressDetails || typeof data.addressDetails !== 'string' || data.addressDetails.trim().length < 5) {
      errors.push('Address details must be at least 5 characters')
    }
    if (data.addressDetails && data.addressDetails.length > 200) {
      errors.push('Address details cannot exceed 200 characters')
    }
  }
  
  // Validate isDefault if provided
  if (data.isDefault !== undefined && typeof data.isDefault !== 'boolean') {
    errors.push('isDefault must be a boolean value')
  }
  
  return { isValid: errors.length === 0, errors }
}

/**
 * GET /api/users/addresses-direct - Get user addresses using direct MongoDB operations
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 100, window: 60000 })
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(session.user.email)) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    await connectToDatabase()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')

    // Find user using direct MongoDB operations
    const user = await usersCollection.findOne({ 
      email: session.user.email,
      isActive: { $ne: false }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Filter and sanitize addresses
    const validAddresses = (user.addresses || [])
      .filter((addr: any) => addr.name && addr.city && addr.phone && addr.addressDetails)
      .map((addr: any) => ({
        _id: addr._id,
        name: sanitizeString(addr.name || ''),
        recipientName: sanitizeString(addr.recipientName || user.name || 'مستلم غير محدد'),
        city: sanitizeString(addr.city || ''),
        phone: sanitizeString(addr.phone || ''),
        addressDetails: sanitizeString(addr.addressDetails || ''),
        isDefault: Boolean(addr.isDefault)
      }))

    return NextResponse.json({
      success: true,
      data: validAddresses
    })

  } catch (error) {
    console.error('Error fetching user addresses:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/users/addresses-direct - Add new address using direct MongoDB operations
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 20, window: 60000 })
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(session.user.email)) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    // Comprehensive input validation
    const validation = validateAddressInput(body)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    const { name, recipientName, city, phone, addressDetails, isDefault } = body

    await connectToDatabase()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')

    // Find user
    const user = await usersCollection.findOne({ 
      email: session.user.email,
      isActive: { $ne: false }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get existing valid addresses
    const existingAddresses = (user.addresses || [])
      .filter((addr: any) => addr.name && addr.city && addr.phone && addr.addressDetails)
      .map((addr: any) => ({
        _id: addr._id || new mongoose.Types.ObjectId(),
        name: addr.name,
        recipientName: addr.recipientName || user.name || 'مستلم غير محدد',
        city: addr.city,
        phone: addr.phone,
        addressDetails: addr.addressDetails,
        isDefault: addr.isDefault || false
      }))

    // Check address limit
    if (existingAddresses.length >= 10) {
      return NextResponse.json(
        { error: 'Maximum number of addresses reached (10)' },
        { status: 400 }
      )
    }

    // Sanitize and prepare new address
    const sanitizedAddress = {
      _id: new mongoose.Types.ObjectId(),
      name: sanitizeString(name),
      recipientName: sanitizeString(recipientName || user.name || 'مستلم غير محدد'),
      city: sanitizeString(city),
      phone: sanitizeString(phone),
      addressDetails: sanitizeString(addressDetails),
      isDefault: Boolean(isDefault) || existingAddresses.length === 0
    }

    // If this is set as default, unset other defaults
    if (sanitizedAddress.isDefault) {
      existingAddresses.forEach((addr: any) => {
        addr.isDefault = false
      })
    }

    // Add new address
    const updatedAddresses = [...existingAddresses, sanitizedAddress]

    // Update using direct MongoDB operations (bypasses Mongoose validation)
    const updateResult = await usersCollection.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          addresses: updatedAddresses,
          lastLogin: new Date()
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to add address' },
        { status: 500 }
      )
    }

    // Return sanitized data
    const sanitizedAddresses = updatedAddresses.map(addr => ({
      _id: addr._id,
      name: sanitizeString(addr.name || ''),
      city: sanitizeString(addr.city || ''),
      phone: sanitizeString(addr.phone || ''),
      addressDetails: sanitizeString(addr.addressDetails || ''),
      isDefault: Boolean(addr.isDefault)
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedAddresses,
      message: 'Address added successfully'
    })

  } catch (error) {
    console.error('Error adding address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/users/addresses-direct - Update address using direct MongoDB operations
 */
export async function PUT(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 30, window: 60000 })
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(session.user.email)) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      )
    }

    const { addressId, name, city, phone, addressDetails, isDefault } = body

    // Validate addressId
    if (!addressId || typeof addressId !== 'string') {
      return NextResponse.json(
        { error: 'Valid address ID is required' },
        { status: 400 }
      )
    }

    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(addressId)) {
      return NextResponse.json(
        { error: 'Invalid address ID format' },
        { status: 400 }
      )
    }

    // Validate input data (partial validation for updates)
    const updateData = { name, city, phone, addressDetails, isDefault }
    const validation = validateAddressInput(updateData, true)
    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', details: validation.errors },
        { status: 400 }
      )
    }

    await connectToDatabase()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')

    // Find user
    const user = await usersCollection.findOne({ 
      email: session.user.email,
      isActive: { $ne: false }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get existing addresses
    const existingAddresses = (user.addresses || [])
      .filter((addr: any) => addr.name && addr.city && addr.phone && addr.addressDetails)

    // Find address to update
    const addressIndex = existingAddresses.findIndex(
      (addr: any) => addr._id?.toString() === addressId
    )

    if (addressIndex === -1) {
      return NextResponse.json(
        { error: 'Address not found or access denied' },
        { status: 404 }
      )
    }

    // Update address with sanitized data
    if (name !== undefined) existingAddresses[addressIndex].name = sanitizeString(name)
    if (city !== undefined) existingAddresses[addressIndex].city = sanitizeString(city)
    if (phone !== undefined) existingAddresses[addressIndex].phone = sanitizeString(phone)
    if (addressDetails !== undefined) existingAddresses[addressIndex].addressDetails = sanitizeString(addressDetails)
    if (typeof isDefault === 'boolean') {
      // If setting as default, unset other defaults
      if (isDefault) {
        existingAddresses.forEach((addr: any) => {
          addr.isDefault = false
        })
      }
      existingAddresses[addressIndex].isDefault = isDefault
    }

    // Update using direct MongoDB operations
    const updateResult = await usersCollection.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          addresses: existingAddresses,
          lastLogin: new Date()
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to update address' },
        { status: 500 }
      )
    }

    // Return sanitized data
    const sanitizedAddresses = existingAddresses.map((addr: any) => ({
      _id: addr._id,
      name: sanitizeString(addr.name || ''),
      city: sanitizeString(addr.city || ''),
      phone: sanitizeString(addr.phone || ''),
      addressDetails: sanitizeString(addr.addressDetails || ''),
      isDefault: Boolean(addr.isDefault)
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedAddresses,
      message: 'Address updated successfully'
    })

  } catch (error) {
    console.error('Error updating address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/users/addresses-direct - Delete address using direct MongoDB operations
 */
export async function DELETE(request: NextRequest) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 20, window: 60000 })
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    const session = await auth()
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(session.user.email)) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const addressId = searchParams.get('id')

    // Validate addressId
    if (!addressId || typeof addressId !== 'string') {
      return NextResponse.json(
        { error: 'Valid address ID is required' },
        { status: 400 }
      )
    }

    // Validate MongoDB ObjectId format
    const objectIdRegex = /^[0-9a-fA-F]{24}$/
    if (!objectIdRegex.test(addressId)) {
      return NextResponse.json(
        { error: 'Invalid address ID format' },
        { status: 400 }
      )
    }

    await connectToDatabase()
    const db = mongoose.connection.db
    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      )
    }
    const usersCollection = db.collection('users')

    // Find user
    const user = await usersCollection.findOne({ 
      email: session.user.email,
      isActive: { $ne: false }
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Get existing addresses
    const existingAddresses = (user.addresses || [])
      .filter((addr: any) => addr.name && addr.city && addr.phone && addr.addressDetails)

    // Check if address exists and belongs to user
    const addressExists = existingAddresses.some((addr: any) => addr._id?.toString() === addressId)
    if (!addressExists) {
      return NextResponse.json(
        { error: 'Address not found or access denied' },
        { status: 404 }
      )
    }

    // Prevent deletion if it's the only address
    if (existingAddresses.length === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only address. Add another address first.' },
        { status: 400 }
      )
    }

    // Remove the address
    const updatedAddresses = existingAddresses.filter((addr: any) => addr._id?.toString() !== addressId)

    // If we deleted the default address and there are other addresses, set first one as default
    if (updatedAddresses.length > 0 && !updatedAddresses.some((addr: any) => addr.isDefault)) {
      updatedAddresses[0].isDefault = true
    }

    // Update using direct MongoDB operations
    const updateResult = await usersCollection.updateOne(
      { email: session.user.email },
      { 
        $set: { 
          addresses: updatedAddresses,
          lastLogin: new Date()
        }
      }
    )

    if (updateResult.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'Failed to delete address' },
        { status: 500 }
      )
    }

    // Return sanitized data
    const sanitizedAddresses = updatedAddresses.map((addr: any) => ({
      _id: addr._id,
      name: sanitizeString(addr.name || ''),
      city: sanitizeString(addr.city || ''),
      phone: sanitizeString(addr.phone || ''),
      addressDetails: sanitizeString(addr.addressDetails || ''),
      isDefault: Boolean(addr.isDefault)
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedAddresses,
      message: 'Address deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting address:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}