import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { JobCategoryForm } from '@/components/features/job-posts/JobCategoryForm'
import { getJobCategoryByIdAction } from '@/actions/job-categories'
import type { PageProps } from '@/types'
import {
  PageContainer,
  PageHeader,
  FormContainer,
  LoadingState,
} from '@/components/layout/PageLayout'

async function CategoryFormContent({ categoryId }: { categoryId: string }) {
  const result = await getJobCategoryByIdAction(categoryId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <JobCategoryForm category={result.data} isEditing />
}

function CategoryFormLoading() {
  return <LoadingState lines={5} />
}

export default async function EditJobCategoryPage({ params }: PageProps) {
  const { id } = await params

  return (
    <PageContainer>
      <PageHeader title="Edit Category" description="Update category information" />

      <FormContainer>
        <Suspense fallback={<CategoryFormLoading />}>
          <CategoryFormContent categoryId={id} />
        </Suspense>
      </FormContainer>
    </PageContainer>
  )
}
