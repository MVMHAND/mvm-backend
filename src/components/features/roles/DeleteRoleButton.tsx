'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { deleteRoleAction } from '@/actions/roles'

interface DeleteRoleButtonProps {
  roleId: string
  roleName: string
  isSystem?: boolean // Kept for backward compatibility but not used
  userCount: number
}

export function DeleteRoleButton({
  roleId,
  roleName,
  userCount,
}: DeleteRoleButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Can only delete if no users are assigned
  const canDelete = userCount === 0

  const handleDelete = () => {
    setError(null)
    startTransition(async () => {
      const result = await deleteRoleAction(roleId)
      if (result.success) {
        router.push('/admin/roles')
      } else {
        setError(result.error || 'Failed to delete role')
        setShowConfirm(false)
      }
    })
  }

  if (!canDelete) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
        <p className="text-sm font-medium text-gray-700">Cannot delete this role</p>
        <p className="mt-1 text-sm text-gray-500">
          This role has {userCount} user(s) assigned. Reassign them to another role first.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}

      {!showConfirm ? (
        <Button variant="danger" onClick={() => setShowConfirm(true)}>
          Delete Role
        </Button>
      ) : (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="font-medium text-red-800">
            Are you sure you want to delete &quot;{roleName}&quot;?
          </p>
          <p className="mt-1 text-sm text-red-600">This action cannot be undone.</p>
          <div className="mt-4 flex gap-3">
            <Button variant="danger" onClick={handleDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Yes, Delete'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
