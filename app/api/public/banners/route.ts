import { NextRequest, NextResponse } from 'next/server'
import { createCollection } from '../../../../funcs/collections'
import { SettingsSchema, SettingsIndexes, Settings } from '../../../../funcs/collections/settings'

/**
 * Public API to fetch active banners from settings collection
 * GET /api/public/banners
 * 
 * Returns active banners sorted by order for display in the user interface
 */
export async function GET(request: NextRequest) {
  try {
    // Get or create settings collection
    const settingsCollection = await createCollection<Settings>('settings', SettingsSchema, {
      indexes: SettingsIndexes
    })

    // Get settings from database (there should be only one settings document)
    const settings = await settingsCollection.model.findOne().lean()
    
    if (!settings || !settings.banners) {
      return NextResponse.json({
        success: true,
        data: [],
        message: 'No banners found'
      })
    }

    // Filter active banners and sort by order
    const activeBanners = settings.banners
      .filter(banner => banner.isActive)
      .sort((a, b) => a.order - b.order)
      .map(banner => ({
        _id: banner._id,
        title: banner.title,
        imageUrl: banner.imageUrl,
        description: banner.description || '',
        linkUrl: banner.linkUrl || null,
        order: banner.order
      }))

    return NextResponse.json({
      success: true,
      data: activeBanners,
      count: activeBanners.length
    })

  } catch (error) {
    console.error('Error fetching banners:', error)
    
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch banners',
      message: 'An error occurred while retrieving banner data'
    }, { status: 500 })
  }
}