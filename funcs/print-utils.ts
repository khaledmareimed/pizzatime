/**
 * Enterprise-level print utilities for restaurant operations
 * Handles multiple receipt types, thermal printer optimization, and restaurant workflows
 */

import { formatJordanDateTime, formatJordanCurrency } from './jordanLocale'

// Enterprise Receipt Types
export type ReceiptType = 
  | 'customer'        // Customer receipt with full details
  | 'kitchen'         // Kitchen ticket for food preparation
  | 'delivery'        // Delivery slip with address and customer info
  | 'cashier'         // Cashier copy with payment details
  | 'manager'         // Manager report with costs and margins
  | 'invoice'         // Formal invoice for business customers

// Printer Configuration
export interface PrinterConfig {
  type: 'thermal' | 'laser' | 'inkjet'
  width: 58 | 80 | 110 // mm for thermal printers
  charactersPerLine: number
  supportsBold: boolean
  supportsUnderline: boolean
  supportsBarcode: boolean
  supportsQR: boolean
  autocut: boolean
}

// Restaurant Settings
export interface RestaurantInfo {
  name: string
  nameEnglish?: string
  address: string
  phone: string
  email?: string
  website?: string
  taxNumber?: string
  crNumber?: string // Commercial Registration
  logo?: string
  slogan?: string
  workingHours?: string
  socialMedia?: {
    instagram?: string
    facebook?: string
    whatsapp?: string
  }
}

interface PrintOrderItem {
  productId: string
  productName: string
  productNameEnglish?: string
  quantity: number
  price: number
  originalPrice: number
  cost?: number // For manager reports
  categoryName?: string
  addons: Array<{
    id: string
    name: string
    nameEnglish?: string
    price: number
  }>
  options: Array<{
    optionTitle: string
    optionTitleEnglish?: string
    choiceName: string
    choiceNameEnglish?: string
    choicePrice: number
  }>
  comments?: string
  kitchenNotes?: string
  preparationTime?: number // minutes
  isSpicy?: boolean
  allergens?: string[]
}

interface PrintOrder {
  _id: string
  orderId: string
  posOrderId?: string
  createdAt: string
  updatedAt?: string
  estimatedDeliveryTime?: string
  items: PrintOrderItem[]
  orderSummary: {
    subtotal: number
    addonsTotal: number
    optionsTotal: number
    deliveryFee: number
    serviceFee?: number
    tax?: number
    couponDiscount: number
    manualDiscount: number
    total: number
    totalCost?: number // For manager reports
    profit?: number // For manager reports
  }
  deliveryMethod: 'pickup' | 'delivery'
  paymentMethod: string
  paymentStatus: string
  status: string
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  deliveryAddress?: {
    recipientName?: string
    phone?: string
    alternativePhone?: string
    city?: string
    area?: string
    street?: string
    building?: string
    floor?: string
    apartment?: string
    addressDetails?: string
    landmark?: string
    coordinates?: {
      lat: number
      lng: number
    }
  }
  customerInfo?: {
    name?: string
    phone?: string
    email?: string
    loyaltyPoints?: number
    customerType?: 'regular' | 'vip' | 'new'
  }
  notes?: string
  kitchenNotes?: string
  deliveryNotes?: string
  isInternalOrder?: boolean
  userId: string
  cashierName?: string
  serverName?: string
  tableNumber?: string
  couponCode?: string
  loyaltyPointsUsed?: number
  loyaltyPointsEarned?: number
}

// Default restaurant configuration - should be loaded from settings
const DEFAULT_RESTAURANT_INFO: RestaurantInfo = {
  name: 'بيتزا تايم',
  nameEnglish: 'Pizza Time',
  address: 'الزرقاء، الجبل الأبيض، الأردن',
  phone: '+962 6 123 4567',
  email: 'info@pizzatimejo.com',
  website: 'pizzatimejo.com',
  taxNumber: '123456789',
  crNumber: 'CR-2024-001',
  slogan: 'أفضل بيتزا في الأردن',
  workingHours: 'يومياً من 10:00 ص - 12:00 م',
  socialMedia: {
    instagram: '@pizzatime_jo',
    whatsapp: '+962791234567'
  }
}

const DEFAULT_PRINTER_CONFIG: PrinterConfig = {
  type: 'thermal',
  width: 80,
  charactersPerLine: 32, // Optimized for 80mm thermal printers
  supportsBold: true,
  supportsUnderline: true,
  supportsBarcode: true,
  supportsQR: false,
  autocut: true
}

/**
 * Generate enterprise-level receipt based on type
 */
export function generateReceipt(
  order: PrintOrder, 
  type: ReceiptType = 'customer',
  restaurantInfo: RestaurantInfo = DEFAULT_RESTAURANT_INFO,
  printerConfig: PrinterConfig = DEFAULT_PRINTER_CONFIG
): string {
  switch (type) {
    case 'customer':
      return generateCustomerReceipt(order, restaurantInfo, printerConfig)
    case 'kitchen':
      return generateKitchenTicket(order, restaurantInfo, printerConfig)
    case 'delivery':
      return generateDeliverySlip(order, restaurantInfo, printerConfig)
    case 'cashier':
      return generateCashierCopy(order, restaurantInfo, printerConfig)
    case 'manager':
      return generateManagerReport(order, restaurantInfo, printerConfig)
    case 'invoice':
      return generateInvoice(order, restaurantInfo, printerConfig)
    default:
      return generateCustomerReceipt(order, restaurantInfo, printerConfig)
  }
}

/**
 * Customer Receipt - Full-width A4 HTML that scales to thermal paper
 */
