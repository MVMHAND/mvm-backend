import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { AllowedDomainForm } from '@/components/features/settings/AllowedDomainForm'
import { getAllowedDomainByIdAction } from '@/actions/allowed-domains'
import type { PageProps } from '@/types'
import {
  PageContainer,
  PageHeader,
  FormContainer,
  LoadingState,
} from '@/components/layout/PageLayout'

async function DomainFormContent({ domainId }: { domainId: string }) {
  const result = await getAllowedDomainByIdAction(domainId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <AllowedDomainForm domain={result.data} isEditing />
}

function DomainFormLoading() {
  return <LoadingState lines={5} />
}

export default async function EditAllowedDomainPage({ params }: PageProps) {
  const { id } = await params

  return (
    <PageContainer>
      <PageHeader title="Edit Allowed Domain" description="Update domain configuration" />

      <FormContainer>
        <Suspense fallback={<DomainFormLoading />}>
          <DomainFormContent domainId={id} />
        </Suspense>
      </FormContainer>
    </PageContainer>
  )
}
