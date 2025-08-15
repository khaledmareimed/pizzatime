'use client'

import { useState, useRef } from 'react'
import { Banner } from '@/funcs/collections/settings'
import { uploadToImgBB, validateImageFile } from '@/funcs/imgbb'
import { useToastContext } from '@/funcs/contexts/ToastContext'

interface BannersSectionProps {
  banners: Banner[]
  onUpdate: (banners: Banner[]) => Promise<boolean>
  saving: boolean
}

export default function BannersSection({ 
  banners, 
  onUpdate, 
  saving 
}: BannersSectionProps) {
  const [localBanners, setLocalBanners] = useState<Banner[]>(banners)
  const [hasChanges, setHasChanges] = useState(false)
  const [uploading, setUploading] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success: showSuccess, error: showError } = useToastContext()

  const handleSave = async () => {
    const success = await onUpdate(localBanners)
    if (success) {
      setHasChanges(false)
    }
  }

  const handleReset = () => {
    setLocalBanners(banners)
    setHasChanges(false)
  }

  const addBanner = () => {
    const newBanner: Banner = {
      title: '',
      imageUrl: '',
      isActive: true,
      order: localBanners.length,
      linkUrl: null,
      description: ''
    }
    setLocalBanners([...localBanners, newBanner])
    setHasChanges(true)
  }

  const updateBanner = (index: number, updates: Partial<Banner>) => {
    const newBanners = [...localBanners]
    newBanners[index] = { ...newBanners[index], ...updates }
    setLocalBanners(newBanners)
    setHasChanges(true)
  }

  const deleteBanner = (index: number) => {
    if (confirm('هل أنت متأكد من حذف هذا البانر؟')) {
      const newBanners = localBanners.filter((_, i) => i !== index)
      // Reorder remaining banners
      newBanners.forEach((banner, i) => {
        banner.order = i
      })
      setLocalBanners(newBanners)
      setHasChanges(true)
    }
  }

  const moveBanner = (index: number, direction: 'up' | 'down') => {
    const newBanners = [...localBanners]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    
    if (targetIndex >= 0 && targetIndex < newBanners.length) {
      // Swap banners
      [newBanners[index], newBanners[targetIndex]] = [newBanners[targetIndex], newBanners[index]]
      
      // Update order values
      newBanners.forEach((banner, i) => {
        banner.order = i
      })
      
      setLocalBanners(newBanners)
      setHasChanges(true)
    }
  }

  const handleImageUpload = async (index: number, file: File) => {
    // Validate file
    const validation = validateImageFile(file)
    if (!validation.valid) {
      showError(validation.error || 'ملف غير صالح')
      return
    }

    try {
      setUploading(index)
      
      // Upload to ImgBB
      const result = await uploadToImgBB(file)
      
      if (result.success && result.url) {
        updateBanner(index, { imageUrl: result.url })
        showSuccess('تم رفع الصورة بنجاح')
      } else {
        showError(result.error || 'فشل في رفع الصورة')
      }
    } catch (error) {
      console.error('Image upload error:', error)
      showError('خطأ في رفع الصورة')
    } finally {
      setUploading(null)
    }
  }

  const handleFileSelect = (index: number) => {
    if (fileInputRef.current) {
      fileInputRef.current.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0]
        if (file) {
          handleImageUpload(index, file)
        }
      }
      fileInputRef.current.click()
    }
  }

  const duplicateBanner = (index: number) => {
    const bannerToCopy = localBanners[index]
    const newBanner: Banner = {
      ...bannerToCopy,
      title: `${bannerToCopy.title} - نسخة`,
      order: localBanners.length,
      isActive: false
    }
    setLocalBanners([...localBanners, newBanner])
    setHasChanges(true)
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            إدارة البانرات
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            إدارة صور البانرات الرئيسية للموقع باستخدام ImgBB
          </p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={addBanner}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2 font-medium"
          >
            <span className="w-5 h-5 flex items-center justify-center bg-green-500 rounded text-sm">+</span>
            إضافة بانر
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

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Banners List */}
      <div className="space-y-6">
        {localBanners.map((banner, index) => (
          <div
            key={index}
            className={`border rounded-lg overflow-hidden transition-colors ${
              banner.isActive
                ? 'border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/10'
                : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
            }`}
          >
            <div className="p-4">
              {/* Banner Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    #{index + 1}
                  </span>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={(e) => updateBanner(index, { isActive: e.target.checked })}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                    />
                    <span className={`text-sm font-medium ${
                      banner.isActive 
                        ? 'text-green-700 dark:text-green-300' 
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {banner.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  {/* Move buttons */}
                  <button
                    onClick={() => moveBanner(index, 'up')}
                    disabled={index === 0}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    title="تحريك لأعلى"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveBanner(index, 'down')}
                    disabled={index === localBanners.length - 1}
                    className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-bold"
                    title="تحريك لأسفل"
                  >
                    ↓
                  </button>
                  
                  {/* Action buttons */}
                  <button
                    onClick={() => duplicateBanner(index)}
                    className="w-8 h-8 flex items-center justify-center text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-md transition-colors"
                    title="نسخ البانر"
                  >
                    ⧉
                  </button>
                  <button
                    onClick={() => deleteBanner(index)}
                    className="w-8 h-8 flex items-center justify-center text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-md transition-colors font-bold"
                    title="حذف البانر"
                  >
                    ×
                  </button>
                </div>
              </div>

              {/* Banner Content */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Image Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    صورة البانر
                  </label>
                  
                  <div className="space-y-3">
                    {/* Image Preview */}
                    {banner.imageUrl && (
                      <div className="relative">
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="w-full h-32 object-cover rounded-lg border border-gray-300 dark:border-gray-600"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/placeholder-banner.png'
                          }}
                        />
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                          معاينة
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Button */}
                    <button
                      onClick={() => handleFileSelect(index)}
                      disabled={uploading === index}
                      className="w-full px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-blue-500 dark:hover:border-blue-400 transition-colors flex items-center justify-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 font-medium"
                    >
                      {uploading === index ? (
                        <>
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                          جاري الرفع...
                        </>
                      ) : (
                        <>
                          <span className="w-5 h-5 flex items-center justify-center bg-gray-200 dark:bg-gray-600 rounded text-sm">↑</span>
                          {banner.imageUrl ? 'تغيير الصورة' : 'رفع صورة'}
                        </>
                      )}
                    </button>
                    
                    {/* Manual URL Input */}
                    <div>
                      <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                        أو أدخل رابط الصورة مباشرة
                      </label>
                      <input
                        type="url"
                        value={banner.imageUrl}
                        onChange={(e) => updateBanner(index, { imageUrl: e.target.value })}
                        placeholder="https://example.com/image.jpg"
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                      />
                    </div>
                  </div>
                </div>

                {/* Details Section */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      عنوان البانر *
                    </label>
                    <input
                      type="text"
                      value={banner.title}
                      onChange={(e) => updateBanner(index, { title: e.target.value })}
                      placeholder="عنوان البانر"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      وصف البانر
                    </label>
                    <textarea
                      value={banner.description || ''}
                      onChange={(e) => updateBanner(index, { description: e.target.value })}
                      placeholder="وصف مختصر للبانر"
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      رابط البانر (اختياري)
                    </label>
                    <input
                      type="url"
                      value={banner.linkUrl || ''}
                      onChange={(e) => updateBanner(index, { linkUrl: e.target.value || null })}
                      placeholder="https://example.com"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      الرابط الذي سيتم توجيه المستخدم إليه عند النقر على البانر
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      ترتيب العرض
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={banner.order}
                      onChange={(e) => updateBanner(index, { order: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Banner Status */}
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded-lg">
                <div className="flex items-center justify-between text-sm">
                  <div className="text-gray-600 dark:text-gray-400">
                    الحالة: 
                    <span className={`mr-1 font-medium ${
                      banner.isActive 
                        ? 'text-green-600 dark:text-green-400' 
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {banner.isActive ? 'نشط' : 'معطل'}
                    </span>
                  </div>
                  
                  <div className="text-gray-600 dark:text-gray-400">
                    الترتيب: #{banner.order + 1}
                  </div>
                  
                  {banner.imageUrl && (
                    <div className="text-gray-600 dark:text-gray-400">
                      <span className="text-green-600 dark:text-green-400">✓</span> صورة محملة
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {localBanners.length === 0 && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            لا توجد بانرات مضافة
            <br />
            <button
              onClick={addBanner}
              className="mt-4 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              إضافة بانر جديد
            </button>
          </div>
        )}
      </div>

      {/* Summary */}
      {localBanners.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <h3 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
            ملخص البانرات
          </h3>
          <div className="text-sm text-blue-800 dark:text-blue-300 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              إجمالي البانرات: {localBanners.length}
            </div>
            <div>
              البانرات النشطة: {localBanners.filter(banner => banner.isActive).length}
            </div>
            <div>
              البانرات مع صور: {localBanners.filter(banner => banner.imageUrl).length}
            </div>
            <div>
              البانرات مع روابط: {localBanners.filter(banner => banner.linkUrl).length}
            </div>
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
        <h3 className="text-sm font-medium text-yellow-900 dark:text-yellow-200 mb-2">
          إرشادات رفع الصور
        </h3>
        <ul className="text-sm text-yellow-800 dark:text-yellow-300 space-y-1">
          <li>- الحد الأقصى لحجم الصورة: 5 ميجابايت</li>
          <li>- الصيغ المدعومة: JPG, PNG, WebP, GIF</li>
          <li>- الأبعاد المنصوح بها: 1200x400 بكسل للبانرات الأفقية</li>
          <li>- يتم رفع الصور إلى خدمة ImgBB المجانية</li>
          <li>- تأكد من أن الصور ذات جودة عالية ومناسبة للعرض</li>
        </ul>
      </div>
    </div>
  )
}