function generateCustomerReceipt(
  order: PrintOrder, 
  restaurant: RestaurantInfo, 
  config: PrinterConfig
): string {
  const orderNumber = order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)
  const customerName = order.customerInfo?.name || order.deliveryAddress?.recipientName
  const customerPhone = order.customerInfo?.phone || order.deliveryAddress?.phone
  
  return `
    <div class="receipt-container">
      <!-- Header -->
      <div class="receipt-header">
        <h1 class="restaurant-name">بيتزا تايم - Pizza Time</h1>
        <p class="restaurant-info">الزرقاء، الجبل الأبيض، الأردن</p>
        <p class="restaurant-info">هاتف: ${restaurant.phone}</p>
        <p class="restaurant-info">pizzatimejo.com</p>
        <div class="separator"></div>
      </div>

      <!-- Order Info -->
      <div class="order-info">
        <div class="order-details">
          <div class="detail-row">
            <span class="label">رقم الطلب:</span>
            <span class="value">#${orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="label">التاريخ:</span>
            <span class="value">${formatJordanDateTime(order.createdAt)}</span>
          </div>
          <div class="detail-row">
            <span class="label">طريقة التوصيل:</span>
            <span class="value">${order.deliveryMethod === 'pickup' ? 'استلام' : 'توصيل'}</span>
          </div>
          <div class="detail-row">
            <span class="label">طريقة الدفع:</span>
            <span class="value">${getPaymentMethodArabic(order.paymentMethod)}</span>
          </div>
          ${order.tableNumber ? `
          <div class="detail-row">
            <span class="label">رقم الطاولة:</span>
            <span class="value">${order.tableNumber}</span>
          </div>` : ''}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Customer Info -->
      ${customerName || customerPhone ? `
      <div class="customer-info">
        <h3 class="section-title">معلومات العميل</h3>
        ${customerName ? `<p class="customer-detail">الاسم: ${customerName}</p>` : ''}
        ${customerPhone ? `<p class="customer-detail">الهاتف: ${customerPhone}</p>` : ''}
        ${order.customerInfo?.customerType === 'vip' ? '<p class="vip-badge">عميل VIP</p>' : ''}
        <div class="separator"></div>
      </div>` : ''}

      <!-- Delivery Address -->
      ${order.deliveryMethod === 'delivery' && order.deliveryAddress ? `
      <div class="delivery-info">
        <h3 class="section-title">عنوان التوصيل</h3>
        <div class="address-details">
          ${order.deliveryAddress.recipientName ? `<p><strong>اسم المستلم:</strong> ${order.deliveryAddress.recipientName}</p>` : ''}
          ${order.deliveryAddress.phone ? `<p><strong>رقم الهاتف:</strong> ${order.deliveryAddress.phone}</p>` : ''}
          ${order.deliveryAddress.alternativePhone ? `<p><strong>هاتف بديل:</strong> ${order.deliveryAddress.alternativePhone}</p>` : ''}
          ${order.deliveryAddress.city ? `<p><strong>المدينة:</strong> ${order.deliveryAddress.city}</p>` : ''}
          ${order.deliveryAddress.area ? `<p><strong>المنطقة/الحي:</strong> ${order.deliveryAddress.area}</p>` : ''}
          ${order.deliveryAddress.street ? `<p><strong>الشارع:</strong> ${order.deliveryAddress.street}</p>` : ''}
          ${order.deliveryAddress.building ? `<p><strong>رقم المبنى:</strong> ${order.deliveryAddress.building}</p>` : ''}
          ${order.deliveryAddress.floor ? `<p><strong>الطابق:</strong> ${order.deliveryAddress.floor}</p>` : ''}
          ${order.deliveryAddress.apartment ? `<p><strong>رقم الشقة:</strong> ${order.deliveryAddress.apartment}</p>` : ''}
          ${order.deliveryAddress.addressDetails ? `<p><strong>تفاصيل العنوان:</strong> ${order.deliveryAddress.addressDetails}</p>` : ''}
          ${order.deliveryAddress.landmark ? `<p><strong>معلم مميز:</strong> ${order.deliveryAddress.landmark}</p>` : ''}
          ${order.deliveryNotes ? `<p><strong>ملاحظات التوصيل:</strong> ${order.deliveryNotes}</p>` : ''}
        </div>
        <div class="separator"></div>
      </div>` : ''}

      <!-- Items -->
      <div class="items-section">
        <h3 class="section-title">المنتجات</h3>
        <div class="items-list">
          ${order.items.map((item, index) => `
            <div class="item">
              <div class="item-header">
                <span class="item-number">${index + 1}.</span>
                <span class="item-name">${item.productName}</span>
                <span class="item-total">${formatJordanCurrency(item.price * item.quantity)}</span>
              </div>
              <div class="item-details">
                <span class="quantity-price">${item.quantity} × ${formatJordanCurrency(item.price)}</span>
              </div>
              
              ${item.addons.length > 0 ? `
              <div class="addons">
                ${item.addons.map(addon => `
                  <div class="addon">+ ${addon.name} ${formatJordanCurrency(addon.price)}</div>
                `).join('')}
              </div>` : ''}
              
              ${item.options.length > 0 ? `
              <div class="options">
                ${item.options.map(option => `
                  <div class="option">- ${option.choiceName}${option.choicePrice > 0 ? ` (+${formatJordanCurrency(option.choicePrice)})` : ''}</div>
                `).join('')}
              </div>` : ''}
              
              ${item.comments ? `<div class="item-comment">ملاحظة: ${item.comments}</div>` : ''}
              ${item.isSpicy ? '<div class="spicy-indicator">حار</div>' : ''}
              ${item.allergens && item.allergens.length > 0 ? `<div class="allergen-warning">تحذير حساسية: ${item.allergens.join(', ')}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Order Summary -->
      <div class="summary-section">
        <h3 class="section-title">ملخص الفاتورة</h3>
        <div class="summary-lines">
          <div class="summary-line">
            <span class="summary-label">المجموع الفرعي:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.subtotal)}</span>
          </div>
          
          ${order.orderSummary.addonsTotal > 0 ? `
          <div class="summary-line">
            <span class="summary-label">الإضافات:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.addonsTotal)}</span>
          </div>` : ''}
          
          ${order.orderSummary.optionsTotal > 0 ? `
          <div class="summary-line">
            <span class="summary-label">الخيارات:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.optionsTotal)}</span>
          </div>` : ''}
          
          ${order.orderSummary.serviceFee && order.orderSummary.serviceFee > 0 ? `
          <div class="summary-line">
            <span class="summary-label">رسوم الخدمة:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.serviceFee)}</span>
          </div>` : ''}
          
          ${order.orderSummary.deliveryFee > 0 ? `
          <div class="summary-line">
            <span class="summary-label">رسوم التوصيل:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.deliveryFee)}</span>
          </div>` : ''}
          
          ${order.orderSummary.tax && order.orderSummary.tax > 0 ? `
          <div class="summary-line">
            <span class="summary-label">الضريبة:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.tax)}</span>
          </div>` : ''}
          
          ${order.orderSummary.couponDiscount > 0 ? `
          <div class="summary-line discount">
            <span class="summary-label">خصم الكوبون:</span>
            <span class="summary-value">-${formatJordanCurrency(order.orderSummary.couponDiscount)}</span>
          </div>` : ''}
          
          ${order.orderSummary.manualDiscount > 0 ? `
          <div class="summary-line discount">
            <span class="summary-label">خصم إداري:</span>
            <span class="summary-value">-${formatJordanCurrency(order.orderSummary.manualDiscount)}</span>
          </div>` : ''}
        </div>
        
        <div class="total-separator"></div>
        <div class="total-line">
          <span class="total-label">المجموع الكلي:</span>
          <span class="total-value">${formatJordanCurrency(order.orderSummary.total)}</span>
        </div>
        <div class="separator"></div>
      </div>

      <!-- Status -->
      <div class="status-section">
        <div class="status-row">
          <span class="status-label">حالة الدفع:</span>
          <span class="status-value payment-${order.paymentStatus}">${getPaymentStatusArabic(order.paymentStatus)}</span>
        </div>
        <div class="status-row">
          <span class="status-label">حالة الطلب:</span>
          <span class="status-value order-${order.status}">${getOrderStatusArabic(order.status)}</span>
        </div>
        ${order.notes ? `<div class="notes"><strong>ملاحظات:</strong> ${order.notes}</div>` : ''}
        <div class="separator"></div>
      </div>

      <!-- Footer -->
      <div class="receipt-footer">
        <p class="thank-you">شكراً لزيارتكم</p>
        <p class="return-message">نتطلع لخدمتكم مرة أخرى</p>
        
        ${restaurant.socialMedia?.whatsapp ? `<p class="contact-info">واتساب: ${restaurant.socialMedia.whatsapp}</p>` : ''}
        ${restaurant.socialMedia?.instagram ? `<p class="contact-info">انستغرام: ${restaurant.socialMedia.instagram}</p>` : ''}
        
        <div class="tax-info">
          ${restaurant.taxNumber ? `<p>الرقم الضريبي: ${restaurant.taxNumber}</p>` : ''}
          ${restaurant.crNumber ? `<p>رقم السجل التجاري: ${restaurant.crNumber}</p>` : ''}
        </div>
        
        <div class="print-time">
          <p>تاريخ الطباعة: ${formatJordanDateTime(new Date().toISOString())}</p>
        </div>
        
        ${config.supportsBarcode ? `<div class="barcode">*${orderNumber}*</div>` : ''}
      </div>
    </div>
  `
}

