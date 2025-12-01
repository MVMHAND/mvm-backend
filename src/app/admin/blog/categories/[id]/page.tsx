import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { CategoryForm } from '@/components/features/blog/CategoryForm'
import { getCategoryByIdAction } from '@/actions/blog-categories'
import { Button } from '@/components/ui/Button'
import type { PageProps } from '@/types'

export const metadata = {
  title: 'Edit Category',
  description: 'Edit blog category',
}

async function CategoryFormContent({ categoryId }: { categoryId: string }) {
  const result = await getCategoryByIdAction(categoryId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <CategoryForm category={result.data} isEditing />
}

function CategoryFormLoading() {
  return (
    <div className="h-64 w-full animate-pulse rounded-lg bg-gray-200" />
  )
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog/categories">
          <Button variant="outline" size="sm">
            ← Back to Categories
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
          <p className="mt-1 text-gray-600">Update category information</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Suspense fallback={<CategoryFormLoading />}>
          <CategoryFormContent categoryId={id} />
        </Suspense>
      </div>
    </div>
  )
}
