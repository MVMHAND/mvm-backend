'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import {
  getAllContributors,
  getContributorWithUsers,
  validateContributorDeletion,
  validateExpertiseCount,
  validateStatsCount,
} from '@/lib/blog/contributors'
import {
  uploadContributorAvatar,
  deleteContributorAvatar,
} from '@/lib/blog/storage'
import type {
  ActionResponse,
  BlogContributor,
  BlogContributorFormData,
  BlogContributorWithUsers,
} from '@/types'

/**
 * Get all blog contributors
 */
export async function getContributorsAction(): Promise<ActionResponse<BlogContributor[]>> {
  try {
    const contributors = await getAllContributors()
    
    return {
      success: true,
      data: contributors,
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
 * Get a single contributor by ID with user info
 */
export async function getContributorByIdAction(
  contributorId: string
): Promise<ActionResponse<BlogContributorWithUsers>> {
  try {
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
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
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
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
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
    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
      }
    }
    
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
    const { error } = await supabase
      .from('blog_contributors')
      .delete()
      .eq('id', contributorId)
    
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
    const file = formData.get('avatar') as File
    
    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      }
    }
    
    // Upload avatar
    const result = await uploadContributorAvatar(file, contributorId)
    
    if (!result.success || !result.url) {
      return {
        success: false,
        error: result.error || 'Failed to upload avatar',
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
