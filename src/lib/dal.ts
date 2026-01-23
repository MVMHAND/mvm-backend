import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

/**
 * Generate a signed URL for an avatar path stored in the database
 * @param avatarPath - The storage path (e.g., "userId/filename.jpg") or full URL
 * @returns Signed URL valid for 1 hour, or null if path is invalid
 */
async function getAvatarSignedUrl(avatarPath: string | null): Promise<string | null> {
  if (!avatarPath) return null
  
  try {
    const supabase = await createClient()
    
    // Extract path if it's a full URL (for backward compatibility with existing data)
    let filePath = avatarPath
    if (avatarPath.startsWith('http://') || avatarPath.startsWith('https://')) {
      const url = new URL(avatarPath)
      const pathMatch = url.pathname.match(/\/storage\/v1\/object\/(?:public|sign)\/user-avatars\/(.+)/)
      if (pathMatch && pathMatch[1]) {
        filePath = pathMatch[1]
      } else {
        console.error('Could not extract path from avatar URL:', avatarPath)
        return null
      }
    }
    
    const { data, error } = await supabase.storage
      .from('user-avatars')
      .createSignedUrl(filePath, 3600) // 1 hour expiry
    
    if (error || !data) {
      console.error('Error generating signed URL for avatar:', error)
      return null
    }
    
    return data.signedUrl
  } catch (error) {
    console.error('Error in getAvatarSignedUrl:', error)
    return null
  }
}

/**
 * Data Access Layer (DAL) - Security Layer
 *
 * This module provides centralized authentication verification for Server Components,
 * Server Actions, and Route Handlers. It follows Next.js 15 and Supabase best practices.
 *
 * SECURITY PRINCIPLES:
 * 1. Never trust cookies or client-side data alone
 * 2. Always verify JWT with Supabase Auth server using getUser()
 * 3. Use React's cache() to memoize verification during a render pass
 * 4. Implement this in all data-fetching functions, not just middleware
 *
 * @see https://nextjs.org/docs/app/guides/authentication
 * @see https://supabase.com/docs/guides/auth/server-side/nextjs
 */

/**
 * Verifies the current user session by validating the JWT with Supabase Auth server.
 *
 * This function is memoized using React's cache() API, so multiple calls during the
 * same render pass will only make one request to Supabase.
 *
 * @returns User object if authenticated
 * @throws Redirects to / if not authenticated
 *
 * @example
 * ```ts
 * // In a Server Component
 * export default async function DashboardPage() {
 *   const user = await verifySession()
 *   // user is guaranteed to exist here
 * }
 * ```
 *
 * @example
 * ```ts
 * // In a Server Action
 * export async function updateProfile(formData: FormData) {
 *   'use server'
 *   const user = await verifySession()
 *   // Proceed with authorized action
 * }
 * ```
 */
export const verifySession = cache(async () => {
  const supabase = await createClient()

  // SECURITY: Use getUser() instead of getSession()
  // getUser() validates the JWT with the Auth server
  // getSession() only reads from cookies which can be spoofed
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/?message=Please log in to access this page')
  }

  return user
})

/**
 * Gets the current user session without redirecting.
 * Useful for optional authentication scenarios.
 *
 * @returns User object if authenticated, null otherwise
 *
 * @example
 * ```ts
 * export default async function ProfilePage() {
 *   const user = await getCurrentUser()
 *   if (!user) {
 *     return <div>Please log in</div>
 *   }
 *   return <div>Welcome {user.email}</div>
 * }
 * ```
 */
export const getCurrentUser = cache(async () => {
  const supabase = await createClient()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return null
  }

  return user
})

/**
 * User profile with role information
 */
export interface UserProfile {
  id: string
  name: string
  email: string
  avatar_url: string | null
  status: string
  role_id: string
  role: {
    id: string
    name: string
    is_super_admin: boolean
    is_system: boolean
  }
  created_at: string
  updated_at: string
  last_login: string | null
}

/**
 * Gets the current user's full profile with role information.
 * This is memoized and should be used in Server Components and Server Actions.
 *
 * @returns UserProfile if authenticated, null otherwise
 *
 * @example
 * ```ts
 * export default async function DashboardPage() {
 *   const profile = await getUserProfile()
 *   if (!profile) {
 *     redirect('/')
 *   }
 *   return <Dashboard user={profile} />
 * }
 * ```
 */
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const supabase = await createClient()
  const user = await getCurrentUser()

  if (!user) {
    return null
  }

  const { data: profile, error } = await supabase
    .from('users')
    .select(
      `
      id,
      name,
      email,
      avatar_url,
      status,
      role_id,
      created_at,
      updated_at,
      last_login,
      role:user_roles (
        id,
        name,
        is_super_admin,
        is_system
      )
    `
    )
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return null
  }

  // Type assertion for the joined role data
  const role = profile.role as unknown as {
    id: string
    name: string
    is_super_admin: boolean
    is_system: boolean
  }

  // Generate signed URL for avatar if present
  const avatarUrl = await getAvatarSignedUrl(profile.avatar_url)

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar_url: avatarUrl,
    status: profile.status,
    role_id: profile.role_id,
    role,
    created_at: profile.created_at,
    updated_at: profile.updated_at,
    last_login: profile.last_login,
  }
})

