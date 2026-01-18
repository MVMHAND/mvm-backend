import { JobPostList } from '@/components/features/job-posts/JobPostList'
import { getJobPostsAction } from '@/actions/job-posts'
import { getJobCategoriesAction } from '@/actions/job-categories'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'

interface JobPostsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    category?: string
    employment_type?: string
  }>
}

export default async function JobPostsPage({ searchParams }: JobPostsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const status = params.status || ''
  const category = params.category || ''
  const employment_type = params.employment_type || ''

  const [postsResult, categoriesResult] = await Promise.all([
    getJobPostsAction({
      page,
      limit: 10,
      search,
      status: status as 'draft' | 'published' | 'unpublished' | undefined,
      category,
      employment_type: employment_type as
        | 'full-time'
        | 'part-time'
        | 'contract'
        | 'project-based'
        | 'freelance'
        | 'internship'
        | undefined,
    }),
    getJobCategoriesAction(),
  ])

  if (!postsResult.success || !postsResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Job Posts" description="Manage job postings and openings" />
        <ErrorMessage
          message={'error' in postsResult ? postsResult.error : 'Failed to load job posts'}
        />
      </PageContainer>
    )
  }

  const { posts, total, pages } = postsResult.data

  return (
    <PageContainer>
      <PageHeader
        title="Job Posts"
        description={`Manage job postings and openings (${total} total)`}
      />

      <JobPostList
        posts={posts}
        categories={categoriesResult.success ? categoriesResult.data || [] : []}
        pagination={{ page, pageSize: 10, total, totalPages: pages }}
      />
    </PageContainer>
  )
}
