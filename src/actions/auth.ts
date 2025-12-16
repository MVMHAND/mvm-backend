'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { randomBytes, createHash } from 'crypto'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getCurrentUser as getDALCurrentUser } from '@/lib/dal'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import { sendPasswordResetEmail } from '@/lib/email'
import type { ActionResponse } from '@/types'
import { getSiteUrl } from '@/lib/utils'

/**
 * Login action - authenticates a user with email and password
 */
export async function loginAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return {
      success: false,
      error: 'Email and password are required',
    }
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    // Log failed login attempt
    await createAuditLog({
      actorId: null,
      actionType: AUDIT_ACTION_TYPES.LOGIN_FAILURE,
      targetType: 'auth',
      metadata: { email, error: error.message },
    })

    return {
      success: false,
      error: 'Invalid email or password',
    }
  }

  if (!data.session) {
    return {
      success: false,
      error: 'Failed to create session',
    }
  }

  // Update last login timestamp
  if (data.user) {
    await supabase
      .from('users')
      .update({ last_login: new Date().toISOString() })
      .eq('id', data.user.id)

    // Log successful login
    await createAuditLog({
      actorId: data.user.id,
      actionType: AUDIT_ACTION_TYPES.LOGIN_SUCCESS,
      targetType: 'auth',
      metadata: { email },
    })
  }

  revalidatePath('/admin', 'layout')

  return {
    success: true,
    message: 'Login successful',
  }
}

/**
 * Logout action - signs out the current user
 */
export async function logoutAction(): Promise<ActionResponse> {
  const supabase = await createClient()

  // Get user before logging out (optional for audit log)
  const user = await getDALCurrentUser()

  const { error } = await supabase.auth.signOut()

  if (error) {
    return {
      success: false,
      error: 'Failed to logout',
    }
  }

  // Log logout
  if (user) {
    await createAuditLog({
      actorId: user.id,
      actionType: AUDIT_ACTION_TYPES.LOGOUT,
      targetType: 'auth',
      metadata: {},
    })
  }

  revalidatePath('/admin', 'layout')
  redirect('/admin/login')
}

/**
 * Forgot password action - sends password reset email with custom token (30 min expiry)
 * Uses custom token system similar to user invitations for security
 */
export async function forgotPasswordAction(formData: FormData): Promise<ActionResponse> {
  const email = formData.get('email') as string

  if (!email) {
    return {
      success: false,
      error: 'Email is required',
    }
  }

  try {
    const adminClient = await createAdminClient()

    // Check if user exists in profiles
    const { data: profile } = await adminClient
      .from('users')
      .select('id, name, status')
      .eq('email', email)
      .single()

    if (!profile) {
      // Don't reveal if user exists or not for security
      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      }
    }

    // Don't send reset for inactive/deleted users
    if (profile.status === 'deleted' || profile.status === 'inactive') {
      return {
        success: true,
        message: 'If an account with this email exists, a password reset link has been sent.',
      }
    }

    // Invalidate any existing reset tokens for this user
    await adminClient.from('user_password_reset_tokens').delete().eq('user_id', profile.id)

    // Generate secure reset token
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Set expiration to 30 minutes from now
    const expiresAt = new Date()
    expiresAt.setMinutes(expiresAt.getMinutes() + 30)

    // Store token in database
    const { error: insertError } = await adminClient.from('user_password_reset_tokens').insert({
      user_id: profile.id,
      email: email,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
    })

    if (insertError) {
      console.error('Error creating reset token:', insertError)
      return {
        success: false,
        error: 'Failed to initiate password reset. Please try again.',
      }
    }

    // Send password reset email with the token
    const siteUrl = getSiteUrl()
    const resetLink = `${siteUrl}/auth/reset-password?token=${token}`
    await sendPasswordResetEmail({
      to: email,
      userName: profile.name,
      resetLink,
      expiresAt,
    })

    // Log the password reset request
    await createAuditLog({
      actorId: null,
      actionType: AUDIT_ACTION_TYPES.PASSWORD_RESET_REQUEST,
      targetType: 'auth',
      metadata: { email },
    })

    return {
      success: true,
      message: 'If an account with this email exists, a password reset link has been sent.',
    }
  } catch (error) {
    console.error('Error in forgotPasswordAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Verify password reset token
 */
export async function verifyResetTokenAction(
  token: string
): Promise<ActionResponse<{ email: string; userName: string }>> {
  try {
    const adminClient = await createAdminClient()

    // Hash the token to match database
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Find the token
    const { data: resetToken, error } = await adminClient
      .from('user_password_reset_tokens')
      .select('*, profile:users(name)')
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .single()

    if (error || !resetToken) {
      return {
        success: false,
        error: 'Invalid or expired reset link. Please request a new one.',
      }
    }

    // Check if token has expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return {
        success: false,
        error: 'This reset link has expired. Please request a new one.',
      }
    }

    return {
      success: true,
      data: {
        email: resetToken.email,
        userName: resetToken.profile?.name || 'User',
      },
    }
  } catch (error) {
    console.error('Error verifying reset token:', error)
    return {
      success: false,
      error: 'Failed to verify reset link.',
    }
  }
}

/**
 * Reset password with token
 */
export async function resetPasswordAction(
  token: string,
  newPassword: string
): Promise<ActionResponse> {
  try {
    const adminClient = await createAdminClient()

    // Hash the token to match database
    const tokenHash = createHash('sha256').update(token).digest('hex')

    // Find and validate the token
    const { data: resetToken, error: tokenError } = await adminClient
      .from('user_password_reset_tokens')
      .select('*')
      .eq('token_hash', tokenHash)
      .is('used_at', null)
      .single()

    if (tokenError || !resetToken) {
      return {
        success: false,
        error: 'Invalid or expired reset link. Please request a new one.',
      }
    }

    // Check if token has expired
    if (new Date(resetToken.expires_at) < new Date()) {
      return {
        success: false,
        error: 'This reset link has expired. Please request a new one.',
      }
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return {
        success: false,
        error: 'Password must be at least 8 characters long.',
      }
    }

    // Update the user's password in Supabase Auth
    const { error: updateError } = await adminClient.auth.admin.updateUserById(resetToken.user_id, {
      password: newPassword,
    })

    if (updateError) {
      console.error('Error updating password:', updateError)
      return {
        success: false,
        error: 'Failed to update password. Please try again.',
      }
    }

    // Mark token as used
    await adminClient
      .from('user_password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('id', resetToken.id)

    // Log the password reset
    await createAuditLog({
      actorId: resetToken.user_id,
      actionType: AUDIT_ACTION_TYPES.PASSWORD_RESET,
      targetType: 'auth',
      metadata: { email: resetToken.email },
    })

    return {
      success: true,
      message: 'Password reset successfully! You can now log in with your new password.',
    }
  } catch (error) {
    console.error('Error in resetPasswordAction:', error)
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    }
  }
}

/**
 * Get current authenticated user with profile
 * @deprecated Use getCurrentUser from @/lib/dal instead
 */
export async function getCurrentUser() {
  return getDALCurrentUser()
}
