import { PostForm } from '@/components/features/blog/PostForm'
import { getAllCategoriesForSelectAction } from '@/actions/blog-categories'
import { getAllContributorsForSelectAction } from '@/actions/blog-contributors'
import {
  PageContainer,
  PageHeader,
  FormContainer,
  ErrorMessage,
} from '@/components/layout/PageLayout'

export const dynamic = 'force-dynamic'

export default async function NewPostPage() {
  const [categoriesResult, contributorsResult] = await Promise.all([
    getAllCategoriesForSelectAction(),
    getAllContributorsForSelectAction(),
  ])

  if (!categoriesResult.success || !categoriesResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Create Post" description="Write a new blog post" />
        <ErrorMessage message={categoriesResult.error || 'Failed to load categories'} />
      </PageContainer>
    )
  }

  if (!contributorsResult.success || !contributorsResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Create Post" description="Write a new blog post" />
        <ErrorMessage message={contributorsResult.error || 'Failed to load contributors'} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Create Post" description="Write a new blog post" />

      <FormContainer>
        <PostForm categories={categoriesResult.data} contributors={contributorsResult.data} />
      </FormContainer>
    </PageContainer>
  )
}
