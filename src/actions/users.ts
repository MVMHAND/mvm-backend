'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { verifySession } from '@/lib/dal'
import { revalidatePath } from 'next/cache'
import { sendInvitationEmail } from '@/lib/email'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import type { ActionResponse } from '@/types'
import type { UserWithRole } from '@/types/database'
import { randomBytes, createHash } from 'crypto'
import { getSiteUrl } from '@/lib/utils'

/**
 * Combined user type that includes both active users and pending invitations
 */
export interface CombinedUser {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: 'active' | 'inactive' | 'invited' | 'deleted'
  role: {
    id: string
    name: string
    is_super_admin: boolean
  }
  created_at: string
  invitation_expires_at?: string | null
}

/**
 * Get paginated list of users with their roles (including pending invitations)
 */
export async function getUsersAction(
  page = 1,
  limit = 10,
  search = '',
  status = ''
): Promise<ActionResponse<{ users: CombinedUser[]; total: number; pages: number }>> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // If filtering by 'invited' status, only get pending invitations
    if (status === 'invited') {
      let invitationQuery = adminClient
        .from('user_invitations')
        .select('*, role:user_roles(*)', { count: 'exact' })
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      if (search) {
        invitationQuery = invitationQuery.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
      }

      const offset = (page - 1) * limit
      const {
        data: invitations,
        error: invError,
        count: invCount,
      } = await invitationQuery.range(offset, offset + limit - 1)

      if (invError) {
        console.error('Error fetching invitations:', invError)
        return { success: false, error: 'Failed to fetch invited users' }
      }

      const invitedUsers: CombinedUser[] = (invitations || []).map((inv) => ({
        id: inv.id,
        name: inv.name,
        email: inv.email,
        avatar_url: null,
        status: 'invited' as const,
        role: inv.role,
        created_at: inv.created_at,
        invitation_expires_at: inv.expires_at,
      }))

      return {
        success: true,
        data: {
          users: invitedUsers,
          total: invCount || 0,
          pages: Math.ceil((invCount || 0) / limit),
        },
      }
    }

    // Get profiles (active/inactive users)
    const offset = (page - 1) * limit
    let query = supabase
      .from('users')
      .select('*, role:user_roles(*)', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Filter by status if provided, otherwise filter out deleted users
    if (status) {
      query = query.eq('status', status)
    } else {
      query = query.neq('status', 'deleted')
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    const {
      data: profiles,
      error: profileError,
      count: profileCount,
    } = await query.range(offset, offset + limit - 1)

    if (profileError) {
      console.error('Error fetching users:', profileError)
      return { success: false, error: 'Failed to fetch users' }
    }

    // If no status filter (showing all), also get pending invitations
    let allUsers: CombinedUser[] = (profiles || []).map((p) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      avatar_url: p.avatar_url,
      status: p.status,
      role: p.role,
      created_at: p.created_at,
      invitation_expires_at: null,
    }))

    let total = profileCount || 0

    // If showing all users (no status filter), include pending invitations
    if (!status) {
      const { data: invitations, count: invCount } = await adminClient
        .from('user_invitations')
        .select('*, role:user_roles(*)', { count: 'exact' })
        .is('accepted_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })

      const invitedUsers: CombinedUser[] = (invitations || []).map((inv) => ({
        id: inv.id,
        name: inv.name,
        email: inv.email,
        avatar_url: null,
        status: 'invited' as const,
        role: inv.role,
        created_at: inv.created_at,
        invitation_expires_at: inv.expires_at,
      }))

      // Combine and sort by created_at
      allUsers = [...allUsers, ...invitedUsers].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      total = total + (invCount || 0)
    }

    const pages = Math.ceil(total / limit)

    return {
      success: true,
      data: { users: allUsers, total, pages },
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
export async function getUserByIdAction(userId: string): Promise<ActionResponse<UserWithRole>> {
  try {
    const supabase = await createClient()

    const { data: user, error } = await supabase
      .from('users')
      .select('*, role:user_roles(*)')
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
    const roleId = formData.get('role_id') as string

    if (!email || !roleId) {
      return {
        success: false,
        error: 'Email and role are required',
      }
    }

    // Check if user already exists in user_profiles
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()

    if (existingUser) {
      return {
        success: false,
        error: 'A user with this email already exists',
      }
    }

    // Check if there's already a pending invitation
    const { data: existingInvitation } = await adminClient
      .from('user_invitations')
      .select('id, expires_at')
      .eq('email', email)
      .is('accepted_at', null)
      .single()

    if (existingInvitation) {
      // Check if invitation is still valid
      if (new Date(existingInvitation.expires_at) > new Date()) {
        return {
          success: false,
          error: 'A pending invitation already exists for this email',
        }
      }
      // Delete expired invitation
      await adminClient.from('user_invitations').delete().eq('id', existingInvitation.id)
    }

    // Generate secure invitation token
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Set expiration to 12 hours from now
    const expiresAt = new Date()
    expiresAt.setHours(expiresAt.getHours() + 12)

    // SECURITY: Validate authentication with DAL
    const currentUser = await verifySession()

    // Get inviter profile for email
    let inviterName = 'Admin'
    const { data: currentUserProfile } = await supabase
      .from('users')
      .select('name')
      .eq('id', currentUser.id)
      .single()

    if (currentUserProfile) {
      inviterName = currentUserProfile.name
    }

    // Create invitation record in database (without name - will be provided during setup)
    const { data: invitation, error: invitationError } = await adminClient
      .from('user_invitations')
      .insert({
        email,
        name: email.split('@')[0], // Temporary name, will be updated during account setup
        role_id: roleId,
        token_hash: tokenHash,
        invited_by: currentUser.id,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single()

    if (invitationError) {
      console.error('Error creating invitation:', invitationError)
      return {
        success: false,
        error: 'Failed to create invitation',
      }
    }

    // Create audit log
    await createAuditLog({
      actorId: currentUser.id,
      actionType: AUDIT_ACTION_TYPES.USER_INVITE,
      targetType: 'user_invitation',
      targetId: invitation.id,
      metadata: { email, role_id: roleId },
    })

    // Send invitation email with unhashed token
    const siteUrl = getSiteUrl()
    const setupLink = `${siteUrl}/auth/accept-invitation?token=${token}`
    const emailResult = await sendInvitationEmail({
      to: email,
      userName: email.split('@')[0], // Use email prefix as temporary name for email
      inviterName,
      setupLink,
      expiresAt,
    })

    if (!emailResult.success) {
      console.error('Failed to send invitation email:', emailResult.error)
      // Delete the invitation if email fails
      await adminClient.from('user_invitations').delete().eq('id', invitation.id)
      return {
        success: false,
        error: 'Failed to send invitation email. Please try again.',
      }
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
      .from('users')
      .select('role:user_roles(is_super_admin)')
      .eq('id', userId)
      .single()

    if (
      user?.role &&
      typeof user.role === 'object' &&
      'is_super_admin' in user.role &&
      user.role.is_super_admin
    ) {
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
      .from('users')
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
    const currentUser = await verifySession()
    await supabase.from('user_audit_logs').insert({
      actor_id: currentUser.id,
      action_type: 'user.update',
      target_type: 'user',
      target_id: userId,
      metadata: { name, role_id: roleId },
    })

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
      .from('users')
      .select('status, role:user_roles(is_super_admin)')
      .eq('id', userId)
      .single()

    if (
      user?.role &&
      typeof user.role === 'object' &&
      'is_super_admin' in user.role &&
      user.role.is_super_admin
    ) {
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
      .from('users')
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
    const currentUser = await verifySession()
    await supabase.from('user_audit_logs').insert({
      actor_id: currentUser.id,
      action_type: 'user.status_change',
      target_type: 'user',
      target_id: userId,
      metadata: { new_status: newStatus },
    })

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
 * Delete user (soft delete in profiles + hard delete from Supabase Auth)
 */
export async function deleteUserAction(userId: string): Promise<ActionResponse> {
  try {
    const supabase = await createClient()
    const adminClient = await createAdminClient()

    // Check if user is trying to delete Super Admin
    const { data: user } = await supabase
      .from('users')
      .select('role:user_roles(is_super_admin)')
      .eq('id', userId)
      .single()

    if (
      user?.role &&
      typeof user.role === 'object' &&
      'is_super_admin' in user.role &&
      user.role.is_super_admin
    ) {
      return {
        success: false,
        error: 'Cannot delete Super Admin user',
      }
    }

    // Soft delete in user_profiles (use admin client to bypass RLS)
    const { error: profileError } = await adminClient
      .from('users')
      .update({
        status: 'deleted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (profileError) {
      console.error('Error soft deleting user profile:', profileError)
      return {
        success: false,
        error: 'Failed to delete user',
      }
    }

    // Hard delete from Supabase Auth
    const { error: authError } = await adminClient.auth.admin.deleteUser(userId)

    if (authError) {
      console.error('Error deleting user from Supabase Auth:', authError)
      // Don't fail the entire operation - profile is already marked as deleted
      // Just log the error
    }

    // Create audit log
    const currentUser = await verifySession()
    await supabase.from('user_audit_logs').insert({
      actor_id: currentUser.id,
      action_type: 'user.delete',
      target_type: 'user',
      target_id: userId,
      metadata: {},
    })

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
    // SECURITY: Validate authentication with DAL
    const user = await verifySession()
    const adminClient = await createAdminClient()

    // Update user status to active
    const { error } = await adminClient
      .from('users')
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
    await adminClient.from('user_audit_logs').insert({
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
    const fileName = `${Date.now()}.${fileExt}`
    const filePath = `${userId}/${fileName}`

    // Check if the user already has avatar files stored
    const { data: existingAvatar } = await supabase.storage.from('user-avatars').list(userId)

    // Remove every existing avatar object to avoid leaving stale files behind
    if (existingAvatar && existingAvatar.length > 0) {
      const avatarPaths = existingAvatar.map((avatar) => `${userId}/${avatar.name}`)
      const { error: removeError } = await supabase.storage.from('user-avatars').remove(avatarPaths)

      if (removeError) {
        console.error('Error removing existing avatar(s):', removeError)
        return {
          success: false,
          error: 'Failed to replace existing avatar. Please try again.',
        }
      }
    }

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('user-avatars')
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
    } = supabase.storage.from('user-avatars').getPublicUrl(filePath)

    // Update profile with new avatar URL using admin client (to bypass RLS)
    const { error: updateError } = await adminClient
      .from('users')
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
