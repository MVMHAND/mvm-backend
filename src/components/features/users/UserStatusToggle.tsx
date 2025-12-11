'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/contexts/ToastContext'
import { toggleUserStatusAction } from '@/actions/users'

interface UserStatusToggleProps {
  user: {
    id: string
    name: string
    status: 'active' | 'inactive' | 'deleted' | 'invited'
  }
}

export function UserStatusToggle({ user }: UserStatusToggleProps) {
  const router = useRouter()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  async function handleConfirm() {
    setIsLoading(true)

    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      const result = await toggleUserStatusAction(user.id, newStatus)

      if (!result.success) {
        error(result.error || 'Failed to update user status')
        return
      }

      success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`)
      setShowConfirm(false)
      router.refresh()
    } catch {
      error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Don't show toggle for deleted or invited users
  // Invited users must accept invitation first before they can be activated/deactivated
  if (user.status === 'deleted' || user.status === 'invited') {
    return null
  }

  return (
    <>
      <Button
        variant={user.status === 'active' ? 'outline' : 'primary'}
        onClick={() => setShowConfirm(true)}
      >
        {user.status === 'active' ? 'Deactivate' : 'Activate'}
      </Button>

      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirm}
        title={`${user.status === 'active' ? 'Deactivate' : 'Activate'} User`}
        message={`Are you sure you want to ${user.status === 'active' ? 'deactivate' : 'activate'} ${user.name}?`}
        confirmText={user.status === 'active' ? 'Deactivate' : 'Activate'}
        variant={user.status === 'active' ? 'danger' : 'primary'}
        isLoading={isLoading}
      />
    </>
  )
}
