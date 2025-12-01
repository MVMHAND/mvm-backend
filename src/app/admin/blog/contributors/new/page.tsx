import Link from 'next/link'
import { ContributorForm } from '@/components/features/blog/ContributorForm'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Create Contributor',
  description: 'Create a new blog contributor',
}

export default function NewContributorPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog/contributors">
          <Button variant="outline" size="sm">
            ← Back to Contributors
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Contributor</h1>
          <p className="mt-1 text-gray-600">Add a new blog contributor</p>
        </div>
      </div>

      <div className="max-w-3xl">
        <ContributorForm />
      </div>
    </div>
  )
}
