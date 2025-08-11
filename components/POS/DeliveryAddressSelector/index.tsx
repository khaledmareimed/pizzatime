'use client'

import React, { useState } from 'react'
import Button from '@/components/Button'

export interface DeliveryAddress {
  id: string
  label: string
  street: string
  city: string
  zipCode: string
  notes?: string
  isDefault?: boolean
}

interface DeliveryAddressSelectorProps {
  addresses: DeliveryAddress[]
  selectedAddressId?: string
  onAddressSelect: (addressId: string) => void
  onAddNewAddress: () => void
  disabled?: boolean
}

export default function DeliveryAddressSelector({
  addresses,
  selectedAddressId,
  onAddressSelect,
  onAddNewAddress,
  disabled = false
}: DeliveryAddressSelectorProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const selectedAddress = addresses.find(addr => addr.id === selectedAddressId)

  if (addresses.length === 0) {
    return (
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          عنوان التوصيل
        </label>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6 text-center">
          <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">
            لا توجد عناوين محفوظة
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            أضف عنوان توصيل لإتمام الطلب
          </p>
          <Button
            onClick={onAddNewAddress}
            variant="primary"
            size="sm"
            disabled={disabled}
            className="bg-blue-500 hover:bg-blue-600"
          >
            إضافة عنوان جديد
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          عنوان التوصيل
        </label>
        <Button
          onClick={onAddNewAddress}
          variant="outline"
          size="sm"
          disabled={disabled}
          className="text-xs"
        >
          إضافة عنوان
        </Button>
      </div>

      {/* Selected Address Display */}
      {selectedAddress && !isExpanded && (
        <div className="border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-2 space-x-reverse mb-2">
                <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  {selectedAddress.label}
                </span>
                {selectedAddress.isDefault && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200">
                    افتراضي
                  </span>
                )}
              </div>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                {selectedAddress.street}, {selectedAddress.city}
              </p>
              {selectedAddress.notes && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {selectedAddress.notes}
                </p>
              )}
            </div>
            <button
              onClick={() => setIsExpanded(true)}
              className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-1"
              disabled={disabled}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Address List */}
      {(isExpanded || !selectedAddress) && (
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {addresses.map((address) => (
            <div
              key={address.id}
              className={`border rounded-xl p-3 cursor-pointer transition-all ${
                selectedAddressId === address.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => {
                if (!disabled) {
                  onAddressSelect(address.id)
                  setIsExpanded(false)
                }
              }}
            >
              <div className="flex items-start space-x-3 space-x-reverse">
                <div className="flex-shrink-0 mt-1">
                  <input
                    type="radio"
                    checked={selectedAddressId === address.id}
                    onChange={() => !disabled && onAddressSelect(address.id)}
                    className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    disabled={disabled}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 space-x-reverse mb-1">
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                      {address.label}
                    </h3>
                    {address.isDefault && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                        افتراضي
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    {address.street}, {address.city}
                  </p>
                  {address.zipCode && (
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      الرمز البريدي: {address.zipCode}
                    </p>
                  )}
                  {address.notes && (
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {address.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isExpanded && selectedAddress && (
        <div className="text-center">
          <button
            onClick={() => setIsExpanded(false)}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200"
            disabled={disabled}
          >
            إخفاء القائمة
          </button>
        </div>
      )}
    </div>
  )
}