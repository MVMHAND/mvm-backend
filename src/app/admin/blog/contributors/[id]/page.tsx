import { Suspense } from 'react'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContributorForm } from '@/components/features/blog/ContributorForm'
import { getContributorByIdAction } from '@/actions/blog-contributors'
import { Button } from '@/components/ui/Button'
import type { PageProps } from '@/types'

export const metadata = {
  title: 'Edit Contributor',
  description: 'Edit blog contributor',
}

async function ContributorFormContent({ contributorId }: { contributorId: string }) {
  const result = await getContributorByIdAction(contributorId)

  if (!result.success || !result.data) {
    notFound()
  }

  return <ContributorForm contributor={result.data} isEditing />
}

function ContributorFormLoading() {
  return <div className="h-96 w-full animate-pulse rounded-lg bg-gray-200" />
}

export default async function EditContributorPage({ params }: PageProps) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog/contributors">
          <Button variant="outline" size="sm">
            ← Back to Contributors
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Edit Contributor</h1>
          <p className="mt-1 text-gray-600">Update contributor information</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <Suspense fallback={<ContributorFormLoading />}>
          <ContributorFormContent contributorId={id} />
        </Suspense>
      </div>
    </div>
  )
}
