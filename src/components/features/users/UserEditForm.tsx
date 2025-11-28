'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { updateUserAction } from '@/actions/users'

interface UserEditFormProps {
  user: {
    id: string
    name: string
    email: string
    role: {
      id: string
      name: string
    }
  }
  roles: Array<{
    id: string
    name: string
    description: string | null
    is_super_admin: boolean
  }>
  disabled?: boolean
}

export function UserEditForm({ user, roles, disabled = false }: UserEditFormProps) {
  const router = useRouter()
  const [name, setName] = useState(user.name)
  const [roleId, setRoleId] = useState(user.role.id)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('role_id', roleId)

      const result = await updateUserAction(user.id, formData)

      if (!result.success) {
        setError(result.error || 'Failed to update user')
        setIsLoading(false)
        return
      }

      setSuccess(result.message || 'User updated successfully!')
      setIsLoading(false)
      router.refresh()
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Filter out Super Admin role
  const selectableRoles = roles.filter((role) => !role.is_super_admin)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          disabled={disabled || isLoading}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20 disabled:bg-gray-100 disabled:text-gray-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          id="email"
          type="email"
          value={user.email}
          disabled
          className="w-full rounded-lg border border-gray-300 bg-gray-100 px-4 py-2 text-gray-500"
        />
        <p className="mt-1 text-sm text-gray-500">Email cannot be changed</p>
      </div>

      <div>
        <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          required
          disabled={disabled || isLoading}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20 disabled:bg-gray-100 disabled:text-gray-500"
        >
          {selectableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
              {role.description && ` - ${role.description}`}
            </option>
          ))}
        </select>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
          <p className="font-medium">Error</p>
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-green-800">
          <p className="font-medium">Success</p>
          <p>{success}</p>
        </div>
      )}

      {!disabled && (
        <Button type="submit" isLoading={isLoading}>
          Save Changes
        </Button>
      )}
    </form>
  )
}
