export default function RoleDetailLoading() {
  return (
    <div className="p-8">
      {/* Breadcrumb skeleton */}
      <div className="mb-6">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      </div>

      {/* Header skeleton */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-9 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200" />
        </div>
        <div className="mt-2 h-5 w-64 animate-pulse rounded bg-gray-200" />
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content skeleton */}
        <div className="space-y-8 lg:col-span-2">
          {/* Form skeleton */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 h-6 w-32 animate-pulse rounded bg-gray-200" />
            <div className="space-y-4">
              <div className="h-10 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-24 animate-pulse rounded-lg bg-gray-200" />
            </div>
          </div>

          {/* Permissions skeleton */}
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="h-6 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-10 w-36 animate-pulse rounded-lg bg-gray-200" />
            </div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="rounded-lg border border-gray-200">
                  <div className="border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="h-5 w-24 animate-pulse rounded bg-gray-200" />
                  </div>
                  <div className="space-y-3 p-4">
                    {[1, 2, 3].map((j) => (
                      <div key={j} className="flex items-center gap-4">
                        <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-6">
            <div className="mb-4 h-6 w-36 animate-pulse rounded bg-gray-200" />
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i}>
                  <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
                  <div className="mt-1 h-6 w-16 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
