'use client'

import React, { useState } from 'react'
import { Product } from '@/funcs/collections'
import Image from 'next/image'
import Button from '@/components/Button'

interface ProductModalProps {
  product: Product
  onAddToCart: (product: Product, quantity: number, addons: any[], options: any[], comments?: string) => void
  onClose: () => void
}

export default function ProductModal({ product, onAddToCart, onClose }: ProductModalProps) {
  const [quantity, setQuantity] = useState(1)
  const [selectedAddons, setSelectedAddons] = useState<any[]>([])
  const [selectedOptions, setSelectedOptions] = useState<{ [key: string]: any }>({})
  const [comments, setComments] = useState('')
  const [showRequiredOptionsAlert, setShowRequiredOptionsAlert] = useState(false)
  const [missingRequiredOptions, setMissingRequiredOptions] = useState<string[]>([])

  const displayPrice = (product.productDiscountPrice && product.productDiscountPrice > 0) 
    ? product.productDiscountPrice 
    : (product.productPrice || 0) // Fix price handling with proper null/undefined checks
  const primaryImage = product.imagesUrl && product.imagesUrl.length > 0 
    ? product.imagesUrl[0] 
    : 'https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400&h=400&fit=crop'

  const handleAddonToggle = (addon: any) => {
    const isSelected = selectedAddons.some(a => a.toppingName === addon.toppingName)
    if (isSelected) {
      setSelectedAddons(selectedAddons.filter(a => a.toppingName !== addon.toppingName))
    } else {
      setSelectedAddons([...selectedAddons, addon])
    }
  }

  const handleOptionSelect = (optionTitle: string, choice: any) => {
    setSelectedOptions({
      ...selectedOptions,
      [optionTitle]: choice
    })
  }

  const calculateTotalPrice = () => {
    let total = displayPrice * quantity
    
    // Add addon prices
    const addonsTotal = selectedAddons.reduce((sum, addon) => sum + (addon.toppingPrice || 0), 0) * quantity
    
    // Add option prices
    const optionsTotal = Object.values(selectedOptions).reduce((sum: number, option: any) => 
      sum + (option.choicePrice || 0), 0) * quantity
    
    return total + addonsTotal + optionsTotal
  }

  const handleAddToCart = () => {
    // Only proceed if all required options are selected
    if (!canAddToCart()) {
      // Check for missing required options and show alert
      const missingOptions = product.productOptions
        .filter(option => option.isRequired && !selectedOptions[option.optionTitle])
        .map(option => option.optionTitle)

      setMissingRequiredOptions(missingOptions)
      setShowRequiredOptionsAlert(true)
      setTimeout(() => {
        setShowRequiredOptionsAlert(false)
        setMissingRequiredOptions([])
      }, 5000)
      return
    }

    const optionsArray = Object.entries(selectedOptions).map(([optionTitle, choice]) => ({
      optionTitle,
      choiceName: choice.choiceName,
      choicePrice: choice.choicePrice || 0
    }))

    onAddToCart(product, quantity, selectedAddons, optionsArray, comments)
  }

  const canAddToCart = () => {
    // Check if all required options are selected
    return product.productOptions.every(option => 
      !option.isRequired || selectedOptions[option.optionTitle]
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4" dir="rtl">
      {/* Mobile Layout */}
      <div className="lg:hidden bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[95vh] overflow-hidden flex flex-col">
        {/* Mobile Header */}
        <div className="relative flex-shrink-0">
          <Image
            src={primaryImage}
            alt={product.productName}
            width={400}
            height={200}
            className="w-full h-48 object-cover rounded-t-lg"
          />
          <button
            onClick={onClose}
            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full w-8 h-8 flex items-center justify-center hover:bg-opacity-70"
          >
            ×
          </button>
        </div>

        {/* Mobile Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {product.productName}
          </h2>
          
          {product.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {product.description}
            </p>
          )}

          <div className="text-lg font-bold text-green-600 dark:text-green-400 mb-6">
            {displayPrice.toFixed(2)} ر.س
          </div>

          {/* Mobile Options */}
          {product.productOptions.map((option, optionIndex) => (
            <div key={optionIndex} className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                {option.optionTitle}
                {option.isRequired && <span className="text-red-500 ml-1">*</span>}
              </h3>
              <div className="space-y-2">
                {option.choices.map((choice, choiceIndex) => (
                  <button
                    key={choiceIndex}
                    onClick={() => handleOptionSelect(option.optionTitle, choice)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedOptions[option.optionTitle]?.choiceName === choice.choiceName
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="flex-1">{choice.choiceName}</span>
                    {choice.choicePrice > 0 && (
                      <span className={`font-medium ${
                        selectedOptions[option.optionTitle]?.choiceName === choice.choiceName
                          ? 'text-white'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        +{choice.choicePrice.toFixed(2)} ر.س
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Mobile Addons */}
          {product.addonsAndToppings.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                الإضافات والتوابل
              </h3>
              <div className="space-y-2">
                {product.addonsAndToppings.map((addon, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddonToggle(addon)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-colors ${
                      selectedAddons.some(a => a.toppingName === addon.toppingName)
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    <span className="flex-1">{addon.toppingName}</span>
                    <span className={`font-medium ${
                      selectedAddons.some(a => a.toppingName === addon.toppingName)
                        ? 'text-white'
                        : 'text-green-600 dark:text-green-400'
                    }`}>
                      +{(addon.toppingPrice || 0).toFixed(2)} ر.س
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Mobile Comments */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              تعليمات خاصة
            </label>
            <textarea
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="أي طلبات خاصة..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              rows={3}
            />
          </div>
        </div>

        {/* Mobile Footer */}
        <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3 space-x-reverse">
              <span className="text-gray-700 dark:text-gray-300">الكمية:</span>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  -
                </button>
                <span className="w-8 text-center font-medium text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500"
                >
                  +
                </button>
              </div>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">
              الإجمالي: {calculateTotalPrice().toFixed(2)} ر.س
            </div>
          </div>
          <div className="flex space-x-3 space-x-reverse">
            <Button onClick={onClose} variant="outline" size="md">إلغاء</Button>
            <Button onClick={handleAddToCart} disabled={!canAddToCart()} variant="primary" size="md">
              إضافة للطلب - {calculateTotalPrice().toFixed(2)} ر.س
            </Button>
          </div>
        </div>
      </div>

      {/* Large Screen Layout */}
      <div className="hidden lg:flex bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl h-[85vh] overflow-hidden shadow-2xl">
        {/* Left Panel - Product Image & Info */}
        <div className="w-1/3 flex flex-col h-full">
          <div className="relative h-1/3 flex-shrink-0">
            <Image
              src={primaryImage}
              alt={product.productName}
              width={400}
              height={300}
              className="w-full h-full object-cover rounded-tl-xl"
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 bg-black bg-opacity-50 text-white rounded-full w-10 h-10 flex items-center justify-center hover:bg-opacity-70 transition-all"
            >
              ×
            </button>
          </div>
          
          {/* Scrollable Product Info */}
          <div className="flex-1 overflow-y-auto p-6 min-h-0">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {product.productName}
            </h2>
            {product.description && (
              <p className="text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
                {product.description}
              </p>
            )}
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {displayPrice.toFixed(2)} ر.س
            </div>
          </div>
          
          {/* Fixed Controls Section */}
          <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-4 space-y-3">
            {/* Quantity Controls */}
            <div className="flex items-center justify-between">
              <span className="text-gray-700 dark:text-gray-300 font-medium">الكمية:</span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center font-bold text-lg text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  +
                </button>
              </div>
            </div>
            
            {/* Total Price */}
            <div className="text-lg font-bold text-gray-900 dark:text-white text-center py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
              الإجمالي: {calculateTotalPrice().toFixed(2)} ر.س
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2">
              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart()}
                variant="primary"
                size="md"
                className="w-full"
              >
                إضافة للطلب - {calculateTotalPrice().toFixed(2)} ر.س
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                size="sm"
                className="w-full"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </div>

        {/* Middle Panel - Options Only */}
        <div className="w-1/3 border-x border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              خيارات المنتج
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Options Only */}
            {product.productOptions.length > 0 ? (
              product.productOptions.map((option, optionIndex) => (
                <div key={optionIndex}>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                    {option.optionTitle}
                    {option.isRequired && <span className="text-red-500 mr-1">*</span>}
                  </h4>
                  <div className="space-y-2">
                    {option.choices.map((choice, choiceIndex) => (
                      <button
                        key={choiceIndex}
                        onClick={() => handleOptionSelect(option.optionTitle, choice)}
                        className={`w-full flex items-center justify-between p-3 rounded-lg text-left transition-all duration-200 ${
                          selectedOptions[option.optionTitle]?.choiceName === choice.choiceName
                            ? 'bg-blue-500 text-white shadow-lg'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <span className="flex-1 font-medium">{choice.choiceName}</span>
                        {choice.choicePrice > 0 && (
                          <span className={`font-bold ${
                            selectedOptions[option.optionTitle]?.choiceName === choice.choiceName
                              ? 'text-white'
                              : 'text-green-600 dark:text-green-400'
                          }`}>
                            +{choice.choicePrice.toFixed(2)} ر.س
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
                لا توجد خيارات متاحة لهذا المنتج
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Toppings & Special Details */}
        <div className="w-1/3 flex flex-col">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              الإضافات والتفاصيل الخاصة
            </h3>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Addons/Toppings Section */}
            {product.addonsAndToppings.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  الإضافات والتوابل
                </h4>
                <div className="space-y-3">
                  {product.addonsAndToppings.map((addon, index) => (
                    <button
                      key={index}
                      onClick={() => handleAddonToggle(addon)}
                      className={`w-full flex items-center justify-between p-4 rounded-xl text-left transition-all duration-200 ${
                        selectedAddons.some(a => a.toppingName === addon.toppingName)
                          ? 'bg-green-500 text-white shadow-lg scale-105'
                          : 'bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600 hover:scale-102'
                      }`}
                    >
                      <span className="flex-1 font-medium">{addon.toppingName}</span>
                      <span className={`font-bold ${
                        selectedAddons.some(a => a.toppingName === addon.toppingName)
                          ? 'text-white'
                          : 'text-green-600 dark:text-green-400'
                      }`}>
                        +{addon.toppingPrice.toFixed(2)} ر.س
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Special Details/Comments Section */}
            <div>
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                تعليمات خاصة
              </h4>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="أي طلبات خاصة أو تفاصيل إضافية..."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                rows={5}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Required Options Alert Popup */}
      {showRequiredOptionsAlert && (
        <div className="fixed top-4 right-4 bg-red-500 text-white px-6 py-4 rounded-lg shadow-xl z-[60] transform transition-all duration-300 ease-in-out max-w-sm">
          <div className="flex items-start space-x-3 space-x-reverse">
            <div className="flex-shrink-0 mt-1">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm mb-2">خيارات مطلوبة!</h4>
              <p className="text-sm mb-3">يرجى اختيار الخيارات التالية:</p>
              <ul className="text-sm space-y-1">
                {missingRequiredOptions.map((optionTitle, index) => (
                  <li key={index} className="flex items-center space-x-2 space-x-reverse">
                    <span className="w-1.5 h-1.5 bg-white rounded-full flex-shrink-0"></span>
                    <span className="font-medium">{optionTitle}</span>
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => {
                setShowRequiredOptionsAlert(false)
                setMissingRequiredOptions([])
              }}
              className="flex-shrink-0 text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}