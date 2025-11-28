import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUserByIdAction } from '@/actions/users'
import { getRolesAction } from '@/actions/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { UserEditForm } from '@/components/features/users/UserEditForm'
import { UserStatusToggle } from '@/components/features/users/UserStatusToggle'
import { DeleteUserButton } from '@/components/features/users/DeleteUserButton'
import { AvatarUpload } from '@/components/features/users/AvatarUpload'
import { formatDateTime, getInitials } from '@/lib/utils'

interface UserDetailPageProps {
  params: {
    id: string
  }
}

export async function generateMetadata({ params }: UserDetailPageProps) {
  const { id } = await params
  const result = await getUserByIdAction(id)
  const userName = result.success && result.data ? result.data.name : 'User'
  
  return {
    title: `${userName} | My Virtual Mate`,
    description: 'Manage user details',
  }
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const {
    data: { user: currentUser },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!currentUser) {
    redirect('/admin/login')
  }

  // Get user data and roles
  const [userResult, rolesResult] = await Promise.all([
    getUserByIdAction(id),
    getRolesAction(),
  ])

  if (!userResult.success) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p>{userResult.error}</p>
        </div>
      </div>
    )
  }

  if (!rolesResult.success) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p>{rolesResult.error}</p>
        </div>
      </div>
    )
  }

  const user = userResult.data!
  const roles = rolesResult.data!
  const isSuperAdmin = user.role?.is_super_admin || false

  return (
    <div className="p-8">
      <div className="mb-8">
        <Link href="/admin/users" className="text-sm text-mvm-blue hover:underline">
          ← Back to Users
        </Link>
      </div>

      <div className="mb-6 flex items-start justify-between">
        <div className="flex items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="h-20 w-20 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-mvm-blue text-2xl font-bold text-white">
              {getInitials(user.name)}
            </div>
          )}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{user.name}</h1>
            <p className="text-gray-600">{user.email}</p>
            <div className="mt-2 flex items-center gap-2">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                  isSuperAdmin
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {user.role?.name}
              </span>
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
            </div>
          </div>
        </div>

        {!isSuperAdmin && <UserStatusToggle user={user} />}
      </div>

      {isSuperAdmin && (
        <div className="mb-6 rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
          <p className="text-sm font-medium text-purple-900">
            🔒 This is the Super Admin user. This account cannot be edited, deactivated, or
            deleted.
          </p>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>User Information</CardTitle>
              <CardDescription>
                {isSuperAdmin ? 'View user details' : 'Update user details and role'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UserEditForm user={user} roles={roles} disabled={isSuperAdmin} />
            </CardContent>
          </Card>

          {!isSuperAdmin && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-red-600">Danger Zone</CardTitle>
                <CardDescription>Irreversible and destructive actions</CardDescription>
              </CardHeader>
              <CardContent>
                <DeleteUserButton userId={user.id} userName={user.name} />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Picture</CardTitle>
            </CardHeader>
            <CardContent>
              <AvatarUpload user={user} disabled={isSuperAdmin} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Account Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium text-gray-700">User ID:</span>
                <p className="mt-1 font-mono text-xs text-gray-600">{user.id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Created:</span>
                <p className="mt-1 text-gray-600">{formatDateTime(user.created_at)}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Last Updated:</span>
                <p className="mt-1 text-gray-600">{formatDateTime(user.updated_at)}</p>
              </div>
              {user.last_login && (
                <div>
                  <span className="font-medium text-gray-700">Last Login:</span>
                  <p className="mt-1 text-gray-600">{formatDateTime(user.last_login)}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
