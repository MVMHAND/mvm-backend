'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
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
  const [isLoading, setIsLoading] = useState(false)

  async function handleToggle() {
    if (
      !confirm(
        `Are you sure you want to ${user.status === 'active' ? 'deactivate' : 'activate'} ${user.name}?`
      )
    ) {
      return
    }

    setIsLoading(true)

    try {
      const newStatus = user.status === 'active' ? 'inactive' : 'active'
      const result = await toggleUserStatusAction(user.id, newStatus)

      if (!result.success) {
        alert(`Error: ${result.error}`)
        return
      }

      router.refresh()
    } catch {
      alert('An unexpected error occurred')
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
    <Button
      variant={user.status === 'active' ? 'outline' : 'primary'}
      onClick={handleToggle}
      isLoading={isLoading}
    >
      {user.status === 'active' ? 'Deactivate' : 'Activate'}
    </Button>
  )
}
