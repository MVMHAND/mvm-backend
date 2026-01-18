'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { verifySession, requirePermission } from '@/lib/dal'
import { Permissions } from '@/lib/permission-constants'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import type { JobCategory, JobCategoryFormData } from '@/types/job-posts'
import { canDeleteCategory, generateCategorySlug } from '@/lib/job-posts/categories'

type ActionResponse<T = unknown> =
  | { success: true; data: T; message?: string }
  | { success: false; error: string }

/**
 * Get all job categories
 */
export async function getJobCategoriesAction(): Promise<ActionResponse<JobCategory[]>> {
  try {
    await verifySession()
    await requirePermission(Permissions.JOB_POSTS_VIEW)

    const supabase = await createClient()
    const { data, error } = await supabase.from('job_categories').select('*').order('name')

    if (error) {
      console.error('Error fetching job categories:', error)
      return { success: false, error: 'Failed to fetch categories' }
    }

    return {
      success: true,
      data: (data as JobCategory[]) || [],
    }
  } catch (error) {
    console.error('Unexpected error in getJobCategoriesAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Get single job category by ID
 */
export async function getJobCategoryByIdAction(id: string): Promise<ActionResponse<JobCategory>> {
  try {
    await verifySession()
    await requirePermission(Permissions.JOB_POSTS_VIEW)

    const supabase = await createClient()
    const { data, error } = await supabase.from('job_categories').select('*').eq('id', id).single()

    if (error) {
      console.error('Error fetching job category:', error)
      return { success: false, error: 'Category not found' }
    }

    return { success: true, data: data as JobCategory }
  } catch (error) {
    console.error('Unexpected error in getJobCategoryByIdAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Create job category
 */
export async function createJobCategoryAction(
  formData: JobCategoryFormData
): Promise<ActionResponse<JobCategory>> {
  try {
    const user = await verifySession()
    await requirePermission(Permissions.JOB_POSTS_EDIT)

    const supabase = await createClient()

    const slug = generateCategorySlug(formData.name)

    const { data, error } = await supabase
      .from('job_categories')
      .insert({
        name: formData.name,
        slug,
        description: formData.description || null,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Category name already exists' }
      }
      console.error('Error creating category:', error)
      return { success: false, error: 'Failed to create category' }
    }

    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.JOB_CATEGORY_CREATED,
      targetType: 'job_category',
      targetId: data.id,
      metadata: { name: data.name },
    })

    revalidatePath('/admin/job-posts/categories')

    return {
      success: true,
      data: data as JobCategory,
      message: 'Category created successfully',
    }
  } catch (error) {
    console.error('Unexpected error in createJobCategoryAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Update job category
 */
export async function updateJobCategoryAction(
  id: string,
  formData: JobCategoryFormData
): Promise<ActionResponse<JobCategory>> {
  try {
    const user = await verifySession()
    await requirePermission(Permissions.JOB_POSTS_EDIT)

    const supabase = await createClient()

    const { data: existingCategory, error: fetchError } = await supabase
      .from('job_categories')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingCategory) {
      return { success: false, error: 'Category not found' }
    }

    let slug = existingCategory.slug
    if (formData.name !== existingCategory.name) {
      slug = generateCategorySlug(formData.name)
    }

    const { data, error } = await supabase
      .from('job_categories')
      .update({
        name: formData.name,
        slug,
        description: formData.description || null,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Category name already exists' }
      }
      console.error('Error updating category:', error)
      return { success: false, error: 'Failed to update category' }
    }

    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.JOB_CATEGORY_UPDATED,
      targetType: 'job_category',
      targetId: id,
      metadata: { name: data.name, previousName: existingCategory.name },
    })

    revalidatePath('/admin/job-posts/categories')

    return {
      success: true,
      data: data as JobCategory,
      message: 'Category updated successfully',
    }
  } catch (error) {
    console.error('Unexpected error in updateJobCategoryAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}

/**
 * Delete job category
 */
export async function deleteJobCategoryAction(id: string): Promise<ActionResponse<void>> {
  try {
    const user = await verifySession()
    await requirePermission(Permissions.JOB_POSTS_DELETE)

    const validation = await canDeleteCategory(id)
    if (!validation.canDelete) {
      return { success: false, error: validation.reason || 'Cannot delete category' }
    }

    const supabase = await createClient()

    const { data: category } = await supabase
      .from('job_categories')
      .select('name')
      .eq('id', id)
      .single()

    const { error } = await supabase.from('job_categories').delete().eq('id', id)

    if (error) {
      console.error('Error deleting category:', error)
      return { success: false, error: 'Failed to delete category' }
    }

    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.JOB_CATEGORY_DELETED,
      targetType: 'job_category',
      targetId: id,
      metadata: { name: category?.name },
    })

    revalidatePath('/admin/job-posts/categories')

    return {
      success: true,
      data: undefined,
      message: 'Category deleted successfully',
    }
  } catch (error) {
    console.error('Unexpected error in deleteJobCategoryAction:', error)
    return { success: false, error: 'An unexpected error occurred' }
  }
}
