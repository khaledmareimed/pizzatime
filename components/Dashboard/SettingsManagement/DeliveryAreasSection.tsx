'use client'

import { useState } from 'react'
import { DeliveryArea, DeliveryLocation } from '@/funcs/collections/settings'
import { formatJordanCurrency } from '@/funcs/jordanLocale'

interface DeliveryAreasSectionProps {
  areas: DeliveryArea[]
  onUpdate: (areas: DeliveryArea[]) => Promise<boolean>
  saving: boolean
}

export default function DeliveryAreasSection({ 
  areas, 
  onUpdate, 
  saving 
}: DeliveryAreasSectionProps) {
  const [localAreas, setLocalAreas] = useState<DeliveryArea[]>(areas)
  const [hasChanges, setHasChanges] = useState(false)
  const [expandedAreas, setExpandedAreas] = useState<Set<number>>(new Set([0]))

  const handleSave = async () => {
    const success = await onUpdate(localAreas)
    if (success) {
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setLocalAreas(areas)
    setHasChanges(false)
  }

  const addArea = () => {
    const newArea: DeliveryArea = {
      cityName: '',
      isActive: true,
      locations: []
    }
    const newAreas = [...localAreas, newArea]
    setLocalAreas(newAreas)
    setExpandedAreas(prev => new Set([...prev, newAreas.length - 1]))
    setHasChanges(true)
  }

  const updateArea = (index: number, updates: Partial<DeliveryArea>) => {
    const newAreas = [...localAreas]
    newAreas[index] = { ...newAreas[index], ...updates }
    setLocalAreas(newAreas)
    setHasChanges(true)
  }

  const deleteArea = (index: number) => {
    if (confirm('هل أنت متأكد من حذف هذه المدينة وجميع مناطقها؟')) {
      const newAreas = localAreas.filter((_, i) => i !== index)
      setLocalAreas(newAreas)
      setExpandedAreas(prev => {
        const newSet = new Set(prev)
        newSet.delete(index)
        return newSet
      })
      setHasChanges(true)
    }
  }

  const addLocation = (areaIndex: number) => {
    const newLocation: DeliveryLocation = {
      locationName: '',
      isActive: true,
      restaurantCost: 0,
      customerCost: 0
    }
    const newAreas = [...localAreas]
    newAreas[areaIndex].locations = [...newAreas[areaIndex].locations, newLocation]
    setLocalAreas(newAreas)
    setHasChanges(true)
  }

  const updateLocation = (areaIndex: number, locationIndex: number, updates: Partial<DeliveryLocation>) => {
    const newAreas = [...localAreas]
    newAreas[areaIndex].locations[locationIndex] = {
      ...newAreas[areaIndex].locations[locationIndex],
      ...updates
    }
    setLocalAreas(newAreas)
    setHasChanges(true)
  }

  const deleteLocation = (areaIndex: number, locationIndex: number) => {
    if (confirm('هل أنت متأكد من حذف هذه المنطقة؟')) {
      const newAreas = [...localAreas]
      newAreas[areaIndex].locations = newAreas[areaIndex].locations.filter((_, i) => i !== locationIndex)
      setLocalAreas(newAreas)
      setHasChanges(true)
    }
  }

  const toggleAreaExpansion = (index: number) => {
    setExpandedAreas(prev => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            المناطق وتكاليف التوصيل
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة المدن والمناطق مع تحديد تكاليف التوصيل للمطعم والعميل
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={addArea}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded text-sm">+</span>
            إضافة مدينة
          </button>
          
          {hasChanges && (
            <>
              <button
                onClick={handleReset}
                disabled={saving}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 font-medium flex items-center gap-2"
              >
                <span className="w-4 h-4 flex items-center justify-center">×</span>
                إلغاء
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2 font-medium"
              >
                {saving ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <span className="w-4 h-4 flex items-center justify-center bg-blue-500 rounded text-xs">✓</span>
                )}
                حفظ التغييرات
              </button>
            </>
          )}
        </div>
      </div>

      {/* Areas List */}
      <div className="space-y-4">
        {localAreas.map((area, areaIndex) => (
          <div
            key={areaIndex}
            className={`border rounded-lg transition-colors ${
              area.isActive
                ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
            }`}
          >
            {/* Area Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <button
                    onClick={() => toggleAreaExpansion(areaIndex)}
                    className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                  >
                    {expandedAreas.has(areaIndex) ? '▼' : '▶'}
                  </button>
                  
                  <input
                    type="text"
                    value={area.cityName}
                    onChange={(e) => updateArea(areaIndex, { cityName: e.target.value })}
                    placeholder="اسم المدينة"
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={area.isActive}
                      onChange={(e) => updateArea(areaIndex, { isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className={`text-sm font-medium ${
                      area.isActive 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {area.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {area.locations.length} منطقة
                  </span>
                  <button
                    onClick={() => deleteArea(areaIndex)}
                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors font-bold"
                    title="حذف المدينة"
                  >
                    ×
                  </button>
                </div>
              </div>
            </div>

            {/* Area Content */}
            {expandedAreas.has(areaIndex) && (
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    مناطق {area.cityName || 'المدينة'}
                  </h3>
                  <button
                    onClick={() => addLocation(areaIndex)}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center gap-2 font-medium"
                  >
                    <span className="w-4 h-4 flex items-center justify-center bg-blue-500 rounded text-xs">+</span>
                    إضافة منطقة
                  </button>
                </div>

                {/* Locations */}
                <div className="space-y-3">
                  {area.locations.map((location, locationIndex) => (
                    <div
                      key={locationIndex}
                      className={`p-3 border rounded-md ${
                        location.isActive
                          ? 'border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/10'
                          : 'border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-700'
                      }`}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center">
                        <div className="md:col-span-2">
                          <input
                            type="text"
                            value={location.locationName}
                            onChange={(e) => updateLocation(areaIndex, locationIndex, { locationName: e.target.value })}
                            placeholder="اسم المنطقة"
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            تكلفة المطعم (د.أ)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={location.restaurantCost}
                            onChange={(e) => updateLocation(areaIndex, locationIndex, { restaurantCost: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                            تكلفة العميل (د.أ)
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={location.customerCost}
                            onChange={(e) => updateLocation(areaIndex, locationIndex, { customerCost: parseFloat(e.target.value) || 0 })}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>

                        <div className="flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={location.isActive}
                              onChange={(e) => updateLocation(areaIndex, locationIndex, { isActive: e.target.checked })}
                              className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                            />
                            <span className="text-xs text-gray-600 dark:text-gray-400">
                              نشط
                            </span>
                          </label>
                          
                          <button
                            onClick={() => deleteLocation(areaIndex, locationIndex)}
                            className="w-6 h-6 flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded transition-colors font-bold text-sm"
                            title="حذف المنطقة"
                          >
                            ×
                          </button>
                        </div>
                      </div>

                      {/* Cost Summary */}
                      <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                        ربح المطعم: {formatJordanCurrency(location.customerCost - location.restaurantCost)}
                        {location.customerCost < location.restaurantCost && (
                          <span className="text-red-600 dark:text-red-400 mr-2">
                            تحذير: التكلفة على العميل أقل من تكلفة المطعم
                          </span>
                        )}
                      </div>
                    </div>
                  ))}

                  {area.locations.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      لا توجد مناطق في هذه المدينة
                      <br />
                      <button
                        onClick={() => addLocation(areaIndex)}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        إضافة منطقة جديدة
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

        {localAreas.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            لا توجد مدن مضافة
            <br />
            <button
              onClick={addArea}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              إضافة مدينة جديدة
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {localAreas.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            ملخص المناطق
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-300 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              إجمالي المدن: {localAreas.length}
            </div>
            <div>
              المدن النشطة: {localAreas.filter(area => area.isActive).length}
            </div>
            <div>
              إجمالي المناطق: {localAreas.reduce((total, area) => total + area.locations.length, 0)}
            </div>
            <div>
              المناطق النشطة: {localAreas.reduce((total, area) => 
                total + area.locations.filter(loc => loc.isActive && area.isActive).length, 0
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}