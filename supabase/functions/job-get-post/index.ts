import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAdminClient,
  verifyDomain,
  createErrorResponse,
  createSuccessResponse,
  handleCorsPreFlight,
} from '../_shared/blog-utils.ts'

interface JobCategory {
  id: string
  name: string
  slug: string
}

interface JobPost {
  id: string
  job_id: string
  title: string
  slug: string
  overview: string | null
  location: string
  employment_type: string
  department: string | null
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
  salary_custom_text: string | null
  skills: string[]
  experience_level: string | null
  responsibilities: string[]
  requirements: string[]
  preferred_skills: string[]
  benefits: string[]
  application_process: string | null
  published_at: string | null
  custom_posted_date: string | null
  seo_meta_title: string | null
  seo_meta_description: string | null
  seo_additional_schemas: Record<string, unknown>[]
  created_at: string
  updated_at: string
  category: JobCategory | null
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsPreFlight()
  }

  try {
    // Verify domain access
    const origin = req.headers.get('origin')
    const isAllowed = await verifyDomain(origin)

    if (!isAllowed) {
      return createErrorResponse('Access denied. Domain not authorized.', 403, 'DOMAIN_NOT_ALLOWED')
    }

    // Use service role client to bypass RLS
    const supabaseClient = createAdminClient()

    // Get job_id from URL
    const url = new URL(req.url)
    const job_id = url.searchParams.get('job_id')
    const includeUnpublished = url.searchParams.get('preview') === 'true'

    if (!job_id) {
      return createErrorResponse('job_id parameter is required', 400)
    }

    // Build query
    let query = supabaseClient
      .from('job_posts')
      .select(
        `
        id,
        job_id,
        title,
        slug,
        overview,
        location,
        employment_type,
        department,
        salary_min,
        salary_max,
        salary_currency,
        salary_period,
        salary_custom_text,
        skills,
        experience_level,
        responsibilities,
        requirements,
        preferred_skills,
        benefits,
        application_process,
        published_at,
        custom_posted_date,
        status,
        seo_meta_title,
        seo_meta_description,
        seo_additional_schemas,
        created_at,
        updated_at,
        category:job_categories(id, name, slug)
      `
      )
      .eq('job_id', job_id)
      .single()

    // Only show published jobs by default
    if (!includeUnpublished) {
      query = query.eq('status', 'published')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching job post:', error)
      return createErrorResponse('Job post not found', 404, 'NOT_FOUND')
    }

    // Format response with computed fields
    const job = {
      ...data,
      posted_date: data.custom_posted_date || data.published_at,
      salary_display: formatSalaryDisplay(data),
      isPublished: data.status === 'published',
      seo_additional_schemas: data.seo_additional_schemas || [],
      responsibilities: data.responsibilities || [],
      requirements: data.requirements || [],
      preferred_skills: data.preferred_skills || [],
      benefits: data.benefits || [],
      skills: data.skills || [],
    }

    return createSuccessResponse({ job })
  } catch (err) {
    console.error('Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})

/**
 * Format salary for display
 */
function formatSalaryDisplay(job: JobPost): string {
  if (job.salary_custom_text) {
    return job.salary_custom_text
  }

  if (job.salary_min && job.salary_max) {
    const currency = job.salary_currency || 'USD'
    const period = job.salary_period || 'year'
    return `${currency} ${job.salary_min.toLocaleString()}-${job.salary_max.toLocaleString()} per ${period}`
  }

  return 'Competitive salary'
}
