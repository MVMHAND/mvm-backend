import type { JobPost, JobPostFormData } from '@/types/job-posts'

/**
 * Generate SEO meta title with fallback
 */
export function generateSeoTitle(post: Partial<JobPost> | JobPostFormData): string {
  if ('seo_meta_title' in post && post.seo_meta_title?.trim()) {
    return post.seo_meta_title
  }

  const parts = [post.title]
  if (post.location) parts.push(post.location)
  parts.push('My Virtual Mate Careers')

  const title = parts.join(' | ')
  return title.length > 60 ? title.substring(0, 57) + '...' : title
}

/**
 * Generate SEO meta description with fallback
 */
export function generateSeoDescription(post: Partial<JobPost> | JobPostFormData): string {
  if ('seo_meta_description' in post && post.seo_meta_description?.trim()) {
    return post.seo_meta_description
  }

  const desc =
    post.overview ||
    `Join My Virtual Mate as a ${post.title}. ${post.employment_type} position${post.location ? ` in ${post.location}` : ''}.`
  return desc.length > 160 ? desc.substring(0, 157) + '...' : desc
}

/**
 * Strip HTML tags to get plain text
 */
export function stripHtmlTags(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Check if HTML content has meaningful text
 */
export function hasHtmlContent(html: string | undefined | null): boolean {
  if (!html) return false
  const text = stripHtmlTags(html)
  return text.length > 0
}

/**
 * Validate if post can be published
 */
export function canPublishPost(post: Partial<JobPost>): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!post.title?.trim()) errors.push('Title is required')
  if (!post.overview?.trim()) errors.push('Position overview is required')
  if (!post.employment_type) errors.push('Employment type is required')
  if (!post.location?.trim()) errors.push('Location is required')
  if (!post.category_id) errors.push('Category is required')

  const hasStructuredSalary = post.salary_min && post.salary_max
  const hasCustomSalary = post.salary_custom_text?.trim()
  if (!hasStructuredSalary && !hasCustomSalary) {
    errors.push('Salary information is required')
  }

  // Check HTML content fields
  if (!hasHtmlContent(post.responsibilities)) {
    errors.push('Responsibilities content is required')
  }

  if (!hasHtmlContent(post.must_have_skills)) {
    errors.push('Must have skills content is required')
  }

  if (!hasHtmlContent(post.preferred_skills)) {
    errors.push('Preferred skills content is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Split multi-line text into array (for skills field only)
 */
export function splitByNewline(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
}

/**
 * Generate primary site URL
 */
export function generatePrimarySiteUrl(jobId: string): string {
  return `https://myvirtualmate.com/careers/${jobId}`
}
