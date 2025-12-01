'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AdminTable, Column, AvatarCell, DateCell, TableError } from '@/components/ui/AdminTable'
import { deleteContributorAction } from '@/actions/blog-contributors'
import { formatDateTime } from '@/lib/utils'
import type { BlogContributor } from '@/types'

interface ContributorListProps {
  contributors: BlogContributor[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function ContributorList({ contributors, pagination }: ContributorListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = (contributorId: string, contributorName: string) => {
    if (!confirm(`Are you sure you want to delete "${contributorName}"?`)) {
      return
    }

    setError(null)
    setDeletingId(contributorId)
    startTransition(async () => {
      const result = await deleteContributorAction(contributorId)

      if (result.success) {
        router.refresh()
      } else {
        setError(result.error || 'Failed to delete contributor')
      }
      setDeletingId(null)
    })
  }

  const columns: Column<BlogContributor>[] = useMemo(
    () => [
      {
        key: 'contributor',
        header: 'Contributor',
        render: (contributor) => (
          <AvatarCell name={contributor.full_name} avatarUrl={contributor.avatar_url} />
        ),
      },
      {
        key: 'position',
        header: 'Position',
        render: (contributor) => (
          <div className="text-sm text-gray-900">{contributor.position}</div>
        ),
      },
      {
        key: 'posts',
        header: 'Posts',
        render: (contributor) => (
          <span className="text-sm text-gray-500">
            {contributor.post_count} {contributor.post_count === 1 ? 'post' : 'posts'}
          </span>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (contributor) => (
          <DateCell date={contributor.created_at} formatter={formatDateTime} />
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        headerAlign: 'right',
        cellAlign: 'right',
        render: (contributor) => (
          <div className="flex justify-end gap-2">
            <Link href={`/admin/blog/contributors/${contributor.id}`}>
              <Button size="sm" variant="outline">
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(contributor.id, contributor.full_name)}
              disabled={isPending && deletingId === contributor.id}
            >
              {isPending && deletingId === contributor.id ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        ),
      },
    ],
    [isPending, deletingId]
  )

  return (
    <div className="space-y-4">
      {error && <TableError message={error} />}

      <AdminTable
        data={contributors}
        columns={columns}
        keyExtractor={(contributor) => contributor.id}
        searchable
        searchPlaceholder="Search contributors..."
        pagination={pagination}
        headerAction={
          <Link href="/admin/blog/contributors/new">
            <Button>Create Contributor</Button>
          </Link>
        }
        emptyMessage="No contributors yet. Create your first one!"
      />
    </div>
  )
}
