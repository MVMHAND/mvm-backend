'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { createRoleAction, updateRoleAction } from '@/actions/roles'
import type { Role } from '@/types'

interface RoleFormProps {
  role?: Role
  isEditing?: boolean
}

export function RoleForm({ role, isEditing = false }: RoleFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const result = isEditing && role
        ? await updateRoleAction(role.id, formData)
        : await createRoleAction(formData)

      if (result.success) {
        if (isEditing) {
          router.refresh()
        } else {
          router.push('/admin/roles')
        }
      } else {
        setError(result.error || 'An error occurred')
      }
    })
  }

  const isSuperAdmin = role?.is_super_admin || false

  return (
    <Card className="relative">
      <LoadingOverlay isLoading={isPending} message={isEditing ? 'Saving...' : 'Creating...'} />
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Role' : 'Create New Role'}</CardTitle>
      </CardHeader>
      <CardContent>
        {isSuperAdmin && (
          <div className="mb-6 rounded-lg bg-purple-50 p-4 text-purple-800">
            <p className="font-medium">Super Admin Role</p>
            <p className="mt-1 text-sm">This role cannot be modified.</p>
          </div>
        )}

        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <Input
            label="Role Name"
            name="name"
            type="text"
            defaultValue={role?.name || ''}
            placeholder="e.g., Content Manager"
            required
            disabled={isSuperAdmin}
          />

          <div>
            <label
              htmlFor="description"
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              defaultValue={role?.description || ''}
              placeholder="Describe what this role is for..."
              disabled={isSuperAdmin}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
            />
          </div>

          {!isSuperAdmin && (
            <div className="flex gap-4">
              <Button type="submit" disabled={isPending}>
                {isPending
                  ? isEditing
                    ? 'Saving...'
                    : 'Creating...'
                  : isEditing
                    ? 'Save Changes'
                    : 'Create Role'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isPending}
              >
                Cancel
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
