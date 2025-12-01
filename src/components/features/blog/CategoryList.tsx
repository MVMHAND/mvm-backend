'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AdminTable, Column, DateCell, TableError } from '@/components/ui/AdminTable'
import { deleteCategoryAction } from '@/actions/blog-categories'
import { formatDateTime } from '@/lib/utils'
import type { BlogCategory } from '@/types'

interface CategoryListProps {
  categories: BlogCategory[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function CategoryList({ categories, pagination }: CategoryListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = (categoryId: string, categoryName: string) => {
    if (!confirm(`Are you sure you want to delete "${categoryName}"?`)) {
      return
    }

    setError(null)
    setDeletingId(categoryId)
    startTransition(async () => {
      const result = await deleteCategoryAction(categoryId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to delete category')
      }
      setDeletingId(null)
    })
  }

  const columns: Column<BlogCategory>[] = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        render: (category) => (
          <div className="font-medium text-gray-900">{category.name}</div>
        ),
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
            <Link href={`/admin/blog/categories/${category.id}`}>
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
    <div className="space-y-4">
      {error && <TableError message={error} />}

      <AdminTable
        data={categories}
        columns={columns}
        keyExtractor={(category) => category.id}
        searchable
        searchPlaceholder="Search categories..."
        pagination={pagination}
        headerAction={
          <Link href="/admin/blog/categories/new">
            <Button>Create Category</Button>
          </Link>
        }
        emptyMessage="No categories yet. Create your first one!"
      />
    </div>
  )
}
