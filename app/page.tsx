// This page should never be reached due to middleware redirects
// But providing a fallback just in case

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">جاري التحويل...</p>
      </div>
    </div>
  )
}