/**
 * Verifies session and returns user profile.
 * Redirects to login if not authenticated or profile not found.
 *
 * @returns UserProfile (guaranteed to exist)
 *
 * @example
 * ```ts
 * export default async function UsersPage() {
 *   const profile = await verifySessionWithProfile()
 *   // profile is guaranteed to exist here
 *   return <UsersList currentUser={profile} />
 * }
 * ```
 */
export const verifySessionWithProfile = cache(async (): Promise<UserProfile> => {
  const profile = await getUserProfile()

  if (!profile) {
    redirect('/?message=Please log in to access this page')
  }

  return profile
})

/**
 * Checks if the current user is a Super Admin.
 *
 * @returns true if user is Super Admin, false otherwise
 */
export const isSuperAdmin = cache(async (): Promise<boolean> => {
  const profile = await getUserProfile()
  return profile?.role?.is_super_admin ?? false
})

/**
 * Gets all permissions for the current user.
 * Super Admin gets all available permissions.
 *
 * @returns Array of permission keys
 */
export const getUserPermissions = cache(async (): Promise<string[]> => {
  const supabase = await createClient()
  const profile = await getUserProfile()

  if (!profile) {
    return []
  }

  // Super Admin has all permissions
  if (profile.role.is_super_admin) {
    const { data: allPermissions } = await supabase
      .from('user_permissions')
      .select('permission_key')

    return allPermissions?.map((p) => p.permission_key) || []
  }

  // Get role-specific permissions
  const { data: rolePermissions } = await supabase
    .from('user_role_permissions')
    .select('permission_key')
    .eq('role_id', profile.role_id)

  return rolePermissions?.map((rp) => rp.permission_key) || []
})

/**
 * Checks if the current user has a specific permission.
 * This should be called AFTER verifySession() to ensure user is authenticated.
 *
 * @param permissionKey - The permission key to check (e.g., 'users.edit')
 * @returns true if user has the permission, false otherwise
 *
 * @example
 * ```ts
 * export async function deleteUser(userId: string) {
 *   'use server'
 *   const user = await verifySession()
 *   const canDelete = await hasPermission('users.delete')
 *   if (!canDelete) {
 *     throw new Error('Unauthorized')
 *   }
 *   // Proceed with deletion
 * }
 * ```
 */
export const hasPermission = cache(async (permissionKey: string): Promise<boolean> => {
  const profile = await getUserProfile()

  if (!profile) {
    return false
  }

  // Super Admin has all permissions
  if (profile.role.is_super_admin) {
    return true
  }

  // Check specific permission in role_permissions table
  const supabase = await createClient()
  const { data: permission } = await supabase
    .from('user_role_permissions')
    .select('permission_key')
    .eq('role_id', profile.role_id)
    .eq('permission_key', permissionKey)
    .maybeSingle()

  return !!permission
})

/**
 * Requires one or more permissions, throws error if not authorized.
 * Use this in Server Actions for cleaner code.
 *
 * @param permissions - Single permission key or array of permission keys
 * @param requireAll - If true, user must have ALL permissions. If false, user must have ANY permission (default: true)
 * @throws Error if user doesn't have the required permission(s)
 *
 * @example
 * ```ts
 * // Single permission (backward compatible)
 * await requirePermission('users.delete')
 *
 * // Multiple permissions - require ALL (default)
 * await requirePermission(['blog.edit', 'blog.publish'])
 *
 * // Multiple permissions - require ANY (at least one)
 * await requirePermission(['blog.edit', 'blog.delete'], false)
 * ```
 */
export const requirePermission = async (
  permissions: string | string[],
  requireAll: boolean = true
): Promise<void> => {
  const profile = await getUserProfile()

  // Super Admin bypasses all permission checks
  if (profile?.role?.is_super_admin) {
    return
  }

  // Normalize to array
  const permissionArray = Array.isArray(permissions) ? permissions : [permissions]

  // Check each permission
  const permissionChecks = await Promise.all(permissionArray.map((key) => hasPermission(key)))

  // Determine if user has required permissions
  const hasAccess = requireAll
    ? permissionChecks.every((check) => check) // All must be true
    : permissionChecks.some((check) => check) // At least one must be true

  if (!hasAccess) {
    const operator = requireAll ? 'all' : 'any'
    const permList = permissionArray.join(', ')
    throw new Error(
      `Unauthorized: Missing required permission(s). Need ${operator} of: ${permList}`
    )
  }
}
