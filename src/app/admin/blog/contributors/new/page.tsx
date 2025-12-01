import { ContributorForm } from '@/components/features/blog/ContributorForm'
import { PageContainer, PageHeader, FormContainer } from '@/components/layout/PageLayout'

export default function NewContributorPage() {
  return (
    <PageContainer>
      <PageHeader title="Create Contributor" description="Add a new blog contributor" />

      <FormContainer>
        <ContributorForm />
      </FormContainer>
    </PageContainer>
  )
}
