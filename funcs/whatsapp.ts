/**
 * WhatsApp Notification Service using CallMeBot API
 * 
 * Sends WhatsApp messages to admin when important events occur
 * such as new orders, order status changes, etc.
 */

import { formatJordanCurrency } from './jordanLocale'

interface WhatsAppMessage {
  phone: string
  text: string
  apikey: string
}

interface OrderNotificationData {
  orderId: string
  customerName: string
  customerPhone: string
  total: number
  items: Array<{
    productName: string
    quantity: number
    price: number
  }>
  deliveryMethod: string
  paymentMethod: string
  orderDate: string
}

/**
 * Validate and format phone number for CallMeBot API
 * CallMeBot expects format: +countrycodephonenumber (e.g., +34123123123)
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digit characters except +
  let cleanPhone = phone.replace(/[^\d+]/g, '')
  
  // If already starts with +, return as is
  if (cleanPhone.startsWith('+')) {
    return cleanPhone
  }
  
  // Remove any + that's not at the beginning
  cleanPhone = cleanPhone.replace(/\+/g, '')
  
  // If starts with 970, add + prefix
  if (cleanPhone.startsWith('970')) {
    return '+' + cleanPhone
  }
  
  // If starts with 0, replace with +970
  if (cleanPhone.startsWith('0')) {
    return '+970' + cleanPhone.substring(1)
  }
  
  // If doesn't start with country code, assume it's Palestinian and add +970
  if (!cleanPhone.startsWith('970')) {
    return '+970' + cleanPhone
  }
  
  return '+' + cleanPhone
}

/**
 * Truncate message if it exceeds CallMeBot limits
 */
function truncateMessage(message: string, maxLength: number = 1000): string {
  if (message.length <= maxLength) {
    return message
  }
  
  // Truncate and add indication
  return message.substring(0, maxLength - 20) + '\n\n... (تم اختصار الرسالة)'
}

/**
 * Send WhatsApp message using CallMeBot API with enhanced error handling and retry logic
 */
export async function sendWhatsAppMessage(message: string, retryCount: number = 2): Promise<boolean> {
  try {
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE
    const apiKey = process.env.WHATSAPP_API_KEY

    console.log('WhatsApp function called with:', {
      hasPhone: !!adminPhone,
      hasApiKey: !!apiKey,
      phone: adminPhone,
      messageLength: message.length
    })

    // Validate credentials
    if (!adminPhone || !apiKey) {
      console.warn('WhatsApp credentials not configured in environment variables', {
        adminPhone: adminPhone || 'missing',
        apiKey: apiKey ? 'present' : 'missing'
      })
      return false
    }

    // Validate API key format (CallMeBot keys are typically numeric)
    if (!/^\d+$/.test(apiKey)) {
      console.error('Invalid API key format. CallMeBot API keys should be numeric.')
      return false
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(adminPhone)
    console.log('Formatted phone number:', formattedPhone)

    // Validate phone number (Palestinian numbers: +970 + 9 digits = 13 characters total)
    if (!formattedPhone || formattedPhone.length !== 13 || !formattedPhone.startsWith('+970')) {
      console.error('Invalid phone number format:', formattedPhone, 'Expected format: +970xxxxxxxxx (13 characters total)')
      return false
    }

    // Truncate message if too long
    const truncatedMessage = truncateMessage(message)
    if (truncatedMessage !== message) {
      console.warn('Message was truncated due to length limits')
    }

    // URL encode the message properly
    const encodedMessage = encodeURIComponent(truncatedMessage)
    
    // Build the API URL with formatted phone
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=${encodedMessage}&apikey=${apiKey}`
    
    console.log('Sending WhatsApp request to:', `https://api.callmebot.com/whatsapp.php?phone=${formattedPhone}&text=[MESSAGE]&apikey=[HIDDEN]`)

    // Send the request with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Restaurant-App/1.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      },
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('WhatsApp API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      url: response.url
    })

    const responseText = await response.text()
    console.log('WhatsApp API response body:', responseText)

    // CallMeBot specific status codes
    if (response.status === 200) {
      console.log('WhatsApp message sent successfully')
      return true
    } else if (response.status === 203) {
      console.error('CallMeBot API returned 203: Possible invalid API key or phone number not registered')
      return false
    } else if (response.status === 403) {
      console.error('CallMeBot API returned 403: Access forbidden. Check API key and phone number registration')
      return false
    } else if (response.status === 429) {
      console.error('CallMeBot API returned 429: Rate limit exceeded. Please wait before sending more messages')
      // Retry after delay for rate limiting
      if (retryCount > 0) {
        console.log(`Retrying WhatsApp message in 5 seconds... (${retryCount} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 5000))
        return sendWhatsAppMessage(message, retryCount - 1)
      }
      return false
    } else {
      console.error('Failed to send WhatsApp message:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText
      })
      
      // Retry for server errors (5xx) or network issues
      if ((response.status >= 500 || response.status === 0) && retryCount > 0) {
        console.log(`Retrying WhatsApp message due to server error... (${retryCount} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 2000))
        return sendWhatsAppMessage(message, retryCount - 1)
      }
      return false
    }
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('WhatsApp request timed out')
      // Retry on timeout
      if (retryCount > 0) {
        console.log(`Retrying WhatsApp message after timeout... (${retryCount} attempts left)`)
        return sendWhatsAppMessage(message, retryCount - 1)
      }
    } else {
      console.error('Error sending WhatsApp message:', error)
      // Retry on network errors
      if (retryCount > 0) {
        console.log(`Retrying WhatsApp message after error... (${retryCount} attempts left)`)
        await new Promise(resolve => setTimeout(resolve, 1000))
        return sendWhatsAppMessage(message, retryCount - 1)
      }
    }
    return false
  }
}

