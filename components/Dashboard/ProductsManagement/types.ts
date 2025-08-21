export interface Category {
  _id: string
  name: string
  description?: string
  products: string[]
  displayOrder: number
  imageUrl?: string
  color?: string
}

export interface MaterialUsed {
  materialId: string
  materialName: string
  quantity: number
  unit: string
}

export interface RawMaterial {
  _id: string
  name: string
  description?: string
  category: string
  unit: string
  currentStock: number
  minimumStock: number
  maximumStock?: number
  averageCost: number
  status: 'active' | 'inactive' | 'discontinued'
}

export interface ProductOption {
  optionTitle: string
  isRequired: boolean
  choices: Array<{
    choiceName: string
    choicePrice: number
    materialsUsed?: MaterialUsed[]
  }>
}

export interface Product {
  _id: string
  productName: string
  categoryId: string
  productPrice: number
  productDiscountPrice?: number
  materialsUsed?: MaterialUsed[]
  addonsAndToppings: Array<{
    toppingName: string
    toppingPrice: number
    materialsUsed?: MaterialUsed[]
  }>
  productOptions: ProductOption[]
  description?: string
  available: boolean
  visible: boolean
  imagesUrl: string[]
}

export interface ProductForm {
  productName: string
  categoryId: string
  productPrice: number
  productDiscountPrice: number
  materialsUsed: MaterialUsed[]
  addonsAndToppings: Array<{
    toppingName: string
    toppingPrice: number
    materialsUsed?: MaterialUsed[]
  }>
  productOptions: ProductOption[]
  description: string
  available: boolean
  visible: boolean
  imagesUrl: string[]
}

export type Tab = 'categories' | 'products'

export interface CategoryForm {
  name: string
  description: string
  displayOrder: number
  color: string
}

export interface DeleteConfirmData {
  type: 'category' | 'product'
  id: string
  name: string
}
