import { Suspense } from 'react'
import { PostList } from '@/components/features/blog/PostList'
import { getPostsAction } from '@/actions/blog-posts'
import { getCategoriesAction } from '@/actions/blog-categories'
import { getContributorsAction } from '@/actions/blog-contributors'

export const metadata = {
  title: 'Blog Posts',
  description: 'Manage blog posts',
}

async function PostsContent() {
  const [postsResult, categoriesResult, contributorsResult] = await Promise.all([
    getPostsAction(),
    getCategoriesAction(),
    getContributorsAction(),
  ])

  if (!postsResult.success || !postsResult.data) {
    return (
      <div className="rounded-lg bg-red-50 p-4 text-red-800">
        <p>Failed to load posts: {postsResult.error}</p>
      </div>
    )
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
    <PostList
      posts={postsResult.data}
      categories={categoriesResult.data}
      contributors={contributorsResult.data}
    />
  )
}

function PostsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-gray-200" />
      <div className="flex gap-3">
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-32 animate-pulse rounded-lg bg-gray-200" />
      </div>
      <div className="h-96 w-full animate-pulse rounded-lg bg-gray-200" />
    </div>
  )
}
 
export default function PostsPage() {
  return (
    <div className="p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Posts</h1>
          <p className="mt-2 text-gray-600">Create and manage blog posts</p>
        </div>
      </div>

      <Suspense fallback={<PostsLoading />}>
        <PostsContent />
      </Suspense>
    </div>
  )
}
