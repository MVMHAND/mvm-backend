/**
 * Blog post utility functions
 */

import { createClient } from '@/lib/supabase/server'
import { slugify } from '@/lib/utils'
import type { BlogPost, BlogPostWithRelations, BlogPostFilters, BlogPostStatus } from '@/types'

/**
 * Get blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null // Not found
    throw error
  }
  
  return data as BlogPost
}

/**
 * Get blog post by ID
 */
export async function getPostById(id: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return data as BlogPost
}

/**
 * Get blog post with relations (category, contributor, users)
 */
export async function getPostWithRelations(id: string): Promise<BlogPostWithRelations | null> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select(`
      *,
      category:blog_categories(*),
      contributor:blog_contributors(*),
      creator:created_by(name, email),
      updater:updated_by(name, email),
      publisher:published_by(name, email)
    `)
    .eq('id', id)
    .single()
  
  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }
  
  return data as unknown as BlogPostWithRelations
}

/**
 * Get all posts with filters
 */
export async function getAllPosts(filters?: BlogPostFilters): Promise<BlogPost[]> {
  const supabase = await createClient()
  
  let query = supabase
    .from('blog_posts')
    .select('*')
    .order('created_at', { ascending: false })
  
  // Apply filters
  if (filters?.status) {
    query = query.eq('status', filters.status)
  }
  
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  
  if (filters?.contributor_id) {
    query = query.eq('contributor_id', filters.contributor_id)
  }
  
  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,content.ilike.%${filters.search}%`)
  }
  
  if (filters?.date_from) {
    query = query.gte('published_date', filters.date_from)
  }
  
  if (filters?.date_to) {
    query = query.lte('published_date', filters.date_to)
  }
  
  const { data, error } = await query
  
  if (error) throw error
  return data as BlogPost[]
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(categoryId: string): Promise<BlogPost[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('category_id', categoryId)
    .order('published_date', { ascending: false })
  
  if (error) throw error
  return data as BlogPost[]
}

/**
 * Get posts by contributor
 */
export async function getPostsByContributor(contributorId: string): Promise<BlogPost[]> {
  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('contributor_id', contributorId)
    .order('published_date', { ascending: false })
  
  if (error) throw error
  return data as BlogPost[]
}

/**
 * Calculate reading time from content
 * Assumes 200 words per minute average reading speed
 */
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200
  const wordCount = content.trim().split(/\s+/).length
  const readingTime = Math.ceil(wordCount / wordsPerMinute)
  return readingTime > 0 ? readingTime : 1
}

/**
 * Generate a URL-friendly slug from title
 * Ensures uniqueness by checking the database
 */
export async function generateSlugFromTitle(title: string, excludeId?: string): Promise<string> {
  const baseSlug = slugify(title)
  const supabase = await createClient()
  
  // Check if slug exists
  let query = supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', baseSlug)
  
  if (excludeId) {
    query = query.neq('id', excludeId)
  }
  
  const { data } = await query.single()
  
  // If slug doesn't exist, return it
  if (!data) return baseSlug
  
  // If slug exists, append a number
  let counter = 1
  let newSlug = `${baseSlug}-${counter}`
  
  while (true) {
    let checkQuery = supabase
      .from('blog_posts')
      .select('id')
      .eq('slug', newSlug)
    
    if (excludeId) {
      checkQuery = checkQuery.neq('id', excludeId)
    }
    
    const { data: existingData } = await checkQuery.single()
    
    if (!existingData) return newSlug
    
    counter++
    newSlug = `${baseSlug}-${counter}`
  }
}

/**
 * Validate SEO field lengths
 */
export function validateSEOFieldLengths(title: string, description: string): {
  title: {
    length: number
    isValid: boolean
    remaining: number
  }
  description: {
    length: number
    isValid: boolean
    remaining: number
  }
} {
  const titleMaxLength = 60
  const descriptionMaxLength = 160
  
  return {
    title: {
      length: title.length,
      isValid: title.length <= titleMaxLength,
      remaining: titleMaxLength - title.length,
    },
    description: {
      length: description.length,
      isValid: description.length <= descriptionMaxLength,
      remaining: descriptionMaxLength - description.length,
    },
  }
}

/**
 * Check if a post can be published
 */
export function canPublishPost(post: BlogPost): {
  canPublish: boolean
  reason?: string
} {
  if (!post.title || post.title.trim() === '') {
    return { canPublish: false, reason: 'Title is required' }
  }
  
  if (!post.content || post.content.trim() === '') {
    return { canPublish: false, reason: 'Content is required' }
  }
  
  if (!post.cover_image_url || post.cover_image_url.trim() === '') {
    return { canPublish: false, reason: 'Cover image is required for publishing' }
  }
  
  if (!post.category_id) {
    return { canPublish: false, reason: 'Category is required' }
  }
  
  if (!post.contributor_id) {
    return { canPublish: false, reason: 'Contributor is required' }
  }
  
  const seoValidation = validateSEOFieldLengths(post.seo_meta_title, post.seo_meta_description)
  
  if (!seoValidation.title.isValid) {
    return { canPublish: false, reason: 'SEO title exceeds 60 characters' }
  }
  
  if (!seoValidation.description.isValid) {
    return { canPublish: false, reason: 'SEO description exceeds 160 characters' }
  }
  
  return { canPublish: true }
}

/**
 * Check if a post can be deleted
 * Published posts cannot be deleted (must be unpublished first)
 */
export function canDeletePost(post: BlogPost): {
  canDelete: boolean
  reason?: string
} {
  if (post.status === 'published') {
    return {
      canDelete: false,
      reason: 'Cannot delete published posts. Unpublish first.',
    }
  }
  
  return { canDelete: true }
}

/**
 * Get post status badge color
 */
export function getPostStatusColor(status: BlogPostStatus): string {
  switch (status) {
    case 'draft':
      return 'gray'
    case 'published':
      return 'green'
    case 'unpublished':
      return 'yellow'
    default:
      return 'gray'
  }
}
