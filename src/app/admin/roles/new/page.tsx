import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getPermissionsAction } from '@/actions/roles'
import { RoleCreateForm } from '@/components/features/roles/RoleCreateForm'

export const metadata = {
  title: 'Create Role | My Virtual Mate',
  description: 'Create a new user role',
}

export default async function NewRolePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  // Fetch permissions for selection
  const permissionsResult = await getPermissionsAction()
  const groupedPermissions = permissionsResult.data?.grouped || {}

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
          <li className="text-gray-600">Create New Role</li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create New Role</h1>
        <p className="mt-2 text-gray-600">
          Define a new role with custom permissions
        </p>
      </div>

      {/* Form with permissions */}
      <div className="max-w-4xl">
        <RoleCreateForm groupedPermissions={groupedPermissions} />
      </div>
    </div>
  )
}
