import { getPermissionsAction } from '@/actions/roles'
import { RoleCreateForm } from '@/components/features/roles/RoleCreateForm'
import { PageContainer, PageHeader, FormContainer } from '@/components/layout/PageLayout'

export const dynamic = 'force-dynamic'

export default async function NewRolePage() {
  // Fetch permissions for selection
  const permissionsResult = await getPermissionsAction()
  const groupedPermissions = permissionsResult.data?.grouped || {}

  return (
    <PageContainer>
      <PageHeader title="Create New Role" description="Define a new role with custom permissions" />

      <FormContainer>
        <RoleCreateForm groupedPermissions={groupedPermissions} />
      </FormContainer>
    </PageContainer>
  )
}
