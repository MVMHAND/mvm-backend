'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { deleteUserAction } from '@/actions/users'

interface DeleteUserButtonProps {
  userId: string
  userName: string
}

export function DeleteUserButton({ userId, userName }: DeleteUserButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleDelete() {
    setIsLoading(true)

    try {
      const result = await deleteUserAction(userId)

      if (!result.success) {
        alert(`Error: ${result.error}`)
        setIsLoading(false)
        setShowConfirm(false)
        return
      }

      // Redirect to users list
      router.push('/admin/users')
      router.refresh()
    } catch {
      alert('An unexpected error occurred')
      setIsLoading(false)
      setShowConfirm(false)
    }
  }

  if (!showConfirm) {
    return (
      <div>
        <p className="mb-4 text-sm text-gray-600">
          Deleting a user will soft-delete their account. They will no longer be able to access
          the admin panel. This action can be reversed by reactivating the user.
        </p>
        <Button variant="danger" onClick={() => setShowConfirm(true)}>
          Delete User
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border-2 border-red-200 bg-red-50 p-4">
      <p className="mb-4 font-medium text-red-900">
        Are you absolutely sure you want to delete {userName}?
      </p>
      <p className="mb-4 text-sm text-red-800">
        This will immediately revoke their access to the admin panel. You can reactivate them
        later if needed.
      </p>
      <div className="flex gap-3">
        <Button variant="danger" onClick={handleDelete} isLoading={isLoading}>
          Yes, Delete User
        </Button>
        <Button variant="outline" onClick={() => setShowConfirm(false)} disabled={isLoading}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
