'use client'

import Link from 'next/link'
import { useAuth } from '@/store/provider'
import { Button } from '@/components/ui/Button'
import {
  AdminTable,
  Column,
  TableBadge,
  AvatarCell,
  DateCell,
  FilterConfig,
} from '@/components/ui/AdminTable'
import { formatDate, formatDateTime } from '@/lib/utils'

interface User {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: 'active' | 'inactive' | 'invited' | 'deleted'
  role: {
    id: string
    name: string
    is_super_admin: boolean
  }
  created_at: string
  last_login: string | null
  invitation_expires_at?: string | null
}

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`
  return formatDate(dateString)
}

interface UserTableProps {
  users: User[]
  pagination?: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

function getStatusVariant(status: string): 'success' | 'warning' | 'error' | 'info' | 'default' {
  switch (status) {
    case 'active':
      return 'success'
    case 'inactive':
      return 'warning'
    case 'invited':
      return 'info'
    case 'deleted':
      return 'error'
    default:
      return 'default'
  }
}

const STATUS_FILTER_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'invited', label: 'Invited' },
]

const USER_FILTERS: FilterConfig[] = [
  {
    key: 'status',
    label: 'Status',
    type: 'select',
    options: STATUS_FILTER_OPTIONS,
    placeholder: 'All statuses',
  },
]

export function UserTable({ users, pagination }: UserTableProps) {
  const { hasPermission } = useAuth()

  const columns: Column<User>[] = [
    {
      key: 'user',
      header: 'User',
      render: (user) => (
        <AvatarCell name={user.name} email={user.email} avatarUrl={user.avatar_url} />
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (user) => (
        <TableBadge variant={user.role.is_super_admin ? 'purple' : 'info'}>
          {user.role.name}
        </TableBadge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (user) => (
        <div className="space-y-1">
          <TableBadge variant={getStatusVariant(user.status)}>{user.status}</TableBadge>
          {user.status === 'invited' && user.invitation_expires_at && (
            <p className="text-xs text-gray-500">
              Expires: {formatDateTime(user.invitation_expires_at)}
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'joined',
      header: 'Created',
      render: (user) => <DateCell date={user.created_at} formatter={formatDate} />,
    },
    {
      key: 'last_login',
      header: 'Last Login',
      render: (user) =>
        user.last_login ? (
          <div>
            <div className="text-sm">{formatRelativeTime(user.last_login)}</div>
            <div className="text-xs text-gray-500">{formatDateTime(user.last_login)}</div>
          </div>
        ) : (
          <span className="text-sm text-gray-400">Never</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      render: (user) =>
        user.status === 'invited' ? (
          <span className="text-xs text-gray-400">Pending</span>
        ) : (
          <Link href={`/admin/users/${user.id}`}>
            <Button variant="ghost" size="sm">
              View
            </Button>
          </Link>
        ),
    },
  ]

  return (
    <AdminTable
      data={users}
      columns={columns}
      keyExtractor={(user) => user.id}
      searchable
      searchPlaceholder="Search by name or email..."
      filters={USER_FILTERS}
      pagination={pagination}
      headerAction={
        hasPermission('users.create') ? (
          <Link href="/admin/users/invite">
            <Button>Invite User</Button>
          </Link>
        ) : null
      }
      emptyMessage="No users found"
    />
  )
}
