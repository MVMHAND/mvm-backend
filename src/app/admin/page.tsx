import { createClient } from '@/lib/supabase/server'
import { PageContainer, PageHeader } from '@/components/layout/PageLayout'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get current user's profile
  const { data: profile } = await supabase
    .from('users')
    .select('name, role:user_roles(name)')
    .eq('id', user?.id ?? '')
    .single()

  return (
    <PageContainer>
      <PageHeader
        title={`Welcome back, ${profile?.name || user?.email}!`}
      />
    </PageContainer>
  )
}
