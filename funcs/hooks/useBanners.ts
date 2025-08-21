import { useState, useEffect } from 'react'
import { Banner } from '../collections/settings'

interface BannersResponse {
  success: boolean
  data: Banner[]
  count: number
  error?: string
  message?: string
}

interface UseBannersReturn {
  banners: Banner[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * Custom hook to fetch banners from the public API
 * Follows component-first architecture principles
 */
export function useBanners(): UseBannersReturn {
  const [banners, setBanners] = useState<Banner[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchBanners = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/public/banners', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store' // Always fetch fresh data
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result: BannersResponse = await response.json()

      if (result.success) {
        setBanners(result.data || [])
      } else {
        setError(result.error || 'Failed to fetch banners')
      }

    } catch (err) {
      console.error('Error fetching banners:', err)
      setError(err instanceof Error ? err.message : 'An unknown error occurred')
      setBanners([]) // Reset to empty array on error
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchBanners()
  }, [])

  return {
    banners,
    loading,
    error,
    refetch: fetchBanners
  }
}