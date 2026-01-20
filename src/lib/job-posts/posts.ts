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
 * Generate JobPosting schema for SEO/AEO
 */
export function generateJobPostingSchema(post: JobPost): Record<string, unknown> {
  const postedDate = post.custom_posted_date || post.published_at || post.created_at
  const validThrough = new Date(postedDate)
  validThrough.setDate(validThrough.getDate() + 30)

  let baseSalary: Record<string, unknown> | undefined
  if (post.salary_custom_text?.trim()) {
    baseSalary = {
      '@type': 'MonetaryAmount',
      currency: post.salary_currency || 'AUD',
      value: post.salary_custom_text,
    }
  } else if (post.salary_min && post.salary_max) {
    baseSalary = {
      '@type': 'MonetaryAmount',
      currency: post.salary_currency,
      value: {
        '@type': 'QuantitativeValue',
        minValue: post.salary_min,
        maxValue: post.salary_max,
        unitText: (post.salary_period || 'HOUR').toUpperCase(),
      },
    }
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: post.title,
    description: post.overview,
    datePosted: postedDate,
    validThrough: validThrough.toISOString(),
    employmentType: post.employment_type.toUpperCase().replace(/-/g, '_'),
    identifier: {
      '@type': 'PropertyValue',
      name: 'Job ID',
      value: post.job_id,
    },
    hiringOrganization: {
      '@type': 'Organization',
      name: 'My Virtual Mate',
      sameAs: 'https://myvirtualmate.com',
      logo: 'https://myvirtualmate.com/logo.png',
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: post.location || 'Australia',
        addressCountry: 'AU',
      },
    },
  }

  if (baseSalary) schema.baseSalary = baseSalary
  if (post.responsibilities?.length > 0) schema.responsibilities = post.responsibilities.join('\n')
  if (post.must_have_skills?.length > 0) schema.qualifications = post.must_have_skills.join('\n')
  if (post.skills?.length > 0) schema.skills = post.skills.join(', ')
  if (post.experience_level) {
    schema.experienceRequirements = post.experience_level.replace('-', ' ')
  }

  return schema
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema(): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'My Virtual Mate',
    url: 'https://myvirtualmate.com',
    logo: 'https://myvirtualmate.com/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'HR',
      email: 'careers@myvirtualmate.com',
    },
  }
}

/**
 * Generate BreadcrumbList schema
 */
export function generateBreadcrumbSchema(post: JobPost): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://myvirtualmate.com',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Careers',
        item: 'https://myvirtualmate.com/careers',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: post.title,
        item: `https://myvirtualmate.com/careers/${post.job_id}`,
      },
    ],
  }
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

  if (!post.responsibilities || post.responsibilities.length === 0) {
    errors.push('At least one responsibility is required')
  }

  if (!post.must_have_skills || post.must_have_skills.length === 0) {
    errors.push('At least one must have skill is required')
  }

  if (!post.preferred_skills || post.preferred_skills.length === 0) {
    errors.push('At least one preferred skill is required')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Split multi-line text into array
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
