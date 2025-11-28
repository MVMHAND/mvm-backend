import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  getRoleByIdAction,
  getPermissionsAction,
  getRolePermissionsAction,
  getRoleUsersAction,
} from '@/actions/roles'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { RoleEditForm } from '@/components/features/roles/RoleEditForm'
import { RoleUsers } from '@/components/features/roles/RoleUsers'
import { DeleteRoleButton } from '@/components/features/roles/DeleteRoleButton'
import { formatDate } from '@/lib/utils'

interface RoleDetailPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: RoleDetailPageProps) {
  const { id } = await params
  const result = await getRoleByIdAction(id)

  if (!result.success || !result.data) {
    return { title: 'Role Not Found | My Virtual Mate' }
  }

  return {
    title: `${result.data.name} | Roles | My Virtual Mate`,
    description: result.data.description || `Manage ${result.data.name} role`,
  }
}

export default async function RoleDetailPage({ params }: RoleDetailPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  const { id } = await params

  // Fetch role, permissions, assigned permissions, and users in parallel
  const [roleResult, permissionsResult, assignedResult, usersResult] = await Promise.all([
    getRoleByIdAction(id),
    getPermissionsAction(),
    getRolePermissionsAction(id),
    getRoleUsersAction(id),
  ])

  if (!roleResult.success || !roleResult.data) {
    notFound()
  }

  const role = roleResult.data
  const groupedPermissions = permissionsResult.data?.grouped || {}
  const assignedPermissions = assignedResult.data || []
  const roleUsers = usersResult.data || []

  return (
    <div className="p-8">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm">
        <ol className="flex items-center gap-2">
          <li>
            <Link href="/admin/roles" className="text-mvm-blue hover:underline">
              Roles
            </Link>
          </li>
          <li className="text-gray-400">/</li>
          <li className="text-gray-600">{role.name}</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold text-gray-900">{role.name}</h1>
          {role.is_super_admin && (
            <span className="rounded-full bg-purple-100 px-3 py-1 text-sm font-medium text-purple-800">
              Super Admin
            </span>
          )}
          {role.is_system && !role.is_super_admin && (
            <span className="rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
              System Role
            </span>
          )}
        </div>
        {role.description && (
          <p className="mt-2 text-gray-600">{role.description}</p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main content - 2 columns */}
        <div className="lg:col-span-2">
          {/* Unified Role Edit Form with single save button */}
          <RoleEditForm
            role={role}
            groupedPermissions={groupedPermissions}
            assignedPermissions={assignedPermissions}
          />
        </div>

        {/* Sidebar - 1 column */}
        <div className="space-y-6">
          {/* Role Info */}
          <Card>
            <CardHeader>
              <CardTitle>Role Information</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Permissions assigned</dt>
                  <dd className="mt-1 text-lg font-semibold text-gray-900">
                    {role.is_super_admin ? 'All' : assignedPermissions.length}
                  </dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(role.created_at)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(role.updated_at)}</dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          {/* Users with this role */}
          <Card>
            <CardHeader>
              <CardTitle>
                Users ({roleUsers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RoleUsers users={roleUsers} roleName={role.name} />
            </CardContent>
          </Card>

          {/* Delete Role */}
          {!role.is_super_admin && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
              </CardHeader>
              <CardContent>
                <DeleteRoleButton
                  roleId={role.id}
                  roleName={role.name}
                  isSystem={false}
                  userCount={role.user_count || 0}
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
