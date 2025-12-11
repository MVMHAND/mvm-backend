'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/contexts/ToastContext'
import { AdminTable, Column, DateCell, TableError } from '@/components/ui/AdminTable'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { deleteAllowedDomainAction, toggleDomainStatusAction } from '@/actions/allowed-domains'
import { formatDateTime } from '@/lib/utils'
import type { AllowedDomain } from '@/types'

interface AllowedDomainsListProps {
  domains: AllowedDomain[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

export function AllowedDomainsList({ domains, pagination }: AllowedDomainsListProps) {
  const router = useRouter()
  const { success, error: showError } = useToast()
  const [isPending, startTransition] = useTransition()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    domainId: string
    domainName: string
  }>({ isOpen: false, domainId: '', domainName: '' })

  const handleDelete = (domainId: string, domainName: string) => {
    setConfirmDialog({ isOpen: true, domainId, domainName })
  }

  const confirmDelete = () => {
    const { domainId } = confirmDialog
    setError(null)
    setDeletingId(domainId)
    startTransition(async () => {
      const result = await deleteAllowedDomainAction(domainId)

      if (result.success) {
        success('Domain deleted successfully')
        setConfirmDialog({ isOpen: false, domainId: '', domainName: '' })
        router.refresh()
      } else {
        showError(result.error || 'Failed to delete domain')
        setError(result.error || 'Failed to delete domain')
      }
      setDeletingId(null)
    })
  }

  const handleToggleStatus = (domainId: string, currentStatus: boolean) => {
    setError(null)
    setTogglingId(domainId)
    startTransition(async () => {
      const result = await toggleDomainStatusAction(domainId, !currentStatus)

      if (result.success) {
        success(`Domain ${!currentStatus ? 'activated' : 'deactivated'} successfully`)
        router.refresh()
      } else {
        showError(result.error || 'Failed to toggle domain status')
        setError(result.error || 'Failed to toggle domain status')
      }
      setTogglingId(null)
    })
  }

  const columns: Column<AllowedDomain>[] = useMemo(
    () => [
      {
        key: 'domain',
        header: 'Domain',
        render: (domain) => (
          <div>
            <div className="font-medium text-gray-900">{domain.domain}</div>
            {domain.description && (
              <div className="text-sm text-gray-500 mt-1">{domain.description}</div>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        render: (domain) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              domain.is_active
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {domain.is_active ? 'Active' : 'Inactive'}
          </span>
        ),
      },
      {
        key: 'created',
        header: 'Created',
        render: (domain) => <DateCell date={domain.created_at} formatter={formatDateTime} />,
      },
      {
        key: 'actions',
        header: 'Actions',
        headerAlign: 'right',
        cellAlign: 'right',
        render: (domain) => (
          <div className="flex justify-end gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleToggleStatus(domain.id, domain.is_active)}
              disabled={isPending && togglingId === domain.id}
            >
              {togglingId === domain.id
                ? 'Updating...'
                : domain.is_active
                  ? 'Deactivate'
                  : 'Activate'}
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => handleDelete(domain.id, domain.domain)}
              disabled={isPending && deletingId === domain.id}
            >
              {deletingId === domain.id ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        ),
      },
    ],
    [isPending, deletingId, togglingId]
  )

  return (
    <>
      <LoadingOverlay isLoading={isPending} />
      {error && <TableError message={error} />}
      <AdminTable<AllowedDomain>
        data={domains}
        columns={columns}
        keyExtractor={(domain) => domain.id}
        pagination={pagination}
        searchable
        searchPlaceholder="Search domains..."
        emptyMessage="No allowed domains found"
      />
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title="Delete Domain"
        message={`Are you sure you want to delete "${confirmDialog.domainName}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        onConfirm={confirmDelete}
        onClose={() => setConfirmDialog({ isOpen: false, domainId: '', domainName: '' })}
      />
    </>
  )
}
