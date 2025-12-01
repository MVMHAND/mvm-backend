'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import {
  getPostWithRelations,
  calculateReadingTime,
  generateSlugFromTitle,
  canPublishPost,
  canDeletePost,
} from '@/lib/blog/posts'
import {
  uploadBlogCover,
  deleteBlogCover,
} from '@/lib/blog/storage'
import type {
  ActionResponse,
  BlogPost,
  BlogPostFormData,
  BlogPostWithRelations,
} from '@/types'

interface GetPostsParams {
  page?: number
  limit?: number
  search?: string
  status?: string
  category?: string
  contributor?: string
}

interface PaginatedPosts {
  posts: BlogPost[]
  total: number
  page: number
  pages: number
}

/**
 * Get paginated blog posts with optional filters
 */
export async function getPostsAction(
  params: GetPostsParams = {}
): Promise<ActionResponse<PaginatedPosts>> {
  try {
    const supabase = await createClient()
    const page = params.page || 1
    const limit = params.limit || 10
    const search = params.search || ''
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('blog_posts')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add search filter
    if (search) {
      query = query.or(`title.ilike.%${search}%,seo_meta_description.ilike.%${search}%`)
    }

    // Add status filter
    if (params.status) {
      query = query.eq('status', params.status)
    }

    // Add category filter
    if (params.category) {
      query = query.eq('category_id', params.category)
    }

    // Add contributor filter
    if (params.contributor) {
      query = query.eq('contributor_id', params.contributor)
    }

    // Execute query with pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching posts:', error)
      return {
        success: false,
        error: 'Failed to fetch posts',
      }
    }

    const total = count || 0
    const pages = Math.ceil(total / limit)

    return {
      success: true,
      data: { posts: data || [], total, page, pages },
    }
  } catch (error) {
    console.error('Error in getPostsAction:', error)
    return {
      success: false,
      error: 'Failed to fetch posts',
    }
  }
}

/**
 * Get a single post by ID with relations
 */
export async function getPostByIdAction(
  postId: string
): Promise<ActionResponse<BlogPostWithRelations>> {
  try {
    const post = await getPostWithRelations(postId)
    
    if (!post) {
      return {
        success: false,
        error: 'Post not found',
      }
    }
    
    return {
      success: true,
      data: post,
    }
  } catch (error) {
    console.error('Error in getPostByIdAction:', error)
    return {
      success: false,
      error: 'Failed to fetch post',
    }
  }
}

/**
 * Create a new blog post
 */
