import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/test-simple-cancel - Test simple cancellation message
 * This sends a basic cancellation message to test the CallMeBot setup
 */
export async function GET(request: NextRequest) {
  try {
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE
    const apiKey = process.env.WHATSAPP_API_KEY

    if (!adminPhone || !apiKey) {
      return NextResponse.json({
        error: 'Missing environment variables',
        details: {
          WHATSAPP_ADMIN_PHONE: adminPhone || 'MISSING',
          WHATSAPP_API_KEY: apiKey ? 'PRESENT' : 'MISSING'
        }
      })
    }

    // Simple cancellation message (no Arabic, no special formatting)
    const simpleMessage = `Order Cancelled

Order ID: #123456
Customer: Test Customer
Phone: +970597758060
Amount: 25.00 JOD
Reason: Customer request
Time: ${new Date().toISOString()}

Please check dashboard.`

    const encodedMessage = encodeURIComponent(simpleMessage)
    
    // Build the exact URL
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodedMessage}&apikey=${apiKey}`
    
    console.log('Simple cancellation test URL:', apiUrl)
    console.log('Phone format:', adminPhone)
    console.log('API key format:', apiKey)
    console.log('Message length:', simpleMessage.length)
    
    // Test the request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Restaurant-App/1.0'
      }
    })

    const responseText = await response.text()
    
    console.log('Simple cancellation response:', {
      status: response.status,
      statusText: response.statusText,
      body: responseText.substring(0, 200) + '...'
    })

    return NextResponse.json({
      success: response.status === 200,
      message: response.status === 200 ? 'Simple cancellation message sent successfully!' : 'Failed to send message',
      details: {
        status: response.status,
        statusText: response.statusText,
        responsePreview: responseText.substring(0, 200),
        phoneUsed: adminPhone,
        messageLength: simpleMessage.length,
        urlGenerated: `https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=[MESSAGE]&apikey=[HIDDEN]`
      },
      nextSteps: response.status !== 200 ? [
        'Check if your phone number is properly registered with CallMeBot',
        'Verify your API key is correct',
        'Make sure you completed the CallMeBot activation process',
        'Try visiting the debug endpoint: /api/debug-whatsapp'
      ] : [
        'Great! CallMeBot is working',
        'You can now use the regular WhatsApp notifications'
      ]
    })
    
  } catch (error) {
    console.error('Error in simple cancel test:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}