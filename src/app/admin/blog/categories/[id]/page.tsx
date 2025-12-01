import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { CategoryForm } from '@/components/features/blog/CategoryForm'
import { getCategoryByIdAction } from '@/actions/blog-categories'
import type { PageProps } from '@/types'
import { PageContainer, PageHeader, FormContainer, LoadingState } from '@/components/layout/PageLayout'

async function CategoryFormContent({ categoryId }: { categoryId: string }) {
  const result = await getCategoryByIdAction(categoryId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <CategoryForm category={result.data} isEditing />
}

function CategoryFormLoading() {
  return <LoadingState lines={5} />
}

export default async function EditCategoryPage({ params }: PageProps) {
  const { id } = await params

  return (
    <PageContainer>
      <PageHeader title="Edit Category" description="Update category information" />

      <FormContainer maxWidth="2xl">
        <Suspense fallback={<CategoryFormLoading />}>
          <CategoryFormContent categoryId={id} />
        </Suspense>
      </FormContainer>
    </PageContainer>
  )
}