export async function createPostAction(
  formData: BlogPostFormData
): Promise<ActionResponse<BlogPost>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
    // Validate required fields
    if (!formData.title || formData.title.trim() === '') {
      return { success: false, error: 'Title is required' }
    }
    
    if (!formData.content || formData.content.trim() === '') {
      return { success: false, error: 'Content is required' }
    }
    
    if (!formData.category_id) {
      return { success: false, error: 'Category is required' }
    }
    
    if (!formData.contributor_id) {
      return { success: false, error: 'Contributor is required' }
    }
    
    // Generate slug
    const slug = await generateSlugFromTitle(formData.title)
    
    // Calculate reading time if not provided
    const reading_time = formData.reading_time || calculateReadingTime(formData.content)
    
    // Create post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .insert({
        seo_meta_title: formData.seo_meta_title.trim(),
        seo_meta_description: formData.seo_meta_description.trim(),
        title: formData.title.trim(),
        slug,
        cover_image_url: formData.cover_image_url || null,
        category_id: formData.category_id,
        contributor_id: formData.contributor_id,
        content: formData.content.trim(),
        reading_time,
        status: formData.status || 'draft',
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating post:', error)
      return {
        success: false,
        error: 'Failed to create post',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_POST_CREATED,
      targetType: 'blog_post',
      targetId: post.id,
      metadata: {
        post_title: post.title,
        status: post.status,
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/posts')
    
    return {
      success: true,
      data: post as BlogPost,
      message: 'Post created successfully',
    }
  } catch (error) {
    console.error('Error in createPostAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a blog post
 */
export async function updatePostAction(
  postId: string,
  formData: BlogPostFormData
): Promise<ActionResponse<BlogPost>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
    // Get existing post
    const { data: existingPost, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (fetchError || !existingPost) {
      return {
        success: false,
        error: 'Post not found',
      }
    }
    
    // Generate new slug if title changed
    let slug = existingPost.slug
    if (formData.title !== existingPost.title) {
      slug = await generateSlugFromTitle(formData.title, postId)
    }
    
    // Calculate reading time
    const reading_time = formData.reading_time || calculateReadingTime(formData.content)
    
    // Update post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update({
        seo_meta_title: formData.seo_meta_title.trim(),
        seo_meta_description: formData.seo_meta_description.trim(),
        title: formData.title.trim(),
        slug,
        cover_image_url: formData.cover_image_url || null,
        category_id: formData.category_id,
        contributor_id: formData.contributor_id,
        content: formData.content.trim(),
        reading_time,
        status: formData.status,
      })
      .eq('id', postId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating post:', error)
      return {
        success: false,
        error: 'Failed to update post',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_POST_UPDATED,
      targetType: 'blog_post',
      targetId: post.id,
      metadata: {
        post_title: post.title,
        status: post.status,
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/posts')
    revalidatePath(`/admin/blog/posts/${postId}`)
    
    return {
      success: true,
      data: post as BlogPost,
      message: 'Post updated successfully',
    }
  } catch (error) {
    console.error('Error in updatePostAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Publish a blog post
 */
export async function publishPostAction(postId: string): Promise<ActionResponse<BlogPost>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
    // Get post
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (fetchError || !post) {
      return {
        success: false,
        error: 'Post not found',
      }
    }
    
    // Validate post can be published
    const validation = canPublishPost(post as BlogPost)
    if (!validation.canPublish) {
      return {
        success: false,
        error: validation.reason || 'Cannot publish post',
      }
    }
    
    // Publish post
    const { data: publishedPost, error } = await supabase
      .from('blog_posts')
      .update({
        status: 'published',
        published_date: post.published_date || new Date().toISOString(),
        published_by: user.id,
      })
      .eq('id', postId)
      .select()
      .single()
    
    if (error) {
      console.error('Error publishing post:', error)
      return {
        success: false,
        error: 'Failed to publish post',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_POST_PUBLISHED,
      targetType: 'blog_post',
      targetId: publishedPost.id,
      metadata: {
        post_title: publishedPost.title,
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/posts')
    
    return {
      success: true,
      data: publishedPost as BlogPost,
      message: 'Post published successfully',
    }
  } catch (error) {
    console.error('Error in publishPostAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Unpublish a blog post
 */
export async function unpublishPostAction(postId: string): Promise<ActionResponse<BlogPost>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
    // Unpublish post
    const { data: post, error } = await supabase
      .from('blog_posts')
      .update({
        status: 'unpublished',
      })
      .eq('id', postId)
      .select()
      .single()
    
    if (error) {
      console.error('Error unpublishing post:', error)
      return {
        success: false,
        error: 'Failed to unpublish post',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_POST_UNPUBLISHED,
      targetType: 'blog_post',
      targetId: post.id,
      metadata: {
        post_title: post.title,
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/posts')
    
    return {
      success: true,
      data: post as BlogPost,
      message: 'Post unpublished successfully',
    }
  } catch (error) {
    console.error('Error in unpublishPostAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a blog post
 */
export async function deletePostAction(postId: string): Promise<ActionResponse<null>> {
  try {
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
    // Get post
    const { data: post, error: fetchError } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('id', postId)
      .single()
    
    if (fetchError || !post) {
      return {
        success: false,
        error: 'Post not found',
      }
    }
    
    // Validate deletion
    const validation = canDeletePost(post as BlogPost)
    if (!validation.canDelete) {
      return {
        success: false,
        error: validation.reason || 'Cannot delete post',
      }
    }
    
    // Delete cover image if exists
    if (post.cover_image_url) {
      await deleteBlogCover(post.cover_image_url)
    }
    
    // Delete post
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', postId)
    
    if (error) {
      console.error('Error deleting post:', error)
      return {
        success: false,
        error: 'Failed to delete post',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_POST_DELETED,
      targetType: 'blog_post',
      targetId: postId,
      metadata: {
        post_title: post.title,
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/posts')
    
    return {
      success: true,
      data: null,
      message: 'Post deleted successfully',
    }
  } catch (error) {
    console.error('Error in deletePostAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Upload cover image for a post
 */
export async function uploadPostCoverAction(
  postId: string,
  formData: FormData
): Promise<ActionResponse<string>> {
  try {
    const file = formData.get('cover') as File
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      }
    }
    
    // Upload cover
    const result = await uploadBlogCover(file, postId)
    
    if (!result.success || !result.url) {
      return {
        success: false,
        error: result.error || 'Failed to upload cover image',
      }
    }
    
    return {
      success: true,
      data: result.url,
      message: 'Cover image uploaded successfully',
    }
  } catch (error) {
    console.error('Error in uploadPostCoverAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
