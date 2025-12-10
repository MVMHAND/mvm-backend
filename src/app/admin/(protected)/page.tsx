import { verifySessionWithProfile } from '@/lib/dal'
import { PageContainer, PageHeader } from '@/components/layout/PageLayout'

export default async function AdminDashboard() {
  // SECURITY: Validate authentication with DAL
  const profile = await verifySessionWithProfile()

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${profile.name || profile.email}!`}
      />
    </PageContainer>
  )
}
