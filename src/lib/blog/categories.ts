/**
 * Blog category utility functions
 */

import { createClient } from '@/lib/supabase/server'
import type { BlogCategory, BlogCategoryWithUsers } from '@/types'

/**
 * Get all blog categories
 */
export async function getAllCategories(): Promise<BlogCategory[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true })
  
  if (error) throw error
  return data as BlogCategory[]
}

/**
 * Get blog category by ID
 */
export async function getCategoryById(id: string): Promise<BlogCategory | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  
  return data as BlogCategory
}

/**
 * Get categories with post count (already maintained by trigger)
 */
export async function getCategoriesWithPostCount(): Promise<BlogCategory[]> {
  return getAllCategories()
}

/**
 * Get category with creator and updater info
 */
export async function getCategoryWithUsers(id: string): Promise<BlogCategoryWithUsers | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_categories')
    .select(`
      *,
      creator:created_by(name, email),
      updater:updated_by(name, email)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return data as unknown as BlogCategoryWithUsers
}

/**
 * Validate if a category can be deleted
 * Categories with published posts cannot be deleted
 */
export async function validateCategoryDeletion(categoryId: string): Promise<{
  canDelete: boolean
  reason?: string
  publishedPostCount?: number
}> {
  const supabase = await createClient()
  
  // Check for published posts
  const { count, error } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', categoryId)
    .eq('status', 'published')
  
  if (error) throw error
  
  const publishedPostCount = count || 0
  
  if (publishedPostCount > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete category with ${publishedPostCount} published post${publishedPostCount === 1 ? '' : 's'}`,
      publishedPostCount,
    }
  }
  
  return { canDelete: true }
}

/**
 * Search categories by name
 */
export async function searchCategories(query: string): Promise<BlogCategory[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .ilike('name', `%${query}%`)
    .order('name', { ascending: true })
  
  if (error) throw error
  return data as BlogCategory[]
}
