/**
 * Public blog post functions that use Edge Functions
 * These bypass RLS by calling Supabase Edge Functions with service role access
 */

interface BlogPostResponse {
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
  seo_meta_title: string
  seo_meta_description: string
  seo_keywords: string | null
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
  isPublished?: boolean
}

/**
 * Get blog post by slug using Edge Function
 * This allows public access while keeping tables protected with RLS
 */
export async function getPublicPostBySlug(slug: string): Promise<BlogPostResponse | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }

  try {
    const functionUrl = `${supabaseUrl}/functions/v1/blog-get-post?slug=${encodeURIComponent(slug)}`
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': `${process.env.NEXT_PUBLIC_SITE_URL}`,
      },
      // Add cache control for better performance
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      throw new Error(`Failed to fetch post: ${response.statusText}`)
    }

    const result = await response.json()

    // The Edge Function returns the post data directly (not wrapped in success/data)
    if (result && result.id) {
      return result as BlogPostResponse
    }

    return null
  } catch (error) {
    console.error('Error fetching public post:', error)
    throw error
  }
}

/**
 * Get blog posts list using Edge Function
 * This allows public access while keeping tables protected with RLS
 */
export async function getPublicPosts(params?: {
  limit?: number
  offset?: number
  category?: string
}): Promise<{ posts: BlogPostResponse[]; total: number }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  if (!supabaseUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL is not defined')
  }

  try {
    const queryParams = new URLSearchParams()
    if (params?.limit) queryParams.set('limit', params.limit.toString())
    if (params?.offset) queryParams.set('offset', params.offset.toString())
    if (params?.category) queryParams.set('category', params.category)

    const functionUrl = `${supabaseUrl}/functions/v1/blog-list-posts?${queryParams.toString()}`
    
    const response = await fetch(functionUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Origin': `${process.env.NEXT_PUBLIC_SITE_URL}`,
      },
      // Add cache control for better performance
      next: {
        revalidate: 60, // Revalidate every 60 seconds
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`)
    }

    const result = await response.json()
    
    // The Edge Function returns { posts: [...], pagination: { total, page, limit, pages } }
    if (result && result.posts) {
      return {
        posts: result.posts as BlogPostResponse[],
        total: result.pagination?.total || 0,
      }
    }

    return { posts: [], total: 0 }
  } catch (error) {
    console.error('Error fetching public posts:', error)
    throw error
  }
}