/**
 * Send new order notification to admin
 */
export async function sendNewOrderNotification(orderData: OrderNotificationData): Promise<boolean> {
  try {
    const { orderId, customerName, customerPhone, total, items, deliveryMethod, paymentMethod, orderDate } = orderData

    // Format the message in Arabic
    const message = `*طلب جديد!*

*رقم الطلب:* #${orderId.slice(-6)}
*العميل:* ${customerName}
*الهاتف:* ${customerPhone}
*المبلغ الإجمالي:* ${formatJordanCurrency(total)}

*الأصناف:*
${items.map(item => `- ${item.productName} x${item.quantity} - ${formatJordanCurrency(item.price * item.quantity)}`).join('\n')}

*طريقة التوصيل:* ${deliveryMethod === 'delivery' ? 'توصيل' : 'استلام'}
*طريقة الدفع:* ${paymentMethod === 'cash' ? 'نقداً' : paymentMethod}
*وقت الطلب:* ${new Date(orderDate).toLocaleString('ar-JO', { timeZone: 'Asia/Amman' })}

يرجى مراجعة لوحة التحكم لتأكيد الطلب.`

    return await sendWhatsAppMessage(message)
  } catch (error) {
    console.error('Error sending new order notification:', error)
    return false
  }
}

/**
 * Send order status update notification
 */
export async function sendOrderStatusNotification(
  orderId: string, 
  customerName: string, 
  oldStatus: string, 
  newStatus: string
): Promise<boolean> {
  try {
    const statusTranslations: Record<string, string> = {
      pending: 'في الانتظار',
      confirmed: 'مؤكد',
      preparing: 'قيد التحضير',
      ready: 'جاهز',
      'out-for-delivery': 'في الطريق',
      delivered: 'تم التوصيل',
      cancelled: 'ملغي'
    }

    const message = `*تحديث حالة الطلب*

*رقم الطلب:* #${orderId.slice(-6)}
*العميل:* ${customerName}
*الحالة السابقة:* ${statusTranslations[oldStatus] || oldStatus}
*الحالة الجديدة:* ${statusTranslations[newStatus] || newStatus}
*وقت التحديث:* ${new Date().toLocaleString('ar-JO', { timeZone: 'Asia/Amman' })}`

    return await sendWhatsAppMessage(message)
  } catch (error) {
    console.error('Error sending order status notification:', error)
    return false
  }
}

/**
 * Send payment status notification
 */
export async function sendPaymentStatusNotification(
  orderId: string,
  customerName: string,
  amount: number,
  paymentStatus: string
): Promise<boolean> {
  try {
    const statusTranslations: Record<string, string> = {
      paid: 'مدفوع',
      pending: 'في الانتظار',
      failed: 'فشل',
      refunded: 'مسترد'
    }

    const message = `*تحديث حالة الدفع*

*رقم الطلب:* #${orderId.slice(-6)}
*العميل:* ${customerName}
*المبلغ:* ${formatJordanCurrency(amount)}
*حالة الدفع:* ${statusTranslations[paymentStatus] || paymentStatus}
*وقت التحديث:* ${new Date().toLocaleString('ar-JO', { timeZone: 'Asia/Amman' })}`

    return await sendWhatsAppMessage(message)
  } catch (error) {
    console.error('Error sending payment status notification:', error)
    return false
  }
}

