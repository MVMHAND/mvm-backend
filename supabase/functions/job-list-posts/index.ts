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
}

interface JobPostListItem {
  id: string
  job_id: string
  title: string
  slug: string
  overview: string | null
  location: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string | null
  salary_period: string | null
  salary_custom_text: string | null
  skills: string[]
  experience_level: string | null
  published_at: string | null
  custom_posted_date: string | null
  status: string
  application_email: string
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

    // Get query parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 50) // Max 50 items
    const categoryId = url.searchParams.get('category_id')
    const employmentType = url.searchParams.get('employment_type')
    const includeUnpublished = url.searchParams.get('preview') === 'true'

    const offset = (page - 1) * limit

    // Build query - exclude heavy content fields for list view
    let query = supabaseClient
      .from('job_posts')
      .select(
        `
        id,
        job_id,
        title,
        overview,
        location,
        employment_type,
        salary_min,
        salary_max,
        salary_currency,
        salary_period,
        salary_custom_text,
        skills,
        experience_level,
        published_at,
        custom_posted_date,
        status,
        application_email,
        category:job_categories(id, name)
      `,
        { count: 'exact' }
      )
      .order('custom_posted_date', { ascending: false, nullsFirst: false })
      .order('published_at', { ascending: false })

    // Only show published jobs by default
    if (!includeUnpublished) {
      query = query.eq('status', 'published')
    }

    // Add filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (employmentType) {
      query = query.eq('employment_type', employmentType)
    }

    query = query.range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching job posts:', error)
      return createErrorResponse('Failed to fetch job posts', 500)
    }

    // Format jobs with computed fields
    const jobs = (data || []).map((job: JobPostListItem) => ({
      ...job,
      posted_date: job.custom_posted_date || job.published_at,
      salary_display: formatSalaryDisplay(job),
      isPublished: job.status === 'published',
    }))

    const response = {
      jobs,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    }

    return createSuccessResponse(response)
  } catch (err) {
    console.error('Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})

/**
 * Format salary for display
 */
function formatSalaryDisplay(job: JobPostListItem): string {
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
