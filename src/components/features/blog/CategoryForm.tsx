'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { createCategoryAction, updateCategoryAction } from '@/actions/blog-categories'
import type { BlogCategory } from '@/types'

interface CategoryFormProps {
  category?: BlogCategory
  isEditing?: boolean
}

export function CategoryForm({ category, isEditing = false }: CategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const name = formData.get('name') as string

      const result =
        isEditing && category
          ? await updateCategoryAction(category.id, { name })
          : await createCategoryAction({ name })

      if (result.success) {
        if (isEditing) {
          router.refresh()
        } else {
          router.push('/admin/blog/categories')
        }
      } else {
        setError(result.error || 'An error occurred')
      }
    })
  }

  return (
    <Card className="relative">
      <LoadingOverlay isLoading={isPending} message={isEditing ? 'Saving...' : 'Creating...'} />
      <CardHeader>
        <CardTitle>{isEditing ? 'Edit Category' : 'Create New Category'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={handleSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg bg-red-50 p-4 text-red-800">
              <p>{error}</p>
            </div>
          )}

          <Input
            label="Category Name"
            name="name"
            type="text"
            defaultValue={category?.name || ''}
            placeholder="e.g., Marketing Strategy"
            required
          />

          <div className="flex gap-4">
            <Button type="submit" disabled={isPending}>
              {isPending
                ? isEditing
                  ? 'Saving...'
                  : 'Creating...'
                : isEditing
                  ? 'Save Changes'
                  : 'Create Category'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={isPending}
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
