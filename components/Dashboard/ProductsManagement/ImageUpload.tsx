'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Upload, 
  X, 
  Image as ImageIcon, 
  Loader2, 
  Check,
  AlertCircle,
  Plus
} from 'lucide-react'
import Button from '@/components/Button'
import { uploadToImgBB, uploadMultipleToImgBB, validateImageFile, debugImageUrls } from '@/funcs/imgbb'

interface ImageUploadProps {
  images: string[]
  onImagesChange: (images: string[]) => void
  multiple?: boolean
  maxImages?: number
  label?: string
  className?: string
}

interface UploadState {
  uploading: boolean
  progress: number
  total: number
}

export default function ImageUpload({
  images,
  onImagesChange,
  multiple = true,
  maxImages = 5,
  label = 'صور المنتج',
  className = ''
}: ImageUploadProps) {
  const [uploadState, setUploadState] = useState<UploadState>({
    uploading: false,
    progress: 0,
    total: 0
  })
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return

    const fileArray = Array.from(files)
    
    // Validate files
    const validationErrors: string[] = []
    fileArray.forEach((file, index) => {
      const validation = validateImageFile(file)
      if (!validation.valid) {
        validationErrors.push(`File ${index + 1}: ${validation.error}`)
      }
    })

    if (validationErrors.length > 0) {
      setError(validationErrors.join(', '))
      return
    }

    // Check max images limit
    if (!multiple && fileArray.length > 1) {
      setError('Only one image is allowed')
      return
    }

    if (images.length + fileArray.length > maxImages) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    setError(null)
    uploadImages(fileArray)
  }

  const uploadImages = async (files: File[]) => {
    setUploadState({
      uploading: true,
      progress: 0,
      total: files.length
    })

    try {
      if (multiple && files.length > 1) {
        // Upload multiple images
        const results = await uploadMultipleToImgBB(
          files, 
          undefined, 
          (completed, total) => {
            setUploadState(prev => ({ ...prev, progress: completed, total }))
          }
        )

        const successfulUploads = results
          .filter(result => result.success && result.url)
          .map(result => result.url!)

        const failedUploads = results.filter(result => !result.success)

        if (failedUploads.length > 0) {
          setError(`${failedUploads.length} uploads failed`)
        }

        if (successfulUploads.length > 0) {
          console.log('Multiple uploads successful:', successfulUploads)
          onImagesChange([...images, ...successfulUploads])
          // Debug the newly uploaded images
          debugImageUrls(successfulUploads)
        }
      } else {
        // Upload single image
        const result = await uploadToImgBB(files[0])
        
        if (result.success && result.url) {
          console.log('Upload successful:', result.url)
          if (multiple) {
            onImagesChange([...images, result.url])
          } else {
            onImagesChange([result.url])
          }
          // Debug the newly uploaded image
          debugImageUrls([result.url])
        } else {
          console.error('Upload failed:', result.error)
          setError(result.error || 'Upload failed')
        }
      }
    } catch (err) {
      setError('Upload failed. Please try again.')
      console.error('Upload error:', err)
    } finally {
      setUploadState({
        uploading: false,
        progress: 0,
        total: 0
      })
    }
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  const canAddMore = images.length < maxImages

  return (
    <div className={`space-y-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {multiple && (
          <span className="text-gray-500 text-xs mr-2">
            ({images.length}/{maxImages})
          </span>
        )}
      </label>

      {/* Upload Area */}
      {canAddMore && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }
            ${uploadState.uploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple={multiple}
            accept="image/*"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
            disabled={uploadState.uploading}
          />

          {uploadState.uploading ? (
            <div className="space-y-3">
              <Loader2 className="w-8 h-8 text-blue-500 mx-auto animate-spin" />
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  جاري رفع الصور... ({uploadState.progress}/{uploadState.total})
                </p>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(uploadState.progress / uploadState.total) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="w-8 h-8 text-gray-400 mx-auto" />
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  اضغط لاختيار الصور أو اسحبها هنا
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, WebP, GIF حتى 5MB
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error Message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center gap-2 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
            <button
              onClick={() => setError(null)}
              className="mr-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Images Preview */}
      {images.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            الصور المرفوعة
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((url, index) => (
              <div
                key={`image-${index}-${url.slice(-10)}`}
                className="relative group w-full h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-600"
                style={{ minHeight: '128px' }}
              >
                <img
                  src={url}
                  alt={`صورة ${index + 1}`}
                  className="w-full h-full object-cover block"
                  style={{ 
                    display: 'block !important',
                    visibility: 'visible',
                    opacity: '1',
                    position: 'relative',
                    zIndex: '1'
                  }}
                  onLoad={(e) => {
                    console.log('✅ Modal image loaded and should be visible:', url)
                    const target = e.currentTarget
                    target.style.backgroundColor = 'transparent'
                    target.style.opacity = '1'
                    target.style.visibility = 'visible'
                    
                    // Hide error placeholder if showing
                    const container = target.parentElement
                    if (container) {
                      const errorDiv = container.querySelector('.error-placeholder') as HTMLElement
                      if (errorDiv) {
                        errorDiv.style.display = 'none'
                      }
                    }
                  }}
                  onError={(e) => {
                    console.error('❌ Modal image failed to load:', url)
                    const target = e.currentTarget
                    target.style.display = 'none'
                    target.style.visibility = 'hidden'
                    const container = target.parentElement
                    if (container) {
                      const errorDiv = container.querySelector('.error-placeholder') as HTMLElement
                      if (errorDiv) {
                        errorDiv.style.display = 'flex'
                        errorDiv.style.visibility = 'visible'
                      }
                    }
                  }}
                  crossOrigin="anonymous"
                />
                
                {/* Error placeholder - hidden by default */}
                <div 
                  className="error-placeholder absolute inset-0 flex items-center justify-center bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs text-center p-2"
                  style={{ display: 'none', zIndex: '2' }}
                >
                  <div>
                    <div>فشل تحميل الصورة</div>
                    <div className="mt-1 text-[10px] opacity-70">{url.substring(0, 25)}...</div>
                  </div>
                </div>
                
                {/* Delete button */}
                <button
                  data-remove
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-all duration-200 z-20"
                  title="حذف الصورة"
                >
                  <X className="w-3 h-3" />
                </button>
                
                {/* Success indicator */}
                <div className="absolute top-2 left-2 bg-green-500 text-white p-1 rounded-full">
                  <Check className="w-3 h-3" />
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add More Button */}
      {canAddMore && images.length > 0 && (
        <Button
          variant="outline"
          onClick={openFileDialog}
          disabled={uploadState.uploading}
          className="w-full"
        >
          <Plus className="w-4 h-4 mr-2" />
          إضافة المزيد من الصور
        </Button>
      )}
    </div>
  )
}