/**
 * Kitchen Ticket - HTML format optimized for kitchen use
 */
function generateKitchenTicket(
  order: PrintOrder, 
  restaurant: RestaurantInfo, 
  config: PrinterConfig
): string {
  const orderNumber = order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)
  
  return `
    <div class="receipt-container kitchen-ticket">
      <!-- Kitchen Header -->
      <div class="receipt-header">
        <h1 class="kitchen-title">تذكرة المطبخ</h1>
        <h2 class="order-number">طلب #${orderNumber}</h2>
        ${order.priority === 'urgent' ? '<div class="priority urgent">*** عاجل ***</div>' : ''}
        ${order.priority === 'high' ? '<div class="priority high">** أولوية عالية **</div>' : ''}
        <div class="separator"></div>
      </div>

      <!-- Order Info -->
      <div class="order-info">
        <div class="detail-row">
          <span class="label">الوقت:</span>
          <span class="value">${new Date(order.createdAt).toLocaleTimeString('ar-JO')}</span>
        </div>
        <div class="detail-row">
          <span class="label">النوع:</span>
          <span class="value">${order.deliveryMethod === 'pickup' ? 'استلام' : 'توصيل'}</span>
        </div>
        ${order.tableNumber ? `
        <div class="detail-row">
          <span class="label">الطاولة:</span>
          <span class="value">${order.tableNumber}</span>
        </div>` : ''}
        <div class="separator"></div>
      </div>

      <!-- Items for Kitchen -->
      <div class="items-section">
        <h3 class="section-title">المنتجات للتحضير</h3>
        <div class="items-list">
          ${order.items.map((item, index) => `
            <div class="item kitchen-item">
              <div class="item-header">
                <span class="item-quantity">${item.quantity}x</span>
                <span class="item-name">${item.productName}</span>
              </div>
              
              ${item.addons.length > 0 ? `
              <div class="addons">
                ${item.addons.map(addon => `
                  <div class="addon">+ ${addon.name}</div>
                `).join('')}
              </div>` : ''}
              
              ${item.options.length > 0 ? `
              <div class="options">
                ${item.options.map(option => `
                  <div class="option">- ${option.choiceName}</div>
                `).join('')}
              </div>` : ''}
              
              ${item.isSpicy ? '<div class="spicy-indicator">حار</div>' : ''}
              ${item.allergens && item.allergens.length > 0 ? `<div class="allergen-warning">حساسية: ${item.allergens.join(', ')}</div>` : ''}
              ${item.comments ? `<div class="item-comment">ملاحظة: ${item.comments}</div>` : ''}
              ${item.kitchenNotes ? `<div class="kitchen-notes">للمطبخ: ${item.kitchenNotes}</div>` : ''}
            </div>
          `).join('')}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Kitchen Notes -->
      ${order.notes || order.kitchenNotes ? `
      <div class="notes-section">
        <h3 class="section-title">ملاحظات مهمة</h3>
        ${order.kitchenNotes ? `<div class="kitchen-notes">${order.kitchenNotes}</div>` : ''}
        ${order.notes ? `<div class="general-notes">${order.notes}</div>` : ''}
        <div class="separator"></div>
      </div>` : ''}

      <!-- Kitchen Footer -->
      <div class="receipt-footer">
        <p class="print-time">وقت الطباعة: ${new Date().toLocaleTimeString('ar-JO')}</p>
        <p class="kitchen-reminder">تأكد من جودة الطعام قبل التسليم</p>
      </div>
    </div>
  `
}

/**
 * Delivery Slip - HTML format optimized for delivery drivers
 */