/**
 * Send daily sales summary
 */
export async function sendDailySalesSummary(
  totalOrders: number,
  totalRevenue: number,
  topProducts: Array<{ name: string; quantity: number }>
): Promise<boolean> {
  try {
    const today = new Date().toLocaleDateString('ar-JO', { timeZone: 'Asia/Amman' })
    
    const message = `*ملخص المبيعات اليومية*

*التاريخ:* ${today}
*عدد الطلبات:* ${totalOrders}
*إجمالي الإيرادات:* ${formatJordanCurrency(totalRevenue)}

*أكثر المنتجات مبيعاً:*
${topProducts.slice(0, 5).map((product, index) => `${index + 1}. ${product.name} (${product.quantity} قطعة)`).join('\n')}

شكراً لكم على عملكم الجاد!`

    return await sendWhatsAppMessage(message)
  } catch (error) {
    console.error('Error sending daily sales summary:', error)
    return false
  }
}

/**
 * Send order cancellation notification to admin
 */
export async function sendOrderCancellationNotification(
  orderId: string,
  customerName: string,
  customerPhone: string,
  total: number,
  cancellationReason: string = 'طلب العميل'
): Promise<boolean> {
  try {
    const message = `طلب ملغي

رقم الطلب: ${orderId.slice(-6)}
اسم العميل: ${customerName}
رقم الهاتف: ${customerPhone}
المبلغ: ${formatJordanCurrency(total)}
سبب الالغاء: ${cancellationReason}
وقت الالغاء: ${new Date().toLocaleString('ar-JO', { timeZone: 'Asia/Amman' })}

يرجى مراجعة النظام`

    return await sendWhatsAppMessage(message)
  } catch (error) {
    console.error('Error sending order cancellation notification:', error)
    return false
  }
}

/**
 * Validate WhatsApp configuration
 */
export function validateWhatsAppConfig(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  const adminPhone = process.env.WHATSAPP_ADMIN_PHONE
  const apiKey = process.env.WHATSAPP_API_KEY

  if (!adminPhone) {
    errors.push('WHATSAPP_ADMIN_PHONE environment variable is missing')
  } else {
    const formattedPhone = formatPhoneNumber(adminPhone)
    if (!formattedPhone || formattedPhone.length !== 13 || !formattedPhone.startsWith('+970')) {
      errors.push(`Invalid phone number format: ${adminPhone}. Should be Palestinian number (e.g., 0597758060 or +970597758060). Formatted as: ${formattedPhone} (expected 13 characters: +970xxxxxxxxx)`)
    }
  }

  if (!apiKey) {
    errors.push('WHATSAPP_API_KEY environment variable is missing')
  } else if (!/^\d+$/.test(apiKey)) {
    errors.push('WHATSAPP_API_KEY should be numeric (CallMeBot API keys are numbers)')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Test WhatsApp connection with detailed diagnostics
 */
export async function testWhatsAppConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    // First validate configuration
    const configValidation = validateWhatsAppConfig()
    if (!configValidation.isValid) {
      return {
        success: false,
        message: 'Configuration validation failed',
        details: { errors: configValidation.errors }
      }
    }

    const testMessage = `*اختبار اتصال WhatsApp*

تم إرسال هذه الرسالة لاختبار اتصال WhatsApp API.
الوقت: ${new Date().toLocaleString('ar-JO', { timeZone: 'Asia/Amman' })}

إذا تلقيت هذه الرسالة، فإن النظام يعمل بشكل صحيح!`

    const result = await sendWhatsAppMessage(testMessage)
    
    if (result) {
      return {
        success: true,
        message: 'WhatsApp test message sent successfully'
      }
    } else {
      return {
        success: false,
        message: 'Failed to send WhatsApp test message. Check logs for details.',
        details: {
          phone: formatPhoneNumber(process.env.WHATSAPP_ADMIN_PHONE || ''),
          hasApiKey: !!process.env.WHATSAPP_API_KEY
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      message: 'Error during WhatsApp connection test',
      details: { error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }
}