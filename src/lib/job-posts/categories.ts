import { createClient } from '@/lib/supabase/server'

/**
 * Get all categories for select dropdown
 */
export async function getAllCategoriesForSelect(): Promise<
  { id: string; name: string; slug: string }[]
> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_categories')
    .select('id, name, slug')
    .order('name')

  if (error) throw error

  return data || []
}

/**
 * Check if category can be deleted
 */
export async function canDeleteCategory(categoryId: string): Promise<{
  canDelete: boolean
  reason?: string
}> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('job_posts')
    .select('id')
    .eq('category_id', categoryId)
    .eq('status', 'published')
    .limit(1)

  if (error) throw error

  if (data && data.length > 0) {
    return {
      canDelete: false,
      reason: 'Cannot delete category with published job posts',
    }
  }

  return { canDelete: true }
}

/**
 * Generate slug from category name
 */
export function generateCategorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}
