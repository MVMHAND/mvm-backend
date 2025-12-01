'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface RoleUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: string
}

interface RoleUsersProps {
  users: RoleUser[]
  roleName: string
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-800'
    case 'inactive':
      return 'bg-yellow-100 text-yellow-800'
    case 'invited':
      return 'bg-blue-100 text-blue-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

export function RoleUsers({ users, roleName }: RoleUsersProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
        <p className="text-gray-600">No users assigned to {roleName}</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {users.map((user) => (
        <div
          key={user.id}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3"
        >
          <div className="flex items-center gap-3">
            {/* Avatar */}
            {user.avatar_url ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.avatar_url}
                alt={user.name}
                className="h-10 w-10 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mvm-blue text-sm font-medium text-white">
                {getInitials(user.name)}
              </div>
            )}

            {/* User info */}
            <div>
              <p className="font-medium text-gray-900">{user.name}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Status badge */}
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(user.status)}`}
            >
              {user.status}
            </span>

            {/* View link */}
            <Link href={`/admin/users/${user.id}`}>
              <Button variant="ghost" size="sm">
                View
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}
