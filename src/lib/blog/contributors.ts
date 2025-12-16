/**
 * Blog contributor utility functions
 */

import { createClient } from '@/lib/supabase/server'
import type { BlogContributor, BlogContributorWithUsers } from '@/types'

/**
 * Get all blog contributors
 */
export async function getAllContributors(): Promise<BlogContributor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_contributors')
    .select('*')
    .order('full_name', { ascending: true })

  if (error) throw error
  return data as BlogContributor[]
}

/**
 * Get blog contributor by ID
 */
export async function getContributorById(id: string): Promise<BlogContributor | null> {
  const supabase = await createClient()

  const { data, error } = await supabase.from('blog_contributors').select('*').eq('id', id).single()

  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }

  return data as BlogContributor
}

/**
 * Get contributors with post count (already maintained by trigger)
 */
export async function getContributorsWithPostCount(): Promise<BlogContributor[]> {
  return getAllContributors()
}

/**
 * Get contributor with creator and updater info
 */
export async function getContributorWithUsers(
  id: string
): Promise<BlogContributorWithUsers | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_contributors')
    .select(
      `
      *,
      creator:created_by(name, email),
      updater:updated_by(name, email)
    `
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  return data as unknown as BlogContributorWithUsers
}

/**
 * Validate if a contributor can be deleted
 * Contributors with published posts cannot be deleted
 */
export async function validateContributorDeletion(contributorId: string): Promise<{
  canDelete: boolean
  reason?: string
  publishedPostCount?: number
}> {
  const supabase = await createClient()

  // Check for published posts
  const { count, error } = await supabase
    .from('blog_posts')
    .select('id', { count: 'exact', head: true })
    .eq('contributor_id', contributorId)
    .eq('status', 'published')

  if (error) throw error

  const publishedPostCount = count || 0

  if (publishedPostCount > 0) {
    return {
      canDelete: false,
      reason: `Cannot delete contributor with ${publishedPostCount} published post${publishedPostCount === 1 ? '' : 's'}`,
      publishedPostCount,
    }
  }

  return { canDelete: true }
}

/**
 * Validate expertise array (max 3 items)
 */
export function validateExpertiseCount(expertise: string[]): {
  isValid: boolean
  error?: string
} {
  if (expertise.length > 3) {
    return {
      isValid: false,
      error: 'Expertise cannot exceed 3 items',
    }
  }
  return { isValid: true }
}

/**
 * Validate stats array (max 3 items)
 */
export function validateStatsCount(stats: string[]): {
  isValid: boolean
  error?: string
} {
  if (stats.length > 3) {
    return {
      isValid: false,
      error: 'Stats cannot exceed 3 items',
    }
  }
  return { isValid: true }
}

/**
 * Search contributors by name
 */
export async function searchContributors(query: string): Promise<BlogContributor[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_contributors')
    .select('*')
    .ilike('full_name', `%${query}%`)
    .order('full_name', { ascending: true })

  if (error) throw error
  return data as BlogContributor[]
}
