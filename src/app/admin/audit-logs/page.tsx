import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card'
import { AuditLogTable } from '@/components/features/audit/AuditLogTable'
import { AuditLogFilters } from '@/components/features/audit/AuditLogFilters'
import { AuditLogStats } from '@/components/features/audit/AuditLogStats'
import { getAuditLogStatsAction } from '@/actions/audit'
import { PageContainer, PageHeader, PageSection } from '@/components/layout/PageLayout'

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

  // Get audit log statistics
  const statsResult = await getAuditLogStatsAction()
  const stats = statsResult.success ? statsResult.data : null

  return (
    <PageContainer>
      <PageHeader
        title="Audit Logs"
        description="Track all system activities, user actions, and changes"
      />

      {/* Statistics */}
      {stats && <AuditLogStats stats={stats} />}

      {/* Filters */}
      <PageSection>
        <Card>
          <CardHeader>
            <CardTitle>Filter Logs</CardTitle>
            <CardDescription>Filter audit logs by action type, user, date, etc.</CardDescription>
          </CardHeader>
          <CardContent>
            <AuditLogFilters initialFilters={params} />
          </CardContent>
        </Card>
      </PageSection>

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
    </PageContainer>
  )
}