function generateDeliverySlip(
  order: PrintOrder, 
  restaurant: RestaurantInfo, 
  config: PrinterConfig
): string {
  const orderNumber = order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)
  const customerName = order.customerInfo?.name || order.deliveryAddress?.recipientName
  const customerPhone = order.customerInfo?.phone || order.deliveryAddress?.phone
  
  return `
    <div class="receipt-container delivery-slip">
      <!-- Delivery Header -->
      <div class="receipt-header">
        <h1 class="delivery-title">قسيمة التوصيل</h1>
        <h2 class="order-number">طلب #${orderNumber}</h2>
        <div class="payment-info">
          <div class="total-amount">المبلغ: ${formatJordanCurrency(order.orderSummary.total)}</div>
          <div class="payment-status">${getPaymentMethodArabic(order.paymentMethod)} - ${order.paymentStatus === 'paid' ? 'مدفوع' : 'تحصيل'}</div>
        </div>
        <div class="separator"></div>
      </div>

      <!-- Customer Contact -->
      <div class="customer-info">
        <h3 class="section-title">معلومات العميل</h3>
        ${customerName ? `<div class="customer-detail"><strong>الاسم:</strong> ${customerName}</div>` : ''}
        ${customerPhone ? `<div class="customer-detail"><strong>الهاتف:</strong> ${customerPhone}</div>` : ''}
        ${order.deliveryAddress?.alternativePhone ? `<div class="customer-detail"><strong>هاتف بديل:</strong> ${order.deliveryAddress.alternativePhone}</div>` : ''}
        <div class="separator"></div>
      </div>

      <!-- Delivery Address -->
      ${order.deliveryAddress ? `
      <div class="delivery-address">
        <h3 class="section-title">عنوان التوصيل</h3>
        <div class="address-details">
          ${order.deliveryAddress.city || order.deliveryAddress.area ? `
          <div class="location">
            ${order.deliveryAddress.city ? order.deliveryAddress.city : ''} 
            ${order.deliveryAddress.area ? `- ${order.deliveryAddress.area}` : ''}
          </div>` : ''}
          
          ${order.deliveryAddress.street ? `<div class="street">الشارع: ${order.deliveryAddress.street}</div>` : ''}
          
          ${order.deliveryAddress.building || order.deliveryAddress.floor || order.deliveryAddress.apartment ? `
          <div class="building-info">
            ${order.deliveryAddress.building ? `مبنى ${order.deliveryAddress.building}` : ''}
            ${order.deliveryAddress.floor ? ` - ط${order.deliveryAddress.floor}` : ''}
            ${order.deliveryAddress.apartment ? ` - ش${order.deliveryAddress.apartment}` : ''}
          </div>` : ''}
          
          ${order.deliveryAddress.addressDetails ? `<div class="address-details-text">التفاصيل: ${order.deliveryAddress.addressDetails}</div>` : ''}
          ${order.deliveryAddress.landmark ? `<div class="landmark">معلم مميز: ${order.deliveryAddress.landmark}</div>` : ''}
        </div>
        <div class="separator"></div>
      </div>` : ''}

      <!-- Order Summary -->
      <div class="order-summary">
        <h3 class="section-title">ملخص الطلب</h3>
        <div class="summary-info">
          <div class="items-count">${order.items.length} منتج - ${formatJordanCurrency(order.orderSummary.total)}</div>
        </div>
        <div class="items-list">
          ${order.items.map((item, index) => `
            <div class="delivery-item">
              <span class="item-quantity">${item.quantity}x</span>
              <span class="item-name">${item.productName}</span>
            </div>
          `).join('')}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Delivery Notes -->
      ${order.notes || order.deliveryNotes ? `
      <div class="delivery-notes">
        <h3 class="section-title">ملاحظات التوصيل</h3>
        ${order.deliveryNotes ? `<div class="note">${order.deliveryNotes}</div>` : ''}
        ${order.notes ? `<div class="note">${order.notes}</div>` : ''}
        <div class="separator"></div>
      </div>` : ''}

      <!-- Restaurant Contact -->
      <div class="receipt-footer">
        <div class="restaurant-contact">
          <p class="restaurant-name">بيتزا تايم - Pizza Time</p>
          <p class="contact-info">${restaurant.phone}</p>
          <p class="contact-info">pizzatimejo.com</p>
        </div>
        <div class="delivery-reminder">
          <p>وقت التوصيل المتوقع: ${order.estimatedDeliveryTime || 'حسب الموقع'}</p>
          <p>تأكد من صحة العنوان قبل التوصيل</p>
        </div>
      </div>
    </div>
  `
}

/**
 * Cashier Copy - HTML format for cashier records
 */
function generateCashierCopy(
  order: PrintOrder, 
  restaurant: RestaurantInfo, 
  config: PrinterConfig
): string {
  const orderNumber = order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)
  
  return `
    <div class="receipt-container cashier-copy">
      <!-- Cashier Header -->
      <div class="receipt-header">
        <h1 class="cashier-title">نسخة الكاشير</h1>
        <h2 class="order-number">طلب #${orderNumber}</h2>
        <div class="separator"></div>
      </div>

      <!-- Order Info -->
      <div class="order-info">
        <div class="detail-row">
          <span class="label">التاريخ:</span>
          <span class="value">${formatJordanDateTime(order.createdAt)}</span>
        </div>
        ${order.cashierName ? `
        <div class="detail-row">
          <span class="label">الكاشير:</span>
          <span class="value">${order.cashierName}</span>
        </div>` : ''}
        <div class="detail-row">
          <span class="label">طريقة الدفع:</span>
          <span class="value">${getPaymentMethodArabic(order.paymentMethod)}</span>
        </div>
        <div class="detail-row">
          <span class="label">حالة الدفع:</span>
          <span class="value payment-${order.paymentStatus}">${getPaymentStatusArabic(order.paymentStatus)}</span>
        </div>
        <div class="separator"></div>
      </div>

      <!-- Payment Breakdown -->
      <div class="payment-section">
        <h3 class="section-title">تفاصيل الدفع</h3>
        <div class="payment-details">
          <div class="payment-line">
            <span class="payment-label">المجموع الفرعي:</span>
            <span class="payment-value">${formatJordanCurrency(order.orderSummary.subtotal)}</span>
          </div>
          
          ${order.orderSummary.addonsTotal > 0 ? `
          <div class="payment-line">
            <span class="payment-label">الإضافات:</span>
            <span class="payment-value">${formatJordanCurrency(order.orderSummary.addonsTotal)}</span>
          </div>` : ''}
          
          ${order.orderSummary.optionsTotal > 0 ? `
          <div class="payment-line">
            <span class="payment-label">الخيارات:</span>
            <span class="payment-value">${formatJordanCurrency(order.orderSummary.optionsTotal)}</span>
          </div>` : ''}
          
          ${order.orderSummary.tax && order.orderSummary.tax > 0 ? `
          <div class="payment-line">
            <span class="payment-label">الضريبة:</span>
            <span class="payment-value">${formatJordanCurrency(order.orderSummary.tax)}</span>
          </div>` : ''}
          
          ${order.orderSummary.serviceFee && order.orderSummary.serviceFee > 0 ? `
          <div class="payment-line">
            <span class="payment-label">رسوم الخدمة:</span>
            <span class="payment-value">${formatJordanCurrency(order.orderSummary.serviceFee)}</span>
          </div>` : ''}
          
          ${order.orderSummary.deliveryFee > 0 ? `
          <div class="payment-line">
            <span class="payment-label">رسوم التوصيل:</span>
            <span class="payment-value">${formatJordanCurrency(order.orderSummary.deliveryFee)}</span>
          </div>` : ''}
          
          ${order.orderSummary.couponDiscount > 0 ? `
          <div class="payment-line discount">
            <span class="payment-label">خصم الكوبون:</span>
            <span class="payment-value">-${formatJordanCurrency(order.orderSummary.couponDiscount)}</span>
          </div>` : ''}
          
          ${order.orderSummary.manualDiscount > 0 ? `
          <div class="payment-line discount">
            <span class="payment-label">خصم إداري:</span>
            <span class="payment-value">-${formatJordanCurrency(order.orderSummary.manualDiscount)}</span>
          </div>` : ''}
        </div>
        
        <div class="total-separator"></div>
        <div class="final-total">
          <span class="total-label">المجموع النهائي:</span>
          <span class="total-value">${formatJordanCurrency(order.orderSummary.total)}</span>
        </div>
        <div class="separator"></div>
      </div>

      <!-- Transaction Info -->
      <div class="transaction-info">
        <h3 class="section-title">معلومات المعاملة</h3>
        <div class="transaction-details">
          <div class="detail-row">
            <span class="label">عدد المنتجات:</span>
            <span class="value">${order.items.length} منتج</span>
          </div>
          <div class="detail-row">
            <span class="label">نوع الطلب:</span>
            <span class="value">${order.deliveryMethod === 'pickup' ? 'استلام' : 'توصيل'}</span>
          </div>
          ${order.couponCode ? `
          <div class="detail-row">
            <span class="label">كود الكوبون:</span>
            <span class="value">${order.couponCode}</span>
          </div>` : ''}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Footer -->
      <div class="receipt-footer">
        <p class="restaurant-name">بيتزا تايم - Pizza Time</p>
        <p class="print-time">وقت الطباعة: ${formatJordanDateTime(new Date().toISOString())}</p>
        <p class="cashier-note">احتفظ بهذه النسخة للمراجعة</p>
      </div>
    </div>
  `
}

