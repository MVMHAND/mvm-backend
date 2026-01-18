import { PageContainer, LoadingState } from '@/components/layout/PageLayout'

export default function LoadingJobCategory() {
  return (
    <PageContainer>
      <div className="mb-8 animate-pulse">
        <div className="mb-2 h-8 w-1/3 rounded bg-gray-200"></div>
        <div className="h-4 w-1/4 rounded bg-gray-200"></div>
      </div>

      <LoadingState lines={3} />
    </PageContainer>
  )
}
