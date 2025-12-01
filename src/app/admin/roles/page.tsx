import { getRolesWithCountsAction } from '@/actions/roles'
import { RoleTable } from '@/components/features/roles/RoleTable'
import {
  PageContainer,
  PageHeader,
  PageSection,
  ErrorMessage,
  InfoMessage,
} from '@/components/layout/PageLayout'

interface RolesPageProps {
  searchParams: Promise<{ search?: string }>
}

export default async function RolesPage({ searchParams }: RolesPageProps) {
  const params = await searchParams
  const search = params.search || ''

  const result = await getRolesWithCountsAction(search)

  if (!result.success) {
    return (
      <PageContainer>
        <ErrorMessage message={result.error || 'An error occurred'} />
      </PageContainer>
    )
  }

  const { roles, total } = result.data!

  return (
    <PageContainer>
      <PageHeader
        title="Roles"
        description={`Manage roles and their permissions (${total} total)`}
      />

      <PageSection>
        <InfoMessage>
          <strong>Note:</strong> Super Admin role has full access to all features and cannot be
          modified. Other roles can be edited or deleted if no users are assigned.
        </InfoMessage>
      </PageSection>

      <RoleTable roles={roles} />
    </PageContainer>
  )
}