/**
 * Manager Report - HTML format with costs and profits analysis
 */
function generateManagerReport(
  order: PrintOrder, 
  restaurant: RestaurantInfo, 
  config: PrinterConfig
): string {
  const orderNumber = order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)
  const profitMargin = order.orderSummary.profit ? (order.orderSummary.profit / order.orderSummary.total) * 100 : 0
  
  return `
    <div class="receipt-container manager-report">
      <!-- Manager Header -->
      <div class="receipt-header">
        <h1 class="manager-title">تقرير إداري</h1>
        <h2 class="order-number">طلب #${orderNumber}</h2>
        <div class="report-date">تاريخ التقرير: ${formatJordanDateTime(order.createdAt)}</div>
        <div class="separator"></div>
      </div>

      <!-- Financial Summary -->
      <div class="financial-summary">
        <h3 class="section-title">الملخص المالي</h3>
        <div class="financial-metrics">
          <div class="metric-card revenue">
            <div class="metric-label">إجمالي الإيرادات</div>
            <div class="metric-value">${formatJordanCurrency(order.orderSummary.total)}</div>
          </div>
          
          ${order.orderSummary.totalCost ? `
          <div class="metric-card cost">
            <div class="metric-label">إجمالي التكلفة</div>
            <div class="metric-value">${formatJordanCurrency(order.orderSummary.totalCost)}</div>
          </div>` : ''}
          
          ${order.orderSummary.profit ? `
          <div class="metric-card profit">
            <div class="metric-label">صافي الربح</div>
            <div class="metric-value">${formatJordanCurrency(order.orderSummary.profit)}</div>
          </div>
          
          <div class="metric-card margin">
            <div class="metric-label">هامش الربح</div>
            <div class="metric-value">${profitMargin.toFixed(1)}%</div>
          </div>` : ''}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Order Analysis -->
      <div class="order-analysis">
        <h3 class="section-title">تحليل الطلب</h3>
        <div class="analysis-details">
          <div class="detail-row">
            <span class="label">عدد المنتجات:</span>
            <span class="value">${order.items.length} منتج</span>
          </div>
          <div class="detail-row">
            <span class="label">إجمالي الكمية:</span>
            <span class="value">${order.items.reduce((sum, item) => sum + item.quantity, 0)} قطعة</span>
          </div>
          <div class="detail-row">
            <span class="label">متوسط سعر المنتج:</span>
            <span class="value">${formatJordanCurrency(order.orderSummary.subtotal / order.items.reduce((sum, item) => sum + item.quantity, 0))}</span>
          </div>
          <div class="detail-row">
            <span class="label">نوع الطلب:</span>
            <span class="value">${order.deliveryMethod === 'pickup' ? 'استلام' : 'توصيل'}</span>
          </div>
          <div class="detail-row">
            <span class="label">طريقة الدفع:</span>
            <span class="value">${getPaymentMethodArabic(order.paymentMethod)}</span>
          </div>
        </div>
        <div class="separator"></div>
      </div>

      <!-- Product Details -->
      <div class="product-details">
        <h3 class="section-title">تفاصيل المنتجات</h3>
        <div class="products-list">
          ${order.items.map((item, index) => {
            const itemRevenue = item.price * item.quantity
            const itemCost = item.cost ? item.cost * item.quantity : 0
            const itemProfit = itemRevenue - itemCost
            const itemMargin = itemRevenue > 0 ? (itemProfit / itemRevenue) * 100 : 0
            
            return `
            <div class="product-item">
              <div class="product-header">
                <span class="product-number">${index + 1}.</span>
                <span class="product-name">${item.productName}</span>
                <span class="product-revenue">${formatJordanCurrency(itemRevenue)}</span>
              </div>
              
              <div class="product-metrics">
                <div class="product-metric">
                  <span class="metric-label">الكمية:</span>
                  <span class="metric-value">${item.quantity}</span>
                </div>
                <div class="product-metric">
                  <span class="metric-label">سعر الوحدة:</span>
                  <span class="metric-value">${formatJordanCurrency(item.price)}</span>
                </div>
                ${item.cost ? `
                <div class="product-metric">
                  <span class="metric-label">تكلفة الوحدة:</span>
                  <span class="metric-value">${formatJordanCurrency(item.cost)}</span>
                </div>
                <div class="product-metric">
                  <span class="metric-label">إجمالي التكلفة:</span>
                  <span class="metric-value">${formatJordanCurrency(itemCost)}</span>
                </div>
                <div class="product-metric profit">
                  <span class="metric-label">ربح المنتج:</span>
                  <span class="metric-value">${formatJordanCurrency(itemProfit)}</span>
                </div>
                <div class="product-metric margin">
                  <span class="metric-label">هامش الربح:</span>
                  <span class="metric-value">${itemMargin.toFixed(1)}%</span>
                </div>` : ''}
              </div>
              
              ${item.categoryName ? `<div class="product-category">الفئة: ${item.categoryName}</div>` : ''}
            </div>
            `
          }).join('')}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Performance Insights -->
      <div class="performance-insights">
        <h3 class="section-title">رؤى الأداء</h3>
        <div class="insights-list">
          ${profitMargin > 30 ? '<div class="insight positive">هامش ربح ممتاز (أكثر من 30%)</div>' : ''}
          ${profitMargin >= 20 && profitMargin <= 30 ? '<div class="insight good">هامش ربح جيد (20-30%)</div>' : ''}
          ${profitMargin < 20 && profitMargin > 0 ? '<div class="insight warning">هامش ربح منخفض (أقل من 20%)</div>' : ''}
          ${order.orderSummary.total > 50 ? '<div class="insight positive">طلب عالي القيمة</div>' : ''}
          ${order.items.length > 5 ? '<div class="insight positive">طلب متنوع (أكثر من 5 منتجات)</div>' : ''}
          ${order.deliveryMethod === 'delivery' ? '<div class="insight info">طلب توصيل - رسوم إضافية</div>' : ''}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Footer -->
      <div class="receipt-footer">
        <p class="restaurant-name">بيتزا تايم - Pizza Time</p>
        <p class="report-generated">تم إنشاء التقرير: ${formatJordanDateTime(new Date().toISOString())}</p>
        <p class="confidential">تقرير سري - للإدارة فقط</p>
      </div>
    </div>
  `
}

