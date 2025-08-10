import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { ensureUserExists } from '@/funcs/middleware/userAuth'

// POST /api/users/init - Initialize user in database after authentication
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'غير مصرح لك بالوصول' },
        { status: 401 }
      )
    }

    // Ensure user exists in database
    const user = await ensureUserExists()
    
    if (user) {
      return NextResponse.json({
        success: true,
        message: 'تم تهيئة المستخدم بنجاح',
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      })
    } else {
      return NextResponse.json(
        { error: 'فشل في تهيئة المستخدم' },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Error initializing user:', error)
    return NextResponse.json(
      { error: 'خطأ في تهيئة المستخدم' },
      { status: 500 }
    )
  }
}