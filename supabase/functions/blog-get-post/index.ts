import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import {
  createAdminClient,
  verifyDomain,
  createErrorResponse,
  createSuccessResponse,
  handleCorsPreFlight,
} from '../_shared/blog-utils.ts'

interface BlogPost {
  id: string
  title: string
  slug: string
  description: string | null
  cover_image_url: string | null
  content: string
  reading_time: number
  published_date: string | null
  status: string
  created_at: string
  updated_at: string
  category: {
    id: string
    name: string
  } | null
  contributor: {
    id: string
    full_name: string
    position: string
    avatar_url: string | null
    bio: string
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
      return createErrorResponse(
        'Access denied. Domain not authorized.',
        403,
        'DOMAIN_NOT_ALLOWED'
      )
    }

    // Use service role client to bypass RLS since no public read access
    const supabaseClient = createAdminClient()

    // Get slug from URL
    const url = new URL(req.url)
    const slug = url.searchParams.get('slug')
    const includeUnpublished = url.searchParams.get('preview') === 'true'

    if (!slug) {
      return createErrorResponse('Slug parameter is required', 400)
    }

    // Build query
    let query = supabaseClient
      .from('blog_posts')
      .select(`
        id,
        title,
        slug,
        description,
        cover_image_url,
        content,
        reading_time,
        published_date,
        status,
        created_at,
        updated_at,
        category:blog_categories(id, name),
        contributor:blog_contributors(id, full_name, position, avatar_url, bio)
      `)
      .eq('slug', slug)
      .single()

    // Only show published posts by default
    if (!includeUnpublished) {
      query = query.eq('status', 'published')
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching post:', error)
      return createErrorResponse('Post not found', 404, 'NOT_FOUND')
    }

    // Add published flag for preview mode
    const response = {
      ...data,
      isPublished: data.status === 'published',
    }

    return createSuccessResponse(response)
  } catch (err) {
    console.error('Function error:', err)
    return createErrorResponse('Internal server error', 500)
  }
})
