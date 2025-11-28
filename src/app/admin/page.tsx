import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getUsersAction } from '@/actions/users'
import { getRolesWithCountsAction } from '@/actions/roles'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  // Get stats in parallel
  const [usersResult, rolesResult] = await Promise.all([
    getUsersAction(1, 1),
    getRolesWithCountsAction(),
  ])

  const totalUsers = usersResult.success ? usersResult.data!.total : 0
  const totalRoles = rolesResult.success ? rolesResult.data!.total : 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Link href="/admin/users">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-mvm-blue">{totalUsers}</p>
              <p className="text-sm text-gray-600">Manage users →</p>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/roles">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Active Roles</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-mvm-blue">{totalRoles}</p>
              <p className="text-sm text-gray-600">Manage roles →</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Permissions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-mvm-blue">11</p>
            <p className="text-sm text-gray-600">System permissions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">System Status</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">✓</p>
            <p className="text-sm text-gray-600">All systems operational</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link
                href="/admin/users/invite"
                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-mvm-blue hover:bg-mvm-blue/5"
              >
                <p className="font-medium text-gray-900">Invite New User</p>
                <p className="text-sm text-gray-600">Send an invitation to a new admin</p>
              </Link>
              <Link
                href="/admin/roles/new"
                className="block rounded-lg border border-gray-200 p-3 transition-colors hover:border-mvm-blue hover:bg-mvm-blue/5"
              >
                <p className="font-medium text-gray-900">Create New Role</p>
                <p className="text-sm text-gray-600">Define a new role with custom permissions</p>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Implementation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">Phase 1: Foundation & Authentication</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">Phase 2: User Management</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-green-600">✓</span>
                <span className="text-gray-600">Phase 3: Role & Permission Management</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-yellow-600">○</span>
                <span className="text-gray-600">Phase 4: Navigation System & Dashboard</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-gray-400">○</span>
                <span className="text-gray-600">Phase 5: Email Integration & Audit Logging</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
