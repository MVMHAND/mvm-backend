export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <div className="h-9 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-72 animate-pulse rounded bg-gray-200" />
        </div>
      </div>

      <div className="max-w-3xl">
        <div className="h-96 w-full animate-pulse rounded-lg bg-gray-200" />
      </div>
    </div>
  )
}
