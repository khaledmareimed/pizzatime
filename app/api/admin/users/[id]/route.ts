import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { createCollection, User, UserSchema, UserIndexes, SystemLog, SystemLogSchema, SystemLogIndexes } from '@/funcs/collections'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create users collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Find the user
    const user = await userCollection.model
      .findById(id)
      .select('-password') // Exclude password field
      .lean()
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(user)

  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
    const body = await request.json()
    const { name, email, phone, role, addresses } = body

    // Create users collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Find the user
    const existingUser = await userCollection.model.findById(id).lean()
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (name !== undefined) updateData.name = name
    if (email !== undefined) updateData.email = email
    if (phone !== undefined) updateData.phone = phone
    if (role !== undefined) updateData.role = role
    if (addresses !== undefined) updateData.addresses = addresses

    // Update the user
    const updatedUser = await userCollection.model.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password').lean()

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
    }

    // Create system log for the update
    try {
      const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
        indexes: SystemLogIndexes
      })

      const logEntry = new systemLogCollection.model({
        userId: session.user.id,
        action: 'admin_user_updated',
        description: `تم تحديث بيانات المستخدم ${existingUser.name} (${existingUser.email})`,
        metadata: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          targetUserId: id,
          targetUserEmail: existingUser.email,
          updatedFields: Object.keys(updateData)
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      })

      await logEntry.save()
    } catch (logError) {
      console.error('Error creating system log:', logError)
      // Don't fail the user update if logging fails
    }

    return NextResponse.json(updatedUser)

  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create users collection
    const userCollection = await createCollection<User>('users', UserSchema, {
      indexes: UserIndexes
    })

    // Find the user first
    const existingUser = await userCollection.model.findById(id).lean()
    
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Prevent deleting admin users
    if (existingUser.role === 'admin') {
      return NextResponse.json({ error: 'Cannot delete admin users' }, { status: 403 })
    }

    // Delete the user
    await userCollection.model.findByIdAndDelete(id)

    // Create system log for the deletion
    try {
      const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
        indexes: SystemLogIndexes
      })

      const logEntry = new systemLogCollection.model({
        userId: session.user.id,
        action: 'admin_user_deleted',
        description: `تم حذف المستخدم ${existingUser.name} (${existingUser.email})`,
        metadata: {
          adminId: session.user.id,
          adminEmail: session.user.email,
          deletedUserId: id,
          deletedUserEmail: existingUser.email,
          deletedUserName: existingUser.name
        },
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        userAgent: request.headers.get('user-agent')
      })

      await logEntry.save()
    } catch (logError) {
      console.error('Error creating system log:', logError)
    }

    return NextResponse.json({ message: 'User deleted successfully' })

  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}