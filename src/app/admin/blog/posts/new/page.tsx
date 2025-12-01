import { Suspense } from 'react'
import Link from 'next/link'
import { PostForm } from '@/components/features/blog/PostForm'
import { getCategoriesAction } from '@/actions/blog-categories'
import { getContributorsAction } from '@/actions/blog-contributors'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Create Post',
  description: 'Create a new blog post',
}

async function NewPostContent() {
  const [categoriesResult, contributorsResult] = await Promise.all([
    getCategoriesAction(),
    getContributorsAction(),
  ])

  if (!categoriesResult.success || !categoriesResult.data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Failed to load categories: {categoriesResult.error}</p>
      </div>
    )
  }

  if (!contributorsResult.success || !contributorsResult.data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Failed to load contributors: {contributorsResult.error}</p>
      </div>
    )
  }

  return (
    <PostForm
      categories={categoriesResult.data}
      contributors={contributorsResult.data}
    />
  )
}

function NewPostLoading() {
  return <div className="h-96 w-full animate-pulse rounded-lg bg-gray-200" />
}

export default function NewPostPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog/posts">
          <Button variant="outline" size="sm">
            ← Back to Posts
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Post</h1>
          <p className="mt-1 text-gray-600">Write a new blog post</p>
        </div>
      </div>

      <div className="max-w-5xl">
        <Suspense fallback={<NewPostLoading />}>
          <NewPostContent />
        </Suspense>
      </div>
    </div>
  )
}