/**
 * Formal Invoice - HTML format for business customers
 */
function generateInvoice(
  order: PrintOrder, 
  restaurant: RestaurantInfo, 
  config: PrinterConfig
): string {
  const orderNumber = order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)
  const customerName = order.customerInfo?.name || order.deliveryAddress?.recipientName
  
  return `
    <div class="receipt-container formal-invoice">
      <!-- Invoice Header -->
      <div class="receipt-header">
        <h1 class="restaurant-name">بيتزا تايم - Pizza Time</h1>
        <p class="restaurant-info">الزرقاء، الجبل الأبيض، الأردن</p>
        <p class="restaurant-info">${restaurant.phone}</p>
        <p class="restaurant-info">pizzatimejo.com</p>
        <div class="separator"></div>
        <h2 class="invoice-title">فاتورة ضريبية</h2>
        <h3 class="invoice-title-en">TAX INVOICE</h3>
        <div class="separator"></div>
      </div>

      <!-- Invoice Details -->
      <div class="invoice-info">
        <div class="invoice-details">
          <div class="detail-row">
            <span class="label">رقم الفاتورة:</span>
            <span class="value">INV-${orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="label">Invoice No:</span>
            <span class="value">INV-${orderNumber}</span>
          </div>
          <div class="detail-row">
            <span class="label">التاريخ:</span>
            <span class="value">${formatJordanDateTime(order.createdAt)}</span>
          </div>
          <div class="detail-row">
            <span class="label">Date:</span>
            <span class="value">${new Date(order.createdAt).toLocaleDateString('en-US')}</span>
          </div>
          ${restaurant.taxNumber ? `
          <div class="detail-row">
            <span class="label">الرقم الضريبي:</span>
            <span class="value">${restaurant.taxNumber}</span>
          </div>
          <div class="detail-row">
            <span class="label">Tax No:</span>
            <span class="value">${restaurant.taxNumber}</span>
          </div>` : ''}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Customer Information -->
      ${customerName ? `
      <div class="customer-section">
        <h3 class="section-title">معلومات العميل / Customer Information</h3>
        <div class="customer-details">
          <div class="detail-row">
            <span class="label">العميل:</span>
            <span class="value">${customerName}</span>
          </div>
          <div class="detail-row">
            <span class="label">Customer:</span>
            <span class="value">${customerName}</span>
          </div>
          ${order.customerInfo?.phone || order.deliveryAddress?.phone ? `
          <div class="detail-row">
            <span class="label">الهاتف / Phone:</span>
            <span class="value">${order.customerInfo?.phone || order.deliveryAddress?.phone}</span>
          </div>` : ''}
        </div>
        <div class="separator"></div>
      </div>` : ''}

      <!-- Invoice Items -->
      <div class="invoice-items">
        <h3 class="section-title">البنود / Items</h3>
        <div class="items-table">
          <div class="table-header">
            <span class="item-no">#</span>
            <span class="item-desc">الوصف / Description</span>
            <span class="item-qty">الكمية / Qty</span>
            <span class="item-price">السعر / Price</span>
            <span class="item-total">المجموع / Total</span>
          </div>
          
          ${order.items.map((item, index) => `
            <div class="table-row">
              <span class="item-no">${index + 1}</span>
              <span class="item-desc">
                <div class="product-name-ar">${item.productName}</div>
                ${item.productNameEnglish ? `<div class="product-name-en">${item.productNameEnglish}</div>` : ''}
                ${item.addons.length > 0 ? `
                <div class="addons-list">
                  ${item.addons.map(addon => `<div class="addon-item">+ ${addon.name}</div>`).join('')}
                </div>` : ''}
                ${item.options.length > 0 ? `
                <div class="options-list">
                  ${item.options.map(option => `<div class="option-item">- ${option.choiceName}</div>`).join('')}
                </div>` : ''}
              </span>
              <span class="item-qty">${item.quantity}</span>
              <span class="item-price">${formatJordanCurrency(item.price)}</span>
              <span class="item-total">${formatJordanCurrency(item.price * item.quantity)}</span>
            </div>
          `).join('')}
        </div>
        <div class="separator"></div>
      </div>

      <!-- Invoice Summary -->
      <div class="invoice-summary">
        <h3 class="section-title">ملخص الفاتورة / Invoice Summary</h3>
        <div class="summary-table">
          <div class="summary-row">
            <span class="summary-label">المجموع الفرعي / Subtotal:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.subtotal)}</span>
          </div>
          
          ${order.orderSummary.addonsTotal > 0 ? `
          <div class="summary-row">
            <span class="summary-label">الإضافات / Add-ons:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.addonsTotal)}</span>
          </div>` : ''}
          
          ${order.orderSummary.deliveryFee > 0 ? `
          <div class="summary-row">
            <span class="summary-label">رسوم التوصيل / Delivery Fee:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.deliveryFee)}</span>
          </div>` : ''}
          
          ${order.orderSummary.serviceFee && order.orderSummary.serviceFee > 0 ? `
          <div class="summary-row">
            <span class="summary-label">رسوم الخدمة / Service Fee:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.serviceFee)}</span>
          </div>` : ''}
          
          ${order.orderSummary.tax && order.orderSummary.tax > 0 ? `
          <div class="summary-row">
            <span class="summary-label">الضريبة / Tax:</span>
            <span class="summary-value">${formatJordanCurrency(order.orderSummary.tax)}</span>
          </div>` : ''}
          
          ${order.orderSummary.couponDiscount > 0 ? `
          <div class="summary-row discount">
            <span class="summary-label">خصم / Discount:</span>
            <span class="summary-value">-${formatJordanCurrency(order.orderSummary.couponDiscount)}</span>
          </div>` : ''}
        </div>
        
        <div class="total-separator"></div>
        <div class="final-total">
          <span class="total-label">المجموع الكلي / Grand Total:</span>
          <span class="total-value">${formatJordanCurrency(order.orderSummary.total)}</span>
        </div>
        <div class="separator"></div>
      </div>

      <!-- Payment Information -->
      <div class="payment-section">
        <h3 class="section-title">معلومات الدفع / Payment Information</h3>
        <div class="payment-details">
          <div class="detail-row">
            <span class="label">طريقة الدفع / Payment Method:</span>
            <span class="value">${getPaymentMethodArabic(order.paymentMethod)}</span>
          </div>
          <div class="detail-row">
            <span class="label">حالة الدفع / Payment Status:</span>
            <span class="value payment-${order.paymentStatus}">${getPaymentStatusArabic(order.paymentStatus)}</span>
          </div>
        </div>
        <div class="separator"></div>
      </div>

      <!-- Invoice Footer -->
      <div class="receipt-footer">
        <div class="thank-you-section">
          <p class="thank-you">شكراً لثقتكم</p>
          <p class="thank-you-en">Thank you for your business</p>
        </div>
        
        <div class="footer-info">
          <p class="invoice-note">هذه فاتورة ضريبية صالحة / This is a valid tax invoice</p>
          <p class="print-time">تاريخ الطباعة / Print Date: ${formatJordanDateTime(new Date().toISOString())}</p>
        </div>
        
        ${restaurant.taxNumber ? `
        <div class="tax-footer">
          <p>الرقم الضريبي / Tax Number: ${restaurant.taxNumber}</p>
          ${restaurant.crNumber ? `<p>رقم السجل التجاري / CR Number: ${restaurant.crNumber}</p>` : ''}
        </div>` : ''}
      </div>
    </div>
  `
}

