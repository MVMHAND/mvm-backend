import { JobPostList } from '@/components/features/job-posts/JobPostList'
import { getJobPostsAction, getJobPostCreatorsAction } from '@/actions/job-posts'
import { getJobCategoriesAction } from '@/actions/job-categories'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'
import { getJobPostsOverviewAnalyticsUrl } from '@/lib/analytics/job-analytics'

interface JobPostsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    category?: string
    employment_type?: string
    created_by?: string
  }>
}

export default async function JobPostsPage({ searchParams }: JobPostsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const status = params.status || ''
  const category = params.category || ''
  const employment_type = params.employment_type || ''
  const created_by = params.created_by || ''

  const [postsResult, categoriesResult, creatorsResult] = await Promise.all([
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
      created_by: created_by || undefined,
    }),
    getJobCategoriesAction(),
    getJobPostCreatorsAction(),
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
        action={
          <a
            href={getJobPostsOverviewAnalyticsUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-mvm-blue px-4 py-2 text-sm font-medium text-white hover:bg-mvm-blue/90 transition-colors"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 3v18h18" />
              <path d="m19 9-5 5-4-4-3 3" />
            </svg>
            View All Analytics
          </a>
        }
      />

      <JobPostList
        posts={posts}
        categories={categoriesResult.success ? categoriesResult.data || [] : []}
        creators={creatorsResult.success ? creatorsResult.data || [] : []}
        pagination={{ page, pageSize: 10, total, totalPages: pages }}
      />
    </PageContainer>
  )
}
