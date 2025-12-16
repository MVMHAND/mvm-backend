import { AllowedDomainsList } from '@/components/features/settings/AllowedDomainsList'
import { getAllowedDomainsAction } from '@/actions/allowed-domains'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'

export const metadata = {
  title: 'Allowed Domains | Settings',
  description: 'Manage domains allowed to access the public blog API',
}

interface AllowedDomainsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function AllowedDomainsPage({ searchParams }: AllowedDomainsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''

  const result = await getAllowedDomainsAction({ page, limit: 10, search })

  if (!result.success || !result.data) {
    return (
      <PageContainer>
        <PageHeader
          title="Allowed Domains"
          description="Manage domains allowed to access the public blog API"
        />
        <ErrorMessage message={result.error || 'Failed to load allowed domains'} />
      </PageContainer>
    )
  }

  const { domains, total, pages } = result.data

  return (
    <PageContainer>
      <PageHeader
        title="Allowed Domains"
        description={`Manage domains allowed to access the public blog API (${total} total)`}
      />

      <AllowedDomainsList
        domains={domains}
        pagination={{ page, pageSize: 10, total, totalPages: pages }}
      />
    </PageContainer>
  )
}
