'use server'

import { createClient } from '@/lib/supabase/server'
import { verifySession, requirePermission } from '@/lib/dal'
import { Permissions } from '@/lib/permission-constants'
import { revalidatePath } from 'next/cache'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import {
  getContributorWithUsers,
  validateContributorDeletion,
  validateExpertiseCount,
  validateStatsCount,
} from '@/lib/blog/contributors'
import { uploadContributorAvatar, deleteContributorAvatar } from '@/lib/blog/storage'
import type {
  ActionResponse,
  BlogContributor,
  BlogContributorFormData,
  BlogContributorWithUsers,
} from '@/types'

interface GetContributorsParams {
  page?: number
  limit?: number
  search?: string
}

interface PaginatedContributors {
  contributors: BlogContributor[]
  total: number
  page: number
  pages: number
}

/**
 * Get paginated blog contributors with optional search
 */
export async function getContributorsAction(
  params: GetContributorsParams = {}
): Promise<ActionResponse<PaginatedContributors>> {
  try {
    await verifySession()
    await requirePermission(Permissions.BLOG_CONTRIBUTORS_MANAGE)
    const supabase = await createClient()
    const page = params.page || 1
    const limit = params.limit || 10
    const search = params.search || ''
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('blog_contributors')
      .select('*, post_count:blog_posts(count)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Add search filter
    if (search) {
      query = query.or(`full_name.ilike.%${search}%,position.ilike.%${search}%`)
    }

    // Execute query with pagination
    const { data, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching contributors:', error)
      return {
        success: false,
        error: 'Failed to fetch contributors',
      }
    }

    // Transform data to include post_count
    const contributors = (data || []).map((contrib) => ({
      ...contrib,
      post_count: Array.isArray(contrib.post_count) ? contrib.post_count[0]?.count || 0 : 0,
    }))

    const total = count || 0
    const pages = Math.ceil(total / limit)

    return {
      success: true,
      data: { contributors, total, page, pages },
    }
  } catch (error) {
    console.error('Error in getContributorsAction:', error)
    return {
      success: false,
      error: 'Failed to fetch contributors',
    }
  }
}

/**
 * Get all contributors for dropdown/select options (no pagination)
 */
export async function getAllContributorsForSelectAction(): Promise<
  ActionResponse<{ id: string; full_name: string }[]>
> {
  try {
    await verifySession()
    await requirePermission(Permissions.BLOG_VIEW)
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('blog_contributors')
      .select('id, full_name')
      .order('full_name', { ascending: true })

    if (error) {
      console.error('Error fetching contributors for select:', error)
      return {
        success: false,
        error: 'Failed to fetch contributors',
      }
    }

    return {
      success: true,
      data: data || [],
    }
  } catch (error) {
    console.error('Error in getAllContributorsForSelectAction:', error)
    return {
      success: false,
      error: 'Failed to fetch contributors',
    }
  }
}

/**
 * Get a single contributor by ID with user info
 */
export async function getContributorByIdAction(
  contributorId: string
): Promise<ActionResponse<BlogContributorWithUsers>> {
  try {
    await verifySession()
    await requirePermission(Permissions.BLOG_CONTRIBUTORS_MANAGE)
    const contributor = await getContributorWithUsers(contributorId)

    if (!contributor) {
      return {
        success: false,
        error: 'Contributor not found',
      }
    }

    return {
      success: true,
      data: contributor,
    }
  } catch (error) {
    console.error('Error in getContributorByIdAction:', error)
    return {
      success: false,
      error: 'Failed to fetch contributor',
    }
  }
}

/**
 * Create a new blog contributor
 */
export async function createContributorAction(
  formData: BlogContributorFormData
): Promise<ActionResponse<BlogContributor>> {
  try {
    // SECURITY: Validate authentication and permission with DAL
    const user = await verifySession()
    await requirePermission(Permissions.BLOG_CONTRIBUTORS_MANAGE)
    const supabase = await createClient()

    // Validate input
    if (!formData.full_name || formData.full_name.trim() === '') {
      return {
        success: false,
        error: 'Full name is required',
      }
    }

    if (!formData.position || formData.position.trim() === '') {
      return {
        success: false,
        error: 'Position is required',
      }
    }

    if (!formData.bio || formData.bio.trim() === '') {
      return {
        success: false,
        error: 'Bio is required',
      }
    }

    // Validate expertise count
    const expertiseValidation = validateExpertiseCount(formData.expertise)
    if (!expertiseValidation.isValid) {
      return {
        success: false,
        error: expertiseValidation.error,
      }
    }

    // Validate stats count
    const statsValidation = validateStatsCount(formData.stats)
    if (!statsValidation.isValid) {
      return {
        success: false,
        error: statsValidation.error,
      }
    }

    // Create contributor
    const { data: contributor, error } = await supabase
      .from('blog_contributors')
      .insert({
        full_name: formData.full_name.trim(),
        position: formData.position.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.avatar_url || null,
        expertise: formData.expertise,
        stats: formData.stats,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating contributor:', error)
      return {
        success: false,
        error: 'Failed to create contributor',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_CONTRIBUTOR_CREATED,
      targetType: 'blog_contributor',
      targetId: contributor.id,
      metadata: {
        contributor_name: contributor.full_name,
      },
    })

    // Revalidate paths
    revalidatePath('/admin/blog/contributors')

    return {
      success: true,
      data: contributor as BlogContributor,
      message: 'Contributor created successfully',
    }
  } catch (error) {
    console.error('Error in createContributorAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a blog contributor
 */
export async function updateContributorAction(
  contributorId: string,
  formData: BlogContributorFormData
): Promise<ActionResponse<BlogContributor>> {
  try {
    // SECURITY: Validate authentication and permission with DAL
    const user = await verifySession()
    await requirePermission(Permissions.BLOG_CONTRIBUTORS_MANAGE)
    const supabase = await createClient()

    // Validate input
    if (!formData.full_name || formData.full_name.trim() === '') {
      return {
        success: false,
        error: 'Full name is required',
      }
    }

    if (!formData.position || formData.position.trim() === '') {
      return {
        success: false,
        error: 'Position is required',
      }
    }

    if (!formData.bio || formData.bio.trim() === '') {
      return {
        success: false,
        error: 'Bio is required',
      }
    }

    // Validate expertise count
    const expertiseValidation = validateExpertiseCount(formData.expertise)
    if (!expertiseValidation.isValid) {
      return {
        success: false,
        error: expertiseValidation.error,
      }
    }

    // Validate stats count
    const statsValidation = validateStatsCount(formData.stats)
    if (!statsValidation.isValid) {
      return {
        success: false,
        error: statsValidation.error,
      }
    }

    // Get existing contributor
    const { data: existingContributor, error: fetchError } = await supabase
      .from('blog_contributors')
      .select('*')
      .eq('id', contributorId)
      .single()

    if (fetchError || !existingContributor) {
      return {
        success: false,
        error: 'Contributor not found',
      }
    }

    // Update contributor
    const { data: contributor, error } = await supabase
      .from('blog_contributors')
      .update({
        full_name: formData.full_name.trim(),
        position: formData.position.trim(),
        bio: formData.bio.trim(),
        avatar_url: formData.avatar_url || null,
        expertise: formData.expertise,
        stats: formData.stats,
      })
      .eq('id', contributorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating contributor:', error)
      return {
        success: false,
        error: 'Failed to update contributor',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_CONTRIBUTOR_UPDATED,
      targetType: 'blog_contributor',
      targetId: contributor.id,
      metadata: {
        contributor_name: contributor.full_name,
        old_values: {
          full_name: existingContributor.full_name,
          position: existingContributor.position,
        },
        new_values: {
          full_name: contributor.full_name,
          position: contributor.position,
        },
      },
    })

    // Revalidate paths
    revalidatePath('/admin/blog/contributors')
    revalidatePath(`/admin/blog/contributors/${contributorId}`)

    return {
      success: true,
      data: contributor as BlogContributor,
      message: 'Contributor updated successfully',
    }
  } catch (error) {
    console.error('Error in updateContributorAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a blog contributor
 */
export async function deleteContributorAction(
  contributorId: string
): Promise<ActionResponse<null>> {
  try {
    // SECURITY: Validate authentication and permission with DAL
    const user = await verifySession()
    await requirePermission(Permissions.BLOG_CONTRIBUTORS_MANAGE)
    const supabase = await createClient()

    // Get contributor
    const { data: contributor, error: fetchError } = await supabase
      .from('blog_contributors')
      .select('*')
      .eq('id', contributorId)
      .single()

    if (fetchError || !contributor) {
      return {
        success: false,
        error: 'Contributor not found',
      }
    }

    // Validate deletion
    const validation = await validateContributorDeletion(contributorId)

    if (!validation.canDelete) {
      return {
        success: false,
        error: validation.reason || 'Cannot delete contributor',
      }
    }

    // Delete avatar if exists
    if (contributor.avatar_url) {
      await deleteContributorAvatar(contributor.avatar_url)
    }

    // Delete contributor
    const { error } = await supabase.from('blog_contributors').delete().eq('id', contributorId)

    if (error) {
      console.error('Error deleting contributor:', error)
      return {
        success: false,
        error: 'Failed to delete contributor',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_CONTRIBUTOR_DELETED,
      targetType: 'blog_contributor',
      targetId: contributorId,
      metadata: {
        contributor_name: contributor.full_name,
      },
    })

    // Revalidate paths
    revalidatePath('/admin/blog/contributors')

    return {
      success: true,
      data: null,
      message: 'Contributor deleted successfully',
    }
  } catch (error) {
    console.error('Error in deleteContributorAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Upload avatar for a contributor
 */
export async function uploadContributorAvatarAction(
  contributorId: string,
  formData: FormData
): Promise<ActionResponse<string>> {
  try {
    const supabase = await createClient()
    const file = formData.get('avatar') as File

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      }
    }

    // Upload avatar (will automatically delete old avatars)
    const result = await uploadContributorAvatar(file, contributorId)

    if (!result.success || !result.url) {
      return {
        success: false,
        error: result.error || 'Failed to upload avatar',
      }
    }

    // Update the contributor with the new avatar URL
    const { error: updateError } = await supabase
      .from('blog_contributors')
      .update({ avatar_url: result.url })
      .eq('id', contributorId)

    if (updateError) {
      console.error('Error updating contributor with avatar:', updateError)
      return {
        success: false,
        error: 'Failed to update contributor with avatar',
      }
    }

    return {
      success: true,
      data: result.url,
      message: 'Avatar uploaded successfully',
    }
  } catch (error) {
    console.error('Error in uploadContributorAvatarAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
