'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { formatDate, getInitials } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: 'active' | 'inactive' | 'deleted'
  role: {
    id: string
    name: string
    is_super_admin: boolean
  }
  created_at: string
}

interface UserTableProps {
  users: User[]
}

export function UserTable({ users }: UserTableProps) {
  if (users.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
        <p className="text-gray-600">No users found</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              User
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Role
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
              Joined
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 bg-white">
          {users.map((user) => (
            <tr key={user.id} className="hover:bg-gray-50">
              <td className="whitespace-nowrap px-6 py-4">
                <div className="flex items-center">
                  <div className="h-10 w-10 flex-shrink-0">
                    {user.avatar_url ? (
                      <img
                        className="h-10 w-10 rounded-full object-cover"
                        src={user.avatar_url}
                        alt={user.name}
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-mvm-blue text-white">
                        {getInitials(user.name)}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                </div>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    user.role.is_super_admin
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-blue-100 text-blue-800'
                  }`}
                >
                  {user.role.name}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4">
                <span
                  className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                    user.status === 'active'
                      ? 'bg-green-100 text-green-800'
                      : user.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : user.status === 'invited'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-red-100 text-red-800'
                  }`}
                >
                  {user.status}
                </span>
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                {formatDate(user.created_at)}
              </td>
              <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                <Link href={`/admin/users/${user.id}`}>
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
