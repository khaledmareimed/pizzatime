'use client'

interface StatusActionsProps {
  // No props needed for now
}

export default function StatusActions({}: StatusActionsProps) {
  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
      <div className="flex flex-wrap gap-4">
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Refresh Status
        </button>
        <a
          href="/dash"
          className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}

