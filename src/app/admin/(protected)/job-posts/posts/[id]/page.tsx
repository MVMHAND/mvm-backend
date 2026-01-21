import { notFound } from 'next/navigation'
import { JobPostForm } from '@/components/features/job-posts/JobPostForm'
import { ContentUrlDisplay } from '@/components/features/shared/ContentUrlDisplay'
import { getJobPostByIdAction } from '@/actions/job-posts'
import { getJobCategoriesAction } from '@/actions/job-categories'
import { generateJobUrls } from '@/lib/urls/content-urls'
import {
  PageContainer,
  PageHeader,
  FormContainer,
  ErrorMessage,
} from '@/components/layout/PageLayout'

interface EditJobPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditJobPostPage({ params }: EditJobPostPageProps) {
  const { id } = await params

  const [postResult, categoriesResult] = await Promise.all([
    getJobPostByIdAction(id),
    getJobCategoriesAction(),
  ])

  if (!postResult.success || !postResult.data) {
    notFound()
  }

  if (!categoriesResult.success || !categoriesResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Edit Job Post" description="Update job post information" />
        <ErrorMessage
          message={
            'error' in categoriesResult ? categoriesResult.error : 'Failed to load categories'
          }
        />
      </PageContainer>
    )
  }

  // Generate URLs using centralized utility
  const urls = generateJobUrls(postResult.data.job_id, postResult.data.status)

  return (
    <PageContainer>
      <PageHeader
        title="Edit Job Post"
        description={`Update job post information • ${postResult.data.job_id}`}
      />

      <div className="space-y-6">
        <ContentUrlDisplay
          title="Job URLs"
          previewUrl={urls.previewUrl}
          productionUrls={urls.productionUrls}
          status={postResult.data.status}
        />

        <FormContainer>
          <JobPostForm post={postResult.data} categories={categoriesResult.data} isEditing />
        </FormContainer>
      </div>
    </PageContainer>
  )
}
