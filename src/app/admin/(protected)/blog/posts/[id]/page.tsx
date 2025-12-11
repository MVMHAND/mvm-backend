import { notFound } from 'next/navigation'
import { PostForm } from '@/components/features/blog/PostForm'
import { BlogUrlDisplay } from '@/components/features/blog/BlogUrlDisplay'
import { getPostByIdAction } from '@/actions/blog-posts'
import { getAllCategoriesForSelectAction } from '@/actions/blog-categories'
import { getAllContributorsForSelectAction } from '@/actions/blog-contributors'
import { PageContainer, PageHeader, FormContainer, ErrorMessage } from '@/components/layout/PageLayout'

interface EditPostPageProps {
  params: Promise<{ id: string }>
}

// Helper to get main site URLs from environment
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

export default async function EditPostPage({ params }: EditPostPageProps) {
  const { id } = await params

  const [postResult, categoriesResult, contributorsResult] = await Promise.all([
    getPostByIdAction(id),
    getAllCategoriesForSelectAction(),
    getAllContributorsForSelectAction(),
  ])

  const mainSiteUrls = getMainSiteUrls()
  const socialPreviewUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${postResult.data?.slug || ''}`

  const blogPreviewBaseUrl = process.env.BLOG_PREVIEW_URL
  if (!blogPreviewBaseUrl) {
    throw new Error('BLOG_PREVIEW_URL is not defined')
  }
  const blogPreviewUrl = `${blogPreviewBaseUrl}/blog/${postResult.data?.slug || ''}`

  if (!postResult.success || !postResult.data) {
    notFound()
  }

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
        <BlogUrlDisplay 
          slug={postResult.data.slug} 
          status={postResult.data.status}
          mainSiteUrls={mainSiteUrls}
          socialPreviewUrl={socialPreviewUrl}
          blogPreviewUrl={blogPreviewUrl}
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
