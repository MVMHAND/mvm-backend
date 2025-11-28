import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getRolesWithCountsAction } from '@/actions/roles'
import { Button } from '@/components/ui/Button'
import { RoleTable } from '@/components/features/roles/RoleTable'
import { RoleSearch } from '@/components/features/roles/RoleSearch'

export const metadata = {
  title: 'Roles | My Virtual Mate',
  description: 'Manage user roles and permissions',
}

interface RolesPageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const search = params.search || ''

  const result = await getRolesWithCountsAction(search)

  if (!result.success) {
    return (
      <div className="p-8">
        <div className="rounded-lg bg-red-50 p-4 text-red-800">
          <p className="font-medium">Error</p>
          <p>{result.error}</p>
        </div>
      </div>
    )
  }

  const { roles, total } = result.data!

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Roles</h1>
          <p className="mt-2 text-gray-600">
            Manage roles and their permissions ({total} total)
          </p>
        </div>
        <Link href="/admin/roles/new">
          <Button>Create Role</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <RoleSearch initialSearch={search} />
      </div>

      {/* Info card */}
      <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Super Admin role has full access to all features and cannot be
          modified. Other roles can be edited or deleted if no users are assigned.
        </p>
      </div>

      {/* Role Table */}
      <RoleTable roles={roles} />
    </div>
  )
}
