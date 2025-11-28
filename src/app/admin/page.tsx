import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getUsersAction } from '@/actions/users'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  // Get user count
  const usersResult = await getUsersAction(1, 1)
  const totalUsers = usersResult.success ? usersResult.data!.total : 0

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600">Welcome back, {user?.email}</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users">
          <Card className="cursor-pointer transition-shadow hover:shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">Total Users</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-mvm-blue">{totalUsers}</p>
              <p className="text-sm text-gray-600">View all users →</p>
            </CardContent>
          </Card>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-mvm-blue">-</p>
            <p className="text-sm text-gray-600">Coming in Phase 3</p>
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

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Phase 1 Complete</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              Foundation and authentication are now set up. The following features will be
              implemented in subsequent phases:
            </p>
            <ul className="mt-4 space-y-2 text-sm text-gray-600">
              <li>• Phase 2: User Management</li>
              <li>• Phase 3: Role & Permission Management</li>
              <li>• Phase 4: Navigation System & Dashboard</li>
              <li>• Phase 5: Email Integration & Audit Logging</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
