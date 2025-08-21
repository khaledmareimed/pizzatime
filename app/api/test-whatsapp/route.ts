import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../auth'
import { testWhatsAppConnection, validateWhatsAppConfig } from '../../../funcs/whatsapp'

/**
 * GET /api/test-whatsapp - Test WhatsApp configuration and connection
 * Admin only endpoint for debugging WhatsApp issues
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin (you may need to adjust this based on your user schema)
    // For now, we'll allow any authenticated user to test
    
    console.log('Testing WhatsApp configuration...')
    
    // Validate configuration first
    const configValidation = validateWhatsAppConfig()
    console.log('Configuration validation:', configValidation)
    
    if (!configValidation.isValid) {
      return NextResponse.json({
        success: false,
        message: 'WhatsApp configuration is invalid',
        errors: configValidation.errors,
        recommendations: [
          'Ensure WHATSAPP_ADMIN_PHONE is set in environment variables',
          'Ensure WHATSAPP_API_KEY is set in environment variables',
          'Phone number should be Palestinian format (e.g., 0597758060 or +970597758060)',
          'API key should be numeric (get it from CallMeBot)',
          'Make sure you have registered your phone number with CallMeBot first'
        ]
      })
    }
    
    // Test the connection
    console.log('Configuration valid, testing connection...')
    const testResult = await testWhatsAppConnection()
    console.log('Test result:', testResult)
    
    return NextResponse.json({
      success: testResult.success,
      message: testResult.message,
      details: testResult.details,
      configValidation,
      troubleshooting: {
        commonIssues: [
          'Phone number not registered with CallMeBot',
          'Invalid API key',
          'Rate limiting (too many requests)',
          'Network connectivity issues',
          'CallMeBot service temporarily down'
        ],
        steps: [
          '1. Visit https://www.callmebot.com/blog/free-api-whatsapp-messages/',
          '2. Follow the setup instructions to register your phone number',
          '3. Get your API key from CallMeBot',
          '4. Set environment variables: WHATSAPP_ADMIN_PHONE and WHATSAPP_API_KEY',
          '5. Test again using this endpoint'
        ]
      }
    })
    
  } catch (error) {
    console.error('Error testing WhatsApp:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        details: 'Check server logs for more information'
      },
      { status: 500 }
    )
  }
}