'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/store/provider'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/contexts/ToastContext'
import {
  AdminTable,
  Column,
  TableBadge,
  DateCell,
  TableError,
  FilterConfig,
} from '@/components/ui/AdminTable'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { Permissions } from '@/lib/permission-constants'
import {
  deleteJobPostAction,
  publishJobPostAction,
  unpublishJobPostAction,
} from '@/actions/job-posts'
import { formatDateTime } from '@/lib/utils'
import { AuditTooltip } from '@/components/features/shared/AuditTooltip'
import type { JobPostWithUsers } from '@/types/job-posts'

interface CategoryOption {
  id: string
  name: string
}

interface JobPostListProps {
  posts: JobPostWithUsers[]
  categories: CategoryOption[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function JobPostList({ posts, categories, pagination }: JobPostListProps) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const { hasPermission } = useAuth()
  const [isPending, startTransition] = useTransition()
  const [actioningId, setActioningId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    type: 'delete' | 'unpublish'
    postId: string
    postTitle: string
  }>({ isOpen: false, type: 'delete', postId: '', postTitle: '' })

  const handleDelete = (postId: string, postTitle: string) => {
    setConfirmDialog({ isOpen: true, type: 'delete', postId, postTitle })
  }

  const confirmDelete = () => {
    const { postId } = confirmDialog
    setError(null)
    setActioningId(postId)
    startTransition(async () => {
      const result = await deleteJobPostAction(postId)

      if (result.success) {
        success('Job post deleted successfully')
        setConfirmDialog({ isOpen: false, type: 'delete', postId: '', postTitle: '' })
        router.refresh()
      } else {
        showError(result.error || 'Failed to delete job post')
        setError(result.error || 'Failed to delete job post')
      }
      setActioningId(null)
    })
  }

  const handlePublish = (postId: string) => {
    setError(null)
    setActioningId(postId)
    startTransition(async () => {
      const result = await publishJobPostAction(postId)

      if (result.success) {
        success('Job post published successfully')
        router.refresh()
      } else {
        showError(result.error || 'Failed to publish job post')
        setError(result.error || 'Failed to publish job post')
      }
      setActioningId(null)
    })
  }

  const handleUnpublish = (postId: string, postTitle: string) => {
    setConfirmDialog({ isOpen: true, type: 'unpublish', postId, postTitle })
  }

  const confirmUnpublish = () => {
    const { postId } = confirmDialog
    setError(null)
    setActioningId(postId)
    startTransition(async () => {
      const result = await unpublishJobPostAction(postId)

      if (result.success) {
        success('Job post unpublished successfully')
        setConfirmDialog({ isOpen: false, type: 'unpublish', postId: '', postTitle: '' })
        router.refresh()
      } else {
        showError(result.error || 'Failed to unpublish job post')
        setError(result.error || 'Failed to unpublish job post')
      }
      setActioningId(null)
    })
  }

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
        key: 'employment_type',
        label: 'Employment Type',
        type: 'select',
        options: [
          { value: 'full-time', label: 'Full-Time' },
          { value: 'part-time', label: 'Part-Time' },
          { value: 'contract', label: 'Contract' },
          { value: 'project-based', label: 'Project-Based' },
          { value: 'freelance', label: 'Freelance' },
          { value: 'internship', label: 'Internship' },
        ],
        placeholder: 'All types',
      },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: categories.map((c) => ({ value: c.id, label: c.name })),
        placeholder: 'All categories',
      },
    ],
    [categories]
  )

  const columns: Column<JobPostWithUsers>[] = useMemo(
    () => [
      {
        key: 'title',
        header: 'Job Title',
        render: (post) => (
          <div className="min-w-0">
            <div className="font-medium text-gray-900">{post.title}</div>
            <div className="mt-1 text-sm text-gray-500">ID: {post.job_id}</div>
          </div>
        ),
        className: 'whitespace-normal',
      },
      {
        key: 'category',
        header: 'Category',
        render: (post) => (
          <TableBadge variant="info">{post.category?.name || 'Uncategorized'}</TableBadge>
        ),
      },
      {
        key: 'employment_type',
        header: 'Type',
        render: (post) => (
          <span className="text-sm capitalize">{post.employment_type.replace('-', ' ')}</span>
        ),
      },
      {
        key: 'location',
        header: 'Location',
        render: (post) => (
          <div>
            <div className="text-sm">{post.location || '—'}</div>
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (post) => {
          const statusColors = {
            draft: 'bg-gray-100 text-gray-800',
            published: 'bg-green-100 text-green-800',
            unpublished: 'bg-yellow-100 text-yellow-800',
          }
          return (
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${statusColors[post.status]}`}
            >
              {post.status}
            </span>
          )
        },
      },
      {
        key: 'posted_date',
        header: 'Posted',
        render: (post) => {
          const date = post.custom_posted_date || post.published_at || post.created_at
          return (
            <AuditTooltip
              createdBy={post.creator}
              createdAt={post.created_at}
              updatedBy={post.updater}
              updatedAt={post.updated_at}
            >
              <DateCell date={date} formatter={formatDateTime} />
            </AuditTooltip>
          )
        },
      },
      {
        key: 'actions',
        header: 'Actions',
        headerAlign: 'right',
        cellAlign: 'right',
        render: (post) => (
          <div className="flex justify-end gap-2">
            {hasPermission(Permissions.JOB_POSTS_EDIT) && (
              <Link href={`/admin/job-posts/posts/${post.id}`}>
                <Button size="sm" variant="outline">
                  Edit
                </Button>
              </Link>
            )}
            {hasPermission(Permissions.JOB_POSTS_PUBLISH) &&
              (post.status === 'draft' || post.status === 'unpublished') && (
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
            {hasPermission(Permissions.JOB_POSTS_PUBLISH) && post.status === 'published' && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleUnpublish(post.id, post.title)}
                disabled={isPending && actioningId === post.id}
              >
                {isPending && actioningId === post.id ? 'Unpublishing...' : 'Unpublish'}
              </Button>
            )}
            {hasPermission(Permissions.JOB_POSTS_DELETE) && post.status !== 'published' && (
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
    [isPending, actioningId]
  )

  return (
    <div className="relative space-y-4">
      <LoadingOverlay isLoading={isPending} message="Processing..." />
      {error && <TableError message={error} />}

      <AdminTable
        data={posts}
        columns={columns}
        keyExtractor={(post) => post.id}
        searchable
        searchPlaceholder="Search job posts..."
        filters={filters}
        pagination={pagination}
        headerAction={
          hasPermission(Permissions.JOB_POSTS_EDIT) ? (
            <Link href="/admin/job-posts/posts/new">
              <Button>Create Job Post</Button>
            </Link>
          ) : null
        }
        emptyMessage="No job posts yet. Create your first one!"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() =>
          setConfirmDialog({ isOpen: false, type: 'delete', postId: '', postTitle: '' })
        }
        onConfirm={confirmDialog.type === 'delete' ? confirmDelete : confirmUnpublish}
        title={confirmDialog.type === 'delete' ? 'Delete Job Post' : 'Unpublish Job Post'}
        message={
          confirmDialog.type === 'delete'
            ? `Are you sure you want to delete "${confirmDialog.postTitle}"? This action cannot be undone.`
            : `Are you sure you want to unpublish "${confirmDialog.postTitle}"?`
        }
        confirmText={confirmDialog.type === 'delete' ? 'Delete' : 'Unpublish'}
        variant="danger"
        isLoading={isPending && actioningId === confirmDialog.postId}
      />
    </div>
  )
}
