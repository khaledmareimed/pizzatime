'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, Package, Search, AlertCircle } from 'lucide-react'
import { MaterialUsed, RawMaterial } from './types'

interface MaterialSelectorProps {
  materials: MaterialUsed[]
  onMaterialsChange: (materials: MaterialUsed[]) => void
  title: string
  disabled?: boolean
}

export default function MaterialSelector({ 
  materials, 
  onMaterialsChange, 
  title,
  disabled = false 
}: MaterialSelectorProps) {
  const [availableMaterials, setAvailableMaterials] = useState<RawMaterial[]>([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch available materials from the database
  useEffect(() => {
    const fetchMaterials = async () => {
      setLoading(true)
      try {
        console.log('Fetching materials from /api/materials...')
        const response = await fetch('/api/materials')
        console.log('Response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('Materials API response:', data)
          
          // Handle the nested response structure from the API
          const materials = data.data?.materials || data.materials || []
          console.log('Extracted materials:', materials.length, 'items')
          setAvailableMaterials(materials)
        } else {
          const errorText = await response.text()
          console.error('Failed to fetch materials:', response.status, response.statusText, errorText)
        }
      } catch (error) {
        console.error('Error fetching materials:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchMaterials()
  }, [])

  // Filter materials based on search term
  const filteredMaterials = availableMaterials.filter(material =>
    material.status === 'active' &&
    (material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     material.category.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const addMaterial = () => {
    const newMaterial: MaterialUsed = {
      materialId: '',
      materialName: '',
      quantity: 0,
      unit: ''
    }
    onMaterialsChange([...materials, newMaterial])
  }

  const removeMaterial = (index: number) => {
    const newMaterials = materials.filter((_, i) => i !== index)
    onMaterialsChange(newMaterials)
  }

  const updateMaterial = (index: number, field: keyof MaterialUsed, value: string | number) => {
    const newMaterials = [...materials]
    
    if (field === 'materialId') {
      // When material is selected, auto-fill name and unit
      const selectedMaterial = availableMaterials.find(m => m._id === value)
      if (selectedMaterial) {
        newMaterials[index] = {
          ...newMaterials[index],
          materialId: selectedMaterial._id,
          materialName: selectedMaterial.name,
          unit: selectedMaterial.unit
        }
      }
    } else {
      newMaterials[index] = {
        ...newMaterials[index],
        [field]: value
      }
    }
    
    onMaterialsChange(newMaterials)
  }

  const getSelectedMaterial = (materialId: string) => {
    return availableMaterials.find(m => m._id === materialId)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h5 className="flex items-center text-md font-medium text-gray-800 dark:text-gray-200">
          <Package className="w-4 h-4 mr-2" />
          {title}
        </h5>
        <button
          type="button"
          onClick={addMaterial}
          disabled={disabled}
          className="flex items-center px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4 mr-1" />
          إضافة مادة
        </button>
      </div>

      <AnimatePresence>
        {materials.map((material, index) => {
          const selectedMaterial = getSelectedMaterial(material.materialId)
          const isLowStock = selectedMaterial && selectedMaterial.currentStock <= selectedMaterial.minimumStock
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  المادة #{index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeMaterial(index)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 disabled:text-gray-400 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Material Selection */}
                <div className="lg:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    اختر المادة *
                  </label>
                  <div className="relative">
                    <select
                      value={material.materialId}
                      onChange={(e) => updateMaterial(index, 'materialId', e.target.value)}
                      disabled={disabled || loading}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">
                        {loading ? 'جاري التحميل...' : 
                         availableMaterials.length === 0 ? 'لا توجد مواد متاحة' : 
                         'اختر المادة'}
                      </option>
                      {filteredMaterials.map(mat => (
                        <option key={mat._id} value={mat._id}>
                          {mat.name} ({mat.category}) - {mat.currentStock} {mat.unit}
                        </option>
                      ))}
                    </select>
                    {loading && (
                      <div className="absolute left-2 top-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </div>
                  {isLowStock && (
                    <div className="flex items-center mt-1 text-xs text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-3 h-3 mr-1" />
                      مخزون منخفض ({selectedMaterial?.currentStock} {selectedMaterial?.unit})
                    </div>
                  )}
                </div>

                {/* Quantity */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    الكمية *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={material.quantity}
                    onChange={(e) => updateMaterial(index, 'quantity', parseFloat(e.target.value) || 0)}
                    disabled={disabled}
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.000"
                  />
                </div>

                {/* Unit (Auto-filled) */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    الوحدة
                  </label>
                  <input
                    type="text"
                    value={material.unit}
                    disabled
                    className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300"
                    placeholder="يتم التعبئة تلقائياً"
                  />
                </div>
              </div>

              {/* Material Info */}
              {selectedMaterial && (
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-md p-3 text-xs">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-gray-600 dark:text-gray-400">
                    <div>
                      <span className="font-medium">الفئة:</span> {selectedMaterial.category}
                    </div>
                    <div>
                      <span className="font-medium">المخزون:</span> {selectedMaterial.currentStock} {selectedMaterial.unit}
                    </div>
                    <div>
                      <span className="font-medium">الحد الأدنى:</span> {selectedMaterial.minimumStock} {selectedMaterial.unit}
                    </div>
                    <div>
                      <span className="font-medium">متوسط التكلفة:</span> {selectedMaterial.averageCost.toFixed(3)} د.أ
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )
        })}
      </AnimatePresence>

      {materials.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <Package className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">لم يتم إضافة أي مواد بعد</p>
          <p className="text-xs">انقر على "إضافة مادة" لبدء إضافة المواد المستخدمة</p>
        </div>
      )}
    </div>
  )
}