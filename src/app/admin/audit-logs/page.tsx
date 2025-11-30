import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { AuditLogTable } from '@/components/features/audit/AuditLogTable'
import { AuditLogFilters } from '@/components/features/audit/AuditLogFilters'
import { AuditLogStats } from '@/components/features/audit/AuditLogStats'
import { getAuditLogStatsAction } from '@/actions/audit'

export const metadata = {
  title: 'Audit Logs | My Virtual Mate',
  description: 'View system audit logs and activity history',
}

interface AuditLogsPageProps {
  searchParams: Promise<{
    page?: string
    actionType?: string
    actorId?: string
    targetType?: string
    startDate?: string
    endDate?: string
  }>
}

export default async function AuditLogsPage({ searchParams }: AuditLogsPageProps) {
  const params = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/admin/login')
  }

  // Get audit log statistics
  const statsResult = await getAuditLogStatsAction()
  const stats = statsResult.success ? statsResult.data : null

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Audit Logs</h1>
        <p className="mt-2 text-gray-600">
          Track all system activities, user actions, and changes
        </p>
      </div>

      {/* Statistics */}
      {stats && <AuditLogStats stats={stats} />}

      {/* Filters */}
      <div className="mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Filter Logs</CardTitle>
            <CardDescription>Filter audit logs by action type, user, date, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogFilters initialFilters={params} />
          </CardContent>
        </Card>
      </div>

      {/* Audit Log Table */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>Complete log of all system activities</CardDescription>
        </CardHeader>
        <CardContent>
          <AuditLogTable
            page={params.page ? parseInt(params.page) : 1}
            filters={{
              actionType: params.actionType,
              actorId: params.actorId,
              targetType: params.targetType,
              startDate: params.startDate,
              endDate: params.endDate,
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
