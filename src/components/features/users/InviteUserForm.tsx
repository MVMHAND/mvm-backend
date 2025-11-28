'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { inviteUserAction } from '@/actions/users'

interface Role {
  id: string
  name: string
  description: string | null
  is_super_admin: boolean
  is_system: boolean
}

interface InviteUserFormProps {
  roles: Role[]
}

export function InviteUserForm({ roles }: InviteUserFormProps) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [roleId, setRoleId] = useState('')
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
      formData.append('email', email)
      formData.append('role_id', roleId)

      const result = await inviteUserAction(formData)

      if (!result.success) {
        setError(result.error || 'Failed to send invitation')
        setIsLoading(false)
        return
      }

      setSuccess(result.message || 'Invitation sent successfully!')
      setIsLoading(false)

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/admin/users')
        router.refresh()
      }, 2000)
    } catch (err) {
      setError('An unexpected error occurred')
      setIsLoading(false)
    }
  }

  // Filter out Super Admin role from selection
  const selectableRoles = roles.filter((role) => !role.is_super_admin)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Input
        label="Full Name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="John Doe"
        required
        disabled={isLoading}
      />

      <Input
        label="Email Address"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="john@example.com"
        required
        helperText="The user will receive an invitation email at this address"
        disabled={isLoading}
      />

      <div>
        <label htmlFor="role" className="mb-2 block text-sm font-medium text-gray-700">
          Role <span className="text-red-500">*</span>
        </label>
        <select
          id="role"
          value={roleId}
          onChange={(e) => setRoleId(e.target.value)}
          required
          disabled={isLoading}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-mvm-blue focus:outline-none focus:ring-2 focus:ring-mvm-blue focus:ring-opacity-20 disabled:bg-gray-100 disabled:text-gray-500"
        >
          <option value="">Select a role...</option>
          {selectableRoles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
              {role.description && ` - ${role.description}`}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Choose the appropriate role for this user's responsibilities
        </p>
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

      <div className="flex gap-4">
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          Send Invitation
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          onClick={() => router.push('/admin/users')}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}
