'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { createRoleAction, updateRolePermissionsAction } from '@/actions/roles'
import type { Permission } from '@/types'

interface RoleCreateFormProps {
  groupedPermissions: Record<string, Permission[]>
}

export function RoleCreateForm({ groupedPermissions }: RoleCreateFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  const handleTogglePermission = (permissionKey: string) => {
    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey)
    } else {
      newSelected.add(permissionKey)
    }
    setSelectedPermissions(newSelected)
  }

  const handleToggleGroup = (permissions: Permission[]) => {
    const groupKeys = permissions.map((p) => p.permission_key)
    const allSelected = groupKeys.every((key) => selectedPermissions.has(key))

    const newSelected = new Set(selectedPermissions)
    if (allSelected) {
      groupKeys.forEach((key) => newSelected.delete(key))
    } else {
      groupKeys.forEach((key) => newSelected.add(key))
    }
    setSelectedPermissions(newSelected)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Role name is required')
      return
    }

    startTransition(async () => {
      // Create form data for role creation
      const formData = new FormData()
      formData.set('name', name.trim())
      formData.set('description', description.trim())

      // Create role
      const roleResult = await createRoleAction(formData)
      if (!roleResult.success) {
        setError(roleResult.error || 'Failed to create role')
        return
      }

      // If permissions selected, assign them
      if (selectedPermissions.size > 0 && roleResult.data?.id) {
        const permResult = await updateRolePermissionsAction(
          roleResult.data.id,
          Array.from(selectedPermissions)
        )
        if (!permResult.success) {
          // Role was created but permissions failed - still navigate but show warning
          console.error('Failed to assign permissions:', permResult.error)
        }
      }

      // Navigate to the new role's page
      router.push(`/admin/roles/${roleResult.data?.id || ''}`)
    })
  }

  const groups = Object.entries(groupedPermissions)

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      <LoadingOverlay isLoading={isPending} message="Creating role..." />
      {/* Error message */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}

      {/* Role Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Role Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Role Name"
            name="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Content Manager"
            required
          />

          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what this role is for..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20"
            />
          </div>
        </CardContent>
      </Card>

      {/* Permissions Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Permissions</CardTitle>
              <p className="mt-1 text-sm text-gray-500">
                Select permissions for this role (can be changed later)
              </p>
            </div>
            <span className="text-sm text-gray-500">{selectedPermissions.size} selected</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {groups.map(([groupName, permissions]) => {
              const groupKeys = permissions.map((p) => p.permission_key)
              const selectedInGroup = groupKeys.filter((key) => selectedPermissions.has(key)).length
              const allSelected = selectedInGroup === permissions.length

              return (
                <div key={groupName} className="overflow-hidden rounded-lg border border-gray-200">
                  {/* Group header */}
                  <div className="flex items-center justify-between border-b border-gray-200 bg-gray-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium text-gray-900">{groupName}</h4>
                      <span className="text-sm text-gray-500">
                        {selectedInGroup} / {permissions.length}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleGroup(permissions)}
                      className="text-sm font-medium text-mvm-blue hover:text-mvm-blue/80"
                    >
                      {allSelected ? 'Deselect all' : 'Select all'}
                    </button>
                  </div>

                  {/* Permissions list */}
                  <div className="divide-y divide-gray-100">
                    {permissions.map((permission) => {
                      const isSelected = selectedPermissions.has(permission.permission_key)
                      const isSensitive =
                        permission.description?.includes('⚠️') ||
                        permission.permission_key.includes('audit')

                      return (
                        <label
                          key={permission.permission_key}
                          className={`flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-gray-50 ${
                            isSensitive ? 'border-l-4 border-amber-400 bg-amber-50/50' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePermission(permission.permission_key)}
                            className="h-4 w-4 rounded border-gray-300 text-mvm-blue focus:ring-mvm-blue"
                          />
                          <div className="flex-1">
                            <p
                              className={`text-sm font-medium ${isSensitive ? 'text-amber-900' : 'text-gray-900'}`}
                            >
                              {permission.label}
                            </p>
                            {permission.description && (
                              <p
                                className={`text-sm ${isSensitive ? 'font-medium text-amber-700' : 'text-gray-500'}`}
                              >
                                {permission.description}
                              </p>
                            )}
                          </div>
                          <code className="text-xs text-gray-400">{permission.permission_key}</code>
                        </label>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit Buttons */}
      <div className="flex items-center gap-4">
        <Button type="submit" disabled={isPending || !name.trim()}>
          {isPending ? 'Creating...' : 'Create Role'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()} disabled={isPending}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
