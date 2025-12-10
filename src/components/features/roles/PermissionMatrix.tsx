'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { updateRolePermissionsAction } from '@/actions/roles'
import type { Permission } from '@/types'

interface PermissionMatrixProps {
  roleId: string
  roleName: string
  isSuperAdmin: boolean
  groupedPermissions: Record<string, Permission[]>
  assignedPermissions: string[]
}

export function PermissionMatrix({
  roleId,
  roleName,
  isSuperAdmin,
  groupedPermissions,
  assignedPermissions,
}: PermissionMatrixProps) {
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set(assignedPermissions)
  )
  const [isPending, startTransition] = useTransition()
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

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

  const handleToggleGroup = (_groupName: string, permissions: Permission[]) => {
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

  const handleSave = () => {
    setMessage(null)
    startTransition(async () => {
      const result = await updateRolePermissionsAction(roleId, Array.from(selectedPermissions))
      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Permissions updated' })
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update permissions' })
      }
    })
  }

  const hasChanges =
    !isSuperAdmin &&
    (selectedPermissions.size !== assignedPermissions.length ||
      !assignedPermissions.every((key) => selectedPermissions.has(key)))

  const groups = Object.entries(groupedPermissions)

  return (
    <div className="space-y-6">
      {/* Header with save button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Permissions</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isSuperAdmin
              ? 'Super Admin has access to all permissions by default'
              : `Configure what ${roleName} role can access`}
          </p>
        </div>
        {!isSuperAdmin && (
          <Button onClick={handleSave} disabled={!hasChanges || isPending}>
            {isPending ? 'Saving...' : 'Save Permissions'}
          </Button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-lg p-4 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800'
              : 'bg-red-50 text-red-800'
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Super Admin notice */}
      {isSuperAdmin && (
        <div className="rounded-lg bg-purple-50 p-4 text-purple-800">
          <p className="font-medium">Super Admin Role</p>
          <p className="mt-1 text-sm">
            This role automatically has access to all permissions and cannot be modified.
          </p>
        </div>
      )}

      {/* Permission groups */}
      <div className="space-y-6">
        {groups.map(([groupName, permissions]) => {
          const groupKeys = permissions.map((p) => p.permission_key)
          const selectedInGroup = groupKeys.filter((key) => selectedPermissions.has(key)).length
          const allSelected = selectedInGroup === permissions.length

          return (
            <div
              key={groupName}
              className="overflow-hidden rounded-lg border border-gray-200 bg-white"
            >
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
                    onClick={() => handleToggleGroup(groupName, permissions)}
                    className="text-sm font-medium text-mvm-blue hover:text-mvm-blue/80"
                  >
                    {allSelected ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>

              {/* Permissions list */}
              <div className="divide-y divide-gray-100">
                {permissions.map((permission) => {
                  const isSelected = isSuperAdmin || selectedPermissions.has(permission.permission_key)

                  const isSensitive = permission.description?.includes('⚠️') || permission.permission_key.includes('audit')
                  
                  return (
                    <label
                      key={permission.permission_key}
                      className={`flex cursor-pointer items-center gap-4 px-4 py-3 hover:bg-gray-50 ${
                        isSuperAdmin ? 'cursor-default' : ''
                      } ${isSensitive ? 'bg-amber-50/50 border-l-4 border-amber-400' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleTogglePermission(permission.permission_key)}
                        disabled={isSuperAdmin}
                        className="h-4 w-4 rounded border-gray-300 text-mvm-blue focus:ring-mvm-blue disabled:cursor-not-allowed disabled:opacity-50"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium ${isSensitive ? 'text-amber-900' : 'text-gray-900'}`}>
                          {permission.label}
                        </p>
                        {permission.description && (
                          <p className={`text-sm ${isSensitive ? 'text-amber-700 font-medium' : 'text-gray-500'}`}>
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

      {/* Bottom save button for long lists */}
      {!isSuperAdmin && groups.length > 2 && (
        <div className="flex justify-end border-t border-gray-200 pt-4">
          <Button onClick={handleSave} disabled={!hasChanges || isPending}>
            {isPending ? 'Saving...' : 'Save Permissions'}
          </Button>
        </div>
      )}
    </div>
  )
}
