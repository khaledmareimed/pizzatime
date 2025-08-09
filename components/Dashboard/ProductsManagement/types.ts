export interface Category {
  _id: string
  name: string
  description?: string
  products: string[]
  displayOrder: number
  imageUrl?: string
  color?: string
}

export interface Product {
  _id: string
  productName: string
  categoryId: string
  productPrice: number
  productDiscountPrice?: number
  addonsAndToppings: Array<{
    toppingName: string
    toppingPrice: number
  }>
  description?: string
  available: boolean
  visible: boolean
  imagesUrl: string[]
}

export type Tab = 'categories' | 'products'

export interface CategoryForm {
  name: string
  description: string
  displayOrder: number
  imageUrl: string
  color: string
}

export interface ProductForm {
  productName: string
  categoryId: string
  productPrice: number
  productDiscountPrice: number
  description: string
  available: boolean
  visible: boolean
  imagesUrl: string[]
  addonsAndToppings: Array<{
    toppingName: string
    toppingPrice: number
  }>
}

export interface DeleteConfirmData {
  type: 'category' | 'product'
  id: string
  name: string
}
