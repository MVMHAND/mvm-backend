'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/Button'
import { AdminTable, Column, TableBadge, DateCell } from '@/components/ui/AdminTable'
import { formatDate } from '@/lib/utils'
import type { Role } from '@/types'

interface RoleWithCount extends Role {
  user_count: number
}

interface RoleTableProps {
  roles: RoleWithCount[]
}

export function RoleTable({ roles }: RoleTableProps) {
  const columns: Column<RoleWithCount>[] = [
    {
      key: 'role',
      header: 'Role',
      render: (role) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-900">{role.name}</span>
            {role.is_super_admin && <TableBadge variant="purple">Super Admin</TableBadge>}
          </div>
          {role.description && <p className="mt-1 text-sm text-gray-500">{role.description}</p>}
        </div>
      ),
    },
    {
      key: 'type',
      header: 'Type',
      render: (role) => (
        <TableBadge variant={role.is_system ? 'info' : 'default'}>
          {role.is_system ? 'System' : 'Custom'}
        </TableBadge>
      ),
    },
    {
      key: 'users',
      header: 'Users',
      render: (role) => (
        <span className="text-sm text-gray-900">
          {role.user_count}
          <span className="ml-1 text-gray-500">{role.user_count === 1 ? 'user' : 'users'}</span>
        </span>
      ),
    },
    {
      key: 'created',
      header: 'Created',
      render: (role) => <DateCell date={role.created_at} formatter={formatDate} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      headerAlign: 'right',
      cellAlign: 'right',
      render: (role) => (
        <Link href={`/admin/roles/${role.id}`}>
          <Button variant="ghost" size="sm">
            {role.is_super_admin ? 'View' : 'Edit'}
          </Button>
        </Link>
      ),
    },
  ]

  return (
    <AdminTable
      data={roles}
      columns={columns}
      keyExtractor={(role) => role.id}
      searchable
      searchPlaceholder="Search roles..."
      headerAction={
        <Link href="/admin/roles/new">
          <Button>Create Role</Button>
        </Link>
      }
      emptyMessage="No roles found"
    />
  )
}
