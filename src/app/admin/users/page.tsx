import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getUsersAction } from '@/actions/users'
import { Button } from '@/components/ui/Button'
import { UserTable } from '@/components/features/users/UserTable'
import { UserSearch } from '@/components/features/users/UserSearch'

interface UsersPageProps {
  searchParams: {
    page?: string
    search?: string
  }
}

export const metadata = {
  title: 'Users | My Virtual Mate',
  description: 'Manage admin users',
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if not authenticated
  if (!user) {
    redirect('/admin/login')
  }

  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''

  const result = await getUsersAction(page, 10, search)

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

  const { users, total, pages } = result.data!

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-gray-600">
            Manage admin users and their permissions ({total} total)
          </p>
        </div>
        <Link href="/admin/users/invite">
          <Button>Invite User</Button>
        </Link>
      </div>

      {/* Search */} 
      <div className="mb-6">
          <UserSearch initialSearch={search} />
      </div>

      {/* User Table */}
      <UserTable users={users} />

      {/* Pagination */}
      {pages > 1 && (
        <div className="mt-6">
          <div className="flex items-center justify-center gap-2">
            <Link
              href={`/admin/users?page=${page - 1}${search ? `&search=${search}` : ''}`}
              className={page <= 1 ? 'pointer-events-none opacity-50' : ''}
            >
              <Button variant="outline" disabled={page <= 1}>
                Previous
              </Button>
            </Link>
            <span className="text-sm text-gray-600">
              Page {page} of {pages}
            </span>
            <Link
              href={`/admin/users?page=${page + 1}${search ? `&search=${search}` : ''}`}
              className={page >= pages ? 'pointer-events-none opacity-50' : ''}
            >
              <Button variant="outline" disabled={page >= pages}>
                Next
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
