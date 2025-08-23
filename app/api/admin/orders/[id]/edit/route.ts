import { NextRequest, NextResponse } from 'next/server'
import { auth } from '../../../../../../auth'
import { createCollection, User, UserSchema, Order, OrderSchema, SystemLog, SystemLogSchema } from '../../../../../../funcs/collections'
import { rateLimit } from '../../../../../../funcs/middleware/rateLimit'
import { getJordanTime } from '../../../../../../funcs/jordanLocale'
import { handleOrderEdit } from '../../../../../../funcs/material-order-management'
import { MATERIAL_USAGE_STATUSES } from '../../../../../../funcs/types/order-status'

/**
 * PUT /api/admin/orders/[id]/edit - Update order details (Admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting
    const rateLimitResult = await rateLimit(request, { limit: 10, window: 60000 }) // 10 requests per minute
    if (!rateLimitResult.success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      )
    }

    // Check authentication
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    if (session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    const resolvedParams = await params
    const orderId = resolvedParams.id
    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Parse request body
    const body = await request.json()
    const {
      items,
      customerInfo,
      deliveryInfo,
      deliveryFee,
      couponDiscount,
      appliedCoupon,
      deliveryMethod,
      paymentMethod,
      subtotal,
      total
    } = body

    // Validate required fields
    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Items array is required' },
        { status: 400 }
      )
    }

    if (!customerInfo || !customerInfo.name || !customerInfo.phone) {
      return NextResponse.json(
        { error: 'Customer name and phone are required' },
        { status: 400 }
      )
    }

    // Validate delivery-specific fields
    if (deliveryMethod === 'delivery') {
      if (!deliveryInfo) {
        return NextResponse.json(
          { error: 'Delivery information is required for delivery orders' },
          { status: 400 }
        )
      }
      
      if (!deliveryInfo.city || !deliveryInfo.location) {
        return NextResponse.json(
          { error: 'City and location are required for delivery orders' },
          { status: 400 }
        )
      }
    }

    console.log('📦 Processing order update:', {
      orderId,
      deliveryMethod,
      hasDeliveryInfo: !!deliveryInfo,
      customerInfo: { name: customerInfo.name, phone: customerInfo.phone },
      deliveryInfo: deliveryInfo ? {
        city: deliveryInfo.city,
        location: deliveryInfo.location,
        deliveryCost: deliveryInfo.deliveryCost
      } : null
    })

    // Connect to database
    const userCollection = await createCollection<User>('users', UserSchema)
    const orderCollection = await createCollection<Order>('orders', OrderSchema)
    const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema)

    // Find the order in both collections
    let orderFound = false
    let updatedOrder = null
    let materialTransactionResult = null

    // First, try to find and update in the orders collection
    try {
      const existingOrder = await orderCollection.model.findOne({ orderId: orderId })
      
      // Store original order for material management
      let originalOrder = null
      if (existingOrder) {
        originalOrder = JSON.parse(JSON.stringify(existingOrder)) // Deep clone
      }
      
      if (existingOrder) {
        // Transform deliveryInfo back to deliveryAddress structure
        const deliveryAddress = deliveryMethod === 'delivery' && deliveryInfo ? {
          name: customerInfo.name,
          recipientName: deliveryInfo.recipientName || customerInfo.name,
          city: deliveryInfo.city || '',
          cityId: deliveryInfo.cityId || '',
          location: deliveryInfo.location || '',
          locationId: deliveryInfo.locationId || '',
          phone: deliveryInfo.phone || customerInfo.phone,
          addressDetails: deliveryInfo.addressDetails || '',
          deliveryCost: deliveryInfo.deliveryCost || deliveryFee || 0,
          isDefault: deliveryInfo.isDefault || false
        } : deliveryMethod === 'pickup' ? {
          // Pickup object structure
          type: 'pickup',
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          recipientName: customerInfo.name,
          name: customerInfo.name,
          phone: customerInfo.phone,
          deliveryCost: 0,
          isPickup: true,
          pickupLocation: 'store', // Indicates pickup from store
          addressDetails: 'استلام من المحل - لا توجد رسوم توصيل'
        } : existingOrder.deliveryAddress

        console.log('🔄 Transforming delivery data for orders collection:', {
          deliveryMethod,
          originalDeliveryInfo: deliveryInfo,
          transformedDeliveryAddress: deliveryAddress,
          isPickupOrder: deliveryMethod === 'pickup',
          customerInfo: { name: customerInfo.name, phone: customerInfo.phone }
        })

        // Update the order in orders collection
        const updateData = {
          items,
          deliveryAddress,
          // Store customer info for both delivery and pickup orders
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          customerEmail: customerInfo.email || '',
          customerInfo: {
            name: customerInfo.name,
            phone: customerInfo.phone,
            email: customerInfo.email || ''
          },
          orderSummary: {
            subtotal: subtotal || 0,
            addonsTotal: items.reduce((sum: number, item) => sum + item.addons.reduce((addonSum: number, addon: any) => addonSum + (addon.price * item.quantity), 0), 0),
            optionsTotal: items.reduce((sum: number, item) => sum + item.options.reduce((optionSum: number, option: any) => optionSum + (option.choicePrice * item.quantity), 0), 0),
            deliveryFee: deliveryFee || 0,
            couponDiscount: couponDiscount || 0,
            manualDiscount: 0,
            total: total || 0
          },
          coupon: appliedCoupon ? {
            couponId: appliedCoupon.couponId || '',
            code: appliedCoupon.code || '',
            name: appliedCoupon.name || '',
            discountAmount: couponDiscount || 0
          } : undefined,
          deliveryMethod: deliveryMethod || 'delivery',
          paymentMethod: paymentMethod || 'cash',
          lastModified: new Date(),
          modifiedBy: session.user.email
        }

        console.log('💾 Updating orders collection with customer info:', {
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          deliveryMethod,
          hasDeliveryAddress: !!deliveryAddress
        })

        updatedOrder = await orderCollection.model.findOneAndUpdate(
          { orderId: orderId },
          { $set: updateData },
          { new: true }
        )

        orderFound = true
        console.log('✅ Order updated in orders collection')
        
        // Handle material management for order edits if order is in material usage status
        if (originalOrder && MATERIAL_USAGE_STATUSES.includes(originalOrder.status)) {
          try {
            console.log('🔧 Processing material management for order edit:', {
              orderId: originalOrder.orderId,
              status: originalOrder.status,
              originalItemsCount: originalOrder.items?.length || 0,
              newItemsCount: items?.length || 0
            })
            
            // Create updated order object for material comparison
            const updatedOrderForMaterial = {
              ...originalOrder,
              items: items,
              orderSummary: updateData.orderSummary
            }
            
            const materialTransactions = await handleOrderEdit(
              originalOrder,
              updatedOrderForMaterial,
              session.user.id || session.user.email || 'admin'
            )
            
            materialTransactionResult = {
              success: true,
              transactions: materialTransactions,
              transactionCount: materialTransactions.length,
              message: materialTransactions.length > 0 
                ? `تم تحديث ${materialTransactions.length} معاملة مواد خام`
                : 'لا توجد تغييرات في المواد الخام'
            }
            
            console.log('✅ Material management completed:', {
              transactionCount: materialTransactions.length,
              success: true
            })
            
          } catch (materialError) {
            console.error('❌ Material management error:', materialError)
            materialTransactionResult = {
              success: false,
              error: materialError instanceof Error ? materialError.message : 'Unknown material error',
              message: 'فشل في تحديث المواد الخام',
              transactionCount: 0
            }
          }
        } else {
          console.log('ℹ️ Skipping material management - order not in material usage status:', {
            status: originalOrder?.status,
            isInMaterialUsageStatus: originalOrder ? MATERIAL_USAGE_STATUSES.includes(originalOrder.status) : false
          })
          materialTransactionResult = {
            success: true,
            message: 'لا حاجة لتحديث المواد - الطلب ليس في حالة استخدام المواد',
            transactionCount: 0,
            skipped: true
          }
        }
        
      }
    } catch (error) {
      console.error('Error updating order in orders collection:', error)
    }

    // Also try to find and update in users collection
    try {
      const userWithOrder = await userCollection.model.findOne({
        'orders.orderId': orderId
      })

      if (userWithOrder) {
        const orderIndex = userWithOrder.orders.findIndex(order => order.orderId === orderId)
        
        if (orderIndex !== -1) {
          // Transform deliveryInfo back to deliveryAddress structure for user orders
          const userDeliveryAddress = deliveryMethod === 'delivery' && deliveryInfo ? {
            recipientName: deliveryInfo.recipientName || customerInfo.name,
            city: deliveryInfo.city || '',
            cityId: deliveryInfo.cityId || '',
            location: deliveryInfo.location || '',
            locationId: deliveryInfo.locationId || '',
            deliveryCost: deliveryInfo.deliveryCost || deliveryFee || 0,
            phone: deliveryInfo.phone || customerInfo.phone,
            addressDetails: deliveryInfo.addressDetails || '',
            isDefault: deliveryInfo.isDefault || false
          } : deliveryMethod === 'pickup' ? {
            // Pickup object structure for user orders
            type: 'pickup',
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            recipientName: customerInfo.name,
            name: customerInfo.name,
            phone: customerInfo.phone,
            deliveryCost: 0,
            isPickup: true,
            pickupLocation: 'store', // Indicates pickup from store
            addressDetails: 'استلام من المحل - لا توجد رسوم توصيل'
          } : userWithOrder.orders[orderIndex].deliveryAddress

          console.log('🔄 Transforming delivery data for user collection:', {
            deliveryMethod,
            originalDeliveryInfo: deliveryInfo,
            transformedUserDeliveryAddress: userDeliveryAddress
          })

          // Update the order in user's orders array
          const updateData = {
            [`orders.${orderIndex}.items`]: items,
            [`orders.${orderIndex}.deliveryAddress`]: userDeliveryAddress,
            // Store customer info for both delivery and pickup orders
            [`orders.${orderIndex}.customerName`]: customerInfo.name,
            [`orders.${orderIndex}.customerPhone`]: customerInfo.phone,
            [`orders.${orderIndex}.customerEmail`]: customerInfo.email || '',
            [`orders.${orderIndex}.customerInfo`]: {
              name: customerInfo.name,
              phone: customerInfo.phone,
              email: customerInfo.email || ''
            },
            [`orders.${orderIndex}.orderSummary`]: {
              subtotal: subtotal || 0,
              addonsTotal: items.reduce((sum: number, item) => sum + item.addons.reduce((addonSum: number, addon: any) => addonSum + (addon.price * item.quantity), 0), 0),
              optionsTotal: items.reduce((sum: number, item) => sum + item.options.reduce((optionSum: number, option: any) => optionSum + (option.choicePrice * item.quantity), 0), 0),
              deliveryFee: deliveryFee || 0,
              discount: couponDiscount || 0,
              total: total || 0
            },
            [`orders.${orderIndex}.deliveryMethod`]: deliveryMethod || 'delivery',
            [`orders.${orderIndex}.paymentMethod`]: paymentMethod || 'cash',
            [`orders.${orderIndex}.lastModified`]: new Date(),
            [`orders.${orderIndex}.modifiedBy`]: session.user.email
          }

          console.log('💾 Updating user collection with customer info:', {
            customerName: customerInfo.name,
            customerPhone: customerInfo.phone,
            deliveryMethod,
            hasUserDeliveryAddress: !!userDeliveryAddress
          })

          await userCollection.model.updateOne(
            { 'orders.orderId': orderId },
            { $set: updateData }
          )

          orderFound = true
          console.log('✅ Order updated in user collection')
        }
      }
    } catch (error) {
      console.error('Error updating order in user collection:', error)
    }

    if (!orderFound) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Log the admin action
    try {
      await systemLogCollection.model.create({
        userId: session.user.id || session.user.email || 'admin',
        timestamp: new Date(),
        level: 'info',
        action: 'order_updated',
        description: `Admin ${session.user.email} edited order ${orderId}`,
        metadata: {
          adminEmail: session.user.email,
          orderId: orderId,
          customerName: customerInfo.name,
          customerPhone: customerInfo.phone,
          newTotal: total,
          itemsCount: items.length,
          editedAt: getJordanTime()
        }
      })
    } catch (logError) {
      console.error('Failed to log admin action:', logError)
      // Don't fail the request if logging fails
    }

    // Return the updated order in the correct format
    const responseOrder = updatedOrder || {
      orderId,
      items,
      deliveryAddress: deliveryMethod === 'delivery' && deliveryInfo ? {
        name: customerInfo.name,
        recipientName: deliveryInfo.recipientName || customerInfo.name,
        city: deliveryInfo.city || '',
        cityId: deliveryInfo.cityId || '',
        location: deliveryInfo.location || '',
        locationId: deliveryInfo.locationId || '',
        phone: deliveryInfo.phone || customerInfo.phone,
        addressDetails: deliveryInfo.addressDetails || ''
      } : deliveryMethod === 'pickup' ? {
        // Pickup object structure for response
        type: 'pickup',
        customerName: customerInfo.name,
        customerPhone: customerInfo.phone,
        recipientName: customerInfo.name,
        name: customerInfo.name,
        phone: customerInfo.phone,
        deliveryCost: 0,
        isPickup: true,
        pickupLocation: 'store',
        addressDetails: 'استلام من المحل - لا توجد رسوم توصيل'
      } : null,
      // Include customer info for both delivery and pickup orders
      customerName: customerInfo.name,
      customerPhone: customerInfo.phone,
      customerEmail: customerInfo.email || '',
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email || ''
      },
      orderSummary: {
        subtotal: subtotal || 0,
        addonsTotal: items.reduce((sum: number, item) => sum + item.addons.reduce((addonSum: number, addon: any) => addonSum + (addon.price * item.quantity), 0), 0),
        optionsTotal: items.reduce((sum: number, item) => sum + item.options.reduce((optionSum: number, option: any) => optionSum + (option.choicePrice * item.quantity), 0), 0),
        deliveryFee: deliveryFee || 0,
        couponDiscount: couponDiscount || 0,
        manualDiscount: 0,
        total: total || 0
      },
      coupon: appliedCoupon ? {
        couponId: appliedCoupon.couponId || '',
        code: appliedCoupon.code || '',
        name: appliedCoupon.name || '',
        discountAmount: couponDiscount || 0
      } : undefined,
      deliveryMethod: deliveryMethod || 'delivery',
      paymentMethod: paymentMethod || 'cash',
      lastModified: new Date(),
      modifiedBy: session.user.email
    }

    console.log('📋 Response order structure:', {
      orderId: responseOrder.orderId,
      deliveryMethod: responseOrder.deliveryMethod,
      hasDeliveryAddress: !!responseOrder.deliveryAddress,
      customerName: responseOrder.deliveryAddress?.recipientName,
      customerPhone: responseOrder.deliveryAddress?.phone
    })

    return NextResponse.json({
      success: true,
      message: 'تم تحديث الطلب بنجاح',
      data: responseOrder,
      materialTransaction: materialTransactionResult
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}