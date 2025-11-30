'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAuditLog, AUDIT_ACTION_TYPES } from '@/lib/audit'
import type { ActionResponse } from '@/types'

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
      .from('profiles')
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

  // Get user before logging out
  const {
    data: { user },
  } = await supabase.auth.getUser()

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
 * Get current authenticated user with profile
 */
export async function getCurrentUser() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return null
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*, role:roles(*)')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return null
  }

  return {
    id: user.id,
    email: user.email!,
    name: profile.name,
    avatar_url: profile.avatar_url,
    role: profile.role,
  }
}
