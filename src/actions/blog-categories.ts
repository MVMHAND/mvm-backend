'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import { getAllCategories, getCategoryWithUsers, validateCategoryDeletion } from '@/lib/blog/categories'
import type { ActionResponse, BlogCategory, BlogCategoryFormData, BlogCategoryWithUsers } from '@/types'

/**
 * Get all blog categories
 */
export async function getCategoriesAction(): Promise<ActionResponse<BlogCategory[]>> {
  try {
    const categories = await getAllCategories()
    
    return {
      success: true,
      data: categories,
    }
  } catch (error) {
    console.error('Error in getCategoriesAction:', error)
    return {
      success: false,
      error: 'Failed to fetch categories',
    }
  }
}

/**
 * Get a single category by ID with user info
 */
export async function getCategoryByIdAction(
  categoryId: string
): Promise<ActionResponse<BlogCategoryWithUsers>> {
  try {
    const category = await getCategoryWithUsers(categoryId)
    
    if (!category) {
      return {
        success: false,
        error: 'Category not found',
      }
    }
    
    return {
      success: true,
      data: category,
    }
  } catch (error) {
    console.error('Error in getCategoryByIdAction:', error)
    return {
      success: false,
      error: 'Failed to fetch category',
    }
  }
}

/**
 * Create a new blog category
 */
export async function createCategoryAction(
  formData: BlogCategoryFormData
): Promise<ActionResponse<BlogCategory>> {
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
    if (!formData.name || formData.name.trim() === '') {
      return {
        success: false,
        error: 'Category name is required',
      }
    }
    
    // Check if category name already exists
    const { data: existingCategory } = await supabase
      .from('blog_categories')
      .select('id')
      .eq('name', formData.name.trim())
      .single()
    
    if (existingCategory) {
      return {
        success: false,
        error: 'A category with this name already exists',
      }
    }
    
    // Create category
    const { data: category, error } = await supabase
      .from('blog_categories')
      .insert({
        name: formData.name.trim(),
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating category:', error)
      return {
        success: false,
        error: 'Failed to create category',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_CATEGORY_CREATED,
      targetType: 'blog_category',
      targetId: category.id,
      metadata: {
        category_name: category.name,
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/categories')
    
    return {
      success: true,
      data: category as BlogCategory,
      message: 'Category created successfully',
    }
  } catch (error) {
    console.error('Error in createCategoryAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update a blog category
 */
export async function updateCategoryAction(
  categoryId: string,
  formData: BlogCategoryFormData
): Promise<ActionResponse<BlogCategory>> {
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
    if (!formData.name || formData.name.trim() === '') {
      return {
        success: false,
        error: 'Category name is required',
      }
    }
    
    // Get existing category
    const { data: existingCategory, error: fetchError } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('id', categoryId)
      .single()
    
    if (fetchError || !existingCategory) {
      return {
        success: false,
        error: 'Category not found',
      }
    }
    
    // Check if new name conflicts with another category
    if (formData.name.trim() !== existingCategory.name) {
      const { data: conflictCategory } = await supabase
        .from('blog_categories')
        .select('id')
        .eq('name', formData.name.trim())
        .neq('id', categoryId)
        .single()
      
      if (conflictCategory) {
        return {
          success: false,
          error: 'A category with this name already exists',
        }
      }
    }
    
    // Update category
    const { data: category, error } = await supabase
      .from('blog_categories')
      .update({
        name: formData.name.trim(),
      })
      .eq('id', categoryId)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating category:', error)
      return {
        success: false,
        error: 'Failed to update category',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_CATEGORY_UPDATED,
      targetType: 'blog_category',
      targetId: category.id,
      metadata: {
        category_name: category.name,
        old_values: { name: existingCategory.name },
        new_values: { name: category.name },
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/categories')
    revalidatePath(`/admin/blog/categories/${categoryId}`)
    
    return {
      success: true,
      data: category as BlogCategory,
      message: 'Category updated successfully',
    }
  } catch (error) {
    console.error('Error in updateCategoryAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete a blog category
 */
export async function deleteCategoryAction(categoryId: string): Promise<ActionResponse<null>> {
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
    
    // Get category
    const { data: category, error: fetchError } = await supabase
      .from('blog_categories')
      .select('*')
      .eq('id', categoryId)
      .single()
    
    if (fetchError || !category) {
      return {
        success: false,
        error: 'Category not found',
      }
    }
    
    // Validate deletion
    const validation = await validateCategoryDeletion(categoryId)
    
    if (!validation.canDelete) {
      return {
        success: false,
        error: validation.reason || 'Cannot delete category',
      }
    }
    
    // Delete category
    const { error } = await supabase
      .from('blog_categories')
      .delete()
      .eq('id', categoryId)
    
    if (error) {
      console.error('Error deleting category:', error)
      return {
        success: false,
        error: 'Failed to delete category',
      }
    }
    
    // Create audit log
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.BLOG_CATEGORY_DELETED,
      targetType: 'blog_category',
      targetId: categoryId,
      metadata: {
        category_name: category.name,
      },
    })
    
    // Revalidate paths
    revalidatePath('/admin/blog/categories')
    
    return {
      success: true,
      data: null,
      message: 'Category deleted successfully',
    }
  } catch (error) {
    console.error('Error in deleteCategoryAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
