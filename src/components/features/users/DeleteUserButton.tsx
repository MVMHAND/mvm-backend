'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/contexts/ToastContext'
import { deleteUserAction } from '@/actions/users'

interface DeleteUserButtonProps {
  userId: string
  userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsLoading(true)

    try {
      const result = await deleteUserAction(userId)

      if (!result.success) {
        error(result.error || 'Failed to delete user')
        setIsLoading(false)
        setShowConfirm(false)
        return
      }

      success('User deleted successfully')
      setShowConfirm(false)
      router.push('/admin/users')
      router.refresh()
    } catch {
      error('An unexpected error occurred')
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  return (
    <div>
      <p className="mb-4 text-sm text-gray-600">
        Deleting a user will soft-delete their account. They will no longer be able to access the
        admin panel. This action can be reversed by reactivating the user.
      </p>
      <Button variant="danger" onClick={() => setShowConfirm(true)}>
        Delete User
      </Button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you absolutely sure you want to delete ${userName}? This will immediately revoke their access to the admin panel. You can reactivate them later if needed.`}
        confirmText="Yes, Delete User"
        variant="danger"
        isLoading={isLoading}
      />
    </div>
  )
}
