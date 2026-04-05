export default function Loading() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 bg-gray-600 rounded animate-pulse w-64"></div>
        <div className="h-4 bg-gray-700 rounded animate-pulse w-48"></div>
      </div>
      <div className="bg-[#4a4458] border border-gray-600 rounded-lg p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8b5cf6] mx-auto mb-4"></div>
          <div className="h-4 bg-gray-700 rounded animate-pulse w-32 mx-auto"></div>
        </div>
      </div>
    </div>
  )
}
