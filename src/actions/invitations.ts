'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { createHash } from 'crypto'
import type { ActionResponse } from '@/types'

/**
 * Verify invitation token and get invitation details
 */
export async function verifyInvitationTokenAction(
  token: string
): Promise<ActionResponse<{ email: string; name: string; roleId: string }>> {
  try {
    const adminClient = await createAdminClient()

    // Hash the token to match database
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Find the invitation
    const { data: invitation, error } = await adminClient
      .from('user_invitations')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('accepted_at', null)
      .single()

    if (error || !invitation) {
      return {
        success: false,
        error: 'Invalid or expired invitation link',
      }
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return {
        success: false,
        error: 'This invitation has expired. Please request a new invitation.',
      }
    }

    return {
      success: true,
      data: {
        email: invitation.email,
        name: invitation.name,
        roleId: invitation.role_id,
      },
    }
  } catch (error) {
    console.error('Error verifying invitation token:', error)
    return {
      success: false,
      error: 'Failed to verify invitation',
    }
  }
}

/**
 * Accept invitation and create user account
 */
export async function acceptInvitationAction(
  token: string,
  name: string,
  password: string
): Promise<ActionResponse> {
  try {
    const adminClient = await createAdminClient()

    // Hash the token to match database
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Find the invitation
    const { data: invitation, error: invitationError } = await adminClient
      .from('user_invitations')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('accepted_at', null)
      .single()

    if (invitationError || !invitation) {
      return {
        success: false,
        error: 'Invalid or expired invitation link',
      }
    }

    // Check if invitation has expired
    if (new Date(invitation.expires_at) < new Date()) {
      return {
        success: false,
        error: 'This invitation has expired. Please request a new invitation.',
      }
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return {
        success: false,
        error: 'Name is required',
      }
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long',
      }
    }

    // Create user in Supabase Auth
    const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
      email: invitation.email,
      password,
      email_confirm: true, // Auto-confirm email since invitation was sent
      user_metadata: {
        name: name.trim(),
      },
    })

    if (authError || !authData.user) {
      console.error('Error creating auth user:', authError)
      return {
        success: false,
        error: 'Failed to create account. Please try again.',
      }
    }

    // Create profile
    const { error: profileError } = await adminClient.from('users').insert({
      id: authData.user.id,
      name: name.trim(),
      email: invitation.email,
      role_id: invitation.role_id,
      status: 'active', // Set to active immediately after password setup
    })

    if (profileError) {
      console.error('Error creating profile:', profileError)
      // Delete the auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(authData.user.id)
      return {
        success: false,
        error: 'Failed to create user profile. Please try again.',
      }
    }

    // Mark invitation as accepted
    await adminClient
      .from('user_invitations')
      .update({ accepted_at: new Date().toISOString() })
      .eq('id', invitation.id)

    // Create audit log
    await adminClient.from('user_audit_logs').insert({
      actor_id: authData.user.id,
      action_type: 'user.invitation_accepted',
      target_type: 'user',
      target_id: authData.user.id,
      metadata: { invitation_id: invitation.id },
    })

    return {
      success: true,
      message: 'Account created successfully! You can now log in.',
    }
  } catch (error) {
    console.error('Error accepting invitation:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
