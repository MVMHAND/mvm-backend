import Link from 'next/link'
import { CategoryForm } from '@/components/features/blog/CategoryForm'
import { Button } from '@/components/ui/Button'

export const metadata = {
  title: 'Create Category',
  description: 'Create a new blog category',
}

export default function NewCategoryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/blog/categories">
          <Button variant="outline" size="sm">
            ← Back to Categories
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Create Category</h1>
          <p className="mt-1 text-gray-600">Add a new blog category</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <CategoryForm />
      </div>
    </div>
  )
}
