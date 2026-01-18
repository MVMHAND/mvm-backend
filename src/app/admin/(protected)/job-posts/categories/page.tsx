import { JobCategoryList } from '@/components/features/job-posts/JobCategoryList'
import { getJobCategoriesAction } from '@/actions/job-categories'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'

export default async function JobCategoriesPage() {
  const result = await getJobCategoriesAction()

  if (!result.success || !result.data) {
    return (
      <PageContainer>
        <PageHeader title="Job Categories" description="Manage job post categories" />
        <ErrorMessage message={'error' in result ? result.error : 'Failed to load categories'} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader
        title="Job Categories"
        description={`Manage job post categories (${result.data.length} total)`}
      />

      <JobCategoryList categories={result.data} />
    </PageContainer>
  )
}
