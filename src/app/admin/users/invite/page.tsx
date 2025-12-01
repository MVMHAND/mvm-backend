import { getRolesAction } from '@/actions/roles'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { InviteUserForm } from '@/components/features/users/InviteUserForm'
import { PageContainer, PageHeader, ErrorMessage, FormContainer } from '@/components/layout/PageLayout'

export default async function InviteUserPage() {
  // Get roles for the form
  const result = await getRolesAction()

  if (!result.success) {
    return (
      <PageContainer>
        <ErrorMessage message={result.error || 'Failed to load roles'} />
      </PageContainer>
    )
  }

  const roles = result.data!

  return (
    <PageContainer>
      <PageHeader
        title="Invite New User"
        description="Send an invitation email to a new admin user. They will receive an email with instructions to set their password and access the admin panel."
      />

      <FormContainer>
        <Card>
          <CardHeader>
            <CardTitle>User Details</CardTitle>
            <CardDescription>Enter the new user's information below</CardDescription>
          </CardHeader>
          <CardContent>
            <InviteUserForm roles={roles} />
          </CardContent>
        </Card>
      </FormContainer>
    </PageContainer>
  )
}
