'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import {
  AdminTable,
  Column,
  TableBadge,
  AvatarCell,
  DateCell,
  FilterConfig,
} from '@/components/ui/AdminTable'
import { formatDate } from '@/lib/utils'

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

function getStatusVariant(
  status: string
): 'success' | 'warning' | 'error' | 'info' | 'default' {
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
        <TableBadge variant={getStatusVariant(user.status)}>{user.status}</TableBadge>
      ),
    },
    {
      key: 'joined',
      header: 'Joined',
      render: (user) => <DateCell date={user.created_at} formatter={formatDate} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      render: (user) => (
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
        <Link href="/admin/users/invite">
          <Button>Invite User</Button>
        </Link>
      }
      emptyMessage="No users found"
    />
  )
}
