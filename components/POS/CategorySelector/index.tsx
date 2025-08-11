'use client'

import React from 'react'
import { Category } from '@/funcs/collections'

interface CategorySelectorProps {
  categories: Category[]
  selectedCategory: string | null
  onCategorySelect: (categoryId: string | null) => void
}

export default function CategorySelector({ 
  categories, 
  selectedCategory, 
  onCategorySelect 
}: CategorySelectorProps) {
  return (
    <div className="p-4">
      <div className="flex items-center space-x-2 space-x-reverse overflow-x-auto">
        <button
          onClick={() => onCategorySelect(null)}
          className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors ${
            selectedCategory === null
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          جميع الأصناف
        </button>
        
        {categories.map((category) => (
          <button
            key={category._id}
            onClick={() => onCategorySelect(category._id)}
            className={`flex-shrink-0 px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
              selectedCategory === category._id
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>
    </div>
  )
}