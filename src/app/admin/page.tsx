import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { getUsersAction } from '@/actions/users'
import { getRolesWithCountsAction } from '@/actions/roles'
import { PageContainer, PageHeader } from '@/components/layout/PageLayout'

export default async function AdminDashboard() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get stats in parallel
  const [usersResult, rolesResult] = await Promise.all([
    getUsersAction(1, 1),
    getRolesWithCountsAction(),
  ])

  const totalUsers = usersResult.success ? usersResult.data!.total : 0
  const totalRoles = rolesResult.success ? rolesResult.data!.total : 0

  // Get current user's profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('name, role:roles(name)')
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
