'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/contexts/ToastContext'
import { AdminTable, Column, AvatarCell, DateCell, TableError } from '@/components/ui/AdminTable'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
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
  const { success, error: showError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    contributorId: string
    contributorName: string
  }>({ isOpen: false, contributorId: '', contributorName: '' })

  const handleDelete = (contributorId: string, contributorName: string) => {
    setConfirmDialog({ isOpen: true, contributorId, contributorName })
  }

  const confirmDelete = () => {
    const { contributorId } = confirmDialog
    setError(null)
    setDeletingId(contributorId)
    startTransition(async () => {
      const result = await deleteContributorAction(contributorId)

      if (result.success) {
        success('Contributor deleted successfully')
        setConfirmDialog({ isOpen: false, contributorId: '', contributorName: '' })
        router.refresh()
      } else {
        showError(result.error || 'Failed to delete contributor')
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [isPending, deletingId]
  )

  return (
    <div className="relative space-y-4">
      <LoadingOverlay isLoading={isPending} message="Deleting..." />
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

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, contributorId: '', contributorName: '' })}
        onConfirm={confirmDelete}
        title="Delete Contributor"
        message={`Are you sure you want to delete "${confirmDialog.contributorName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={isPending && deletingId === confirmDialog.contributorId}
      />
    </div>
  )
}
