import { NextResponse } from 'next/server'
import { initializeApplication } from '@/funcs/startup'

/**
 * GET /api/init - Initialize the application
 * This endpoint ensures the database is connected and all collections are set up
 */
export async function GET() {
  try {
    await initializeApplication()
    
    return NextResponse.json({ 
      success: true,
      message: 'Application initialized successfully'
    })
  } catch (error) {
    console.error('Application initialization failed:', error)
    
    return NextResponse.json(
      { 
        success: false,
        error: 'Application initialization failed'
      },
      { status: 500 }
    )
  }
}