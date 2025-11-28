export default function RolesLoading() {
  return (
    <div className="p-8">
      {/* Header skeleton */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <div className="h-9 w-32 animate-pulse rounded bg-gray-200" />
          <div className="mt-2 h-5 w-64 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
      </div>

      {/* Info card skeleton */}
      <div className="mb-6 h-16 animate-pulse rounded-lg bg-gray-200" />

      {/* Table skeleton */}
      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-6 py-3">
          <div className="flex gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-4 w-20 animate-pulse rounded bg-gray-200" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="px-6 py-4">
              <div className="flex items-center gap-6">
                <div className="h-12 w-48 animate-pulse rounded bg-gray-200" />
                <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200" />
                <div className="h-5 w-20 animate-pulse rounded bg-gray-200" />
                <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
