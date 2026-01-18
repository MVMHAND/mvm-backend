import { JobCategoryForm } from '@/components/features/job-posts/JobCategoryForm'
import { PageContainer, PageHeader, FormContainer } from '@/components/layout/PageLayout'

export default function NewJobCategoryPage() {
  return (
    <PageContainer>
      <PageHeader title="Create Category" description="Add a new job category" />

      <FormContainer>
        <JobCategoryForm />
      </FormContainer>
    </PageContainer>
  )
}
