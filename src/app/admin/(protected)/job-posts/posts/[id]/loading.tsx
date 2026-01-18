import { PageContainer, PageHeader, LoadingState } from '@/components/layout/PageLayout'

export default function Loading() {
  return (
    <PageContainer>
      <PageHeader title="Loading..." description="Please wait" />
      <LoadingState lines={8} />
    </PageContainer>
  )
}
