'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/contexts/ToastContext'
import { AdminTable, Column, DateCell, TableError } from '@/components/ui/AdminTable'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { deleteJobCategoryAction } from '@/actions/job-categories'
import { formatDateTime } from '@/lib/utils'
import type { JobCategory } from '@/types/job-posts'

interface JobCategoryListProps {
  categories: JobCategory[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function JobCategoryList({ categories, pagination }: JobCategoryListProps) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    categoryId: string
    categoryName: string
  }>({ isOpen: false, categoryId: '', categoryName: '' })

  const handleDelete = (categoryId: string, categoryName: string) => {
    setConfirmDialog({ isOpen: true, categoryId, categoryName })
  }

  const confirmDelete = () => {
    const { categoryId } = confirmDialog
    setError(null)
    setDeletingId(categoryId)
    startTransition(async () => {
      const result = await deleteJobCategoryAction(categoryId)

      if (result.success) {
        success('Category deleted successfully')
        setConfirmDialog({ isOpen: false, categoryId: '', categoryName: '' })
        router.refresh()
      } else {
        showError(result.error || 'Failed to delete category')
        setError(result.error || 'Failed to delete category')
      }
      setDeletingId(null)
    })
  }

  const columns: Column<JobCategory>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (category) => (
          <div>
            <div className="font-medium text-gray-900">{category.name}</div>
            {category.description && (
              <div className="mt-1 text-sm text-gray-500">{category.description}</div>
            )}
          </div>
        ),
      },
      {
        key: 'slug',
        header: 'Slug',
        render: (category) => <span className="text-sm text-gray-500">{category.slug}</span>,
      },
      {
        key: 'posts',
        header: 'Posts',
        render: (category) => (
          <span className="text-sm text-gray-500">
            {category.post_count} {category.post_count === 1 ? 'post' : 'posts'}
          </span>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (category) => <DateCell date={category.created_at} formatter={formatDateTime} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        headerAlign: 'right',
        cellAlign: 'right',
        render: (category) => (
          <div className="flex justify-end gap-2">
            <Link href={`/admin/job-posts/categories/${category.id}`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(category.id, category.name)}
              disabled={isPending && deletingId === category.id}
            >
              {isPending && deletingId === category.id ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPending, deletingId]
  )

  return (
    <div className="relative space-y-4">
      <LoadingOverlay isLoading={isPending} message="Deleting..." />
      {error && <TableError message={error} />}

      <AdminTable
        data={categories}
        columns={columns}
        keyExtractor={(category) => category.id}
        searchable
        searchPlaceholder="Search categories..."
        pagination={pagination}
        headerAction={
          <Link href="/admin/job-posts/categories/new">
            <Button>Create Category</Button>
          </Link>
        }
        emptyMessage="No categories yet. Create your first one!"
      />

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, categoryId: '', categoryName: '' })}
        onConfirm={confirmDelete}
        title="Delete Category"
        message={`Are you sure you want to delete "${confirmDialog.categoryName}"? This will fail if the category has published posts.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isPending && deletingId === confirmDialog.categoryId}
      />
    </div>
  )
}
