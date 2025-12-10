'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AdminTable, Column, TableBadge, DateCell, TableError, FilterConfig } from '@/components/ui/AdminTable'
import { StatusBadge } from './StatusBadge'
import { deletePostAction, publishPostAction, unpublishPostAction } from '@/actions/blog-posts'
import { formatDateTime } from '@/lib/utils'
import type { BlogPost } from '@/types'

interface CategoryOption {
  id: string
  name: string
}

interface ContributorOption {
  id: string
  full_name: string
}

interface PostListProps {
  posts: BlogPost[]
  categories: CategoryOption[]
  contributors: ContributorOption[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function PostList({ posts, categories, contributors, pagination }: PostListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

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

  // Build filter configuration from categories and contributors
  const filters: FilterConfig[] = useMemo(
    () => [
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'published', label: 'Published' },
          { value: 'unpublished', label: 'Unpublished' },
        ],
        placeholder: 'All statuses',
      },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: categories.map((c) => ({ value: c.id, label: c.name })),
        placeholder: 'All categories',
      },
      {
        key: 'contributor',
        label: 'Author',
        type: 'select',
        options: contributors.map((c) => ({ value: c.id, label: c.full_name })),
        placeholder: 'All authors',
      },
    ],
    [categories, contributors]
  )

  const columns: Column<BlogPost>[] = useMemo(
    () => [
      {
        key: 'post',
        header: 'Post',
        render: (post) => (
          <div className="max-w-md">
            <div className="font-medium text-gray-900">{post.title}</div>
            <div className="mt-1 text-sm text-gray-500 line-clamp-1">{post.seo_meta_description}</div>
          </div>
        ),
        className: 'whitespace-normal',
      },
      {
        key: 'category',
        header: 'Category',
        render: (post) => (
          <TableBadge variant="info">
            {categories.find((c) => c.id === post.category_id)?.name || 'Unknown'}
          </TableBadge>
        ),
      },
      {
        key: 'author',
        header: 'Author',
        render: (post) => (
          <span className="text-sm text-gray-500">
            {contributors.find((c) => c.id === post.contributor_id)?.full_name || 'Unknown'}
          </span>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (post) => <StatusBadge status={post.status} />,
      },
      {
        key: 'published',
        header: 'Published',
        render: (post) =>
          post.published_date ? (
            <DateCell date={post.published_date} formatter={formatDateTime} />
          ) : (
            <span className="text-gray-400">—</span>
          ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerAlign: 'right',
        cellAlign: 'right',
        render: (post) => (
          <div className="flex justify-end gap-2">
            <Link href={`/admin/blog/posts/${post.id}`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            {(post.status === 'draft' || post.status === 'unpublished') && (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => handlePublish(post.id)}
                disabled={isPending && actioningId === post.id}
              >
                {isPending && actioningId === post.id
                  ? 'Publishing...'
                  : post.status === 'unpublished'
                    ? 'Republish'
                    : 'Publish'}
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
        ),
        className: 'whitespace-normal',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [categories, contributors, isPending, actioningId]
  )

  return (
    <div className="space-y-4">
      {error && <TableError message={error} />}

      <AdminTable
        data={posts}
        columns={columns}
        keyExtractor={(post) => post.id}
        searchable
        searchPlaceholder="Search posts..."
        filters={filters}
        pagination={pagination}
        headerAction={
          <Link href="/admin/blog/posts/new">
            <Button>Create Post</Button>
          </Link>
        }
        emptyMessage="No posts yet. Create your first one!"
      />
    </div>
  )
}