/**
 * Print receipt with enterprise features
 */
export function printReceipt(
  order: PrintOrder, 
  type: ReceiptType = 'customer',
  restaurantInfo?: RestaurantInfo,
  printerConfig?: PrinterConfig
): void {
  try {
    const receiptText = generateReceipt(order, type, restaurantInfo, printerConfig)
    
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=400,height=600')
    
    if (!printWindow) {
      alert('فشل في فتح نافذة الطباعة. يرجى التأكد من عدم حظر النوافذ المنبثقة.')
      return
    }
    
    const orderNumber = order.posOrderId ? order.posOrderId.slice(-6) : order.orderId.slice(-6)
    const receiptTypeArabic = getReceiptTypeArabic(type)
    
    // Create HTML content optimized for thermal printers
    const htmlContent = `
      <!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${receiptTypeArabic} - طلب ${orderNumber}</title>
        <style>
          /* Base styles for A4 full-width receipt */
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
          body {
            font-family: 'Arial', 'Tahoma', sans-serif;
            font-size: 54px;
            line-height: 1.6;
            color: #000;
            background: #fff;
            direction: rtl;
            text-align: right;
            padding: 80px;
            max-width: 420mm;
            margin: 0 auto;
          }
          
          /* Receipt Container */
          .receipt-container {
            width: 100%;
            background: white;
            border: 4px solid #000;
            padding: 40px;
          }
          
          /* Header Styles */
          .receipt-header {
            text-align: center;
            margin-bottom: 40px;
          }
          
          .restaurant-name {
            font-size: 65px;
          }
          
          .restaurant-info {
            font-size: 45px;
          }
          
          .receipt-title {
            font-size: 72px;
          }
          
          /* Separators */
          .separator {
            border-bottom: 4px solid #000;
            margin: 30px 0;
          }
          
          .total-separator {
            border-bottom: 4px solid #000;
            margin: 20px 0;
          }
          
          /* Order Details */
          .order-details {
            margin-bottom: 30px;
          }
          
          .detail-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 50px;
            font-size: 63px;
          }
          
          .label {
            font-size: 63px;
          }
          
          .value {
            font-size: 63px;
          }
          
          /* Section Titles */
          .section-title {
            font-size: 58px;
          }
          
          /* Customer Info */
          .customer-detail {
            font-size: 63px;
          }
          
          .vip-badge {
            font-size: 66px;
          }
          
          /* Address Details */
          .address-details p {
            font-size: 60px;
          }
          
          /* Items */
          .items-list {
            margin-bottom: 30px;
          }
          
          .item {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px dashed #ccc;
          }
          
          .item:last-child {
            border-bottom: none;
          }
          
          .item-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
          }
          
          .item-number {
            font-size: 72px;
          }
          
          .item-name {
            font-size: 75px;
          }
          
          .item-total {
            font-size: 75px;
          }
          
          .item-details {
            font-size: 60px;
          }
          
          .quantity-price {
            font-size: 60px;
          }
          
          .addons, .options {
            margin: 40px 0;
            padding-right: 100px;
          }
          
          .addon, .option {
            font-size: 57px;
          }
          
          .item-comment {
            font-size: 57px;
          }
          
          .spicy-indicator {
            font-size: 57px;
          }
          
          .allergen-warning {
            font-size: 54px;
          }
          
          /* Summary */
          .summary-lines {
            margin-bottom: 30px;
          }
          
          .summary-line {
            display: flex;
            justify-content: space-between;
            margin-bottom: 40px;
            font-size: 66px;
          }
          
          .summary-line.discount .summary-value {
            font-size: 66px;
          }
          
          .summary-label {
            font-size: 66px;
          }
          
          .summary-value {
            font-size: 66px;
          }
          
          .total-line {
            font-size: 90px;
          }
          
          /* Status */
          .status-row {
            font-size: 66px;
          }
          
          .status-label {
            font-size: 66px;
          }
          
          .status-value {
            font-size: 66px;
          }
          
          .status-value.payment-paid {
            font-size: 66px;
          }
          
          .status-value.payment-pending {
            font-size: 66px;
          }
          
          .status-value.order-delivered {
            font-size: 66px;
          }
          
          .status-value.order-preparing {
            font-size: 66px;
          }
          
          .notes {
            font-size: 60px;
          }
          
          /* Footer */
          .receipt-footer {
            font-size: 54px;
          }
          
          .thank-you {
            font-size: 63px;
          }
          
          .return-message {
            font-size: 52px;
          }
          
          .contact-info {
            font-size: 60px;
          }
          
          .tax-info {
            font-size: 54px;
          }
          
          .tax-info p {
            font-size: 54px;
          }
          
          .print-time {
            font-size: 48px;
          }
          
          .barcode {
            font-size: 72px;
          }
          
          /* Print Styles - 75% of doubled sizes */
          @media print {
            body {
              padding: 0;
              margin: 0;
              font-size: 54px;
              max-width: none;
            }
            
            @page {
              margin: 0;
              size: A4;
            }
            
            .receipt-container {
              border: none;
              padding: 40px;
              width: 100%;
            }
            
            .restaurant-name {
              font-size: 65px;
            }
            
            .receipt-title {
              font-size: 72px;
            }
            
            .section-title {
              font-size: 58px;
            }
            
            .item-name, .item-total {
              font-size: 75px;
            }
            
            .total-line {
              font-size: 90px;
            }
            
            .thank-you {
              font-size: 63px;
            }
            
            .summary-label, .summary-value {
              font-size: 66px;
            }
            
            .status-row, .status-label, .status-value {
              font-size: 66px;
            }
            
            .customer-detail, .label, .value {
              font-size: 63px;
            }
            
            .item-details, .quantity-price, .contact-info, .notes {
              font-size: 60px;
            }
            
            .addon, .option, .item-comment, .spicy-indicator {
              font-size: 57px;
            }
            
            .allergen-warning, .tax-info, .tax-info p {
              font-size: 54px;
            }
            
            .print-time {
              font-size: 48px;
            }
            
            .barcode {
              font-size: 72px;
            }
          }
        </style>
      </head>
      <body>
        ${receiptText}
        <script>
          window.onload = function() {
            // Auto-print as PDF
            setTimeout(() => {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            }, 500);
          };
        </script>
      </body>
      </html>
    `
    
    printWindow.document.write(htmlContent)
    printWindow.document.close()
  } catch (error) {
    console.error('Error printing receipt:', error)
    alert('حدث خطأ أثناء طباعة الفاتورة')
  }
}

