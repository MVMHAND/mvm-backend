import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { PostPreview } from '@/components/features/blog/PostPreview'
import { getPostByIdAction } from '@/actions/blog-posts'
import { getCategoryByIdAction } from '@/actions/blog-categories'
import { getContributorByIdAction } from '@/actions/blog-contributors'
import { Button } from '@/components/ui/Button'
import type { PageProps } from '@/types'

export const metadata = {
  title: 'Preview Post',
  description: 'Preview blog post',
}

interface PreviewContentProps {
  postId: string
}

async function PreviewContent({ postId }: PreviewContentProps) {
  const postResult = await getPostByIdAction(postId)

  if (!postResult.success || !postResult.data) {
    notFound()
  }

  const post = postResult.data

  const [categoryResult, contributorResult] = await Promise.all([
    getCategoryByIdAction(post.category_id),
    getContributorByIdAction(post.contributor_id),
  ])

  if (!categoryResult.success || !categoryResult.data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Failed to load category</p>
      </div>
    )
  }

  if (!contributorResult.success || !contributorResult.data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Failed to load contributor</p>
      </div>
    )
  }

  return (
    <PostPreview
      post={post}
      category={categoryResult.data}
      contributor={contributorResult.data}
    />
  )
}

function PreviewLoading() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="h-96 w-full animate-pulse rounded-lg bg-gray-200" />
      <div className="h-12 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="h-6 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-64 w-full animate-pulse rounded bg-gray-200" />
    </div>
  )
}

export default async function PreviewPostPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link href="/admin/blog/posts">
          <Button variant="outline" size="sm">
            ← Back to Posts
          </Button>
        </Link>
        <Link href={`/admin/blog/posts/${id}`}>
          <Button variant="outline" size="sm">
            Edit Post
          </Button>
        </Link>
      </div>

      <Suspense fallback={<PreviewLoading />}>
        <PreviewContent postId={id} />
      </Suspense>
    </div>
  )
}
