import { PostList } from '@/components/features/blog/PostList'
import { getPostsAction } from '@/actions/blog-posts'
import { getAllCategoriesForSelectAction } from '@/actions/blog-categories'
import { getAllContributorsForSelectAction } from '@/actions/blog-contributors'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'

interface PostsPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    category?: string
    contributor?: string
  }>
}

export default async function PostsPage({ searchParams }: PostsPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''
  const status = params.status || ''
  const category = params.category || ''
  const contributor = params.contributor || ''

  const [postsResult, categoriesResult, contributorsResult] = await Promise.all([
    getPostsAction({ page, limit: 10, search, status, category, contributor }),
    getAllCategoriesForSelectAction(),
    getAllContributorsForSelectAction(),
  ])

  if (!postsResult.success || !postsResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Blog Posts" description="Create and manage blog posts" />
        <ErrorMessage message={postsResult.error || 'Failed to load posts'} />
      </PageContainer>
    )
  }

  const { posts, total, pages } = postsResult.data

  return (
    <PageContainer>
      <PageHeader
        title="Blog Posts"
        description={`Create and manage blog posts (${total} total)`}
      />

      <PostList
        posts={posts}
        categories={categoriesResult.success ? categoriesResult.data || [] : []}
        contributors={contributorsResult.success ? contributorsResult.data || [] : []}
        pagination={{ page, pageSize: 10, total, totalPages: pages }}
      />
    </PageContainer>
  )
}
