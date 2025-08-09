import { auth } from '@/auth'
import { redirect } from 'next/navigation'
import { isDatabaseConnected, getConnectionStatus } from '@/funcs/database'
import { collectionManager } from '@/funcs/collections'
import { isApplicationInitialized } from '@/funcs/startup'
import StatusActions from '@/components/Dashboard/StatusActions'

interface StatusInfo {
  timestamp: string
  environment: string
  uptime: string
  application: {
    initialized: boolean
    startupTime: string
  }
  database: {
    connected: boolean
    readyState: number | null
    host: string | null
    name: string | null
    mongoUri: string
    hasCredentials: boolean
  }
  collections: {
    registered: string[]
    count: number
  }
  system: {
    nodeVersion: string
    platform: string
    memory: {
      used: string
      total: string
      percentage: string
    }
  }
}

async function getSystemStatus(): Promise<StatusInfo> {
  // Only check status, don't initialize anything
  const appInitialized = isApplicationInitialized()
  const dbConnected = await isDatabaseConnected()
  const dbStatus = getConnectionStatus()
  const registeredCollections = collectionManager.listCollections()
  
  // Get database config info (masked for security)
  const mongoUri = process.env.MONGODB_URI || 'Not configured'
  const maskedUri = mongoUri.includes('mongodb') 
    ? mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//*****:*****@') 
    : mongoUri
  const hasCredentials = !!(process.env.MONGODB_URI && process.env.MONGODB_URI.includes('@'))
  
  // Get memory usage
  const memoryUsage = process.memoryUsage()
  const totalMemory = memoryUsage.heapTotal
  const usedMemory = memoryUsage.heapUsed
  const memoryPercentage = ((usedMemory / totalMemory) * 100).toFixed(2)
  
  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    uptime: formatUptime(process.uptime()),
    application: {
      initialized: appInitialized,
      startupTime: formatUptime(process.uptime())
    },
    database: {
      connected: dbConnected,
      readyState: dbStatus.readyState,
      host: dbStatus.host,
      name: dbStatus.name || process.env.MONGODB_DB_NAME || 'pizzatime',
      mongoUri: maskedUri,
      hasCredentials
    },
    collections: {
      registered: registeredCollections,
      count: registeredCollections.length
    },
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: formatBytes(usedMemory),
        total: formatBytes(totalMemory),
        percentage: `${memoryPercentage}%`
      }
    }
  }
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${days}d ${hours}h ${minutes}m ${secs}s`
}

function formatBytes(bytes: number): string {
  const mb = bytes / (1024 * 1024)
  return `${mb.toFixed(2)} MB`
}

function StatusCard({ 
  title, 
  status, 
  details, 
  isHealthy 
}: { 
  title: string
  status: string
  details?: React.ReactNode
  isHealthy: boolean
}) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border-l-4" 
         style={{ borderLeftColor: isHealthy ? '#10B981' : '#EF4444' }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          isHealthy 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {status}
        </span>
      </div>
      {details && (
        <div className="text-sm text-gray-600">
          {details}
        </div>
      )}
    </div>
  )
}

function ApplicationStatusDetails({ application }: { application: StatusInfo['application'] }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Initialization:</span>
        <span className={`font-mono text-sm ${application.initialized ? 'text-green-600' : 'text-red-600'}`}>
          {application.initialized ? 'Complete' : 'Pending'}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Running Time:</span>
        <span className="font-mono text-sm">{application.startupTime}</span>
      </div>
    </div>
  )
}

function DatabaseStatusDetails({ database }: { database: StatusInfo['database'] }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Connection State:</span>
        <span className="font-mono text-sm">
          {database.readyState !== null ? `${database.readyState}` : 'Unknown'}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Credentials:</span>
        <span className={`font-mono text-sm ${database.hasCredentials ? 'text-green-600' : 'text-red-600'}`}>
          {database.hasCredentials ? 'Configured' : 'Missing'}
        </span>
      </div>
      <div className="flex justify-between">
        <span>Database:</span>
        <span className="font-mono text-sm">{database.name}</span>
      </div>
      <div className="flex justify-between items-start">
        <span>URI:</span>
        <span className="font-mono text-xs text-right ml-2 break-all max-w-xs">
          {database.mongoUri}
        </span>
      </div>
      {database.host && (
        <div className="flex justify-between">
          <span>Host:</span>
          <span className="font-mono text-sm">{database.host}</span>
        </div>
      )}
    </div>
  )
}

function SystemStatusDetails({ system }: { system: StatusInfo['system'] }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between">
        <span>Node.js:</span>
        <span className="font-mono text-sm">{system.nodeVersion}</span>
      </div>
      <div className="flex justify-between">
        <span>Platform:</span>
        <span className="font-mono text-sm">{system.platform}</span>
      </div>
      <div className="flex justify-between">
        <span>Memory Usage:</span>
        <span className="font-mono text-sm">
          {system.memory.used} / {system.memory.total} ({system.memory.percentage})
        </span>
      </div>
    </div>
  )
}

export default async function StatusPage() {
  const session = await auth()
  
  // Redirect if not authenticated
  if (!session) {
    redirect('/auth/signin?callbackUrl=/dash/status')
  }

  // Check if user is admin
  if (session.user.role !== 'admin') {
    redirect('/auth/unauthorized')
  }

  const status = await getSystemStatus()
  const overallHealthy = status.application.initialized &&
                        status.database.connected && 
                        status.database.hasCredentials && 
                        status.collections.count > 0

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">System Status</h1>
          <p className="mt-2 text-gray-600">
            Monitor the health and performance of your Pizza Time application
          </p>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-500">
            <span>Last updated: {new Date(status.timestamp).toLocaleString()}</span>
            <span>•</span>
            <span>Environment: {status.environment}</span>
            <span>•</span>
            <span>Uptime: {status.uptime}</span>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div className={`rounded-lg p-4 mb-8 ${
          overallHealthy 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-3 ${
              overallHealthy ? 'bg-green-500' : 'bg-red-500'
            }`} />
            <span className={`font-semibold ${
              overallHealthy ? 'text-green-800' : 'text-red-800'
            }`}>
              {overallHealthy ? 'All Systems Operational' : 'System Issues Detected'}
            </span>
          </div>
        </div>

        {/* Status Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <StatusCard
            title="Database Connection"
            status={status.database.connected ? 'Connected' : 'Disconnected'}
            isHealthy={status.database.connected}
            details={<DatabaseStatusDetails database={status.database} />}
          />

          <StatusCard
            title="Collections Manager"
            status={`${status.collections.count} Collections`}
            isHealthy={status.collections.count > 0}
            details={
              <div className="space-y-1">
                {status.collections.registered.map((collection, index) => (
                  <div key={index} className="text-sm">
                    • {collection}
                  </div>
                ))}
              </div>
            }
          />

          <StatusCard
            title="System Resources"
            status="Monitoring"
            isHealthy={true}
            details={<SystemStatusDetails system={status.system} />}
          />
        </div>

        {/* Actions */}
        <StatusActions />

        {/* Raw Status Data (for debugging) */}
        <details className="mt-8 bg-white rounded-lg shadow-md">
          <summary className="p-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-50">
            Raw Status Data (Debug)
          </summary>
          <div className="p-4 border-t">
            <pre className="text-xs bg-gray-50 p-4 rounded overflow-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </div>
        </details>
      </div>
    </div>
  )
}
