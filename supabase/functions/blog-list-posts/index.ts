import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAdminClient,
  verifyDomain,
  createErrorResponse,
  createSuccessResponse,
  handleCorsPreFlight,
} from '../_shared/blog-utils.ts'

interface BlogPostListItem {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  reading_time: number
  published_date: string | null
  status: string
  category: {
    id: string
    name: string
  } | null
  contributor: {
    id: string
    full_name: string
    position: string
    avatar_url: string | null
  } | null
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

    // Use service role client to bypass RLS since no public read access
    const supabaseClient = createAdminClient()

    // Get query parameters
    const url = new URL(req.url)
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '10'), 50) // Max 50 items
    const categoryId = url.searchParams.get('category_id')
    const contributorId = url.searchParams.get('contributor_id')
    const includeUnpublished = url.searchParams.get('preview') === 'true'

    const offset = (page - 1) * limit

    // Build query - exclude content field for list view
    let query = supabaseClient
      .from('blog_posts')
      .select(
        `
        id,
        title,
        slug,
        description,
        cover_image_url,
        reading_time,
        published_date,
        status,
        category:blog_categories(id, name),
        contributor:blog_contributors(id, full_name, position, avatar_url)
      `,
        { count: 'exact' }
      )
      .order('published_date', { ascending: false })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Only show published posts by default
    if (!includeUnpublished) {
      query = query.eq('status', 'published')
    }

    // Add filters
    if (categoryId) {
      query = query.eq('category_id', categoryId)
    }

    if (contributorId) {
      query = query.eq('contributor_id', contributorId)
    }

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching posts:', error)
      return createErrorResponse('Failed to fetch posts', 500)
    }

    // Add published flag for preview mode if needed
    const posts = data.map((post) => ({
      ...post,
      isPublished: post.status === 'published',
    }))

    const response = {
      posts,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit),
      },
    }

    return createSuccessResponse(response)
  } catch (err) {
    console.error('Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})
