import { getUsersAction } from '@/actions/users'
import { UserTable } from '@/components/features/users/UserTable'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'

interface UsersPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
  }>
}

export default async function UsersPage({ searchParams }: UsersPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const status = params.status || ''

  const result = await getUsersAction(page, 10, search, status)

  if (!result.success) {
    return (
      <PageContainer>
        <ErrorMessage message={result.error || 'An error occurred'} />
      </PageContainer>
    )
  }

  const { users, total, pages } = result.data!

  return (
    <PageContainer>
      <PageHeader
        title="Users"
        description={`Manage admin users and their permissions (${total} total)`}
      />

      <UserTable
        users={users}
        pagination={{
          page,
          pageSize: 10,
          total,
          totalPages: pages,
        }}
      />
    </PageContainer>
  )
}
