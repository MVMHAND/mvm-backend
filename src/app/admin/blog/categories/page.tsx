import { Suspense } from 'react'
import Link from 'next/link'
import { CategoryList } from '@/components/features/blog/CategoryList'
import { getCategoriesAction } from '@/actions/blog-categories'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Blog Categories',
  description: 'Manage blog post categories',
}

async function CategoriesContent() {
  const result = await getCategoriesAction()

  if (!result.success || !result.data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Failed to load categories: {result.error}</p>
      </div>
    )
  }

  return <CategoryList categories={result.data} />
}

function CategoriesLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-gray-200" />
      <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
    </div>
  )
}

export default function CategoriesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Categories</h1>
          <p className="mt-1 text-gray-600">Manage blog post categories</p>
        </div>
      </div>

      <Suspense fallback={<CategoriesLoading />}>
        <CategoriesContent />
      </Suspense>
    </div>
  )
}
