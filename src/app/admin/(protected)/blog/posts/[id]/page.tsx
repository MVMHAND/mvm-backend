import { notFound } from 'next/navigation'
import { PostForm } from '@/components/features/blog/PostForm'
import { ContentUrlDisplay } from '@/components/features/shared/ContentUrlDisplay'
import { getPostByIdAction } from '@/actions/blog-posts'
import { getAllCategoriesForSelectAction } from '@/actions/blog-categories'
import { getAllContributorsForSelectAction } from '@/actions/blog-contributors'
import { generateBlogUrls } from '@/lib/urls/content-urls'
import {
  PageContainer,
  PageHeader,
  FormContainer,
  ErrorMessage,
} from '@/components/layout/PageLayout'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params

  const [postResult, categoriesResult, contributorsResult] = await Promise.all([
    getPostByIdAction(id),
    getAllCategoriesForSelectAction(),
    getAllContributorsForSelectAction(),
  ])

  if (!postResult.success || !postResult.data) {
    notFound()
  }

  // Generate URLs using centralized utility
  const urls = generateBlogUrls(postResult.data.slug, postResult.data.status)

  if (!categoriesResult.success || !categoriesResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Edit Post" description="Update post information" />
        <ErrorMessage message={categoriesResult.error || 'Failed to load categories'} />
      </PageContainer>
    )
  }

  if (!contributorsResult.success || !contributorsResult.data) {
    return (
      <PageContainer>
        <PageHeader title="Edit Post" description="Update post information" />
        <ErrorMessage message={contributorsResult.error || 'Failed to load contributors'} />
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title="Edit Post" description="Update post information" />

      <div className="space-y-6">
        <ContentUrlDisplay
          title="Blog URLs"
          previewUrl={urls.previewUrl}
          socialPreviewUrl={urls.socialPreviewUrl}
          productionUrls={urls.productionUrls}
          status={postResult.data.status}
        />

        <FormContainer>
          <PostForm
            post={postResult.data}
            categories={categoriesResult.data}
            contributors={contributorsResult.data}
            isEditing
          />
        </FormContainer>
      </div>
    </PageContainer>
  )
}
