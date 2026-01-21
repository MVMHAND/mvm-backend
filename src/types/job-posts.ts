/**
 * Job Posts type definitions
 * Types for job categories and job posts
 */

export type JobStatus = 'draft' | 'published' | 'unpublished'
export type EmploymentType =
  | 'full-time'
  | 'part-time'
  | 'contract'
  | 'project-based'
  | 'freelance'
  | 'internship'
export type ExperienceLevel =
  | 'entry-level'
  | 'junior'
  | 'mid-level'
  | 'senior'
  | 'lead'
  | 'principal'
  | 'executive'

export interface JobCategory {
  id: string
  name: string
  post_count: number
  created_at: string
  updated_at: string
}

export interface JobCategoryFormData {
  name: string
}

export interface JobPost {
  id: string
  job_id: string // Auto-generated job identifier
  title: string
  slug: string // Always same as job_id

  // Content
  overview: string | null

  // Job Details
  category_id: string | null
  department: string | null
  location: string | null
  employment_type: EmploymentType

  // Salary
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  salary_period: string
  salary_custom_text: string | null

  // Rich Text Content (HTML from TipTap editor)
  responsibilities: string
  must_have_skills: string
  preferred_skills: string
  benefits: string

  // Skills array (JSON array for tags)
  skills: string[]

  // Metadata
  experience_level: ExperienceLevel | null
  status: JobStatus
  published_at: string | null
  custom_posted_date: string | null

  // URL fields
  primary_site_url: string | null

  // SEO
  seo_meta_title: string | null
  seo_meta_description: string | null

  // Timestamps
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
  published_by: string | null

  category?: JobCategory
}

export interface JobPostFormData {
  title: string
  overview?: string

  category_id?: string
  department?: string
  location?: string
  employment_type: EmploymentType

  salary_type?: 'structured' | 'custom'
  salary_min?: number
  salary_max?: number
  salary_currency?: string
  salary_period?: string
  salary_custom_text?: string

  // Rich text HTML content (from TipTap editor)
  responsibilities?: string
  must_have_skills?: string
  preferred_skills?: string
  benefits?: string

  // Skills as multi-line text, converted to array on save
  skills?: string

  experience_level?: ExperienceLevel
  status?: JobStatus
  custom_posted_date?: string

  seo_meta_title?: string
  seo_meta_description?: string
}

export interface GetJobPostsParams {
  page?: number
  limit?: number
  search?: string
  status?: JobStatus
  category?: string
  employment_type?: EmploymentType
}

export interface JobPostWithCategory extends Omit<JobPost, 'category'> {
  category: JobCategory | null
}

export interface JobPostFilters {
  status?: JobStatus
  category_id?: string
  employment_type?: EmploymentType
  search?: string
}

export interface JobPostValidationResult {
  valid: boolean
  errors: string[]
}
