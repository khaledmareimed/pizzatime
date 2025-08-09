/**
 * ImgBB Image Upload Utility
 * 
 * Handles image uploads to ImgBB service and returns the hosted URL
 */

interface ImgBBResponse {
  data: {
    id: string
    title: string
    url_viewer: string
    url: string
    display_url: string
    width: number
    height: number
    size: number
    time: number
    expiration: number
    image: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    thumb: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    medium: {
      filename: string
      name: string
      mime: string
      extension: string
      url: string
    }
    delete_url: string
  }
  success: boolean
  status: number
}

interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload image to ImgBB
 * @param file - The image file to upload
 * @param apiKey - ImgBB API key (get from environment variables)
 * @returns Promise with upload result
 */
export async function uploadToImgBB(file: File, apiKey?: string): Promise<UploadResult> {
  try {
    // Use environment variable or passed API key
    const imgbbApiKey = apiKey || process.env.NEXT_PUBLIC_IMGBB_API_KEY
    
    if (!imgbbApiKey) {
      return {
        success: false,
        error: 'ImgBB API key not configured'
      }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        error: 'Invalid file type. Please use JPG, PNG, WebP, or GIF'
      }
    }

    // Validate file size (ImgBB limit is 32MB, but we'll set a smaller limit)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return {
        success: false,
        error: 'File too large. Maximum size is 5MB'
      }
    }

    // Convert file to base64
    const base64 = await fileToBase64(file)
    
    // Prepare form data
    const formData = new FormData()
    formData.append('key', imgbbApiKey)
    formData.append('image', base64.split(',')[1]) // Remove data:image/...;base64, prefix
    formData.append('name', file.name.split('.')[0]) // File name without extension

    // Upload to ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data: ImgBBResponse = await response.json()

    if (data.success) {
      return {
        success: true,
        url: data.data.display_url
      }
    } else {
      return {
        success: false,
        error: 'Upload failed'
      }
    }

  } catch (error) {
    console.error('ImgBB upload error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed'
    }
  }
}

/**
 * Upload multiple images to ImgBB
 * @param files - Array of image files to upload
 * @param apiKey - ImgBB API key
 * @param onProgress - Optional progress callback
 * @returns Promise with array of upload results
 */
export async function uploadMultipleToImgBB(
  files: File[], 
  apiKey?: string,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResult[]> {
  const results: UploadResult[] = []
  
  for (let i = 0; i < files.length; i++) {
    const result = await uploadToImgBB(files[i], apiKey)
    results.push(result)
    
    if (onProgress) {
      onProgress(i + 1, files.length)
    }
    
    // Small delay to avoid rate limiting
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500))
    }
  }
  
  return results
}

/**
 * Convert file to base64 string
 * @param file - File to convert
 * @returns Promise with base64 string
 */
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

/**
 * Validate image file
 * @param file - File to validate
 * @returns Validation result
 */
export function validateImageFile(file: File): { valid: boolean; error?: string } {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
  const maxSize = 5 * 1024 * 1024 // 5MB

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Please use JPG, PNG, WebP, or GIF'
    }
  }

  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File too large. Maximum size is 5MB'
    }
  }

  return { valid: true }
}

/**
 * Validate and test image URL
 * @param url - Image URL to validate
 * @returns Promise with validation result
 */
export async function validateImageUrl(url: string): Promise<{ valid: boolean; error?: string }> {
  try {
    // Basic URL validation
    if (!url || typeof url !== 'string') {
      return { valid: false, error: 'Invalid URL: URL is empty or not a string' }
    }

    // Check if it's a valid URL
    try {
      new URL(url)
    } catch {
      return { valid: false, error: 'Invalid URL format' }
    }

    // Check if it's an ImgBB URL
    if (!url.includes('i.ibb.co') && !url.includes('imgbb.com')) {
      console.warn('URL is not from ImgBB:', url)
    }

    // Test if image loads
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        console.log('✅ Image URL is valid and loads successfully:', url)
        resolve({ valid: true })
      }
      img.onerror = () => {
        console.error('❌ Image URL failed to load:', url)
        resolve({ valid: false, error: 'Image failed to load' })
      }
      img.crossOrigin = 'anonymous'
      img.src = url
    })
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown validation error' 
    }
  }
}

/**
 * Debug image URLs in an array
 * @param urls - Array of image URLs to debug
 */
export async function debugImageUrls(urls: string[]): Promise<void> {
  console.log('🔍 Debugging image URLs:', urls)
  
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i]
    console.log(`📷 Testing image ${i + 1}/${urls.length}:`, url)
    
    const result = await validateImageUrl(url)
    if (result.valid) {
      console.log(`✅ Image ${i + 1} is valid`)
    } else {
      console.error(`❌ Image ${i + 1} failed:`, result.error)
    }
  }
}
