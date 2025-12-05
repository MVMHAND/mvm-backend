import { createClient } from '@/lib/supabase/server'

/**
 * Check if a user has a specific permission
 * Super Admin always has all permissions
 */
export async function hasPermission(permissionKey: string): Promise<boolean> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    // Get user's profile with role
    const { data: profile } = await supabase
      .from('users')
      .select(
        `
        id,
        role_id,
        role:user_roles (
          id,
          is_super_admin
        )
      `
      )
      .eq('id', user.id)
      .single()

    if (!profile) {
      return false
    }

    // Super Admin has all permissions
    if (profile.role && (profile.role as unknown as { is_super_admin: boolean }).is_super_admin) {
      return true
    }

    // Check if user's role has the permission
    const { data: rolePermission } = await supabase
      .from('user_role_permissions')
      .select('permission_key')
      .eq('role_id', profile.role_id)
      .eq('permission_key', permissionKey)
      .single()

    return !!rolePermission
  } catch (error) {
    console.error('Error checking permission:', error)
    return false
  }
}

/**
 * Get all permissions for the current user
 */
export async function getUserPermissions(): Promise<string[]> {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return []
    }

    // Get user's profile with role
    const { data: profile } = await supabase
      .from('users')
      .select(
        `
        id,
        role_id,
        role:user_roles (
          id,
          is_super_admin
        )
      `
      )
      .eq('id', user.id)
      .single()

    if (!profile) {
      return []
    }

    // Super Admin has all permissions - return all permission keys
    if (profile.role && (profile.role as unknown as { is_super_admin: boolean }).is_super_admin) {
      const { data: allPermissions } = await supabase
        .from('user_permissions')
        .select('permission_key')

      return allPermissions?.map((p) => p.permission_key) || []
    }

    // Get role permissions
    const { data: rolePermissions } = await supabase
      .from('user_role_permissions')
      .select('permission_key')
      .eq('role_id', profile.role_id)

    return rolePermissions?.map((rp) => rp.permission_key) || []
  } catch (error) {
    console.error('Error getting user permissions:', error)
    return []
  }
}

/**
 * Check if user is Super Admin
 */
export async function isSuperAdmin(): Promise<boolean> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return false
    }

    const { data: profile } = await supabase
      .from('users')
      .select(
        `
        role:user_roles (
          is_super_admin
        )
      `
      )
      .eq('id', user.id)
      .single()

    return !!(profile?.role as unknown as { is_super_admin: boolean })?.is_super_admin
  } catch (error) {
    console.error('Error checking super admin:', error)
    return false
  }
}
