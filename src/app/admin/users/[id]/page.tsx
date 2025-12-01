import { getUserByIdAction } from '@/actions/users'
import { getRolesAction } from '@/actions/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { UserEditForm } from '@/components/features/users/UserEditForm'
import { UserStatusToggle } from '@/components/features/users/UserStatusToggle'
import { DeleteUserButton } from '@/components/features/users/DeleteUserButton'
import { AvatarUpload } from '@/components/features/users/AvatarUpload'
import { formatDateTime, getInitials } from '@/lib/utils'
import { PageContainer, ErrorMessage, InfoMessage } from '@/components/layout/PageLayout'

interface UserDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function UserDetailPage({ params }: UserDetailPageProps) {
  const { id } = await params

  // Get user data and roles
  const [userResult, rolesResult] = await Promise.all([
    getUserByIdAction(id),
    getRolesAction(),
  ])

  if (!userResult.success) {
    return (
      <PageContainer>
        <ErrorMessage message={userResult.error || 'Failed to load user'} />
      </PageContainer>
    )
  }

  if (!rolesResult.success) {
    return (
      <PageContainer>
        <ErrorMessage message={rolesResult.error || 'Failed to load roles'} />
      </PageContainer>
    )
  }

  const user = userResult.data!
  const roles = rolesResult.data!
  const isSuperAdmin = user.role?.is_super_admin || false

  return (
    <PageContainer>
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
        <InfoMessage variant="warning" className="mb-6">
          <p className="font-medium">
            🔒 This is the Super Admin user. This account cannot be edited, deactivated, or
            deleted.
          </p>
        </InfoMessage>
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
    </PageContainer>
  )
}
