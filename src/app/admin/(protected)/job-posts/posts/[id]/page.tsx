import { notFound } from 'next/navigation'
import { JobPostForm } from '@/components/features/job-posts/JobPostForm'
import { getJobPostByIdAction } from '@/actions/job-posts'
import { getJobCategoriesAction } from '@/actions/job-categories'
import {
  PageContainer,
  PageHeader,
  FormContainer,
  ErrorMessage,
} from '@/components/layout/PageLayout'

interface EditJobPostPageProps {
  params: Promise<{ id: string }>
}

const getMainSiteUrls = (): string[] => {
  const envValue = process.env.MAIN_SITE_URL
  if (!envValue) throw new Error('MAIN_SITE_URL is not defined')

  try {
    const parsed = JSON.parse(envValue)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return [envValue]
  }
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

  const mainSiteUrls = getMainSiteUrls()
  const jobPreviewBaseUrl = process.env.JOB_PREVIEW_URL || process.env.BLOG_PREVIEW_URL
  if (!jobPreviewBaseUrl) {
    throw new Error('JOB_PREVIEW_URL or BLOG_PREVIEW_URL is not defined')
  }

  const jobPreviewUrlBase = `${jobPreviewBaseUrl}/careers/${postResult.data.job_id}`
  const jobPreviewUrl =
    postResult.data.status === 'published'
      ? jobPreviewUrlBase
      : `${jobPreviewUrlBase}${jobPreviewUrlBase.includes('?') ? '&' : '?'}preview=true`

  return (
    <PageContainer>
      <PageHeader title="Edit Job Post" description="Update job post information" />

      <FormContainer>
        <JobPostForm
          post={postResult.data}
          categories={categoriesResult.data}
          isEditing
          mainSiteUrls={mainSiteUrls}
          jobPreviewUrl={jobPreviewUrl}
        />
      </FormContainer>
    </PageContainer>
  )
}
