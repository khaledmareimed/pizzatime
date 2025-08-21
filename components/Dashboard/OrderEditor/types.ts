/**
 * Shared Types for OrderEditor Components
 * Following component-first architecture principles
 */

export interface OrderItem {
  productId: string
  productName: string
  quantity: number
  price: number
  originalPrice: number
  image?: string
  categoryId: string
  addons: Array<{
    id: string
    name: string
    price: number
  }>
  options: Array<{
    optionTitle: string
    choiceName: string
    choicePrice: number
  }>
  comments?: string
}

export interface Product {
  _id: string
  productName: string
  productPrice: number
  productDiscountPrice?: number
  imagesUrl?: string[]
  categoryId: string
  available: boolean
  description?: string
  addonsAndToppings?: Array<{
    toppingName: string
    toppingPrice: number
  }>
  productOptions?: Array<{
    optionTitle: string
    isRequired: boolean
    choices: Array<{
      choiceName: string
      choicePrice: number
    }>
  }>
}

export interface Category {
  _id: string
  name: string
  description?: string
  image?: string
  isActive: boolean
}

export interface DeliveryLocation {
  _id: string
  locationName: string
  customerCost: number
}

export interface DeliveryArea {
  _id: string
  cityName: string
  locations: DeliveryLocation[]
}

export interface CustomerInfo {
  name: string
  phone: string
  email: string
}

export interface DeliveryInfo {
  recipientName: string
  city: string
  cityId: string
  location: string
  locationId: string
  deliveryCost: number
  phone: string
  addressDetails: string
  isDefault: boolean
}

export interface EditedOrder {
  orderId?: string
  customerInfo: CustomerInfo
  deliveryInfo?: DeliveryInfo
  items: OrderItem[]
  deliveryFee: number
  couponDiscount: number
  subtotal: number
  total: number
  deliveryMethod: 'delivery' | 'pickup'
  paymentMethod?: string // Made optional since we're not editing it
  status?: string
  createdAt?: string
  updatedAt?: string
}

export interface OrderTotals {
  subtotal: number
  total: number
}

export interface OrderEditorProps {
  order: any
  onSave: (updatedOrder: any) => Promise<boolean>
  onCancel: () => void
}