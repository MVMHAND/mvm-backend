'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { LoadingOverlay } from '@/components/ui/LoadingOverlay'
import { createJobCategoryAction, updateJobCategoryAction } from '@/actions/job-categories'
import { AuditInfo } from '@/components/features/shared/AuditInfo'
import type { JobCategoryWithUsers } from '@/types/job-posts'

interface JobCategoryFormProps {
  category?: JobCategoryWithUsers
  isEditing?: boolean
}

const DEFAULT_COLORS = [
  '#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
]

export function JobCategoryForm({ category, isEditing = false }: JobCategoryFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<string>(category?.color || DEFAULT_COLORS[0])

  const handleSubmit = (formData: FormData) => {
    setError(null)
    startTransition(async () => {
      const name = formData.get('name') as string
      const color = selectedColor

      const result =
        isEditing && category
          ? await updateJobCategoryAction(category.id, { name, color })
          : await createJobCategoryAction({ name, color })

      if (result.success) {
        if (isEditing) {
          router.refresh()
        } else {
          router.push('/admin/job-posts/categories')
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
            placeholder="e.g., Engineering, Marketing"
            required
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Category Color
            </label>
            <p className="mb-3 text-sm text-gray-500">
              This color will be used for the category chip on the website and admin panel
            </p>
            <div className="flex flex-wrap gap-3">
              {DEFAULT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setSelectedColor(color)}
                  className={`h-10 w-10 rounded-lg transition-all ${selectedColor === color
                      ? 'ring-2 ring-offset-2 ring-mvm-blue scale-110'
                      : 'hover:scale-105'
                    }`}
                  style={{ backgroundColor: color }}
                  title={color}
                />
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-600">Custom:</span>
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => setSelectedColor(e.target.value)}
                className="h-10 w-20 cursor-pointer rounded border border-gray-300"
              />
              <span className="text-sm font-mono text-gray-700">{selectedColor}</span>
            </div>
            <div className="mt-3">
              <span className="text-sm text-gray-600">Preview: </span>
              <span
                className="inline-block rounded-full px-3 py-1 text-sm font-medium text-white"
                style={{ backgroundColor: selectedColor }}
              >
                {category?.name || 'Category Name'}
              </span>
            </div>
          </div>

          {isEditing && category && (
            <AuditInfo
              createdBy={category.creator}
              createdAt={category.created_at}
              updatedBy={category.updater}
              updatedAt={category.updated_at}
              variant="detailed"
              className="mt-6"
            />
          )}

          <div className="flex gap-4 pt-6">
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
