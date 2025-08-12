'use client'

import React from 'react'
import { Product } from '@/funcs/collections'
import Image from 'next/image'

interface ProductCardProps {
  product: Product
  onClick: () => void
}

export default function ProductCard({ product, onClick }: ProductCardProps) {
  const displayPrice = (product.productDiscountPrice && product.productDiscountPrice > 0) 
    ? product.productDiscountPrice 
    : (product.productPrice || 0) // Fix price handling with proper null/undefined checks
  const primaryImage = product.imagesUrl && product.imagesUrl.length > 0 
    ? product.imagesUrl[0] 
    : 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop'

  return (
    <div
      onClick={onClick}
      className={`
        bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700
        transition-all duration-200 cursor-pointer overflow-hidden
        ${product.available 
          ? 'hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600' 
          : 'opacity-50 cursor-not-allowed'
        }
      `}
    >
      {/* Product Image */}
      <div className="relative h-32 w-full">
        <Image
          src={primaryImage}
          alt={product.productName}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
        />

        {/* Customization Indicator */}
        {(product.addonsAndToppings.length > 0 || product.productOptions.length > 0) && (
          <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-xs">
            قابل للتخصيص
          </div>
        )}

        {/* Unavailable Overlay */}
        {!product.available && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
            <span className="text-white font-medium text-sm">غير متاح</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 dark:text-white text-sm mb-1 line-clamp-2">
          {product.productName}
        </h3>
        
        {product.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 line-clamp-1">
            {product.description}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <span className="font-bold text-gray-900 dark:text-white">
            {displayPrice.toFixed(2)} ر.س
          </span>
          
          {product.available && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onClick()
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-1 rounded transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}