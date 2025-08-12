/**
 * WhatsApp Notification Service using CallMeBot API
 * 
 * Sends WhatsApp messages to admin when important events occur
 * such as new orders, order status changes, etc.
 */

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
 * Send WhatsApp message using CallMeBot API
 */
export async function sendWhatsAppMessage(message: string): Promise<boolean> {
  try {
    const adminPhone = process.env.WHATSAPP_ADMIN_PHONE
    const apiKey = process.env.WHATSAPP_API_KEY

    console.log('WhatsApp function called with:', {
      hasPhone: !!adminPhone,
      hasApiKey: !!apiKey,
      phone: adminPhone,
      messageLength: message.length
    })

    if (!adminPhone || !apiKey) {
      console.warn('WhatsApp credentials not configured in environment variables', {
        adminPhone: adminPhone || 'missing',
        apiKey: apiKey ? 'present' : 'missing'
      })
      return false
    }

    // URL encode the message
    const encodedMessage = encodeURIComponent(message)
    
    // Build the API URL
    const apiUrl = `https://api.callmebot.com/whatsapp.php?phone=${adminPhone}&text=${encodedMessage}&apikey=${apiKey}`
    
    console.log('Sending WhatsApp request to:', apiUrl.substring(0, 100) + '...')

    // Send the request
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'Restaurant-App/1.0'
      }
    })

    console.log('WhatsApp API response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })

    if (response.ok) {
      const responseText = await response.text()
      console.log('WhatsApp API response body:', responseText)
      console.log('WhatsApp message sent successfully')
      return true
    } else {
      const errorText = await response.text()
      console.error('Failed to send WhatsApp message:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      return false
    }
  } catch (error) {
    console.error('Error sending WhatsApp message:', error)
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
*المبلغ الإجمالي:* ${total.toFixed(2)} ر.س

*الأصناف:*
${items.map(item => `- ${item.productName} x${item.quantity} - ${(item.price * item.quantity).toFixed(2)} ر.س`).join('\n')}

*طريقة التوصيل:* ${deliveryMethod === 'delivery' ? 'توصيل' : 'استلام'}
*طريقة الدفع:* ${paymentMethod === 'cash' ? 'نقداً' : paymentMethod}
*وقت الطلب:* ${new Date(orderDate).toLocaleString('ar-SA')}

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
*وقت التحديث:* ${new Date().toLocaleString('ar-SA')}`

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
*المبلغ:* ${amount.toFixed(2)} ر.س
*حالة الدفع:* ${statusTranslations[paymentStatus] || paymentStatus}
*وقت التحديث:* ${new Date().toLocaleString('ar-SA')}`

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
    const today = new Date().toLocaleDateString('ar-SA')
    
    const message = `*ملخص المبيعات اليومية*

*التاريخ:* ${today}
*عدد الطلبات:* ${totalOrders}
*إجمالي الإيرادات:* ${totalRevenue.toFixed(2)} ر.س

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
 * Test WhatsApp connection
 */
export async function testWhatsAppConnection(): Promise<boolean> {
  const testMessage = `🧪 *اختبار اتصال WhatsApp*

تم إرسال هذه الرسالة لاختبار اتصال WhatsApp API.
الوقت: ${new Date().toLocaleString('ar-SA')}

إذا تلقيت هذه الرسالة، فإن النظام يعمل بشكل صحيح! ✅`

  return await sendWhatsAppMessage(testMessage)
}