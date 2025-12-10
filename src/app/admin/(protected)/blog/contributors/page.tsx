import { ContributorList } from '@/components/features/blog/ContributorList'
import { getContributorsAction } from '@/actions/blog-contributors'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'

interface ContributorsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function ContributorsPage({ searchParams }: ContributorsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''

  const result = await getContributorsAction({ page, limit: 10, search })

  if (!result.success || !result.data) {
    return (
      <PageContainer>
        <PageHeader
          title="Blog Contributors"
          description="Manage blog post contributors and authors"
        />
        <ErrorMessage message={result.error || 'Failed to load contributors'} />
      </PageContainer>
    )
  }

  const { contributors, total, pages } = result.data

  return (
    <PageContainer>
      <PageHeader
        title="Blog Contributors"
        description={`Manage blog post contributors and authors (${total} total)`}
      />

      <ContributorList
        contributors={contributors}
        pagination={{ page, pageSize: 10, total, totalPages: pages }}
      />
    </PageContainer>
  )
}