/**
 * Utility functions for receipt formatting and translations
 */

// Center text within given width
function centerText(text: string, width: number): string {
  if (text.length >= width) return text
  const padding = Math.floor((width - text.length) / 2)
  return ' '.repeat(padding) + text + ' '.repeat(width - text.length - padding)
}

// Format summary line with proper alignment
function formatSummaryLine(label: string, amount: number, width: number, isBold: boolean = false): string {
  const amountText = formatJordanCurrency(amount)
  const maxLabelWidth = width - amountText.length - 2
  const truncatedLabel = label.length > maxLabelWidth ? label.substring(0, maxLabelWidth) : label
  const padding = width - truncatedLabel.length - amountText.length
  const line = truncatedLabel + ' '.repeat(Math.max(1, padding)) + amountText
  return isBold ? line : line
}

// Group items by category for kitchen tickets
function groupItemsByCategory(items: PrintOrderItem[]): Record<string, PrintOrderItem[]> {
  return items.reduce((groups, item) => {
    const category = item.categoryName || 'عام'
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(item)
    return groups
  }, {} as Record<string, PrintOrderItem[]>)
}

// Get receipt type in Arabic
function getReceiptTypeArabic(type: ReceiptType): string {
  const translations: Record<ReceiptType, string> = {
    'customer': 'فاتورة العميل',
    'kitchen': 'تذكرة المطبخ',
    'delivery': 'قسيمة التوصيل',
    'cashier': 'نسخة الكاشير',
    'manager': 'تقرير إداري',
    'invoice': 'فاتورة ضريبية'
  }
  return translations[type] || 'فاتورة'
}

// Get priority in Arabic
function getPriorityArabic(priority: string): string {
  const translations: Record<string, string> = {
    'low': 'منخفضة',
    'normal': 'عادية',
    'high': 'عالية',
    'urgent': 'عاجلة'
  }
  return translations[priority] || priority
}

// Payment method translations
function getPaymentMethodArabic(method: string): string {
  const translations: Record<string, string> = {
    'cash': 'نقداً',
    'card': 'بطاقة ائتمان',
    'online': 'دفع إلكتروني',
    'wallet': 'محفظة إلكترونية',
    'bank_transfer': 'تحويل بنكي'
  }
  return translations[method] || method
}

// Payment status translations
function getPaymentStatusArabic(status: string): string {
  const translations: Record<string, string> = {
    'pending': 'في الانتظار',
    'paid': 'مدفوع',
    'failed': 'فشل',
    'refunded': 'مسترد',
    'partial': 'دفع جزئي',
    'cancelled': 'ملغي'
  }
  return translations[status] || status
}

// Order status translations
function getOrderStatusArabic(status: string): string {
  const translations: Record<string, string> = {
    'pending': 'في الانتظار',
    'confirmed': 'مؤكد',
    'preparing': 'قيد التحضير',
    'ready': 'جاهز',
    'out_for_delivery': 'في الطريق',
    'delivered': 'تم التوصيل',
    'cancelled': 'ملغي',
    'refunded': 'مسترد'
  }
  return translations[status] || status
}

/**
 * Advanced printing functions
 */

// Print multiple receipt types at once
export function printMultipleReceipts(
  order: PrintOrder,
  types: ReceiptType[],
  restaurantInfo?: RestaurantInfo,
  printerConfig?: PrinterConfig
): void {
  types.forEach((type, index) => {
    setTimeout(() => {
      printReceipt(order, type, restaurantInfo, printerConfig)
    }, index * 1000) // Delay between prints
  })
}

// Generate receipt preview (without printing)
export function generateReceiptPreview(
  order: PrintOrder,
  type: ReceiptType = 'customer',
  restaurantInfo?: RestaurantInfo,
  printerConfig?: PrinterConfig
): string {
  return generateReceipt(order, type, restaurantInfo, printerConfig)
}

// Validate order data before printing
export function validateOrderForPrinting(order: any): order is PrintOrder {
  return (
    order &&
    typeof order === 'object' &&
    order.orderId &&
    order.createdAt &&
    Array.isArray(order.items) &&
    order.orderSummary &&
    typeof order.orderSummary.total === 'number'
  )
}

// Get recommended receipt types based on order
export function getRecommendedReceiptTypes(order: PrintOrder): ReceiptType[] {
  const types: ReceiptType[] = ['customer']
  
  // Always include kitchen ticket for food preparation
  types.push('kitchen')
  
  // Add delivery slip for delivery orders
  if (order.deliveryMethod === 'delivery') {
    types.push('delivery')
  }
  
  // Add cashier copy for cash payments
  if (order.paymentMethod === 'cash') {
    types.push('cashier')
  }
  
  // Add manager report for high-value orders
  if (order.orderSummary.total > 100) { // Configurable threshold
    types.push('manager')
  }
  
  return types
}

// Format receipt for email/SMS
export function formatReceiptForDigital(
  order: PrintOrder,
  type: ReceiptType = 'customer'
): string {
  const receipt = generateReceipt(order, type)
  
  // Add digital-specific formatting
  const lines = receipt.split('\n')
  const digitalReceipt = [
    '📱 فاتورة إلكترونية',
    '',
    ...lines,
    '',
    '💚 صديق للبيئة - فاتورة رقمية',
    `🔗 تتبع طلبك: ${order.orderId}`
  ]
  
  return digitalReceipt.join('\n')
}