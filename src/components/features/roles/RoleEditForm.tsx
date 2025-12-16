'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { updateRoleAction, updateRolePermissionsAction } from '@/actions/roles'
import type { Role, Permission } from '@/types'

interface RoleEditFormProps {
  role: Role
  groupedPermissions: Record<string, Permission[]>
  assignedPermissions: string[]
}

export function RoleEditForm({ role, groupedPermissions, assignedPermissions }: RoleEditFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(role.name)
  const [description, setDescription] = useState(role.description || '')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(assignedPermissions)
  )

  const isSuperAdmin = role.is_super_admin

  const handleTogglePermission = (permissionKey: string) => {
    if (isSuperAdmin) return

    const newSelected = new Set(selectedPermissions)
    if (newSelected.has(permissionKey)) {
      newSelected.delete(permissionKey)
    } else {
      newSelected.add(permissionKey)
    }
    setSelectedPermissions(newSelected)
  }

  const handleToggleGroup = (permissions: Permission[]) => {
    if (isSuperAdmin) return

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
    if (isSuperAdmin) return

    setError(null)
    setSuccess(null)

    startTransition(async () => {
      // Create form data for role update
      const formData = new FormData()
      formData.set('name', name)
      formData.set('description', description)

      // Update role details
      const roleResult = await updateRoleAction(role.id, formData)
      if (!roleResult.success) {
        setError(roleResult.error || 'Failed to update role')
        return
      }

      // Update permissions
      const permResult = await updateRolePermissionsAction(role.id, Array.from(selectedPermissions))
      if (!permResult.success) {
        setError(permResult.error || 'Failed to update permissions')
        return
      }

      setSuccess('Role updated successfully')
      router.refresh()
    })
  }

  // Check if anything has changed
  const hasNameChange = name !== role.name
  const hasDescriptionChange = description !== (role.description || '')
  const hasPermissionChange =
    selectedPermissions.size !== assignedPermissions.length ||
    !assignedPermissions.every((key) => selectedPermissions.has(key))
  const hasChanges = !isSuperAdmin && (hasNameChange || hasDescriptionChange || hasPermissionChange)

  const groups = Object.entries(groupedPermissions)

  return (
    <form onSubmit={handleSubmit} className="relative space-y-6">
      <LoadingOverlay isLoading={isPending} message="Saving changes..." />
      {/* Messages */}
      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-green-800">
          <p>{success}</p>
        </div>
      )}

      {/* Super Admin notice */}
      {isSuperAdmin && (
        <div className="rounded-lg bg-purple-50 p-4 text-purple-800">
          <p className="font-medium">Super Admin Role</p>
          <p className="mt-1 text-sm">
            This role cannot be modified and automatically has access to all permissions.
          </p>
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
            disabled={isSuperAdmin}
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
              disabled={isSuperAdmin}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50"
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
                {isSuperAdmin
                  ? 'Super Admin has access to all permissions'
                  : `Select permissions for ${role.name}`}
              </p>
            </div>
            {!isSuperAdmin && (
              <span className="text-sm text-gray-500">{selectedPermissions.size} selected</span>
            )}
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
                        {isSuperAdmin
                          ? `${permissions.length} / ${permissions.length}`
                          : `${selectedInGroup} / ${permissions.length}`}
                      </span>
                    </div>
                    {!isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => handleToggleGroup(permissions)}
                        className="text-sm font-medium text-mvm-blue hover:text-mvm-blue/80"
                      >
                        {allSelected ? 'Deselect all' : 'Select all'}
                      </button>
                    )}
                  </div>

                  {/* Permissions list */}
                  <div className="divide-y divide-gray-100">
                    {permissions.map((permission) => {
                      const isSelected =
                        isSuperAdmin || selectedPermissions.has(permission.permission_key)
                      const isSensitive =
                        permission.description?.includes('⚠️') ||
                        permission.permission_key.includes('audit')

                      return (
                        <label
                          key={permission.permission_key}
                          className={`flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-gray-50 ${
                            isSuperAdmin ? 'cursor-default' : ''
                          } ${isSensitive ? 'border-l-4 border-amber-400 bg-amber-50/50' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTogglePermission(permission.permission_key)}
                            disabled={isSuperAdmin}
                            className="h-4 w-4 rounded border-gray-300 text-mvm-blue focus:ring-mvm-blue disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Save Button */}
      {!isSuperAdmin && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-sm text-gray-500">
            {hasChanges ? 'You have unsaved changes' : 'No changes to save'}
          </p>
          <Button type="submit" disabled={!hasChanges || isPending}>
            {isPending ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </form>
  )
}
