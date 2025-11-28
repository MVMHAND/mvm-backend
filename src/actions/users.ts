'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { ActionResponse } from '@/types'

/**
 * Get paginated list of users with their roles
 */
export async function getUsersAction(
  page = 1,
  limit = 10,
  search = ''
): Promise<ActionResponse<{ users: any[]; total: number; pages: number }>> {
  try {
    const supabase = await createClient()
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('profiles')
      .select('*, role:roles(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filter out deleted users
    query = query.neq('status', 'deleted')

    // Add search filter if provided
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Execute query with pagination
    const { data: users, error, count } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('Error fetching users:', error)
      return {
        success: false,
        error: 'Failed to fetch users',
      }
    }

    const total = count || 0
    const pages = Math.ceil(total / limit)

    return {
      success: true,
      data: { users: users || [], total, pages },
    }
  } catch (error) {
    console.error('Error in getUsersAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a single user by ID
 */
export async function getUserByIdAction(
  userId: string
): Promise<ActionResponse<any>> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('profiles')
      .select('*, role:roles(*)')
      .eq('id', userId)
      .single()

    if (error) {
      return {
        success: false,
        error: 'User not found',
      }
    }

    return {
      success: true,
      data: user,
    }
  } catch (error) {
    console.error('Error in getUserByIdAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Invite a new admin user
 */
export async function inviteUserAction(formData: FormData): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    const email = formData.get('email') as string
    const name = formData.get('name') as string
    const roleId = formData.get('role_id') as string

    if (!email || !name || !roleId) {
      return {
        success: false,
        error: 'Email, name, and role are required',
      }
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email already exists',
      }
    }

    // Create auth user using admin client (Supabase will send the invitation email)
    const redirectUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    const { data: authData, error: authError } = await adminClient.auth.admin.inviteUserByEmail(
      email,
      {
        data: {
          name,
          role_id: roleId,
        },
        redirectTo: redirectUrl,
      }
    )

    if (authError) {
      console.error('Error creating auth user:', authError)
      return {
        success: false,
        error: 'Failed to send invitation',
      }
    }

    // Create profile using admin client (to bypass RLS)
    const { error: profileError } = await adminClient.from('profiles').insert({
      id: authData.user.id,
      name,
      email,
      role_id: roleId,
      status: 'invited',
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      return {
        success: false,
        error: 'Failed to create user profile',
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await supabase.from('audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'user.invite',
        target_type: 'user',
        target_id: authData.user.id,
        metadata: { email, name, role_id: roleId },
      })
    }

    revalidatePath('/admin/users')

    return {
      success: true,
      message: `Invitation sent to ${email}`,
    }
  } catch (error) {
    console.error('Error in inviteUserAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update user details
 */
export async function updateUserAction(
  userId: string,
  formData: FormData
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check if user is trying to edit Super Admin
    const { data: user } = await supabase
      .from('profiles')
      .select('role:roles(is_super_admin)')
      .eq('id', userId)
      .single()

    if (user?.role && typeof user.role === 'object' && 'is_super_admin' in user.role && user.role.is_super_admin) {
      return {
        success: false,
        error: 'Cannot modify Super Admin user',
      }
    }

    const name = formData.get('name') as string
    const roleId = formData.get('role_id') as string

    if (!name || !roleId) {
      return {
        success: false,
        error: 'Name and role are required',
      }
    }

    // Use admin client to bypass RLS for updating other users
    const { error } = await adminClient
      .from('profiles')
      .update({
        name,
        role_id: roleId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user:', error)
      return {
        success: false,
        error: 'Failed to update user',
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await supabase.from('audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'user.update',
        target_type: 'user',
        target_id: userId,
        metadata: { name, role_id: roleId },
      })
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)

    return {
      success: true,
      message: 'User updated successfully',
    }
  } catch (error) {
    console.error('Error in updateUserAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Toggle user status (active/inactive)
 */
export async function toggleUserStatusAction(
  userId: string,
  newStatus: 'active' | 'inactive'
): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check if user is trying to modify Super Admin or an invited user
    const { data: user } = await supabase
      .from('profiles')
      .select('status, role:roles(is_super_admin)')
      .eq('id', userId)
      .single()

    if (user?.role && typeof user.role === 'object' && 'is_super_admin' in user.role && user.role.is_super_admin) {
      return {
        success: false,
        error: 'Cannot deactivate Super Admin user',
      }
    }

    // Prevent toggling invited users - they must accept invitation first
    if (user?.status === 'invited') {
      return {
        success: false,
        error: 'Cannot change status of invited users. User must accept invitation first.',
      }
    }

    // Use admin client to bypass RLS
    const { error } = await adminClient
      .from('profiles')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating user status:', error)
      return {
        success: false,
        error: 'Failed to update user status',
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await supabase.from('audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'user.status_change',
        target_type: 'user',
        target_id: userId,
        metadata: { new_status: newStatus },
      })
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)

    return {
      success: true,
      message: `User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`,
    }
  } catch (error) {
    console.error('Error in toggleUserStatusAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete user (soft delete by setting status to 'deleted')
 */
export async function deleteUserAction(userId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check if user is trying to delete Super Admin
    const { data: user } = await supabase
      .from('profiles')
      .select('role:roles(is_super_admin)')
      .eq('id', userId)
      .single()

    if (user?.role && typeof user.role === 'object' && 'is_super_admin' in user.role && user.role.is_super_admin) {
      return {
        success: false,
        error: 'Cannot delete Super Admin user',
      }
    }

    // Use admin client to bypass RLS for deleting other users
    const { error } = await adminClient
      .from('profiles')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error deleting user:', error)
      return {
        success: false,
        error: 'Failed to delete user',
      }
    }

    // Create audit log
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser()

    if (currentUser) {
      await supabase.from('audit_logs').insert({
        actor_id: currentUser.id,
        action_type: 'user.delete',
        target_type: 'user',
        target_id: userId,
        metadata: {},
      })
    }

    revalidatePath('/admin/users')

    return {
      success: true,
      message: 'User deleted successfully',
    }
  } catch (error) {
    console.error('Error in deleteUserAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Activate user after password setup
 */
export async function activateUserAfterSetupAction(): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return {
        success: false,
        error: 'Not authenticated',
      }
    }

    // Update user status to active
    const { error } = await adminClient
      .from('profiles')
      .update({
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    if (error) {
      console.error('Error activating user:', error)
      return {
        success: false,
        error: 'Failed to activate user',
      }
    }

    // Create audit log
    await adminClient.from('audit_logs').insert({
      actor_id: user.id,
      action_type: 'user.activated',
      target_type: 'user',
      target_id: user.id,
      metadata: { activation_type: 'password_setup' },
    })

    return {
      success: true,
      message: 'User activated successfully',
    }
  } catch (error) {
    console.error('Error in activateUserAfterSetupAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Upload user avatar
 */
export async function uploadAvatarAction(
  userId: string,
  formData: FormData
): Promise<ActionResponse<{ avatar_url: string }>> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()
    const file = formData.get('avatar') as File

    if (!file) {
      return {
        success: false,
        error: 'No file provided',
      }
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'File must be an image',
      }
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return {
        success: false,
        error: 'File size must be less than 2MB',
      }
    }

    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}-${Date.now()}.${fileExt}`
    const filePath = `avatars/${fileName}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, {
        upsert: true,
      })

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError)
      return {
        success: false,
        error: 'Failed to upload avatar',
      }
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('avatars').getPublicUrl(filePath)

    // Update profile with new avatar URL using admin client (to bypass RLS)
    const { error: updateError } = await adminClient
      .from('profiles')
      .update({
        avatar_url: publicUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (updateError) {
      console.error('Error updating profile with avatar:', updateError)
      return {
        success: false,
        error: 'Failed to update profile',
      }
    }

    revalidatePath('/admin/users')
    revalidatePath(`/admin/users/${userId}`)

    return {
      success: true,
      data: { avatar_url: publicUrl },
      message: 'Avatar uploaded successfully',
    }
  } catch (error) {
    console.error('Error in uploadAvatarAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
