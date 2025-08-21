import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/debug-whatsapp - Debug WhatsApp URL format
 * This endpoint helps debug the exact URL being sent to CallMeBot
 */
export async function GET(request: NextRequest) {
  try {
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE
    const apiKey = process.env.WHATSAPP_API_KEY

    console.log('Environment variables check:', {
      hasPhone: !!adminPhone,
      hasApiKey: !!apiKey,
      phoneValue: adminPhone,
      apiKeyValue: apiKey
    })

    if (!adminPhone || !apiKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          WHATSAPP_ADMIN_PHONE: adminPhone || 'MISSING',
          WHATSAPP_API_KEY: apiKey ? 'PRESENT' : 'MISSING'
        }
      })
    }

    // Simple test message
    const testMessage = 'Test message from restaurant app'
    const encodedMessage = encodeURIComponent(testMessage)
    
    // Build the exact URL that would be sent
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodedMessage}&apikey=${apiKey}`
    
    console.log('Generated URL:', apiUrl)
    
    // Test the actual request
    console.log('Testing CallMeBot API...')
    
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Restaurant-App/1.0'
      }
    })

    const responseText = await response.text()
    
    console.log('CallMeBot response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText
    })

    return NextResponse.json({
      success: response.status === 200,
      testUrl: apiUrl,
      response: {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      },
      environment: {
        phone: adminPhone,
        hasApiKey: !!apiKey,
        apiKeyLength: apiKey?.length || 0
      },
      troubleshooting: {
        expectedFormat: 'https://api.callmebot.com/whatsapp.php?phone=+970597758060&text=message&apikey=1234567890',
        yourFormat: `https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=message&apikey=${apiKey}`,
        steps: [
          '1. Make sure your phone number is registered with CallMeBot',
          '2. Visit: https://www.callmebot.com/blog/free-api-whatsapp-messages/',
          '3. Send the activation message to the CallMeBot WhatsApp number',
          '4. Get your API key from the confirmation message',
          '5. Set environment variables correctly'
        ]
      }
    })
    
  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}