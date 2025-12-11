/**
 * Blog type definitions
 * Types for blog categories, contributors, and posts
 */

// Blog Post Status
export type BlogPostStatus = 'draft' | 'published' | 'unpublished'

// Blog Category
export interface BlogCategory {
  id: string
  name: string
  post_count: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// Blog Category with creator/updater info
export interface BlogCategoryWithUsers extends BlogCategory {
  creator?: {
    name: string
    email: string
  }
  updater?: {
    name: string
    email: string
  }
}

// Blog Contributor
export interface BlogContributor {
  id: string
  full_name: string
  position: string
  avatar_url: string | null
  bio: string
  expertise: string[]
  stats: string[]
  post_count: number
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// Blog Contributor with creator/updater info
export interface BlogContributorWithUsers extends BlogContributor {
  creator?: {
    name: string
    email: string
  }
  updater?: {
    name: string
    email: string
  }
}

// Blog Post
export interface BlogPost {
  id: string
  seo_meta_title: string
  seo_meta_description: string
  seo_keywords: string | null
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  category_id: string
  contributor_id: string
  content: string
  reading_time: number
  published_date: string | null
  status: BlogPostStatus
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  published_by: string | null
}

// Blog Post with relations
export interface BlogPostWithRelations extends BlogPost {
  category: BlogCategory
  contributor: BlogContributor
  creator?: {
    name: string
    email: string
  }
  updater?: {
    name: string
    email: string
  }
  publisher?: {
    name: string
    email: string
  }
}

// Form data types
export interface BlogCategoryFormData {
  name: string
}

export interface BlogContributorFormData {
  full_name: string
  position: string
  avatar_url?: string | null
  bio: string
  expertise: string[]
  stats: string[]
}

export interface BlogPostFormData {
  seo_meta_title: string
  seo_meta_description: string
  seo_keywords?: string | null
  title: string
  slug: string
  description: string
  cover_image_url?: string | null
  category_id: string | null
  contributor_id: string | null
  content: string
  reading_time: number
  status: BlogPostStatus
}

// Filter types
export interface BlogPostFilters {
  status?: BlogPostStatus
  category_id?: string
  contributor_id?: string
  search?: string
  date_from?: string
  date_to?: string
}

// Validation result types
export interface CategoryValidationResult {
  isValid: boolean
  error?: string
  hasPublishedPosts?: boolean
}

export interface ContributorValidationResult {
  isValid: boolean
  error?: string
  hasPublishedPosts?: boolean
  expertiseCount?: number
  statsCount?: number
}

export interface PostValidationResult {
  isValid: boolean
  error?: string
  canDelete?: boolean
  canPublish?: boolean
}

export interface SEOValidation {
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
}
