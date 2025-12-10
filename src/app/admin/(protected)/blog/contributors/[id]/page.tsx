import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { ContributorForm } from '@/components/features/blog/ContributorForm'
import { getContributorByIdAction } from '@/actions/blog-contributors'
import type { PageProps } from '@/types'
import { PageContainer, PageHeader, FormContainer, LoadingState } from '@/components/layout/PageLayout'

async function ContributorFormContent({ contributorId }: { contributorId: string }) {
  const result = await getContributorByIdAction(contributorId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <ContributorForm contributor={result.data} isEditing />
}

function ContributorFormLoading() {
  return <LoadingState lines={6} />
}

export default async function EditContributorPage({ params }: PageProps) {
  const { id } = await params

  return (
    <PageContainer>
      <PageHeader title="Edit Contributor" description="Update contributor information" />

      <FormContainer>
        <Suspense fallback={<ContributorFormLoading />}>
          <ContributorFormContent contributorId={id} />
        </Suspense>
      </FormContainer>
    </PageContainer>
  )
}
