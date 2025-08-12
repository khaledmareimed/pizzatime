import { createCollection, SystemLog, SystemLogSchema, SystemLogIndexes } from './index'

/**
 * Utility functions for creating system logs consistently across the application
 */

export interface CreateSystemLogParams {
  userId: string
  action: SystemLog['action']
  description: string
  orderId?: string
  metadata?: any
  ipAddress?: string
  userAgent?: string
}

/**
 * Creates a new system log entry
 */
export async function createSystemLog(params: CreateSystemLogParams): Promise<SystemLog | null> {
  try {
    const systemLogCollection = await createCollection<SystemLog>('systemlogs', SystemLogSchema, {
      indexes: SystemLogIndexes
    })

    const logEntry = new systemLogCollection.model({
      userId: params.userId,
      orderId: params.orderId,
      action: params.action,
      description: params.description,
      metadata: params.metadata || {},
      ipAddress: params.ipAddress,
      userAgent: params.userAgent
    })

    const savedLog = await logEntry.save()
    return savedLog.toObject() as SystemLog
  } catch (error) {
    console.error('Error creating system log:', error)
    return null
  }
}

/**
 * Gets the client IP address from request headers
 */
export function getClientIP(request: Request): string | undefined {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const clientIP = request.headers.get('x-client-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  return realIP || clientIP || undefined
}

/**
 * Gets the user agent from request headers
 */
export function getUserAgent(request: Request): string | undefined {
  return request.headers.get('user-agent') || undefined
}

/**
 * Helper function to create system log with request context
 */
export async function createSystemLogWithContext(
  request: Request,
  params: Omit<CreateSystemLogParams, 'ipAddress' | 'userAgent'>
): Promise<SystemLog | null> {
  return createSystemLog({
    ...params,
    ipAddress: getClientIP(request),
    userAgent: getUserAgent(request)
  })
}