import { JobPostForm } from '@/components/features/job-posts/JobPostForm'
import { getJobCategoriesAction } from '@/actions/job-categories'
import {
  PageContainer,
  PageHeader,
  FormContainer,
  ErrorMessage,
} from '@/components/layout/PageLayout'

export const dynamic = 'force-dynamic'

export default async function NewJobPostPage() {
  const categoriesResult = await getJobCategoriesAction()

  if (!categoriesResult.success || !categoriesResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Create Job Post" description="Add a new job opening" />
        <ErrorMessage
          message={
            'error' in categoriesResult ? categoriesResult.error : 'Failed to load categories'
          }
        />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Create Job Post" description="Add a new job opening" />

      <FormContainer>
        <JobPostForm categories={categoriesResult.data} />
      </FormContainer>
    </PageContainer>
  )
}
