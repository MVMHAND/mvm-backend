import { CategoryForm } from '@/components/features/blog/CategoryForm'
import { PageContainer, PageHeader, FormContainer } from '@/components/layout/PageLayout'

export default function NewCategoryPage() {
  return (
    <PageContainer>
      <PageHeader title="Create Category" description="Add a new blog category" />

      <FormContainer>
        <CategoryForm />
      </FormContainer>
    </PageContainer>
  )
}
