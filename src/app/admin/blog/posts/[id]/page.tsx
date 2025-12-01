import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostForm } from '@/components/features/blog/PostForm'
import { getPostByIdAction } from '@/actions/blog-posts'
import { getCategoriesAction } from '@/actions/blog-categories'
import { getContributorsAction } from '@/actions/blog-contributors'
import { Button } from '@/components/ui/Button'
import type { PageProps } from '@/types'

export const metadata = {
  title: 'Edit Post',
  description: 'Edit blog post',
}

async function EditPostContent({ postId }: { postId: string }) {
  const [postResult, categoriesResult, contributorsResult] = await Promise.all([
    getPostByIdAction(postId),
    getCategoriesAction(),
    getContributorsAction(),
  ])

  if (!postResult.success || !postResult.data) {
    notFound()
  }

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
      post={postResult.data}
      categories={categoriesResult.data}
      contributors={contributorsResult.data}
      isEditing
    />
  )
}

function EditPostLoading() {
  return <div className="h-96 w-full animate-pulse rounded-lg bg-gray-200" />
}

export default async function EditPostPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog/posts">
          <Button variant="outline" size="sm">
            ← Back to Posts
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Post</h1>
          <p className="mt-1 text-gray-600">Update post information</p>
        </div>
      </div>

      <div className="max-w-5xl">
        <Suspense fallback={<EditPostLoading />}>
          <EditPostContent postId={id} />
        </Suspense>
      </div>
    </div>
  )
}
