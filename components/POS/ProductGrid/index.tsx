'use client'

import React, { useState } from 'react'
import { Product } from '@/funcs/collections'
import ProductCard from '../ProductCard'
import ProductModal from '../ProductModal'

interface ProductGridProps {
  products: Product[]
  onAddToCart: (product: Product, quantity?: number, addons?: any[], options?: any[], comments?: string) => void
}

export default function ProductGrid({ products, onAddToCart }: ProductGridProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [showProductModal, setShowProductModal] = useState(false)

  const handleProductClick = (product: Product) => {
    // If product has addons or options, show modal for customization
    if (product.addonsAndToppings.length > 0 || product.productOptions.length > 0) {
      setSelectedProduct(product)
      setShowProductModal(true)
    } else {
      // Add directly to cart with default quantity
      onAddToCart(product, 1)
    }
  }

  const handleAddToCart = (product: Product, quantity: number, addons: any[], options: any[], comments?: string) => {
    onAddToCart(product, quantity, addons, options, comments)
    setShowProductModal(false)
    setSelectedProduct(null)
  }

  if (products.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-gray-400 dark:text-gray-500 text-4xl md:text-6xl mb-4">🍽️</div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 dark:text-white mb-2">
            لا توجد منتجات متاحة
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            لم يتم العثور على منتجات في هذا الصنف
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onClick={() => handleProductClick(product)}
          />
        ))}
      </div>

      {/* Product Customization Modal */}
      {showProductModal && selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onAddToCart={handleAddToCart}
          onClose={() => {
            setShowProductModal(false)
            setSelectedProduct(null)
          }}
        />
      )}
    </>
  )
}