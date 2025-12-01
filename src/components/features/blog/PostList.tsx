'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { StatusBadge } from './StatusBadge'
import { PostFilters } from './PostFilters'
import { deletePostAction, publishPostAction, unpublishPostAction } from '@/actions/blog-posts'
import { formatDateTime } from '@/lib/utils'
import type { BlogPost, BlogCategory, BlogContributor, BlogPostStatus } from '@/types'

interface PostListProps {
  posts: BlogPost[]
  categories: BlogCategory[]
  contributors: BlogContributor[]
}

export function PostList({ posts, categories, contributors }: PostListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BlogPostStatus | 'all'>('all')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [contributorFilter, setContributorFilter] = useState('')
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Filter posts
  const filteredPosts = posts.filter((post) => {
    const matchesSearch =
      post.title.toLowerCase().includes(search.toLowerCase()) ||
      post.seo_meta_description.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || post.status === statusFilter
    const matchesCategory = !categoryFilter || post.category_id === categoryFilter
    const matchesContributor = !contributorFilter || post.contributor_id === contributorFilter

    return matchesSearch && matchesStatus && matchesCategory && matchesContributor
  })

  const handleDelete = (postId: string, postTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${postTitle}"?`)) {
      return
    }

    setError(null)
    setActioningId(postId)
    startTransition(async () => {
      const result = await deletePostAction(postId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to delete post')
      }
      setActioningId(null)
    })
  }

  const handlePublish = (postId: string) => {
    setError(null)
    setActioningId(postId)
    startTransition(async () => {
      const result = await publishPostAction(postId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to publish post')
      }
      setActioningId(null)
    })
  }

  const handleUnpublish = (postId: string) => {
    if (!confirm('Are you sure you want to unpublish this post?')) {
      return
    }

    setError(null)
    setActioningId(postId)
    startTransition(async () => {
      const result = await unpublishPostAction(postId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to unpublish post')
      }
      setActioningId(null)
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Input
          type="search"
          placeholder="Search posts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />
        <Link href="/admin/blog/posts/new">
          <Button>Create Post</Button>
        </Link>
      </div>

      <PostFilters
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        contributorFilter={contributorFilter}
        onStatusChange={setStatusFilter}
        onCategoryChange={setCategoryFilter}
        onContributorChange={setContributorFilter}
        categories={categories}
        contributors={contributors}
      />

      <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Post
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Author
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Published
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  {search || statusFilter !== 'all' || categoryFilter || contributorFilter
                    ? 'No posts found matching your filters.'
                    : 'No posts yet. Create your first one!'}
                </td>
              </tr>
            ) : (
              filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="max-w-md">
                      <div className="font-medium text-gray-900">{post.title}</div>
                      <div className="mt-1 text-sm text-gray-500 line-clamp-1">{post.seo_meta_description}</div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                      {categories.find((c) => c.id === post.category_id)?.name || 'Unknown'}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {contributors.find((c) => c.id === post.contributor_id)?.full_name || 'Unknown'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4">
                    <StatusBadge status={post.status} />
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                    {post.published_date ? formatDateTime(post.published_date) : '—'}
                  </td>
                  <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/blog/posts/${post.id}/preview`}>
                        <Button size="sm" variant="ghost">
                          Preview
                        </Button>
                      </Link>
                      <Link href={`/admin/blog/posts/${post.id}`}>
                        <Button size="sm" variant="outline">
                          Edit
                        </Button>
                      </Link>
                      {post.status === 'draft' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handlePublish(post.id)}
                          disabled={isPending && actioningId === post.id}
                        >
                          {isPending && actioningId === post.id ? 'Publishing...' : 'Publish'}
                        </Button>
                      )}
                      {post.status === 'published' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUnpublish(post.id)}
                          disabled={isPending && actioningId === post.id}
                        >
                          {isPending && actioningId === post.id ? 'Unpublishing...' : 'Unpublish'}
                        </Button>
                      )}
                      {post.status !== 'published' && (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleDelete(post.id, post.title)}
                          disabled={isPending && actioningId === post.id}
                        >
                          {isPending && actioningId === post.id ? 'Deleting...' : 'Delete'}
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {filteredPosts.length > 0 && (
        <div className="text-sm text-gray-500">
          Showing {filteredPosts.length} of {posts.length} posts
        </div>
      )}
    </div>
  )
}
