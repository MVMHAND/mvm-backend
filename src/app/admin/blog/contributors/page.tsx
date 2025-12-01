import { Suspense } from 'react'
import { ContributorList } from '@/components/features/blog/ContributorList'
import { getContributorsAction } from '@/actions/blog-contributors'

export const metadata = {
  title: 'Blog Contributors',
  description: 'Manage blog post contributors',
}

async function ContributorsContent() {
  const result = await getContributorsAction()

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Failed to load contributors: {result.error}</p>
      </div>
    )
  }

  return <ContributorList contributors={result.data} />
}

function ContributorsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-gray-200" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
    </div>
  )
}

export default function ContributorsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Contributors</h1>
          <p className="mt-1 text-gray-600">Manage blog post contributors and authors</p>
        </div>
      </div>

      <Suspense fallback={<ContributorsLoading />}>
        <ContributorsContent />
      </Suspense>
    </div>
  )
}
