import { CategoryList } from '@/components/features/blog/CategoryList'
import { getCategoriesAction } from '@/actions/blog-categories'
import { PageContainer, PageHeader, ErrorMessage } from '@/components/layout/PageLayout'

interface CategoriesPageProps {
  searchParams: Promise<{
    page?: string
    search?: string
  }>
}

export default async function CategoriesPage({ searchParams }: CategoriesPageProps) {
  const params = await searchParams
  const page = Number(params.page) || 1
  const search = params.search || ''

  const result = await getCategoriesAction({ page, limit: 10, search })

  if (!result.success || !result.data) {
    return (
      <PageContainer>
        <PageHeader title="Blog Categories" description="Manage blog post categories" />
        <ErrorMessage message={result.error || 'Failed to load categories'} />
      </PageContainer>
    )
  }

  const { categories, total, pages } = result.data

  return (
    <PageContainer>
      <PageHeader
        title="Blog Categories"
        description={`Manage blog post categories (${total} total)`}
      />

      <CategoryList
        categories={categories}
        pagination={{ page, pageSize: 10, total, totalPages: pages }}
      />
    </PageContainer>
  )
}
